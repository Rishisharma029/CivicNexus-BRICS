import { TRPCError } from "@trpc/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { analyzeCivicRequest, farmerDetailsSchema, generatePolicyBrief, supportedLanguages, translateToAllLanguages } from "../ai";
import { canSubmitCivicSignal, canUsePolicyWorkspace } from "../access";
import * as db from "../db";
import { buildImmediateEvidenceBrief, canTransitionPolicyStatus, type PolicyStatus } from "../policy";
import { enrichCitizenSignal, recordCitizenSignal } from "../civicService";
import { transcribeAudio } from "../_core/voiceTranscription";
import { storageGetSignedUrl, storagePut } from "../storage";
import { isOwnedVoicePreviewUrl, normalizeVoiceTranscript, storageKeyFromAudioUrl } from "../voiceFlow";
import { fetchLatestWorldBankIndicator, worldBankIndicators } from "../worldBank";
import { notifyOwner } from "../_core/notification";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";

const countrySchema = z.enum(["BR", "RU", "IN", "CN", "ZA"]);
const languageSchema = z.enum(["en", "hi", "ru", "zh", "pt", "ar"]);
const categorySchema = z.enum(["water", "sanitation", "transport", "healthcare", "education", "energy", "digital", "climate", "public_safety", "agriculture"]);
const urgencySchema = z.enum(["low", "medium", "high", "critical"]);
const statusSchema = z.enum(["submitted", "reviewed", "prioritized", "actioned"]);
const voiceFileSchema = z.object({
  mimeType: z.enum(["audio/webm", "audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4"]),
  fileName: z.string().trim().min(3).max(160),
});
const voicePayloadSchema = voiceFileSchema.extend({
  audioBase64: z.string().min(32).max(23_000_000),
});

async function storeVoicePreview(userId: number, input: z.infer<typeof voicePayloadSchema>) {
  const audioBytes = Buffer.from(input.audioBase64.replace(/^data:[^;]+;base64,/, ""), "base64");
  if (!audioBytes.length || audioBytes.length > 16 * 1024 * 1024) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Voice notes must be between 1 byte and 16 MB." });
  const extension = input.fileName.split(".").pop()?.replace(/[^a-z0-9]/gi, "") || "webm";
  return storagePut(`civicnexus/voice-preview/${userId}/${Date.now()}.${extension}`, audioBytes, input.mimeType);
}

const citizenProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!canSubmitCivicSignal(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Citizen access is required for this action." });
  return next();
});

const policymakerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!canUsePolicyWorkspace(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Policymaker access is required for this action." });
  return next();
});

async function requireRequestAccess(requestId: number, user: { id: number; role: string }) {
  const request = await db.getRequestById(requestId);
  if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Request not found." });
  if (user.role === "citizen" && request.userId !== user.id) throw new TRPCError({ code: "FORBIDDEN", message: "You can only access your own requests." });
  return request;
}

export const civicRouter = router({
  publicDashboard: publicProcedure.query(() => db.listPublicDashboard()),

  requests: router({
    submit: citizenProcedure.input(z.object({
      country: countrySchema, category: categorySchema, urgency: urgencySchema, originalLanguage: languageSchema,
      title: z.string().trim().min(8).max(280), description: z.string().trim().min(25).max(5000),
      locationLabel: z.string().trim().min(3).max(320), latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180),
      farmDetails: farmerDetailsSchema.optional(),
    })).mutation(({ ctx, input }) => recordCitizenSignal(ctx.user.id, input)),
    transcribeVoice: citizenProcedure.input(voicePayloadSchema.extend({ originalLanguage: languageSchema })).mutation(async ({ ctx, input }) => {
      const stored = await storeVoicePreview(ctx.user.id, input);
      const signedAudioUrl = await storageGetSignedUrl(stored.key);
      const transcription = await transcribeAudio({ audioUrl: signedAudioUrl, language: input.originalLanguage, prompt: "Citizen infrastructure or farmer development request for CivicNexus BRICS. Transcribe faithfully in the speaker's language." });
      if ("error" in transcription) throw new TRPCError({ code: "BAD_REQUEST", message: transcription.error });
      return { audioUrl: stored.url, transcript: normalizeVoiceTranscript(transcription.text ?? ""), detectedLanguage: transcription.language ?? input.originalLanguage };
    }),
    submitVoice: citizenProcedure.input(z.object({
      country: countrySchema, category: categorySchema, urgency: urgencySchema, originalLanguage: languageSchema,
      title: z.string().trim().min(8).max(280), description: z.string().trim().min(25).max(5000), locationLabel: z.string().trim().min(3).max(320), latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180),
      ...voiceFileSchema.shape, audioBase64: z.string().min(32).max(23_000_000).optional(), audioUrl: z.string().max(1200).optional(),
      farmDetails: farmerDetailsSchema.optional(),
    }).superRefine((input, refinement) => {
      if (!input.audioBase64 && !input.audioUrl) refinement.addIssue({ code: "custom", message: "Record or upload a voice note before submitting." });
      if (input.audioBase64 && input.audioUrl) refinement.addIssue({ code: "custom", message: "Use one voice-note source at a time." });
    })).mutation(async ({ ctx, input }) => {
      const audioUrl = input.audioUrl
        ? isOwnedVoicePreviewUrl(input.audioUrl, ctx.user.id)
          ? input.audioUrl
          : (() => { throw new TRPCError({ code: "FORBIDDEN", message: "The selected voice note is not available to this account." }); })()
        : (await storeVoicePreview(ctx.user.id, { audioBase64: input.audioBase64!, mimeType: input.mimeType, fileName: input.fileName })).url;
      return recordCitizenSignal(ctx.user.id, { ...input, description: input.description, channel: "voice", audioUrl });
    }),
    enrich: citizenProcedure.input(z.object({ requestId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const request = await requireRequestAccess(input.requestId, ctx.user);
      let descriptionOverride: string | undefined;
      if (request.channel === "voice" && request.audioUrl) {
        const transcription = await transcribeAudio({ audioUrl: await storageGetSignedUrl(storageKeyFromAudioUrl(request.audioUrl)), language: request.originalLanguage, prompt: "Citizen infrastructure development request for CivicNexus BRICS." });
        if ("error" in transcription) throw new TRPCError({ code: "BAD_REQUEST", message: transcription.error });
        try {
          descriptionOverride = normalizeVoiceTranscript(transcription.text ?? "");
        } catch (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "The voice note could not be transcribed." });
        }
      }
      return enrichCitizenSignal(ctx.user.id, request.id, descriptionOverride);
    }),
    byId: protectedProcedure.input(z.object({ requestId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const request = await requireRequestAccess(input.requestId, ctx.user);
      const [analysis, translations, analysisTranslations, advisoryTranslations, audit, farmerAdvisory] = await Promise.all([db.getRequestAnalysis(request.id), db.getTranslations("request", request.id), db.getTranslations("analysis", request.id), db.getTranslations("advisory", request.id), db.listAuditEvents("request", request.id), db.getFarmerAdvisory(request.id)]);
      return { request, analysis, translations, analysisTranslations, advisoryTranslations, audit, farmerAdvisory };
    }),
  }),

  policy: router({
    dashboard: policymakerProcedure.query(() => db.listPublicDashboard()),
    generateBrief: policymakerProcedure.input(z.object({ priorityId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const priority = await db.getPriorityById(input.priorityId);
      if (!priority) throw new TRPCError({ code: "NOT_FOUND", message: "Priority not found." });
      const content = buildImmediateEvidenceBrief({ ...priority, countries: priority.countries as string[], contextEvidence: priority.contextEvidence as string[] | null });
      const brief = await db.createPolicyBrief({ priorityId: priority.id, language: "en", title: `Policy brief — ${priority.title}`, content, model: "civicnexus-evidence-template-v1", readiness: "ready_for_review", createdBy: ctx.user.id });
      await db.addAuditEvent({ actorId: ctx.user.id, entityType: "brief", entityId: brief.id, action: "evidence_policy_brief_ready", note: `Immediate evidence brief created for priority #${priority.id}; optional AI refinement is available.` });
      void notifyOwner({ title: "CivicNexus: policy brief ready", content: `${brief.title} is ready for policymaker review and PDF export.` }).then(delivered => db.addAuditEvent({ actorId: ctx.user.id, entityType: "brief", entityId: brief.id, action: "owner_brief_ready_alert", note: delivered ? "Owner alert delivered." : "Owner alert deferred; upstream notification service unavailable." })).catch(async error => {
        await db.addAuditEvent({ actorId: ctx.user.id, entityType: "brief", entityId: brief.id, action: "owner_brief_ready_alert", note: error instanceof Error ? `Owner alert could not be completed: ${error.message}` : "Owner alert could not be completed." });
      });
      return brief;
    }),
    refineBrief: policymakerProcedure.input(z.object({ briefId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const brief = await db.getPolicyBrief(input.briefId);
      if (!brief) throw new TRPCError({ code: "NOT_FOUND", message: "Policy brief not found." });
      const priority = await db.getPriorityById(brief.priorityId);
      if (!priority) throw new TRPCError({ code: "NOT_FOUND", message: "Priority for this brief not found." });
      const { content, model } = await generatePolicyBrief({ ...priority, countries: priority.countries as string[] });
      const updated = await db.updatePolicyBrief(brief.id, { content, model, readiness: "ready_for_review" });
      const { translations, model: translationModel } = await translateToAllLanguages(brief.title, content);
      await db.saveTranslations("brief", brief.id, translations, translationModel);
      await db.addAuditEvent({ actorId: ctx.user.id, entityType: "brief", entityId: brief.id, action: "ai_policy_brief_refined", note: `Optional Google Gemini refinement and translations completed for priority #${priority.id}.` });
      return updated;
    }),
    briefs: policymakerProcedure.query(() => db.listPolicyBriefs()),
    briefById: policymakerProcedure.input(z.object({ briefId: z.number().int().positive() })).query(async ({ input }) => {
      const brief = await db.getPolicyBrief(input.briefId);
      if (!brief) throw new TRPCError({ code: "NOT_FOUND", message: "Policy brief not found." });
      return { brief, translations: await db.getTranslations("brief", brief.id) };
    }),
    updatePriorityStatus: policymakerProcedure.input(z.object({ priorityId: z.number().int().positive(), status: statusSchema, note: z.string().trim().max(800).optional() })).mutation(async ({ ctx, input }) => {
      const priority = await db.getPriorityById(input.priorityId);
      if (!priority) throw new TRPCError({ code: "NOT_FOUND", message: "Priority not found." });
      if (!canTransitionPolicyStatus(priority.status as PolicyStatus, input.status)) throw new TRPCError({ code: "BAD_REQUEST", message: "Status may only move forward through submitted, reviewed, prioritized, and actioned." });
      await db.updatePriorityStatus(priority.id, input.status);
      await db.addAuditEvent({ actorId: ctx.user.id, entityType: "priority", entityId: priority.id, action: "priority_status_updated", previousStatus: priority.status, nextStatus: input.status, note: input.note ?? null });
      return { success: true };
    }),
  }),

  admin: router({
    audit: adminProcedure.query(() => db.listAuditEvents()),
    updateRequestStatus: adminProcedure.input(z.object({ requestId: z.number().int().positive(), status: statusSchema, note: z.string().trim().max(800).optional() })).mutation(async ({ ctx, input }) => {
      const request = await db.getRequestById(input.requestId);
      if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Request not found." });
      if (!canTransitionPolicyStatus(request.status as PolicyStatus, input.status)) throw new TRPCError({ code: "BAD_REQUEST", message: "Status may only move forward through submitted, reviewed, prioritized, and actioned." });
      await db.updateRequestStatus(request.id, input.status);
      await db.addAuditEvent({ actorId: ctx.user.id, entityType: "request", entityId: request.id, action: "request_status_updated", previousStatus: request.status, nextStatus: input.status, note: input.note ?? null });
      return { success: true };
    }),
    assignRole: adminProcedure.input(z.object({ openId: z.string().min(1), role: z.enum(["citizen", "policymaker", "admin"]) })).mutation(async ({ ctx, input }) => {
      const user = await db.getUserByOpenId(input.openId);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User must sign in once before a role can be assigned." });
      await db.upsertUser({ openId: user.openId, role: input.role });
      await db.addAuditEvent({ actorId: ctx.user.id, entityType: "user", entityId: user.id, action: "role_assigned", note: `${input.role} role assigned.` });
      return { success: true };
    }),
    supportedLanguages: publicProcedure.query(() => supportedLanguages),
    nationalContext: adminProcedure.query(() => db.listNationalContext()),
    syncWorldBankContext: adminProcedure.mutation(async ({ ctx }) => {
      const countryCodes = { BR: "BRA", RU: "RUS", IN: "IND", CN: "CHN", ZA: "ZAF" } as const;
      let imported = 0;
      for (const [country, code] of Object.entries(countryCodes) as [keyof typeof countryCodes, string][]) {
        for (const indicator of worldBankIndicators) {
          const latest = await fetchLatestWorldBankIndicator(code, indicator.code);
          if (!latest) continue;
          await db.upsertNationalContextRecord({ sourceKey: `world-bank:${country}:${indicator.code}:${latest.dataPeriod}`, country, category: indicator.category, contextType: indicator.contextType, indicatorCode: indicator.code, label: indicator.label, value: String(latest.value), unit: indicator.unit, dataPeriod: latest.dataPeriod, direction: indicator.direction, relevanceWeight: indicator.relevanceWeight, sourceName: "World Bank Indicators API", sourceUrl: latest.sourceUrl, notes: "Imported as decision-support context; not proof of an individual citizen claim.", importedBy: ctx.user.id });
          imported += 1;
        }
      }
      await db.addAuditEvent({ actorId: ctx.user.id, entityType: "context", entityId: 0, action: "world_bank_context_synced", note: `${imported} attributable national-context records imported from the World Bank Indicators API.` });
      return { imported };
    }),
    addInvestmentPlanContext: adminProcedure.input(z.object({ country: countrySchema, category: categorySchema.optional(), label: z.string().trim().min(5).max(280), sourceUrl: z.string().url().max(1024), dataPeriod: z.string().trim().min(4).max(32), notes: z.string().trim().min(5).max(3000), relevanceWeight: z.number().int().min(1).max(100) })).mutation(async ({ ctx, input }) => {
      const sourceKey = `manual-plan:${input.country}:${input.category ?? "all"}:${createHash("sha256").update(input.sourceUrl).digest("hex").slice(0, 20)}`;
      await db.upsertNationalContextRecord({ sourceKey, country: input.country, category: input.category ?? null, contextType: "investment_plan", indicatorCode: "NATIONAL_PLAN", label: input.label, value: "50", unit: "contextual plan record", dataPeriod: input.dataPeriod, direction: "manual", relevanceWeight: input.relevanceWeight, sourceName: "Administrator-attributed public investment plan", sourceUrl: input.sourceUrl, notes: input.notes, importedBy: ctx.user.id });
      await db.addAuditEvent({ actorId: ctx.user.id, entityType: "context", entityId: 0, action: "investment_plan_context_added", note: `${input.country} investment-plan context recorded with source attribution.` });
      return { success: true };
    }),
  }),
});
