import { describe, expect, it } from "vitest";
import { farmerAdvisorySchema, farmerDetailsSchema } from "./ai";
import { formatCategory } from "./policy";

describe("AI-Driven Farmer Advisory guardrails", () => {
  it("accepts structured farm context across the supported issue types", () => {
    expect(farmerDetailsSchema.parse({ cropOrLivestock: "rice", issueType: "irrigation", farmScale: "smallholder" })).toMatchObject({ cropOrLivestock: "rice", issueType: "irrigation" });
  });

  it("requires cautious actions, cautions, and escalation in every advisory", () => {
    expect(() => farmerAdvisorySchema.parse({ issueType: "pests", severity: "high", summary: "Possible pest pressure.", recommendedActions: ["Observe field edges", "Record patterns"], cautions: [], escalation: "Contact an extension officer." })).toThrow();
    expect(farmerAdvisorySchema.parse({ issueType: "pests", severity: "high", summary: "Possible pest pressure.", recommendedActions: ["Observe field edges", "Record patterns"], cautions: ["Do not apply unverified treatments."], escalation: "Contact an extension officer." }).severity).toBe("high");
  });

  it("renders agriculture as a first-class public-interest category", () => {
    expect(formatCategory("agriculture")).toBe("Agriculture");
  });
});
