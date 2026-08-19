import { describe, expect, it, vi } from "vitest";

const { getPriorityById, createPolicyBrief, addAuditEvent, generatePolicyBrief, translateToAllLanguages, notifyOwner, mockPdf, mockJsPdf } = vi.hoisted(() => {
  const mockPdf = { setFont: vi.fn(), setFontSize: vi.fn(), setTextColor: vi.fn(), text: vi.fn(), splitTextToSize: vi.fn(() => ["Evidence brief content"]), addPage: vi.fn(), save: vi.fn() };
  return {
    getPriorityById: vi.fn(), createPolicyBrief: vi.fn(), addAuditEvent: vi.fn(), generatePolicyBrief: vi.fn(), translateToAllLanguages: vi.fn(), notifyOwner: vi.fn(), mockPdf, mockJsPdf: vi.fn(() => mockPdf),
  };
});

vi.mock("./db", () => ({ getPriorityById, createPolicyBrief, addAuditEvent }));
vi.mock("./ai", async importOriginal => ({
  ...(await importOriginal<typeof import("./ai")>()),
  generatePolicyBrief,
  translateToAllLanguages,
  supportedLanguages: { en: "English" },
}));
vi.mock("./_core/notification", () => ({ notifyOwner }));
vi.mock("jspdf", () => ({ jsPDF: mockJsPdf }));

import { exportBriefPdf } from "../client/src/lib/briefPdf";
import { civicRouter } from "./routers/civic";

describe("instant brief lifecycle", () => {
  it("creates a PDF-exportable evidence brief without invoking Gemini or translation", async () => {
    getPriorityById.mockResolvedValue({ id: 8, title: "Sanitation resilience and access programme", category: "sanitation", countries: ["IN"], requestCount: 2, impactScore: 72, alignmentScore: 20, contextScore: 50, priorityScore: 59, evidenceBrief: "Citizens report an urgent sanitation need.", aiRationale: "Public health resilience.", contextEvidence: [] });
    createPolicyBrief.mockImplementation(async input => ({ id: 18, ...input, createdAt: new Date() }));
    addAuditEvent.mockResolvedValue(undefined);
    notifyOwner.mockResolvedValue(true);
    const caller = civicRouter.createCaller({ user: { id: 3, role: "policymaker" } } as never);

    const brief = await caller.policy.generateBrief({ priorityId: 8 });
    exportBriefPdf(brief);

    expect(brief.model).toBe("civicnexus-evidence-template-v1");
    expect(brief.content).toContain("Human review note");
    expect(generatePolicyBrief).not.toHaveBeenCalled();
    expect(translateToAllLanguages).not.toHaveBeenCalled();
    expect(mockPdf.save).toHaveBeenCalledWith("policy-brief-sanitation-resilience-and-access-programme.pdf");
  });
});
