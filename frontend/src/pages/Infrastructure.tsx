import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { api } from "../services/api";
import RiskBadge from "../components/RiskBadge";
import FeatureImportance from "../components/FeatureImportance";
import { Facility } from "../types";

export default function Infrastructure() {
  const [rows, setRows] = useState<Facility[]>([]);
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<Facility | null>(null);

  useEffect(() => {
    api.facilities({ limit: "1500" }).then((r) => setRows(r.results));
  }, []);

  const types = useMemo(() => Array.from(new Set(rows.map((r) => r.facility_type_label))).sort(), [rows]);

  const filtered = useMemo(() => {
    let out = rows;
    if (type !== "all") out = out.filter((r) => r.facility_type_label === type);
    if (status !== "all") out = out.filter((r) => r.status === status);
    return out.slice(0, 300);
  }, [rows, type, status]);

  return (
    <div className="space-y-5 p-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">WASH Infrastructure Monitoring</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          {rows.length.toLocaleString()} mapped facilities, ranked by modeled disruption probability.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm">
          <option value="all">All facility types</option>
          {types.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm">
          <option value="all">All statuses</option>
          {["CRITICAL", "HIGH", "MODERATE", "LOW"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="ml-auto text-xs text-[var(--text-muted)]">Showing {filtered.length} of {rows.length.toLocaleString()}</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-panel">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--text-muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">Facility ID</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Location</th>
              <th className="px-4 py-3 font-medium">Flood exposure</th>
              <th className="px-4 py-3 font-medium">Disruption risk</th>
              <th className="px-4 py-3 font-medium">Accessibility</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {filtered.map((f) => (
              <tr key={f.id} onClick={() => setSelected(f)} className="cursor-pointer transition-colors hover:bg-[var(--bg-muted)]">
                <td className="px-4 py-3 font-mono text-xs text-[var(--text-muted)]">{f.id}</td>
                <td className="px-4 py-3 font-medium">{f.facility_type_label}</td>
                <td className="px-4 py-3">{f.municipality}, {f.district}</td>
                <td className="px-4 py-3 tabular">{f.flood_exposure_pct}%</td>
                <td className="px-4 py-3 tabular">{f.disruption_probability}%</td>
                <td className="px-4 py-3 tabular">{f.road_accessibility}%</td>
                <td className="px-4 py-3"><RiskBadge level={f.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/50 p-4" onClick={() => setSelected(null)}>
          <div
            className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="font-mono text-xs text-[var(--text-muted)]">{selected.id}</p>
                <h2 className="font-display text-lg font-semibold">{selected.name}</h2>
                <p className="text-xs text-[var(--text-muted)]">{selected.municipality}, {selected.district}</p>
              </div>
              <button onClick={() => setSelected(null)} className="rounded p-1 hover:bg-[var(--bg-muted)]"><X className="h-4 w-4" /></button>
            </div>

            <div className="mb-4 flex items-center gap-3">
              <span className="font-display text-3xl font-semibold tabular">{selected.disruption_probability}%</span>
              <RiskBadge level={selected.status} pulse />
            </div>

            <p className="text-xs text-[var(--text-muted)]">Model confidence: {(selected.model_confidence * 100).toFixed(0)}%</p>

            <p className="mt-4 text-sm font-medium">Top contributing factors</p>
            <div className="mt-2">
              <FeatureImportance factors={selected.top_factors} />
            </div>

            <div className="mt-5 rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] p-3 text-xs text-[var(--text-muted)]">
              This is a modeled disruption <em>risk</em>, not a confirmed field observation. Mark the outcome
              below once verified on the ground.
            </div>
            <div className="mt-3 flex gap-2">
              <button className="flex-1 rounded-lg border border-[var(--border)] py-2 text-xs font-medium hover:bg-[var(--bg-muted)]">Confirm</button>
              <button className="flex-1 rounded-lg border border-[var(--border)] py-2 text-xs font-medium hover:bg-[var(--bg-muted)]">Needs inspection</button>
              <button className="flex-1 rounded-lg border border-[var(--border)] py-2 text-xs font-medium hover:bg-[var(--bg-muted)]">False positive</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
