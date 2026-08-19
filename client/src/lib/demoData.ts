import type { MapPriority, MapRequest } from "@/components/RequestMap";

export const DEMO_REQUESTS: MapRequest[] = [
  {
    id: 101,
    country: "IN",
    category: "water",
    urgency: "critical",
    locationLabel: "Pune, Maharashtra, India",
    latitude: "18.5204",
    longitude: "73.8567",
    analysisState: "complete",
    analysis: {
      summary: "Recurrent drinking water supply interruption across 14 municipal wards during peak summer months.",
      urgencyScore: 92,
      confidence: 95,
    },
  },
  {
    id: 102,
    country: "IN",
    category: "agriculture",
    urgency: "high",
    locationLabel: "Nashik Agricultural Belt, Maharashtra, India",
    latitude: "19.9975",
    longitude: "73.7898",
    analysisState: "complete",
    analysis: {
      summary: "Pest outbreak and unexpected soil salinity affecting onion and tomato crops across 240 hectares.",
      urgencyScore: 84,
      confidence: 91,
    },
  },
  {
    id: 103,
    country: "ZA",
    category: "water",
    urgency: "critical",
    locationLabel: "Gauteng / Johannesburg, South Africa",
    latitude: "-26.2041",
    longitude: "28.0473",
    analysisState: "complete",
    analysis: {
      summary: "High water stress and pipeline deterioration impacting peri-urban healthcare clinics and schools.",
      urgencyScore: 88,
      confidence: 93,
    },
  },
  {
    id: 104,
    country: "BR",
    category: "climate",
    urgency: "high",
    locationLabel: "Belém, Pará, Brazil",
    latitude: "-1.4558",
    longitude: "-48.4902",
    analysisState: "complete",
    analysis: {
      summary: "Intense flash flooding and drainage overflow impacting riverine communities and road connectivity.",
      urgencyScore: 82,
      confidence: 89,
    },
  },
  {
    id: 105,
    country: "CN",
    category: "digital",
    urgency: "medium",
    locationLabel: "Chengdu Rural Fringe, Sichuan, China",
    latitude: "30.5728",
    longitude: "104.0668",
    analysisState: "complete",
    analysis: {
      summary: "Rural fiber optic expansion request to support smart irrigation and agricultural telemetry.",
      urgencyScore: 68,
      confidence: 90,
    },
  },
  {
    id: 106,
    country: "RU",
    category: "energy",
    urgency: "high",
    locationLabel: "Kazan District, Tatarstan, Russia",
    latitude: "55.7963",
    longitude: "49.1088",
    analysisState: "complete",
    analysis: {
      summary: "Substation overload and thermal insulation deficiencies during extreme sub-zero weather spells.",
      urgencyScore: 81,
      confidence: 92,
    },
  },
];

export const DEMO_FULL_PRIORITIES = [
  {
    id: 1,
    title: "Water resilience and safe access programme",
    category: "water",
    countries: ["IN", "ZA", "BR"],
    requestCount: 24,
    impactScore: 88,
    alignmentScore: 80,
    contextScore: 78,
    priorityScore: 86,
    status: "reviewed" as const,
    evidenceBrief: "Recurrent urban drinking water deficits and pipeline breakdown documented across Maharashtra (India), Gauteng (South Africa), and Pará (Brazil).",
    aiRationale: "Cross-border alignment identified in municipal water distribution strain and climate-induced water table degradation.",
    contextEvidence: [
      "World Bank (SH.H2O.SMDW.ZS): 72% basic drinking water access baseline (2023)",
      "National Infrastructure Pipeline: State Water Security Plan (2025–2030)"
    ],
  },
  {
    id: 2,
    title: "Farmer climate resilience and advisory programme",
    category: "agriculture",
    countries: ["IN", "BR", "CN"],
    requestCount: 19,
    impactScore: 84,
    alignmentScore: 75,
    contextScore: 74,
    priorityScore: 82,
    status: "prioritized" as const,
    evidenceBrief: "Agronomic stress from erratic monsoons, soil salinity shifts, and localized pest infestations reported by smallholder farmer clusters.",
    aiRationale: "Shared requirement for localized vernacular extension advisories, organic bio-control protocols, and micro-irrigation subsidies.",
    contextEvidence: [
      "World Bank (AG.LND.AGRI.ZS): 60.4% agricultural land area representation",
      "World Bank (NV.AGR.TOTL.ZS): 16.8% agriculture value added to GDP"
    ],
  },
  {
    id: 3,
    title: "Clean energy access and cold-climate grid modernisation",
    category: "energy",
    countries: ["RU", "ZA", "IN"],
    requestCount: 12,
    impactScore: 78,
    alignmentScore: 60,
    contextScore: 68,
    priorityScore: 75,
    status: "submitted" as const,
    evidenceBrief: "Substation overload and thermal insulation deficiencies during extreme climate events.",
    aiRationale: "Regional grid resilience, smart-metering deployment, and decentralized renewable mini-grid expansion.",
    contextEvidence: [
      "World Bank (EG.ELC.ACCS.ZS): 98.2% electrification baseline with rural peak load volatility"
    ],
  },
];

export const DEMO_PRIORITIES: MapPriority[] = DEMO_FULL_PRIORITIES;

