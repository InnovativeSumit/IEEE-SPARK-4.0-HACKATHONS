import { useEffect, useState } from "react";
import { Download, FileText, Printer } from "lucide-react";
import { api } from "../services/api";
import RiskBadge from "../components/RiskBadge";

export default function Reports() {
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    api.reportSummary().then(setSummary);
  }, []);

  if (!summary) return <div className="p-6 text-sm text-[var(--text-muted)]">Generating situation report…</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">WASH Situation Report</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Generated {new Date(summary.generated_at).toLocaleString()} · {summary.mode}</p>
        </div>
        <div className="flex gap-2">
          <a href={api.csvExportUrl()} className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium hover:bg-[var(--bg-muted)]">
            <Download className="h-4 w-4" /> Export CSV
          </a>
          <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg bg-monsoon-500 px-4 py-2 text-sm font-semibold text-white hover:bg-monsoon-600">
            <Printer className="h-4 w-4" /> Print / Save as PDF
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 shadow-panel">
        <div className="mb-5 flex items-center gap-2">
          <FileText className="h-4 w-4 text-monsoon-500" />
          <p className="font-display text-sm font-semibold">Event summary</p>
        </div>
        <p className="text-sm text-[var(--text-muted)]">{summary.event_summary}</p>

        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            ["Affected population", summary.affected_population.toLocaleString()],
            ["Flooded area", `${summary.flooded_area_km2} km²`],
            ["Critical communities", summary.critical_communities],
            ["Critical WASH facilities", summary.critical_facility_count],
          ].map(([label, value]) => (
            <div key={label as string} className="rounded-lg bg-[var(--bg-muted)] p-3">
              <p className="text-[11px] text-[var(--text-muted)]">{label}</p>
              <p className="font-display text-xl font-semibold tabular">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-panel">
        <div className="border-b border-[var(--border)] px-5 py-3.5">
          <p className="font-display text-sm font-semibold">Top 10 priority communities</p>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {summary.top_priority_communities.map((c: any) => (
            <div key={c.id} className="flex items-center justify-between px-5 py-2.5 text-sm">
              <span>#{c.rank} {c.name} <span className="text-[var(--text-muted)]">· {c.district}</span></span>
              <div className="flex items-center gap-3">
                <span className="font-display tabular font-semibold">{c.priority_score}</span>
                <RiskBadge level={c.priority_category} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 shadow-panel">
          <p className="font-display text-sm font-semibold">Methodology</p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">{summary.methodology}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 shadow-panel">
          <p className="font-display text-sm font-semibold">Data sources</p>
          <ul className="mt-2 space-y-1 text-sm text-[var(--text-muted)]">
            {summary.data_sources.map((d: string) => <li key={d}>· {d}</li>)}
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-risk-high/30 bg-risk-high/8 p-4 text-sm">
        <p className="font-medium">Limitations</p>
        <p className="mt-1 text-[var(--text-muted)]">{summary.limitations}</p>
      </div>
    </div>
  );
}
