import { Button } from "@/components/ui/button";
import { BRICS_COUNTRIES, CATEGORIES } from "@/lib/civic";
import { trpc } from "@/lib/trpc";
import { DatabaseZap, ExternalLink, Loader2, PlusCircle, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DEMO_WORLD_BANK_RECORDS } from "@/lib/demoData";

export default function NationalContextPanel() {
  const isDemo = typeof window !== "undefined" && window.location.hostname.includes("github.io");
  const [demoRecords, setDemoRecords] = useState<any[]>(DEMO_WORLD_BANK_RECORDS);
  const [isSyncing, setIsSyncing] = useState(false);

  const context = trpc.civic.admin.nationalContext.useQuery(undefined, { enabled: !isDemo });
  const sync = trpc.civic.admin.syncWorldBankContext.useMutation({
    onSuccess: result => {
      context.refetch();
      toast.success(`${result.imported} World Bank context records synchronised.`);
    },
    onError: error => toast.error(error.message),
  });

  const [plan, setPlan] = useState({
    country: "IN" as "BR" | "RU" | "IN" | "CN" | "ZA",
    category: "" as "" | (typeof CATEGORIES)[number]["value"],
    label: "",
    sourceUrl: "",
    dataPeriod: "2026",
    notes: "",
    relevanceWeight: 60,
  });

  const addPlan = trpc.civic.admin.addInvestmentPlanContext.useMutation({
    onSuccess: () => {
      context.refetch();
      setPlan(current => ({ ...current, label: "", sourceUrl: "", notes: "" }));
      toast.success("Attributed investment-plan context recorded.");
    },
    onError: error => toast.error(error.message),
  });

  const handleSync = () => {
    if (isDemo) {
      setIsSyncing(true);
      setTimeout(() => {
        setIsSyncing(false);
        setDemoRecords(DEMO_WORLD_BANK_RECORDS);
        toast.success("6 World Bank indicator baselines synchronised successfully (Demo Mode).");
      }, 600);
      return;
    }
    sync.mutate();
  };

  const handleAddPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemo) {
      const newRecord = {
        id: Date.now(),
        country: plan.country,
        category: plan.category || "water",
        contextType: "public_investment_plan",
        label: plan.label,
        value: "Approved",
        unit: "programme",
        dataPeriod: plan.dataPeriod,
        relevanceWeight: plan.relevanceWeight,
        sourceUrl: plan.sourceUrl,
        notes: plan.notes,
      };
      setDemoRecords(prev => [newRecord, ...prev]);
      setPlan(current => ({ ...current, label: "", sourceUrl: "", notes: "" }));
      toast.success("Attributed investment-plan context recorded into BRICS registry.");
      return;
    }
    addPlan.mutate({ ...plan, category: plan.category || undefined });
  };

  const records = context.data?.length ? context.data : demoRecords;

  return (
    <section className="mt-9 border border-black">
      <div className="grid gap-5 border-b border-black bg-black p-5 text-white lg:grid-cols-[1fr_auto]">
        <div>
          <p className="section-kicker !text-red-300">National context layer</p>
          <h2 className="mt-2 text-2xl font-bold tracking-[-.04em]">
            Combine civic demand with attributable evidence.
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-300">
            World Bank demographic and infrastructure-access indicators can be synchronised as context. Administrators can also record a sourced public-investment plan. Missing values are never imputed, and context supports rather than replaces human review.
          </p>
        </div>
        <Button
          onClick={handleSync}
          disabled={sync.isPending || isSyncing}
          className="h-fit self-end rounded-none bg-red-700 hover:bg-red-800 text-white font-bold"
        >
          {sync.isPending || isSyncing ? <Loader2 className="animate-spin" /> : <RefreshCw />} Sync World Bank baseline
        </Button>
      </div>

      <div className="grid gap-8 p-5 lg:grid-cols-[.9fr_1.1fr]">
        <div>
          <div className="flex items-center gap-2">
            <DatabaseZap className="h-5 w-5 text-red-700" />
            <h3 className="font-bold">Imported and attributed records ({records.length})</h3>
          </div>
          <div className="mt-4 max-h-72 space-y-2 overflow-auto pr-1">
            {records.length ? (
              records.map((record: any) => (
                <article key={record.id} className="border border-black p-3 bg-neutral-50/70">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-red-700">
                        {record.contextType.replaceAll("_", " ")} · {record.country}
                      </p>
                      <p className="mt-1 text-sm font-semibold">{record.label}</p>
                    </div>
                    <strong className="text-sm">
                      {record.value} {record.unit}
                    </strong>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-neutral-500">
                    <span>
                      {record.dataPeriod} · weight {record.relevanceWeight}
                    </span>
                    <a
                      className="inline-flex items-center gap-1 underline text-red-700 hover:text-red-900"
                      href={record.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Source <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </article>
              ))
            ) : (
              <p className="border border-dashed border-black p-4 text-sm text-neutral-500">
                No national-context records yet. Use the World Bank baseline sync before building a context-weighted portfolio.
              </p>
            )}
          </div>
        </div>

        <form onSubmit={handleAddPlan}>
          <p className="field-label">Add public-investment plan context</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <select
              value={plan.country}
              onChange={event => setPlan(current => ({ ...current, country: event.target.value as typeof plan.country }))}
              className="field-control"
            >
              <option value="BR">Brazil</option>
              <option value="RU">Russia</option>
              <option value="IN">India</option>
              <option value="CN">China</option>
              <option value="ZA">South Africa</option>
            </select>
            <select
              value={plan.category}
              onChange={event => setPlan(current => ({ ...current, category: event.target.value as typeof plan.category }))}
              className="field-control"
            >
              <option value="">All categories</option>
              {CATEGORIES.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            <input
              required
              value={plan.label}
              onChange={event => setPlan(current => ({ ...current, label: event.target.value }))}
              placeholder="Plan or investment programme title"
              className="field-control sm:col-span-2"
            />
            <input
              required
              type="url"
              value={plan.sourceUrl}
              onChange={event => setPlan(current => ({ ...current, sourceUrl: event.target.value }))}
              placeholder="Official public source URL"
              className="field-control sm:col-span-2"
            />
            <input
              required
              value={plan.dataPeriod}
              onChange={event => setPlan(current => ({ ...current, dataPeriod: event.target.value }))}
              placeholder="Plan period, e.g. 2025–2030"
              className="field-control"
            />
            <input
              required
              type="number"
              min="1"
              max="100"
              value={plan.relevanceWeight}
              onChange={event => setPlan(current => ({ ...current, relevanceWeight: Number(event.target.value) }))}
              placeholder="Relevance weight"
              className="field-control"
            />
            <textarea
              required
              minLength={5}
              value={plan.notes}
              onChange={event => setPlan(current => ({ ...current, notes: event.target.value }))}
              placeholder="Explain why the plan is relevant. Do not state that it proves a citizen claim."
              className="field-control min-h-24 resize-y sm:col-span-2"
            />
          </div>
          <Button
            disabled={addPlan.isPending}
            type="submit"
            className="mt-4 rounded-none bg-red-700 hover:bg-red-800 text-white font-bold"
          >
            {addPlan.isPending ? <Loader2 className="animate-spin" /> : <PlusCircle />} Record attributed plan
          </Button>
        </form>
      </div>
    </section>
  );
}
