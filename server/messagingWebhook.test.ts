import { describe, expect, it } from "vitest";
import { isValidMessagingWebhookToken } from "./messaging";

describe("CivicNexus messaging gateway secret", () => {
  it("validates the configured gateway token securely", () => {
    process.env.CIVIC_MESSAGE_WEBHOOK_TOKEN = "test-secret-token-12345";
    
    // Correct token
    expect(isValidMessagingWebhookToken("test-secret-token-12345")).toBe(true);
    
    // Incorrect tokens
    expect(isValidMessagingWebhookToken("wrong-token")).toBe(false);
    expect(isValidMessagingWebhookToken("")).toBe(false);
    expect(isValidMessagingWebhookToken(undefined)).toBe(false);
  });
});
