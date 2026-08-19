import { describe, expect, it, vi } from "vitest";

const { getPriorityById, createPolicyBrief, addAuditEvent, generatePolicyBrief, translateToAllLanguages, notifyOwner } = vi.hoisted(() => ({
  getPriorityById: vi.fn(),
  createPolicyBrief: vi.fn(),
  addAuditEvent: vi.fn(),
  generatePolicyBrief: vi.fn(),
  translateToAllLanguages: vi.fn(),
  notifyOwner: vi.fn(),
}));

vi.mock("./db", () => ({ getPriorityById, createPolicyBrief, addAuditEvent }));
vi.mock("./ai", async importOriginal => ({
  ...(await importOriginal<typeof import("./ai")>()),
  generatePolicyBrief,
  translateToAllLanguages,
  supportedLanguages: { en: "English" },
}));
vi.mock("./_core/notification", () => ({ notifyOwner }));

import { civicRouter } from "./routers/civic";

describe("instant policy brief route", () => {
  it("returns an evidence brief without waiting for Gemini, translation, or owner notification", async () => {
    getPriorityById.mockResolvedValue({
      id: 7, title: "Water resilience and access programme", category: "water", countries: ["IN", "ZA"], requestCount: 4,
      impactScore: 77, alignmentScore: 40, contextScore: 50, priorityScore: 66,
      evidenceBrief: "Citizens report repeated disruption to safe water access.", aiRationale: "Water resilience across affected localities.", contextEvidence: [],
    });
    createPolicyBrief.mockResolvedValue({ id: 14, priorityId: 7, language: "en", title: "Policy brief — Water resilience and access programme", content: "instant", model: "civicnexus-evidence-template-v1", readiness: "ready_for_review", createdBy: 3, createdAt: new Date() });
    addAuditEvent.mockResolvedValue(undefined);
    generatePolicyBrief.mockImplementation(() => { throw new Error("Gemini must not run during instant creation."); });
    translateToAllLanguages.mockImplementation(() => { throw new Error("Translation must not run during instant creation."); });
    notifyOwner.mockImplementation(() => new Promise(() => undefined));

    const caller = civicRouter.createCaller({ user: { id: 3, role: "policymaker" } } as never);
    const result = await Promise.race([
      caller.policy.generateBrief({ priorityId: 7 }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Brief creation waited on a deferred operation.")), 100)),
    ]);

    expect(result).toMatchObject({ id: 14, readiness: "ready_for_review" });
    expect(generatePolicyBrief).not.toHaveBeenCalled();
    expect(translateToAllLanguages).not.toHaveBeenCalled();
    expect(notifyOwner).toHaveBeenCalledOnce();
  });
});
