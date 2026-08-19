import { describe, expect, it } from "vitest";
import { canModerateCivicNexus, canSubmitCivicSignal, canUsePolicyWorkspace } from "./access";

describe("CivicNexus role boundaries", () => {
  it("allows citizens to submit but not to enter policy or moderation workspaces", () => {
    expect(canSubmitCivicSignal("citizen")).toBe(true);
    expect(canUsePolicyWorkspace("citizen")).toBe(false);
    expect(canModerateCivicNexus("citizen")).toBe(false);
  });

  it("allows policymakers to use decision support but not to moderate", () => {
    expect(canSubmitCivicSignal("policymaker")).toBe(false);
    expect(canUsePolicyWorkspace("policymaker")).toBe(true);
    expect(canModerateCivicNexus("policymaker")).toBe(false);
  });

  it("gives administrators full operational access", () => {
    expect(canSubmitCivicSignal("admin")).toBe(true);
    expect(canUsePolicyWorkspace("admin")).toBe(true);
    expect(canModerateCivicNexus("admin")).toBe(true);
  });
});
