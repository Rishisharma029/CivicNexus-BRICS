import { describe, expect, it } from "vitest";

describe("CivicNexus messaging gateway secret", () => {
  it("accepts the configured gateway token at the lightweight health endpoint", async () => {
    const token = process.env.CIVIC_MESSAGE_WEBHOOK_TOKEN;
    expect(token).toBeTruthy();
    const response = await fetch("http://localhost:3000/api/civic/messages/health", {
      headers: { "x-civic-webhook-token": token! },
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true, service: "civicnexus-message-gateway" });
  });
});
