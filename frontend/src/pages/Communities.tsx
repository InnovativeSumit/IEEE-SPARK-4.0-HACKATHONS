import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../services/api";
import RiskBadge from "../components/RiskBadge";
import { Community } from "../types";

export default function Communities() {
  const [rows, setRows] = useState<Community[]>([]);
  const [district, setDistrict] = useState("all");
  const [category, setCategory] = useState("all");
  const [sortKey, setSortKey] = useState<keyof Community>("priority_score");
  const [params] = useSearchParams();
  const highlight = params.get("highlight");

  useEffect(() => {
    api.communityRanking(200).then((r) => setRows(r.results));
  }, []);

  const districts = useMemo(() => Array.from(new Set(rows.map((r) => r.district))).sort(), [rows]);

  const filtered = useMemo(() => {
    let out = rows;
    if (district !== "all") out = out.filter((r) => r.district === district);
    if (category !== "all") out = out.filter((r) => r.priority_category === category);
    return [...out].sort((a, b) => (b[sortKey] as number) - (a[sortKey] as number));
  }, [rows, district, category, sortKey]);

  return (
    <div className="space-y-5 p-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Communities requiring immediate WASH intervention</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Ranked by the transparent weighted priority score — see the exact formula on the Methodology page.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm"
        >
          <option value="all">All districts</option>
          {districts.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm"
        >
          <option value="all">All priority levels</option>
          {["CRITICAL", "VERY HIGH", "HIGH", "MODERATE", "LOW"].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as keyof Community)}
          className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm"
        >
          <option value="priority_score">Sort: Priority score</option>
          <option value="flood_exposure_pct">Sort: Flood exposure</option>
          <option value="population">Sort: Population</option>
          <option value="accessibility_risk">Sort: Accessibility risk</option>
        </select>
        <span className="ml-auto text-xs text-[var(--text-muted)]">{filtered.length} communities</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-panel">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--text-muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">Rank</th>
              <th className="px-4 py-3 font-medium">Community</th>
              <th className="px-4 py-3 font-medium">District</th>
              <th className="px-4 py-3 font-medium">Zone</th>
              <th className="px-4 py-3 font-medium">Population</th>
              <th className="px-4 py-3 font-medium">Flood exposure</th>
              <th className="px-4 py-3 font-medium">WASH risk</th>
              <th className="px-4 py-3 font-medium">Accessibility</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {filtered.map((c) => (
              <tr
                key={c.id}
                className={`transition-colors hover:bg-[var(--bg-muted)] ${highlight === c.id ? "bg-monsoon-500/10" : ""}`}
              >
                <td className="px-4 py-3 font-display font-semibold text-[var(--text-muted)]">#{c.rank}</td>
                <td className="px-4 py-3">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{c.municipality}</p>
                </td>
                <td className="px-4 py-3">{c.district}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-xs font-medium">{c.response_zone}</span>
                </td>
                <td className="px-4 py-3 tabular">{c.population.toLocaleString()}</td>
                <td className="px-4 py-3 tabular">{c.flood_exposure_pct}%</td>
                <td className="px-4 py-3 tabular">{c.wash_disruption_risk}%</td>
                <td className="px-4 py-3 tabular">{c.accessibility_risk}%</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-semibold tabular">{c.priority_score}</span>
                    <RiskBadge level={c.priority_category} />
                  </div>
                </td>
                <td className="max-w-[220px] px-4 py-3 text-xs text-[var(--text-muted)]">{c.recommendations[0]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
