import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCreateCitizenRequest, mockAddAuditEvent, mockNotifyOwner } = vi.hoisted(() => ({
  mockCreateCitizenRequest: vi.fn(),
  mockAddAuditEvent: vi.fn(),
  mockNotifyOwner: vi.fn(),
}));

vi.mock("./db", () => ({
  createCitizenRequest: mockCreateCitizenRequest,
  addAuditEvent: mockAddAuditEvent,
}));

vi.mock("./_core/notification", () => ({ notifyOwner: mockNotifyOwner }));

import { canRunAiEnrichment, recordCitizenSignal } from "./civicService";

describe("CivicNexus deferred enrichment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateCitizenRequest.mockResolvedValue({ id: 42, country: "IN", category: "water", urgency: "critical", locationLabel: "Pune" });
    mockAddAuditEvent.mockResolvedValue(undefined);
  });

  it("keeps complete analyses immutable while allowing pending and retryable analyses", () => {
    expect(canRunAiEnrichment("pending")).toBe(true);
    expect(canRunAiEnrichment("needs_review")).toBe(true);
    expect(canRunAiEnrichment("complete")).toBe(false);
  });

  it("acknowledges a valid citizen report without waiting for a slow notification or AI enrichment", async () => {
    mockNotifyOwner.mockImplementation(() => new Promise(() => undefined));
    const result = await Promise.race([
      recordCitizenSignal(1, { country: "IN", category: "water", urgency: "critical", originalLanguage: "en", title: "Safe water access is interrupted", description: "Residents report repeated disruption to drinking water access.", locationLabel: "Pune", latitude: 18.52, longitude: 73.85 }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Submission waited on a background operation.")), 100)),
    ]);
    expect(result).toEqual({ requestId: 42, analysisState: "pending", priorityId: null });
    expect(mockNotifyOwner).toHaveBeenCalledOnce();
  });
});
