import { describe, expect, it, vi } from "vitest";

const { mockPdf, mockJsPdf } = vi.hoisted(() => {
  const mockPdf = {
    setFont: vi.fn(), setFontSize: vi.fn(), setTextColor: vi.fn(), text: vi.fn(),
    splitTextToSize: vi.fn(() => ["Evidence brief content"]), addPage: vi.fn(), save: vi.fn(),
  };
  return { mockPdf, mockJsPdf: vi.fn(() => mockPdf) };
});

vi.mock("jspdf", () => ({ jsPDF: mockJsPdf }));

import { exportBriefPdf } from "../client/src/lib/briefPdf";

describe("instant evidence brief PDF export", () => {
  it("exports the locally created evidence brief without waiting for AI refinement", () => {
    exportBriefPdf({ title: "Policy brief — Water resilience", content: "# Decision question\n\nEvidence brief content" });
    expect(mockJsPdf).toHaveBeenCalledOnce();
    expect(mockPdf.save).toHaveBeenCalledWith("policy-brief-water-resilience.pdf");
    expect(mockPdf.text).toHaveBeenCalled();
  });
});
