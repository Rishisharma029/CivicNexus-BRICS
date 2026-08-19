import { analyzeCivicRequest, farmerDetailsSchema, generateFarmerAdvisory, translateToAllLanguages, type FarmerDetails, type SupportedLanguage } from "./ai";
import * as db from "./db";
import { notifyOwner } from "./_core/notification";

export type CitizenSignalInput = {
  country: "BR" | "RU" | "IN" | "CN" | "ZA";
  category: "water" | "sanitation" | "transport" | "healthcare" | "education" | "energy" | "digital" | "climate" | "public_safety" | "agriculture";
  urgency: "low" | "medium" | "high" | "critical";
  originalLanguage: SupportedLanguage;
  title: string;
  description: string;
  locationLabel: string;
  latitude: number;
  longitude: number;
  channel?: "text" | "voice" | "messaging";
  audioUrl?: string | null;
  farmDetails?: FarmerDetails | null;
};

export function canRunAiEnrichment(analysisState: "pending" | "complete" | "needs_review") {
  return analysisState !== "complete";
}

async function sendHighUrgencyOwnerAlert(userId: number, request: { id: number; country: string; category: string; urgency: string; locationLabel: string }) {
  const delivered = await notifyOwner({ title: `CivicNexus: ${request.urgency} urgency request`, content: `${request.country} · ${request.category} · ${request.locationLabel}. Request #${request.id} is ready for review.` });
  await db.addAuditEvent({ actorId: userId, entityType: "request", entityId: request.id, action: "owner_high_urgency_alert", note: delivered ? "Owner alert delivered." : "Owner alert deferred; upstream notification service unavailable." });
}

export async function recordCitizenSignal(userId: number, input: CitizenSignalInput) {
  const request = await db.createCitizenRequest({
    ...input, userId, channel: input.channel ?? "text", audioUrl: input.audioUrl ?? null,
    latitude: String(input.latitude), longitude: String(input.longitude),
  });
  await db.addAuditEvent({ actorId: userId, entityType: "request", entityId: request.id, action: `${input.channel ?? "text"}_request_submitted`, nextStatus: "submitted", note: "Citizen request saved." });
  if (input.urgency === "high" || input.urgency === "critical") {
    void sendHighUrgencyOwnerAlert(userId, request).catch(async error => {
      await db.addAuditEvent({ actorId: userId, entityType: "request", entityId: request.id, action: "owner_high_urgency_alert", note: error instanceof Error ? `Owner alert could not be completed: ${error.message}` : "Owner alert could not be completed." });
    });
  }
  return { requestId: request.id, analysisState: "pending" as const, priorityId: null };
}

// Retained for authenticated messaging adapters that use the same immediate-save workflow.
export const processCitizenSignal = recordCitizenSignal;

export async function enrichCitizenSignal(userId: number, requestId: number, descriptionOverride?: string) {
  const current = await db.getRequestById(requestId);
  if (!current) throw new Error("Request not found.");
  if (!canRunAiEnrichment(current.analysisState)) return { requestId, analysisState: "complete" as const, priorityId: null };
  if (descriptionOverride) await db.updateCitizenRequestDescription(requestId, descriptionOverride);
  const request = descriptionOverride ? await db.getRequestById(requestId) : current;
  if (!request) throw new Error("Request not found.");
  try {
    const { analysis, model } = await analyzeCivicRequest({ ...request, language: request.originalLanguage });
    await db.completeRequestAnalysis(request.id, analysis, model);
    const { translations, model: translationModel } = await translateToAllLanguages(request.title, request.description);
    await db.saveTranslations("request", request.id, translations, translationModel);
    const { translations: analysisTranslations, model: analysisTranslationModel } = await translateToAllLanguages(request.title, analysis.summary);
    await db.saveTranslations("analysis", request.id, analysisTranslations, analysisTranslationModel);
    if (request.category === "agriculture" && request.farmDetails) {
      const farmDetails = farmerDetailsSchema.parse(request.farmDetails);
      const { advisory, model: advisoryModel } = await generateFarmerAdvisory({ country: request.country, locationLabel: request.locationLabel, title: request.title, description: request.description, language: request.originalLanguage, farmDetails });
      await db.completeFarmerAdvisory(request.id, advisory, advisoryModel);
      const advisoryContent = `Summary: ${advisory.summary}\n\nLow-risk next actions:\n${advisory.recommendedActions.map(action => `- ${action}`).join("\n")}\n\nCautions:\n${advisory.cautions.map(caution => `- ${caution}`).join("\n")}\n\nEscalation: ${advisory.escalation}`;
      const { translations: advisoryTranslations, model: advisoryTranslationModel } = await translateToAllLanguages(`Farmer advisory — ${request.title}`, advisoryContent);
      await db.saveTranslations("advisory", request.id, advisoryTranslations, advisoryTranslationModel);
      await db.addAuditEvent({ actorId: userId, entityType: "advisory", entityId: request.id, action: "farmer_advisory_ready", note: "Safety-bounded farmer advisory generated for protected review." });
    }
    const priority = await db.rebuildPriorityFromRequest(request.id);
    await db.addAuditEvent({ actorId: userId, entityType: "request", entityId: request.id, action: "ai_analysis_complete", note: `Deferred Google Gemini analysis complete; priority #${priority?.id ?? "pending"}.` });
    return { requestId: request.id, analysisState: "complete" as const, priorityId: priority?.id ?? null };
  } catch (error) {
    await db.markAnalysisNeedsReview(request.id);
    await db.addAuditEvent({ actorId: userId, entityType: "request", entityId: request.id, action: "ai_analysis_needs_review", note: error instanceof Error ? error.message : "AI pipeline failed safely." });
    return { requestId: request.id, analysisState: "needs_review" as const, priorityId: null };
  }
}
