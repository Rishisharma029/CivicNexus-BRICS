export type CivicRole = "citizen" | "policymaker" | "admin";

export function canSubmitCivicSignal(role: CivicRole) {
  return role === "citizen" || role === "admin";
}

export function canUsePolicyWorkspace(role: CivicRole) {
  return role === "policymaker" || role === "admin";
}

export function canModerateCivicNexus(role: CivicRole) {
  return role === "admin";
}
