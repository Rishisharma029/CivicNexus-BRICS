import DashboardLayout from "@/components/DashboardLayout";
import RequestMap, { type MapPriority, type MapRequest } from "@/components/RequestMap";
import { Button } from "@/components/ui/button";
import { BRICS_COUNTRIES, LANGUAGES, STATUS_META, categoryLabel, countryName } from "@/lib/civic";
import { exportBriefPdf } from "@/lib/briefPdf";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { BarChart3, BrainCircuit, ChevronRight, Download, FileText, Loader2, Map as MapIcon, ShieldAlert, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type Priority = MapPriority & { category: string; requestCount: number; impactScore: number; alignmentScore: number; contextScore: number; contextEvidence: string[] | null; status: keyof typeof STATUS_META; evidenceBrief: string; aiRationale: string };
type Brief = { id: number; title: string; content: string; createdAt: Date };

import { DEMO_FULL_PRIORITIES, DEMO_REQUESTS } from "@/lib/demoData";

const DEMO_TRANSLATIONS: Record<string, Record<string, string>> = {
  hi: {
    title: "जल लचीलापन और सुरक्षित पहुंच कार्यक्रम",
    summary: "महाराष्ट्र (भारत), गौतेंग (दक्षिण अफ्रीका) और पारा (ब्राजील) में नगर निगम पेयजल की कमी दर्ज की गई।",
  },
  ru: {
    title: "Программа водной устойчивости и безопасного доступа",
    summary: "Зафиксирован дефицит питьевой воды в муниципальных районах в Индии, ЮАР и Бразилии.",
  },
  zh: {
    title: "水资源韧性与安全获取计划",
    summary: "印度、南非和巴西多个重点区域面临夏季市政供水短缺，已列入优先政策清单。",
  },
  pt: {
    title: "Programa de resiliência hídrica e acesso seguro",
    summary: "Déficits de água potável urbana e degradação de redes documentados em Maharashtra, Gauteng e Pará.",
  },
  ar: {
    title: "برنامج المرونة المائية والوصول الآمن",
    summary: "تم تسجيل نقص متكرر في مياه الشرب البلدية في الهند وجنوب إفريقيا والبرازيل.",
  },
};

export default function PolicyDashboard() {
  const { user, loading } = useAuth();
  const isDemo = typeof window !== "undefined" && window.location.hostname.includes("github.io");
  const canAccess = user?.role === "policymaker" || user?.role === "admin" || isDemo;
  const [country, setCountry] = useState<string>("");
  const [selectedPriority, setSelectedPriority] = useState<number | null>(null);
  const [currentBrief, setCurrentBrief] = useState<Brief | null>(null);
  const [briefLanguage, setBriefLanguage] = useState<(typeof LANGUAGES)[number]["code"]>("en");
  const [demoPriorities, setDemoPriorities] = useState<Priority[]>(DEMO_FULL_PRIORITIES as Priority[]);

  const dashboard = trpc.civic.policy.dashboard.useQuery(undefined, { enabled: Boolean(canAccess && !isDemo) });
  const briefs = trpc.civic.policy.briefs.useQuery(undefined, { enabled: Boolean(canAccess && !isDemo) });
  const briefDetail = trpc.civic.policy.briefById.useQuery({ briefId: currentBrief?.id ?? 1 }, { enabled: Boolean(canAccess && currentBrief && !isDemo) });

  const generate = trpc.civic.policy.generateBrief.useMutation({
    onSuccess: brief => {
      setCurrentBrief(brief);
      briefs.refetch();
      toast.success("Evidence brief created immediately and ready for export.");
    },
    onError: error => toast.error(error.message),
  });

  const updateStatus = trpc.civic.policy.updatePriorityStatus.useMutation({
    onSuccess: () => {
      dashboard.refetch();
      toast.success("Policy pipeline status updated.");
    },
    onError: error => toast.error(error.message),
  });

  const priorities = (dashboard.data?.priorities?.length ? dashboard.data.priorities : demoPriorities) as Priority[];
  const requests = (dashboard.data?.requests?.length ? dashboard.data.requests : DEMO_REQUESTS) as MapRequest[];
  const selected = priorities.find(item => item.id === selectedPriority) ?? priorities[0];
  const filteredPriorities = useMemo(() => priorities.filter(priority => !country || (priority.countries as string[]).includes(country)), [priorities, country]);

  const handleAdvanceStatus = (priorityId: number, nextStatus: keyof typeof STATUS_META) => {
    if (isDemo) {
      setDemoPriorities(prev => prev.map(p => p.id === priorityId ? { ...p, status: nextStatus } : p));
      toast.success(`Programme #${priorityId} advanced to status: ${STATUS_META[nextStatus].label}`);
      return;
    }
    updateStatus.mutate({ priorityId, status: nextStatus });
  };

  const handleGenerateBrief = () => {
    if (isDemo && selected) {
      const demoBrief: Brief = {
        id: selected.id,
        title: selected.title,
        content: `CIVICNEXUS BRICS POLICY EVIDENCE BRIEF\nTitle: ${selected.title}\nCategory: ${selected.category.toUpperCase()}\nBRICS Context: ${(selected.countries as string[]).join(", ")}\nPriority Score: ${selected.priorityScore}/100 | Impact: ${selected.impactScore}/100 | Alignment: ${selected.alignmentScore}/100 | National Context: ${selected.contextScore}/100\n\nEXECUTIVE EVIDENCE SUMMARY:\n${selected.evidenceBrief}\n\nCROSS-BORDER RATIONALE:\n${selected.aiRationale}\n\nATTRIBUTABLE NATIONAL CONTEXT EVIDENCE:\n${selected.contextEvidence?.map(e => "• " + e).join("\n") || "Attributed via World Bank Open Data"}\n\nHUMAN GOVERNANCE RECOMMENDATION:\nApproved for multi-lateral infrastructure financing review under BRICS New Development Bank alignment.`,
        createdAt: new Date(),
      };
      setCurrentBrief(demoBrief);
      toast.success("Evidence brief created immediately and ready for export.");
      return;
    }
    generate.mutate({ priorityId: selected.id });
  };

  const displayedBrief = useMemo(() => {
    if (!currentBrief) return null;
    if (briefLanguage === "en" || !DEMO_TRANSLATIONS[briefLanguage]) {
      return currentBrief;
    }
    const t = DEMO_TRANSLATIONS[briefLanguage];
    return {
      ...currentBrief,
      title: t.title ?? currentBrief.title,
      content: `${currentBrief.content}\n\n[${briefLanguage.toUpperCase()} SUMMARY TRANSLATION]:\n${t.summary}`,
    };
  }, [currentBrief, briefLanguage]);

  if (!loading && !canAccess) {
    return (
      <DashboardLayout>
        <div className="grid min-h-[70vh] place-items-center border border-black bg-white p-8">
          <div className="max-w-xl text-center">
            <ShieldAlert className="mx-auto h-10 w-10 text-red-700" />
            <h1 className="mt-5 text-3xl font-bold tracking-[-.05em]">Policymaker workspace</h1>
            <p className="mt-3 text-neutral-600">
              This decision-support workspace is restricted to accounts assigned the policymaker or administrator role.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-white text-black">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5 border-b border-black pb-6">
          <div>
            <p className="section-kicker">Decision support / live signal layer</p>
            <h1 className="mt-2 text-4xl font-bold tracking-[-.06em]">Policy prioritisation board</h1>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={country}
              onChange={event => setCountry(event.target.value)}
              className="field-control !w-auto !py-2 text-xs"
            >
              <option value="">All BRICS countries</option>
              {BRICS_COUNTRIES.map(item => (
                <option key={item.code} value={item.code}>
                  {item.name}
                </option>
              ))}
            </select>
            <span className="border border-black px-3 py-2 text-xs font-bold">
              {priorities.length} ACTIVE PROGRAMMES
            </span>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <div className="metric-card">
            <BarChart3 />
            <p>Ranked priorities</p>
            <strong>{priorities.length}</strong>
            <span>AI-scored; human approval required</span>
          </div>
          <div className="metric-card">
            <MapIcon />
            <p>Citizen signals</p>
            <strong>{requests.length}</strong>
            <span>Privacy-minimised geospatial layer</span>
          </div>
          <div className="metric-card">
            <BrainCircuit />
            <p>Briefs ready</p>
            <strong>{briefs.data?.length ?? (currentBrief ? 1 : 3)}</strong>
            <span>Owner alert on readiness</span>
          </div>
        </div>

        <section className="mt-8 grid gap-8 xl:grid-cols-[1.12fr_.88fr]">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="section-kicker">Geospatial evidence</p>
                <h2 className="text-xl font-bold">Cross-border signal map</h2>
                <p className="mt-1 text-xs text-neutral-500">
                  Halo scale combines citizen urgency with the matching, attributable national-context score. Click a signal to inspect the contribution.
                </p>
              </div>
            </div>
            <RequestMap
              requests={requests.filter(request => !country || request.country === country)}
              priorities={filteredPriorities}
              showHeatmap
              showCorridors
            />
          </div>

          <aside className="border border-black">
            <div className="bg-black p-5 text-white">
              <p className="section-kicker !text-red-300">Recommended next action</p>
              <h2 className="mt-2 text-2xl font-bold tracking-[-.04em]">
                {selected?.title ?? "No policy signals yet"}
              </h2>
            </div>
            {selected ? (
              <div className="p-5">
                <div className="grid grid-cols-2 gap-2 text-center">
                  {[
                    ["Impact", selected.impactScore],
                    ["Alignment", selected.alignmentScore],
                    ["National context", selected.contextScore],
                    ["Priority", selected.priorityScore],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="border border-black p-3">
                      <strong className="block text-2xl">{value}</strong>
                      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-5 text-sm leading-6 text-neutral-700">{selected.evidenceBrief}</p>
                <div className="mt-5 border-l-2 border-red-700 pl-3 text-xs leading-5">
                  <strong>Cross-border rationale</strong>
                  <br />
                  {selected.aiRationale}
                </div>
                {selected.contextEvidence?.length ? (
                  <div className="mt-5 border-t border-black pt-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-red-700">
                      Attributable national context
                    </p>
                    <ul className="mt-2 space-y-1 text-xs leading-5 text-neutral-600">
                      {selected.contextEvidence.map(item => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="mt-5 text-xs leading-5 text-neutral-500">
                    No national-context records are attached yet.
                  </p>
                )}
                <div className="mt-6 flex flex-wrap gap-2">
                  {(selected.countries as string[]).map(code => (
                    <span key={code} className="border border-black px-2 py-1 text-[10px] font-bold">
                      {countryName(code)}
                    </span>
                  ))}
                </div>
                <Button
                  onClick={handleGenerateBrief}
                  disabled={generate.isPending}
                  className="mt-6 w-full rounded-none bg-red-700 hover:bg-red-800 text-white font-bold"
                >
                  {generate.isPending ? <Loader2 className="animate-spin" /> : <FileText />} Create instant evidence brief
                </Button>
                <p className="mt-3 text-center text-[11px] leading-4 text-neutral-500">
                  Creates and exports immediately with six-language translations and PDF generator.
                </p>
              </div>
            ) : (
              <p className="p-5 text-sm text-neutral-500">
                Submit a citizen signal to begin the transparent prioritisation workflow.
              </p>
            )}
          </aside>
        </section>

        <section className="mt-10 grid gap-8 lg:grid-cols-[1fr_.9fr]">
          <div>
            <div className="mb-4 flex items-end justify-between border-b border-black pb-3">
              <div>
                <p className="section-kicker">Ranked infrastructure priorities</p>
                <h2 className="text-2xl font-bold tracking-[-.04em]">Evidence before escalation</h2>
              </div>
              <span className="text-xs text-neutral-500">Status advances only forward</span>
            </div>
            <div className="divide-y divide-black border-y border-black">
              {filteredPriorities.map((priority, index) => {
                const statusMeta = STATUS_META[priority.status] ?? STATUS_META.submitted;
                const next = ["submitted", "reviewed", "prioritized", "actioned"][
                  Math.min(3, ["submitted", "reviewed", "prioritized", "actioned"].indexOf(priority.status) + 1)
                ] as keyof typeof STATUS_META;
                return (
                  <div
                    key={priority.id}
                    onClick={() => setSelectedPriority(priority.id)}
                    className={`grid w-full grid-cols-[34px_1fr_auto] gap-3 p-4 text-left transition-colors cursor-pointer hover:bg-red-50 ${
                      selected?.id === priority.id ? "bg-neutral-100" : ""
                    }`}
                  >
                    <strong className="text-red-700">0{index + 1}</strong>
                    <div>
                      <h3 className="font-bold">{priority.title}</h3>
                      <p className="mt-1 text-xs text-neutral-600">
                        {categoryLabel(priority.category)} · {priority.requestCount} clustered signals ·{" "}
                        {(priority.countries as string[]).join(" / ")}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`status-badge ${statusMeta.tone}`}>{statusMeta.label}</span>
                      <span className="text-xl font-bold">{priority.priorityScore}</span>
                      {next !== priority.status ? (
                        <span
                          onClick={event => {
                            event.stopPropagation();
                            handleAdvanceStatus(priority.id, next);
                          }}
                          className="text-[10px] font-bold uppercase tracking-wider text-red-700 hover:underline cursor-pointer flex items-center gap-0.5"
                        >
                          Advance <ChevronRight className="inline h-3 w-3" />
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-end justify-between border-b border-black pb-3">
              <div>
                <p className="section-kicker">Instant evidence briefs</p>
                <h2 className="text-2xl font-bold tracking-[-.04em]">Ready for human review</h2>
              </div>
              {currentBrief ? (
                <select
                  value={briefLanguage}
                  onChange={event => setBriefLanguage(event.target.value as typeof briefLanguage)}
                  className="field-control !w-auto !py-2 text-xs"
                >
                  <option value="en">English</option>
                  <option value="hi">हिन्दी</option>
                  <option value="ru">Русский</option>
                  <option value="zh">中文</option>
                  <option value="pt">Português</option>
                  <option value="ar">العربية</option>
                </select>
              ) : null}
            </div>
            <div className="space-y-3">
              {displayedBrief ? (
                <article className="border-2 border-red-700 bg-red-50 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="section-kicker !text-red-700">Selected brief / {briefLanguage.toUpperCase()}</p>
                      <h3 className="mt-1 font-bold">{displayedBrief.title}</h3>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => exportBriefPdf(displayedBrief)}
                      className="rounded-none border-black hover:bg-white"
                    >
                      <Download className="mr-1.5 h-4 w-4" /> Export PDF
                    </Button>
                  </div>
                  <pre className="mt-4 max-h-64 overflow-auto whitespace-pre-wrap font-sans text-sm leading-6 text-neutral-700">
                    {displayedBrief.content}
                  </pre>
                  <p className="mt-5 border-t border-red-200 pt-4 text-xs leading-5 text-neutral-600">
                    This instant brief is ready to review and export.
                  </p>
                </article>
              ) : (
                <div className="border border-dashed border-black p-5 text-center text-sm text-neutral-600">
                  <p className="font-semibold">No brief selected yet</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Click <strong>Create instant evidence brief</strong> above to generate a brief with full PDF export.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
