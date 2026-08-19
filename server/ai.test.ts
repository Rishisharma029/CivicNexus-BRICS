import { describe, expect, it } from "vitest";
import { validateCivicAnalysis, validateTranslationBundle } from "./ai";

const validAnalysis = {
  classification: "water", sentiment: "negative", urgencyScore: 82, confidence: 91,
  summary: "Residents report repeated interruption to safe water access.",
  impactStatement: "The reported disruption may affect daily health, care, and livelihoods.",
  evidence: ["Citizen report describes recurrent interruption."],
  crossBorderThemes: ["Water resilience"], duplicateGroup: "water-resilience-access",
};

describe("CivicNexus AI output validation", () => {
  it("accepts complete, bounded infrastructure analysis", () => {
    expect(validateCivicAnalysis(validAnalysis)).toMatchObject({ classification: "water", confidence: 91 });
  });

  it("rejects malformed analysis rather than persisting an unsafe score", () => {
    expect(() => validateCivicAnalysis({ ...validAnalysis, urgencyScore: 500 })).toThrow();
    expect(() => validateCivicAnalysis({ ...validAnalysis, classification: "other" })).toThrow();
  });

  it("requires every working-language translation before persistence", () => {
    const translation = { title: "Water access", content: "Translation text" };
    expect(validateTranslationBundle({ en: translation, hi: translation, ru: translation, zh: translation, pt: translation, ar: translation }).ar.title).toBe("Water access");
    expect(() => validateTranslationBundle({ en: translation })).toThrow();
  });
});
