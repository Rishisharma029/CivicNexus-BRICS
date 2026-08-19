export const POLICY_STATUS_ORDER = ["submitted", "reviewed", "prioritized", "actioned"] as const;
export type PolicyStatus = (typeof POLICY_STATUS_ORDER)[number];

const urgencyWeights = { low: 25, medium: 50, high: 75, critical: 100 } as const;

export function canTransitionPolicyStatus(from: PolicyStatus, to: PolicyStatus) {
  return POLICY_STATUS_ORDER.indexOf(to) >= POLICY_STATUS_ORDER.indexOf(from);
}

export function calculatePriorityScores(input: {
  urgency: keyof typeof urgencyWeights;
  requestCount: number;
  countryCount: number;
  aiUrgencyScore: number;
  confidence: number;
  contextScore?: number;
}) {
  const baselineUrgency = urgencyWeights[input.urgency];
  const alignmentScore = Math.min(100, Math.round((input.countryCount / 5) * 100));
  const impactScore = Math.min(
    100,
    Math.round(24 + baselineUrgency * 0.36 + input.aiUrgencyScore * 0.26 + input.requestCount * 4 + input.countryCount * 6),
  );
  const priorityScore = Math.min(
    100,
    Math.round(impactScore * 0.49 + alignmentScore * 0.26 + Math.max(0, Math.min(100, input.confidence)) * 0.15 + Math.max(0, Math.min(100, input.contextScore ?? 50)) * 0.10),
  );

  return { impactScore, alignmentScore, priorityScore };
}

export function formatCategory(category: string) {
  return category.replaceAll("_", " ").replace(/\b\w/g, character => character.toUpperCase());
}

export function buildImmediateEvidenceBrief(input: {
  title: string;
  category: string;
  countries: string[];
  requestCount: number;
  impactScore: number;
  alignmentScore: number;
  contextScore: number;
  priorityScore: number;
  evidenceBrief: string;
  aiRationale: string;
  contextEvidence?: string[] | null;
}) {
  const nationalContext = input.contextEvidence?.length ? input.contextEvidence.map(item => `- ${item}`).join("\n") : "- No attributable national-context records are attached yet; verify official local sources before escalation.";
  return `# Policy brief — ${input.title}

## Decision question
Should responsible BRICS institutions review a coordinated response to the recorded ${formatCategory(input.category).toLowerCase()} signal?

## Citizen signal
${input.evidenceBrief}

## Evidence snapshot
- Clustered citizen signals: ${input.requestCount}
- Countries represented: ${input.countries.join(", ")}
- Impact score: ${input.impactScore}/100
- Cross-nation alignment: ${input.alignmentScore}/100
- National-context score: ${input.contextScore}/100
- Composite priority: ${input.priorityScore}/100

## Cross-border alignment
${input.aiRationale}

## Attributable national context
${nationalContext}

## Recommended next 90-day review
Validate the citizen-reported need with the relevant local authority, identify responsible delivery institutions, assess equity and accessibility effects, and define a time-bound pilot only after a documented human review.

## Metrics for review
Track verified service access, affected-population reach, response time, implementation cost, and any distributional impact by locality.

## Human review note
This instant evidence brief is assembled from recorded citizen signals, transparent scores, and attributable context. It is not a funding decision, verified field assessment, or substitute for statutory consultation. Use optional AI refinement only after reviewing the evidence trace.`;
}
