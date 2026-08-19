import { describe, expect, it } from "vitest";
import { calculatePriorityScores, canTransitionPolicyStatus } from "./policy";

describe("CivicNexus policy scoring", () => {
  it("raises priority for urgent, cross-border, confident signals", () => {
    const lowSignal = calculatePriorityScores({ urgency: "low", requestCount: 1, countryCount: 1, aiUrgencyScore: 20, confidence: 50 });
    const strongSignal = calculatePriorityScores({ urgency: "critical", requestCount: 12, countryCount: 5, aiUrgencyScore: 94, confidence: 92 });
    expect(strongSignal.priorityScore).toBeGreaterThan(lowSignal.priorityScore);
    expect(strongSignal.alignmentScore).toBe(100);
  });

  it("permits the exact forward-only policy status pipeline", () => {
    expect(canTransitionPolicyStatus("submitted", "reviewed")).toBe(true);
    expect(canTransitionPolicyStatus("reviewed", "prioritized")).toBe(true);
    expect(canTransitionPolicyStatus("prioritized", "actioned")).toBe(true);
    expect(canTransitionPolicyStatus("actioned", "reviewed")).toBe(false);
  });
});
