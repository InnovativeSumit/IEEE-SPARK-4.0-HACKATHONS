import { useEffect, useState } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, Cell } from "recharts";
import { api } from "../services/api";
import { Community } from "../types";

const CATEGORY_COLORS: Record<string, string> = {
  CRITICAL: "#e1443f", "VERY HIGH": "#ef8c2b", HIGH: "#ef8c2b", MODERATE: "#e0b93f", LOW: "#3fb279",
};

export default function WashRisk() {
  const [rows, setRows] = useState<Community[]>([]);
  const [riskSummary, setRiskSummary] = useState<any>(null);

  useEffect(() => {
    api.communityRanking(200).then((r) => setRows(r.results));
    api.washRisk().then(setRiskSummary);
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Emergency Priority Matrix</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          WASH disruption vs. population exposure — bubble size reflects accessibility risk. Upper-right is the emergency zone.
        </p>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 shadow-panel">
        <div className="h-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
              <CartesianGrid stroke="var(--border)" />
              <XAxis type="number" dataKey="wash_disruption_risk" name="WASH disruption" unit="%" domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--text-muted)" }} label={{ value: "WASH disruption risk", position: "insideBottom", offset: -5, fontSize: 12, fill: "var(--text-muted)" }} />
              <YAxis type="number" dataKey="population_exposure" name="Population exposure" unit="%" domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--text-muted)" }} label={{ value: "Population exposure", angle: -90, position: "insideLeft", fontSize: 12, fill: "var(--text-muted)" }} />
              <ZAxis type="number" dataKey="accessibility_risk" range={[40, 400]} name="Accessibility risk" unit="%" />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                content={({ payload }) => {
                  if (!payload || !payload.length) return null;
                  const d = payload[0].payload as Community;
                  return (
                    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-2.5 text-xs shadow-lg">
                      <p className="font-semibold">{d.name}</p>
                      <p>WASH disruption: {d.wash_disruption_risk}%</p>
                      <p>Population exposure: {d.population_exposure}%</p>
                      <p>Accessibility risk: {d.accessibility_risk}%</p>
                      <p>Priority: {d.priority_score}</p>
                    </div>
                  );
                }}
              />
              <Scatter data={rows} fill="#0f9b8e">
                {rows.map((r) => (
                  <Cell key={r.id} fill={CATEGORY_COLORS[r.priority_category]} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {riskSummary && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-panel">
          <div className="border-b border-[var(--border)] px-5 py-3.5">
            <p className="font-display text-sm font-semibold">Disruption risk by facility type</p>
          </div>
          <div className="grid grid-cols-1 divide-y divide-[var(--border)] sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-3">
            {Object.entries(riskSummary.by_type as Record<string, any>).map(([label, v]: any) => (
              <div key={label} className="p-4">
                <p className="text-sm font-medium">{label}</p>
                <p className="mt-1 font-display text-xl font-semibold tabular">{v.avg_disruption}%</p>
                <p className="text-xs text-[var(--text-muted)]">avg. disruption · {v.count} facilities</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
