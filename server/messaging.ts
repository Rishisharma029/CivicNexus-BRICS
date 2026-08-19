import { timingSafeEqual } from "node:crypto";
import type { Express, Request, Response } from "express";
import { z } from "zod";
import * as db from "./db";
import { processCitizenSignal } from "./civicService";

export function isValidMessagingWebhookToken(providedToken: string | undefined) {
  const expectedToken = process.env.CIVIC_MESSAGE_WEBHOOK_TOKEN;
  if (!expectedToken || !providedToken) return false;
  const expected = Buffer.from(expectedToken);
  const provided = Buffer.from(providedToken);
  return expected.length === provided.length && timingSafeEqual(expected, provided);
}

function requireMessagingToken(req: Request, res: Response) {
  const header = req.header("x-civic-webhook-token");
  if (isValidMessagingWebhookToken(header)) return true;
  res.status(401).json({ error: "Unauthorized messaging gateway." });
  return false;
}

export function registerMessagingGateway(app: Express) {
  app.get("/api/civic/messages/health", (req, res) => {
    if (!requireMessagingToken(req, res)) return;
    res.json({ ok: true, service: "civicnexus-message-gateway" });
  });

  app.post("/api/civic/messages/inbound", async (req, res) => {
    if (!requireMessagingToken(req, res)) return;
    const parsed = z.object({
      provider: z.enum(["whatsapp", "telegram", "government_gateway"]), externalMessageId: z.string().trim().min(1).max(180), senderReference: z.string().trim().min(1).max(320),
      country: z.enum(["BR", "RU", "IN", "CN", "ZA"]), category: z.enum(["water", "sanitation", "transport", "healthcare", "education", "energy", "digital", "climate", "public_safety", "agriculture"]),
      urgency: z.enum(["low", "medium", "high", "critical"]), originalLanguage: z.enum(["en", "hi", "ru", "zh", "pt", "ar"]),
      title: z.string().trim().min(8).max(280), text: z.string().trim().min(25).max(5000), locationLabel: z.string().trim().min(3).max(320),
      latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180),
    }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid civic message payload.", issues: parsed.error.issues.map(issue => ({ path: issue.path.join("."), message: issue.message })) });
    try {
      const existing = await db.getMessageIngestion(parsed.data.provider, parsed.data.externalMessageId);
      if (existing) return res.status(200).json({ accepted: true, duplicate: true, requestId: existing.requestId });
      const gatewayUser = await db.getOrCreateMessagingGatewayUser(parsed.data.provider, parsed.data.senderReference);
      const result = await processCitizenSignal(gatewayUser.id, { ...parsed.data, description: parsed.data.text, channel: "messaging" });
      await db.recordMessageIngestion({ provider: parsed.data.provider, externalMessageId: parsed.data.externalMessageId, requestId: result.requestId });
      await db.addAuditEvent({ actorId: gatewayUser.id, entityType: "message", entityId: result.requestId, action: "messaging_gateway_ingested", note: `${parsed.data.provider} message accepted through authenticated adapter.` });
      return res.status(202).json({ accepted: true, duplicate: false, ...result });
    } catch (error) {
      return res.status(500).json({ error: error instanceof Error ? error.message : "Messaging gateway could not process the request." });
    }
  });
}
