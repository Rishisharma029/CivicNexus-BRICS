import { and, desc, eq, inArray, isNull, or } from "drizzle-orm";
import { createHash } from "node:crypto";
import { drizzle } from "drizzle-orm/mysql2";
import {
  auditEvents,
  citizenRequests,
  contentTranslations,
  farmerAdvisories,
  InsertUser,
  messageIngestions,
  nationalContextRecords,
  policyBriefs,
  policyPriorities,
  requestAnalyses,
  users,
} from "../drizzle/schema";
import type { CivicAnalysis, FarmerAdvisory, SupportedLanguage } from "./ai";
import { calculatePriorityScores, formatCategory, type PolicyStatus } from "./policy";
import { calculateNationalContextScore } from "./nationalContext";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: values.lastSignedIn };
  (["name", "email", "loginMethod"] as const).forEach(field => {
    if (user[field] !== undefined) { values[field] = user[field]; updateSet[field] = user[field]; }
  });
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(users).where(eq(users.openId, openId)).limit(1))[0];
}

export async function getOrCreateMessagingGatewayUser(provider: "whatsapp" | "telegram" | "government_gateway", senderReference: string) {
  const openId = `gateway-${provider}-${createHash("sha256").update(senderReference).digest("hex").slice(0, 42)}`;
  await upsertUser({ openId, name: `${provider} gateway citizen`, loginMethod: "messaging_gateway", role: "citizen" });
  const user = await getUserByOpenId(openId);
  if (!user) throw new Error("Messaging gateway user could not be provisioned.");
  return user;
}

export async function getMessageIngestion(provider: "whatsapp" | "telegram" | "government_gateway", externalMessageId: string) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(messageIngestions).where(and(eq(messageIngestions.provider, provider), eq(messageIngestions.externalMessageId, externalMessageId))).limit(1))[0];
}

export async function recordMessageIngestion(input: typeof messageIngestions.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  await db.insert(messageIngestions).values(input);
}

export async function createCitizenRequest(input: Omit<typeof citizenRequests.$inferInsert, "id" | "createdAt" | "updatedAt" | "analysisState" | "status">) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  const result = await db.insert(citizenRequests).values(input);
  const [request] = await db.select().from(citizenRequests).where(eq(citizenRequests.id, Number(result[0].insertId))).limit(1);
  if (!request) throw new Error("The request could not be saved.");
  return request;
}

export async function getRequestById(requestId: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(citizenRequests).where(eq(citizenRequests.id, requestId)).limit(1))[0];
}

export async function getRequestAnalysis(requestId: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(requestAnalyses).where(eq(requestAnalyses.requestId, requestId)).limit(1))[0];
}

export async function completeFarmerAdvisory(requestId: number, advisory: FarmerAdvisory, model: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  await db.insert(farmerAdvisories).values({ requestId, model, ...advisory }).onDuplicateKeyUpdate({ set: {
    model, issueType: advisory.issueType, severity: advisory.severity, summary: advisory.summary,
    recommendedActions: advisory.recommendedActions, cautions: advisory.cautions, escalation: advisory.escalation,
  }});
}

export async function getFarmerAdvisory(requestId: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(farmerAdvisories).where(eq(farmerAdvisories.requestId, requestId)).limit(1))[0];
}

export async function updateCitizenRequestDescription(requestId: number, description: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  await db.update(citizenRequests).set({ description }).where(eq(citizenRequests.id, requestId));
}

export async function completeRequestAnalysis(requestId: number, analysis: CivicAnalysis, model: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  await db.insert(requestAnalyses).values({
    requestId, model, classification: analysis.classification, sentiment: analysis.sentiment,
    urgencyScore: analysis.urgencyScore, confidence: analysis.confidence, summary: analysis.summary,
    impactStatement: analysis.impactStatement, evidence: analysis.evidence, crossBorderThemes: analysis.crossBorderThemes,
    duplicateGroup: analysis.duplicateGroup,
  }).onDuplicateKeyUpdate({ set: {
    model, classification: analysis.classification, sentiment: analysis.sentiment, urgencyScore: analysis.urgencyScore,
    confidence: analysis.confidence, summary: analysis.summary, impactStatement: analysis.impactStatement,
    evidence: analysis.evidence, crossBorderThemes: analysis.crossBorderThemes, duplicateGroup: analysis.duplicateGroup,
  }});
  await db.update(citizenRequests).set({ analysisState: "complete" }).where(eq(citizenRequests.id, requestId));
}

export async function markAnalysisNeedsReview(requestId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(citizenRequests).set({ analysisState: "needs_review" }).where(eq(citizenRequests.id, requestId));
}

export async function saveTranslations(entityType: "request" | "analysis" | "brief" | "advisory", entityId: number, translations: Record<SupportedLanguage, { title: string; content: string }>, model: string) {
  const db = await getDb();
  if (!db) return;
  for (const [language, translation] of Object.entries(translations) as [SupportedLanguage, { title: string; content: string }][]) {
    await db.insert(contentTranslations).values({ entityType, entityId, language, title: translation.title, content: translation.content, model })
      .onDuplicateKeyUpdate({ set: { title: translation.title, content: translation.content, model } });
  }
}

export async function getTranslations(entityType: "request" | "analysis" | "brief" | "advisory", entityId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contentTranslations).where(and(eq(contentTranslations.entityType, entityType), eq(contentTranslations.entityId, entityId)));
}

export async function rebuildPriorityFromRequest(requestId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  const request = await getRequestById(requestId);
  const analysis = await getRequestAnalysis(requestId);
  if (!request || !analysis) throw new Error("A completed request analysis is required before prioritisation.");
  const matchingRequests = await db.select().from(citizenRequests).where(eq(citizenRequests.category, request.category));
  const requestIds = matchingRequests.map(item => item.id);
  const matchingAnalyses = requestIds.length ? await db.select().from(requestAnalyses).where(inArray(requestAnalyses.requestId, requestIds)) : [];
  const countries = Array.from(new Set(matchingRequests.map(item => item.country)));
  const uniqueSignalCount = new Set(matchingAnalyses.map(item => item.duplicateGroup || `request-${item.requestId}`)).size;
  const averageUrgency = Math.round(matchingAnalyses.reduce((total, item) => total + item.urgencyScore, 0) / Math.max(1, matchingAnalyses.length));
  const averageConfidence = Math.round(matchingAnalyses.reduce((total, item) => total + item.confidence, 0) / Math.max(1, matchingAnalyses.length));
  const context = await getRelevantNationalContext(request.category, countries);
  const { contextScore, evidence: contextEvidence } = calculateNationalContextScore(context);
  const scores = calculatePriorityScores({ urgency: request.urgency, requestCount: uniqueSignalCount, countryCount: countries.length, aiUrgencyScore: averageUrgency, confidence: averageConfidence, contextScore });
  const title = request.category === "agriculture" ? "Farmer resilience and advisory programme" : `${formatCategory(request.category)} resilience and access programme`;
  const rationale = (analysis.crossBorderThemes as string[]).join("; ");
  await db.insert(policyPriorities).values({
    groupKey: request.category, category: request.category, title, countries, requestCount: matchingRequests.length,
    ...scores, contextScore, contextEvidence, evidenceBrief: analysis.summary, aiRationale: rationale,
  }).onDuplicateKeyUpdate({ set: { countries, requestCount: matchingRequests.length, ...scores, contextScore, contextEvidence, evidenceBrief: analysis.summary, aiRationale: rationale } });
  return (await db.select().from(policyPriorities).where(eq(policyPriorities.groupKey, request.category)).limit(1))[0];
}

export async function upsertNationalContextRecord(input: typeof nationalContextRecords.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  await db.insert(nationalContextRecords).values(input).onDuplicateKeyUpdate({ set: {
    country: input.country, category: input.category, contextType: input.contextType, indicatorCode: input.indicatorCode,
    label: input.label, value: input.value, unit: input.unit, dataPeriod: input.dataPeriod, direction: input.direction,
    relevanceWeight: input.relevanceWeight, sourceName: input.sourceName, sourceUrl: input.sourceUrl, notes: input.notes, importedBy: input.importedBy,
  }});
}

export async function listNationalContext() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(nationalContextRecords).orderBy(desc(nationalContextRecords.updatedAt));
}

export async function getRelevantNationalContext(category: string, countries: string[]) {
  const db = await getDb();
  if (!db || !countries.length) return [];
  const compatibleCountries = countries as ("BR" | "RU" | "IN" | "CN" | "ZA")[];
  return db.select().from(nationalContextRecords).where(and(inArray(nationalContextRecords.country, compatibleCountries), or(eq(nationalContextRecords.category, category as "water" | "sanitation" | "transport" | "healthcare" | "education" | "energy" | "digital" | "climate" | "public_safety" | "agriculture"), isNull(nationalContextRecords.category))));
}

export async function listPublicDashboard() {
  const db = await getDb();
  if (!db) return { requests: [], priorities: [] };
  const [requests, analyses, priorities] = await Promise.all([
    db.select().from(citizenRequests).orderBy(desc(citizenRequests.createdAt)),
    db.select().from(requestAnalyses),
    db.select().from(policyPriorities).orderBy(desc(policyPriorities.priorityScore)),
  ]);
  const analysisByRequest = new Map(analyses.map(item => [item.requestId, item]));
  return {
    requests: requests.map(request => {
      const analysis = analysisByRequest.get(request.id);
      return {
        id: request.id,
        country: request.country,
        category: request.category,
        urgency: request.urgency,
        status: request.status,
        locationLabel: request.locationLabel,
        latitude: request.latitude,
        longitude: request.longitude,
        analysisState: request.analysisState,
        createdAt: request.createdAt,
        analysis: analysis ? {
          classification: analysis.classification,
          sentiment: analysis.sentiment,
          urgencyScore: analysis.urgencyScore,
          confidence: analysis.confidence,
          summary: analysis.summary,
          impactStatement: analysis.impactStatement,
          crossBorderThemes: analysis.crossBorderThemes,
          duplicateGroup: analysis.duplicateGroup,
        } : null,
      };
    }),
    priorities,
  };
}

export async function updateRequestStatus(requestId: number, status: PolicyStatus) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  await db.update(citizenRequests).set({ status }).where(eq(citizenRequests.id, requestId));
}

export async function updatePriorityStatus(priorityId: number, status: PolicyStatus) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  await db.update(policyPriorities).set({ status }).where(eq(policyPriorities.id, priorityId));
}

export async function getPriorityById(priorityId: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(policyPriorities).where(eq(policyPriorities.id, priorityId)).limit(1))[0];
}

export async function createPolicyBrief(input: Omit<typeof policyBriefs.$inferInsert, "id" | "createdAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  const result = await db.insert(policyBriefs).values(input);
  return (await db.select().from(policyBriefs).where(eq(policyBriefs.id, Number(result[0].insertId))).limit(1))[0];
}

export async function updatePolicyBrief(briefId: number, input: Pick<typeof policyBriefs.$inferInsert, "content" | "model" | "readiness">) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  await db.update(policyBriefs).set(input).where(eq(policyBriefs.id, briefId));
  return getPolicyBrief(briefId);
}

export async function getPolicyBrief(briefId: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(policyBriefs).where(eq(policyBriefs.id, briefId)).limit(1))[0];
}

export async function listPolicyBriefs() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(policyBriefs).orderBy(desc(policyBriefs.createdAt));
}

export async function addAuditEvent(input: typeof auditEvents.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditEvents).values(input);
}

export async function listAuditEvents(entityType?: "request" | "priority" | "brief" | "user" | "context" | "message" | "advisory", entityId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (entityType && entityId) return db.select().from(auditEvents).where(and(eq(auditEvents.entityType, entityType), eq(auditEvents.entityId, entityId))).orderBy(desc(auditEvents.createdAt));
  return db.select().from(auditEvents).orderBy(desc(auditEvents.createdAt));
}
