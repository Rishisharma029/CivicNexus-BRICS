import { describe, expect, it } from "vitest";
import { calculateNationalContextScore } from "./nationalContext";

describe("CivicNexus national-context scoring", () => {
  it("uses only attributable context records and preserves their evidence trace", () => {
    const result = calculateNationalContextScore([
      { country: "IN", category: "water", contextType: "infrastructure_index", label: "Basic drinking water services", value: "72", unit: "%", dataPeriod: "2023", direction: "lower_need", relevanceWeight: 70, sourceName: "World Bank", sourceUrl: "https://api.worldbank.org/example", notes: null },
      { country: "IN", category: "water", contextType: "investment_plan", label: "State water resilience plan", value: "50", unit: "contextual plan record", dataPeriod: "2025–2030", direction: "manual", relevanceWeight: 80, sourceName: "Official plan", sourceUrl: "https://example.gov/plan", notes: "Official plan record" },
    ]);
    expect(result.contextScore).toBeGreaterThanOrEqual(0);
    expect(result.contextScore).toBeLessThanOrEqual(100);
    expect(result.evidence).toHaveLength(2);
    expect(result.evidence[0]).toContain("World Bank");
  });

  it("returns a neutral context score when no attributable records exist", () => {
    expect(calculateNationalContextScore([])).toEqual({ contextScore: 50, evidence: [] });
  });
});
