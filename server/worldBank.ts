export const worldBankIndicators = [
  { code: "SP.POP.TOTL", label: "Population, total", unit: "people", contextType: "demographic" as const, category: null, direction: "higher_need" as const, relevanceWeight: 25 },
  { code: "IT.NET.USER.ZS", label: "Individuals using the Internet", unit: "% of population", contextType: "infrastructure_index" as const, category: "digital", direction: "lower_need" as const, relevanceWeight: 70 },
  { code: "EG.ELC.ACCS.ZS", label: "Access to electricity", unit: "% of population", contextType: "infrastructure_index" as const, category: "energy", direction: "lower_need" as const, relevanceWeight: 75 },
  { code: "SH.H2O.SMDW.ZS", label: "People using at least basic drinking water services", unit: "% of population", contextType: "infrastructure_index" as const, category: "water", direction: "lower_need" as const, relevanceWeight: 75 },
  { code: "AG.LND.AGRI.ZS", label: "Agricultural land", unit: "% of land area", contextType: "agriculture_index" as const, category: "agriculture", direction: "manual" as const, relevanceWeight: 45 },
  { code: "NV.AGR.TOTL.ZS", label: "Agriculture, forestry, and fishing value added", unit: "% of GDP", contextType: "agriculture_index" as const, category: "agriculture", direction: "manual" as const, relevanceWeight: 55 },
] as const;

type WorldBankDatum = { date: string; value: number | null };

export async function fetchLatestWorldBankIndicator(country: string, indicatorCode: string) {
  const url = `https://api.worldbank.org/v2/country/${country}/indicator/${indicatorCode}?format=json&per_page=12`;
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`World Bank indicator request failed for ${country}/${indicatorCode}.`);
  const payload = await response.json() as [unknown, WorldBankDatum[]];
  const latest = payload[1]?.find(item => item.value !== null && Number.isFinite(item.value));
  if (!latest) return null;
  return { value: latest.value!, dataPeriod: latest.date, sourceUrl: url };
}
