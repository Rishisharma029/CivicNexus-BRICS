import type { MapPriority, MapRequest } from "@/components/RequestMap";

export const DEMO_REQUESTS: (MapRequest & { status: "submitted" | "reviewed" | "prioritized" | "actioned" })[] = [
  {
    id: 101,
    country: "IN",
    category: "water",
    urgency: "critical",
    status: "reviewed",
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
    status: "prioritized",
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
    status: "submitted",
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
    status: "reviewed",
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
    status: "submitted",
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
    status: "actioned",
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

export const DEMO_AUDIT_LOGS = [
  { id: 1, action: "status_updated", note: "Moderation approved advancement of Pune Water Signal to reviewed status.", entityType: "request", entityId: 101, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 2, action: "policy_matrix_indexed", note: "Nashik Agricultural Belt signal included in BRICS Agriculture Programme.", entityType: "priority", entityId: 2, createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 3, action: "signal_created", note: "Citizen signal logged via authenticated portal.", entityType: "request", entityId: 103, createdAt: new Date(Date.now() - 10800000).toISOString() },
  { id: 4, action: "brief_generated", note: "Executive evidence brief compiled and ready for multilateral review.", entityType: "brief", entityId: 1, createdAt: new Date(Date.now() - 14400000).toISOString() },
];

export const DEMO_WORLD_BANK_RECORDS = [
  { id: 1, country: "IN", category: "water", contextType: "world_bank_indicator", indicatorCode: "SH.H2O.SMDW.ZS", label: "Safely managed drinking water services (% of population)", value: "72.4", unit: "%", dataPeriod: "2023", relevanceWeight: 85, sourceUrl: "https://data.worldbank.org/indicator/SH.H2O.SMDW.ZS?locations=IN", notes: "Attributed from World Bank Open Data (India)" },
  { id: 2, country: "IN", category: "agriculture", contextType: "world_bank_indicator", indicatorCode: "AG.LND.AGRI.ZS", label: "Agricultural land (% of land area)", value: "60.4", unit: "%", dataPeriod: "2023", relevanceWeight: 80, sourceUrl: "https://data.worldbank.org/indicator/AG.LND.AGRI.ZS?locations=IN", notes: "Attributed from World Bank Open Data (India)" },
  { id: 3, country: "ZA", category: "water", contextType: "world_bank_indicator", indicatorCode: "SH.H2O.SMDW.ZS", label: "Safely managed drinking water services (% of population)", value: "79.1", unit: "%", dataPeriod: "2023", relevanceWeight: 82, sourceUrl: "https://data.worldbank.org/indicator/SH.H2O.SMDW.ZS?locations=ZA", notes: "Attributed from World Bank Open Data (South Africa)" },
  { id: 4, country: "BR", category: "climate", contextType: "world_bank_indicator", indicatorCode: "ER.FSH.AQUA.MT", label: "Aquaculture production (metric tons)", value: "624300", unit: "MT", dataPeriod: "2022", relevanceWeight: 75, sourceUrl: "https://data.worldbank.org/indicator/ER.FSH.AQUA.MT?locations=BR", notes: "Attributed from World Bank Open Data (Brazil)" },
  { id: 5, country: "CN", category: "digital", contextType: "world_bank_indicator", indicatorCode: "IT.NET.USER.ZS", label: "Individuals using the Internet (% of population)", value: "76.4", unit: "%", dataPeriod: "2023", relevanceWeight: 90, sourceUrl: "https://data.worldbank.org/indicator/IT.NET.USER.ZS?locations=CN", notes: "Attributed from World Bank Open Data (China)" },
  { id: 6, country: "RU", category: "energy", contextType: "world_bank_indicator", indicatorCode: "EG.ELC.ACCS.ZS", label: "Access to electricity (% of population)", value: "100.0", unit: "%", dataPeriod: "2023", relevanceWeight: 78, sourceUrl: "https://data.worldbank.org/indicator/EG.ELC.ACCS.ZS?locations=RU", notes: "Attributed from World Bank Open Data (Russia)" },
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

export function getDemoDetail(id: number) {
  const req = DEMO_REQUESTS.find(r => r.id === id) ?? DEMO_REQUESTS[0];
  return {
    request: {
      id: req.id,
      userId: 1,
      country: req.country,
      category: req.category,
      urgency: req.urgency,
      title: req.id === 102 ? "Pest infestation and soil salinity stress in Nashik" : "Recurrent drinking water supply cuts in municipal zone",
      description: req.id === 102 
        ? "Farmers across the Nashik belt report unseasonal humidity causing fungal blights and pest attacks on tomato and onion crops. Soil salinity has increased after recent canal irrigation cycles."
        : "Over 14 residential wards face erratic water tanker schedules and low pressure in main distribution lines during summer peak demand. Primary health clinic is forced to store water in unsealed containers.",
      locationLabel: req.locationLabel,
      latitude: req.latitude,
      longitude: req.longitude,
      channel: "web",
      originalLanguage: "en",
      status: "reviewed" as const,
      analysisState: "complete",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    analysis: {
      id: 1,
      requestId: req.id,
      summary: req.analysis?.summary ?? "Public infrastructure signal validated and categorized by Gemini AI.",
      confidence: req.analysis?.confidence ?? 94,
      urgencyScore: req.analysis?.urgencyScore ?? 88,
      sentiment: "urgent",
      impactStatement: "Affects over 12,000 residents and local smallholder agricultural units. High return on public remediation.",
      crossBorderThemes: ["Water Security", "Climate Adaptation", "Agricultural Resilience", "Municipal Infrastructure"],
      duplicateOfId: null,
      rawOutput: "{}",
      createdAt: new Date().toISOString(),
    },
    translations: [
      { language: "en", title: req.id === 102 ? "Pest infestation and soil salinity stress in Nashik" : "Recurrent drinking water supply cuts in municipal zone", content: req.id === 102 ? "Farmers across the Nashik belt report unseasonal humidity causing fungal blights and pest attacks on tomato and onion crops." : "Over 14 residential wards face erratic water tanker schedules and low pressure in main distribution lines during summer peak demand." },
      { language: "hi", title: req.id === 102 ? "नासिक में कीट प्रकोप और मिट्टी की लवणता" : "नगर निगम क्षेत्र में लगातार पेयजल आपूर्ति में बाधा", content: req.id === 102 ? "नासिक बेल्ट के किसानों ने टमाटर और प्याज की फसलों पर कवक और कीटों के हमले की सूचना दी है।" : "14 से अधिक आवासीय वार्डों में गर्मियों के दौरान पानी के टैंकरों की अनियमितता का सामना करना पड़ रहा है।" },
      { language: "ru", title: "Перебои с водоснабжением в муниципальном районе", content: "Жители сообщают о перебоях в подаче питьевой воды и снижении давления в сети." },
      { language: "zh", title: "市政供水中断及管网水压不足问题", content: "居民反映夏季用水高峰期供水不稳定，建议加快管道维护。" },
      { language: "pt", title: "Interrupções no fornecimento de água potável", content: "Moradores relatam escassez de água e pressão insuficiente nas redes durante o verão." },
      { language: "ar", title: "انقطاع إمدادات مياه الشرب في المنطقة البلدية", content: "أبلغ المواطنون عن تكرار انقطاع المياه في أوقات الذروة." },
    ],
    analysisTranslations: [
      { language: "en", title: "AI Analysis", content: "High priority infrastructure requirement with severe community impact." },
      { language: "hi", title: "एआई विश्लेषण", content: "गंभीर सामुदायिक प्रभाव वाला उच्च प्राथमिकता वाला बुनियादी ढाँचा अनुरोध।" },
      { language: "ru", title: "ИИ-анализ", content: "Высокоприоритетный запрос на модернизацию инфраструктуры." },
      { language: "zh", title: "AI 分析", content: "具有高度公共影响的优先基础设施需求。" },
      { language: "pt", title: "Análise de IA", content: "Demanda de infraestrutura de alta prioridade com impacto comunitário." },
      { language: "ar", title: "تحليل الذكاء الاصطناعي", content: "طلب بنية تحتية عالي الأولوية وله تأثير مجتمعي مباشر." },
    ],
    farmerAdvisory: req.category === "agriculture" || req.id === 102 ? {
      id: 1,
      requestId: req.id,
      summary: "Integrated pest management and drainage guidance for horticultural crops.",
      recommendedActions: [
        "Improve furrow aeration and drainage to reduce fungal spread in waterlogged zones.",
        "Apply neem-based organic bio-repellents during early morning hours.",
        "Monitor soil moisture with tensiometer before next irrigation cycle."
      ],
      cautions: [
        "Do not apply unprescribed chemical pesticides without local agronomist consultation.",
        "Avoid overhead sprinkler irrigation during high humidity periods."
      ],
      escalation: "Escalate to District Krishi Vigyan Kendra (KVK) or Agronomy Extension Officer for lab soil testing.",
      createdAt: new Date().toISOString(),
    } : null,
    advisoryTranslations: [
      { language: "en", title: "Farmer Advisory", content: "Integrated pest management and drainage guidance for horticultural crops." },
      { language: "hi", title: "किसान सलाह", content: "बागवानी फसलों के लिए एकीकृत कीट प्रबंधन और जल निकासी मार्गदर्शन।" },
    ],
    audit: [
      { id: 1, action: "signal_created", note: "Signal captured via verified civic channel", entityType: "request", entityId: req.id, createdAt: new Date().toISOString() },
      { id: 2, action: "ai_analysis_completed", note: "Gemini 2.5 structured analysis and multilanguage translation completed", entityType: "analysis", entityId: 1, createdAt: new Date().toISOString() },
      { id: 3, action: "policy_matrix_indexed", note: "Indexed into cross-border BRICS demand registry", entityType: "priority", entityId: 1, createdAt: new Date().toISOString() },
    ],
  };
}


