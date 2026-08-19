export type ContextDirection = "higher_need" | "lower_need" | "manual";
export type ContextScoreRecord = {
  indicatorCode: string;
  label: string;
  value: string;
  direction: ContextDirection;
  relevanceWeight: number;
  country: string;
  sourceName: string;
  dataPeriod: string;
};

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export function calculateNationalContextScore(records: ContextScoreRecord[]) {
  if (!records.length) return { contextScore: 50, evidence: [] as string[] };
  const groups = new Map<string, ContextScoreRecord[]>();
  records.forEach(record => groups.set(record.indicatorCode, [...(groups.get(record.indicatorCode) ?? []), record]));
  const weightedSignals: { score: number; weight: number; evidence: string }[] = [];
  for (const indicatorRecords of Array.from(groups.values()) as ContextScoreRecord[][]) {
    const numeric = indicatorRecords.map(record => Number(record.value)).filter(Number.isFinite);
    const min = Math.min(...numeric);
    const max = Math.max(...numeric);
    for (const record of indicatorRecords) {
      const raw = Number(record.value);
      const score = !Number.isFinite(raw) || record.direction === "manual" || max === min
        ? 50
        : record.direction === "higher_need"
          ? ((raw - min) / (max - min)) * 100
          : ((max - raw) / (max - min)) * 100;
      weightedSignals.push({ score, weight: Math.max(1, record.relevanceWeight), evidence: `${record.label} (${record.country}, ${record.dataPeriod}; ${record.sourceName})` });
    }
  }
  const totalWeight = weightedSignals.reduce((total, item) => total + item.weight, 0);
  const contextScore = totalWeight ? clamp(weightedSignals.reduce((total, item) => total + item.score * item.weight, 0) / totalWeight) : 50;
  return { contextScore, evidence: Array.from(new Set(weightedSignals.map(item => item.evidence))).slice(0, 8) };
}
