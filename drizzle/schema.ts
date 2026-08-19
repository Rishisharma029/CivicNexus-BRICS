import { index, int, json, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const bricsCountries = ["BR", "RU", "IN", "CN", "ZA"] as const;
export const civicLanguages = ["en", "hi", "ru", "zh", "pt", "ar"] as const;
export const infrastructureCategories = ["water", "sanitation", "transport", "healthcare", "education", "energy", "digital", "climate", "public_safety", "agriculture"] as const;
export const urgencyLevels = ["low", "medium", "high", "critical"] as const;
export const policyStatuses = ["submitted", "reviewed", "prioritized", "actioned"] as const;
export const submissionChannels = ["text", "voice", "messaging"] as const;
export const contextTypes = ["demographic", "infrastructure_index", "agriculture_index", "investment_plan"] as const;

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["citizen", "policymaker", "admin"]).default("citizen").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const citizenRequests = mysqlTable("citizenRequests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  country: mysqlEnum("country", bricsCountries).notNull(),
  category: mysqlEnum("category", infrastructureCategories).notNull(),
  urgency: mysqlEnum("urgency", urgencyLevels).notNull(),
  status: mysqlEnum("status", policyStatuses).default("submitted").notNull(),
  originalLanguage: mysqlEnum("originalLanguage", civicLanguages).default("en").notNull(),
  title: varchar("title", { length: 280 }).notNull(),
  description: text("description").notNull(),
  channel: mysqlEnum("channel", submissionChannels).default("text").notNull(),
  audioUrl: varchar("audioUrl", { length: 1024 }),
  locationLabel: varchar("locationLabel", { length: 320 }).notNull(),
  latitude: varchar("latitude", { length: 32 }).notNull(),
  longitude: varchar("longitude", { length: 32 }).notNull(),
  farmDetails: json("farmDetails"),
  analysisState: mysqlEnum("analysisState", ["pending", "complete", "needs_review"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("citizenRequests_country_category_idx").on(table.country, table.category),
  index("citizenRequests_status_idx").on(table.status),
  index("citizenRequests_user_idx").on(table.userId),
]);

export const messageIngestions = mysqlTable("messageIngestions", {
  id: int("id").autoincrement().primaryKey(),
  provider: mysqlEnum("provider", ["whatsapp", "telegram", "government_gateway"]).notNull(),
  externalMessageId: varchar("externalMessageId", { length: 180 }).notNull(),
  requestId: int("requestId").notNull(),
  receivedAt: timestamp("receivedAt").defaultNow().notNull(),
}, table => [uniqueIndex("messageIngestions_provider_message_unique").on(table.provider, table.externalMessageId)]);

export const nationalContextRecords = mysqlTable("nationalContextRecords", {
  id: int("id").autoincrement().primaryKey(),
  sourceKey: varchar("sourceKey", { length: 320 }).notNull().unique(),
  country: mysqlEnum("country", bricsCountries).notNull(),
  category: mysqlEnum("category", infrastructureCategories),
  contextType: mysqlEnum("contextType", contextTypes).notNull(),
  indicatorCode: varchar("indicatorCode", { length: 120 }).notNull(),
  label: varchar("label", { length: 280 }).notNull(),
  value: varchar("value", { length: 64 }).notNull(),
  unit: varchar("unit", { length: 120 }).notNull(),
  dataPeriod: varchar("dataPeriod", { length: 32 }).notNull(),
  direction: mysqlEnum("direction", ["higher_need", "lower_need", "manual"]).default("manual").notNull(),
  relevanceWeight: int("relevanceWeight").default(50).notNull(),
  sourceName: varchar("sourceName", { length: 280 }).notNull(),
  sourceUrl: varchar("sourceUrl", { length: 1024 }).notNull(),
  notes: text("notes"),
  importedBy: int("importedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("nationalContext_country_category_idx").on(table.country, table.category),
  index("nationalContext_type_idx").on(table.contextType),
]);

export const requestAnalyses = mysqlTable("requestAnalyses", {
  id: int("id").autoincrement().primaryKey(),
  requestId: int("requestId").notNull().unique(),
  model: varchar("model", { length: 128 }).notNull(),
  classification: varchar("classification", { length: 80 }).notNull(),
  sentiment: mysqlEnum("sentiment", ["negative", "neutral", "positive", "mixed"]).notNull(),
  urgencyScore: int("urgencyScore").notNull(),
  confidence: int("confidence").notNull(),
  summary: text("summary").notNull(),
  impactStatement: text("impactStatement").notNull(),
  evidence: json("evidence").notNull(),
  crossBorderThemes: json("crossBorderThemes").notNull(),
  duplicateGroup: varchar("duplicateGroup", { length: 128 }),
  humanReviewNote: text("humanReviewNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const farmerAdvisories = mysqlTable("farmerAdvisories", {
  id: int("id").autoincrement().primaryKey(),
  requestId: int("requestId").notNull().unique(),
  model: varchar("model", { length: 128 }).notNull(),
  issueType: varchar("issueType", { length: 80 }).notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high"]).notNull(),
  summary: text("summary").notNull(),
  recommendedActions: json("recommendedActions").notNull(),
  cautions: json("cautions").notNull(),
  escalation: text("escalation").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const contentTranslations = mysqlTable("contentTranslations", {
  id: int("id").autoincrement().primaryKey(),
  entityType: mysqlEnum("entityType", ["request", "analysis", "brief", "advisory"]).notNull(),
  entityId: int("entityId").notNull(),
  language: mysqlEnum("language", civicLanguages).notNull(),
  title: varchar("title", { length: 280 }),
  content: text("content").notNull(),
  model: varchar("model", { length: 128 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  uniqueIndex("translations_entity_language_unique").on(table.entityType, table.entityId, table.language),
]);

export const policyPriorities = mysqlTable("policyPriorities", {
  id: int("id").autoincrement().primaryKey(),
  groupKey: varchar("groupKey", { length: 128 }).notNull().unique(),
  category: mysqlEnum("category", infrastructureCategories).notNull(),
  title: varchar("title", { length: 280 }).notNull(),
  countries: json("countries").notNull(),
  requestCount: int("requestCount").default(0).notNull(),
  impactScore: int("impactScore").notNull(),
  alignmentScore: int("alignmentScore").notNull(),
  priorityScore: int("priorityScore").notNull(),
  contextScore: int("contextScore").default(50).notNull(),
  contextEvidence: json("contextEvidence"),
  status: mysqlEnum("status", policyStatuses).default("submitted").notNull(),
  evidenceBrief: text("evidenceBrief").notNull(),
  aiRationale: text("aiRationale").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("policyPriorities_score_idx").on(table.priorityScore),
  index("policyPriorities_status_idx").on(table.status),
]);

export const policyBriefs = mysqlTable("policyBriefs", {
  id: int("id").autoincrement().primaryKey(),
  priorityId: int("priorityId").notNull(),
  language: mysqlEnum("language", civicLanguages).default("en").notNull(),
  title: varchar("title", { length: 280 }).notNull(),
  content: text("content").notNull(),
  model: varchar("model", { length: 128 }).notNull(),
  readiness: mysqlEnum("readiness", ["draft", "ready_for_review"]).default("ready_for_review").notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const auditEvents = mysqlTable("auditEvents", {
  id: int("id").autoincrement().primaryKey(),
  actorId: int("actorId"),
  entityType: mysqlEnum("entityType", ["request", "priority", "brief", "user", "context", "message", "advisory"]).notNull(),
  entityId: int("entityId").notNull(),
  action: varchar("action", { length: 96 }).notNull(),
  previousStatus: varchar("previousStatus", { length: 32 }),
  nextStatus: varchar("nextStatus", { length: 32 }),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  index("audit_entity_idx").on(table.entityType, table.entityId),
]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type CitizenRequest = typeof citizenRequests.$inferSelect;
export type PolicyPriority = typeof policyPriorities.$inferSelect;
