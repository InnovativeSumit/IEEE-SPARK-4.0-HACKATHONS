import { useEffect, useState } from "react";
import { Layers, Users } from "lucide-react";
import { api } from "../services/api";
import { ResponseZone } from "../types";
import TiltCard from "../components/TiltCard";

const ZONE_COLORS: Record<string, string> = {
  Alpha: "#e1443f", Bravo: "#ef8c2b", Charlie: "#e0b93f", Delta: "#3fb279", Echo: "#4a5cdb", Foxtrot: "#0f9b8e",
};

const FEATURE_LABELS: Record<string, string> = {
  flood_exposure_pct: "Flood exposure",
  wash_disruption_risk: "WASH disruption",
  population_exposure: "Population exposure",
  accessibility_risk: "Accessibility risk",
  vulnerability_score: "Vulnerability",
};

export default function ResponseZones() {
  const [zones, setZones] = useState<ResponseZone[]>([]);

  useEffect(() => {
    api.responseZones().then((r) => setZones(r.zones));
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">AI Response Zones</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--text-muted)]">
          Communities are grouped by KMeans clustering over their risk profile — flood exposure, WASH
          disruption, population exposure, accessibility and vulnerability — so teams with similar
          operational needs can be staged together, ordered here by urgency.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {zones.map((z) => {
          const color = ZONE_COLORS[z.zone] || "#8fa4b6";
          const maxFeature = Math.max(...Object.values(z.centroid));
          return (
            <TiltCard key={z.zone} maxTilt={5} className="rounded-2xl">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 shadow-panel">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${color}22` }}>
                      <Layers className="h-4.5 w-4.5" style={{ color }} />
                    </span>
                    <div>
                      <p className="font-display text-base font-semibold">Zone {z.zone}</p>
                      <p className="text-xs text-[var(--text-muted)]">{z.community_count} communities</p>
                    </div>
                  </div>
                  <span className="font-display text-2xl font-semibold tabular" style={{ color }}>{z.avg_priority_score}</span>
                </div>

                <div className="mt-3 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                  <Users className="h-3.5 w-3.5" />
                  {z.total_population_affected.toLocaleString()} people estimated affected
                </div>

                <div className="mt-4 space-y-1.5">
                  {Object.entries(z.centroid).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-2 text-xs">
                      <span className="w-32 shrink-0 text-[var(--text-muted)]">{FEATURE_LABELS[k] || k}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--bg-muted)]">
                        <div className="h-full rounded-full" style={{ width: `${(v / (maxFeature || 1)) * 100}%`, background: color }} />
                      </div>
                      <span className="w-9 shrink-0 text-right tabular">{v.toFixed(0)}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 border-t border-[var(--border)] pt-3">
                  <p className="text-xs font-medium">Representative communities</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">{z.sample_communities.join(", ")}</p>
                </div>
              </div>
            </TiltCard>
          );
        })}
      </div>
    </div>
  );
}
