import { describe, expect, it } from "vitest";
import { buildImmediateEvidenceBrief } from "./policy";

describe("instant policy evidence brief", () => {
  it("creates a complete, source-conscious review brief without an LLM invocation", () => {
    const brief = buildImmediateEvidenceBrief({
      title: "Water resilience and access programme", category: "water", countries: ["IN", "ZA"], requestCount: 8,
      impactScore: 81, alignmentScore: 40, contextScore: 62, priorityScore: 71,
      evidenceBrief: "Citizens report repeated disruption to safe water access.", aiRationale: "Water resilience and access across localities.",
      contextEvidence: ["World Bank: basic water service access, 2023"],
    });
    expect(brief).toContain("Decision question");
    expect(brief).toContain("World Bank: basic water service access, 2023");
    expect(brief).toContain("Human review note");
  });
});
