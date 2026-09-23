import { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Popup, useMap } from "react-leaflet";
import { X } from "lucide-react";
import { api } from "../services/api";
import RiskBadge from "../components/RiskBadge";
import FeatureImportance from "../components/FeatureImportance";
import { Community, Facility } from "../types";

const CATEGORY_COLORS: Record<string, string> = {
  CRITICAL: "#e1443f",
  "VERY HIGH": "#ef8c2b",
  HIGH: "#ef8c2b",
  MODERATE: "#e0b93f",
  LOW: "#3fb279",
};

function FitBounds({ communities }: { communities: Community[] }) {
  const map = useMap();
  useEffect(() => {
    if (communities.length) {
      const bounds = communities.map((c) => [c.lat, c.lon]) as [number, number][];
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [communities, map]);
  return null;
}

export default function MapView() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [floodGeojson, setFloodGeojson] = useState<any>(null);
  const [selected, setSelected] = useState<Community | null>(null);
  const [layers, setLayers] = useState({ flood: true, priority: true, facilities: false });

  useEffect(() => {
    api.communityRanking(200).then((r) => setCommunities(r.results));
    api.facilities({ limit: "2000" }).then((r) => setFacilities(r.results));
    api.floodGeojson().then(setFloodGeojson);
  }, []);

  const floodStyle = (feature: any) => ({
    color: feature.properties.color,
    weight: 1,
    fillColor: feature.properties.color,
    fillOpacity: 0.18,
  });

  return (
    <div className="relative h-[calc(100vh-0px)] w-full">
      <div className="absolute left-4 top-4 z-[1000] w-56 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]/95 p-3 shadow-panel backdrop-blur">
        <p className="mb-2 font-display text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Layers</p>
        {[
          { key: "flood", label: "Flood extent" },
          { key: "priority", label: "Community priority" },
          { key: "facilities", label: "WASH facilities" },
        ].map((l) => (
          <label key={l.key} className="flex items-center gap-2 py-1 text-sm">
            <input
              type="checkbox"
              checked={(layers as any)[l.key]}
              onChange={(e) => setLayers((s) => ({ ...s, [l.key]: e.target.checked }))}
              className="h-3.5 w-3.5 accent-monsoon-500"
            />
            {l.label}
          </label>
        ))}
        <div className="mt-2 border-t border-[var(--border)] pt-2 text-[10px] text-[var(--text-muted)]">
          DEMO MODE — Simulated / Research Data
        </div>
      </div>

      <MapContainer center={[27.0, 86.4]} zoom={9} className="h-full w-full" zoomControl={false}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds communities={communities} />

        {layers.flood && floodGeojson && <GeoJSON data={floodGeojson} style={floodStyle} />}

        {layers.priority &&
          communities.map((c) => (
            <CircleMarker
              key={c.id}
              center={[c.lat, c.lon]}
              radius={c.priority_category === "CRITICAL" ? 9 : 6}
              pathOptions={{
                color: CATEGORY_COLORS[c.priority_category],
                fillColor: CATEGORY_COLORS[c.priority_category],
                fillOpacity: 0.75,
                weight: 1.5,
              }}
              eventHandlers={{ click: () => setSelected(c) }}
            >
              <Popup>
                <p className="font-semibold">{c.name}</p>
                <p className="text-xs">Priority {c.priority_score}/100 · {c.priority_category}</p>
              </Popup>
            </CircleMarker>
          ))}

        {layers.facilities &&
          facilities.slice(0, 800).map((f) => (
            <CircleMarker
              key={f.id}
              center={[f.lat, f.lon]}
              radius={3}
              pathOptions={{ color: "#3a49b8", fillColor: "#4a5cdb", fillOpacity: 0.8, weight: 0.5 }}
            >
              <Popup>
                <p className="font-semibold">{f.name}</p>
                <p className="text-xs">Disruption {f.disruption_probability}% · {f.status}</p>
              </Popup>
            </CircleMarker>
          ))}
      </MapContainer>

      {selected && (
        <div className="absolute inset-y-0 right-0 z-[1000] w-full max-w-sm overflow-y-auto border-l border-[var(--border)] bg-[var(--bg-elevated)] p-5 shadow-2xl">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <p className="text-xs text-[var(--text-muted)]">{selected.district} · {selected.municipality} · Zone {selected.response_zone}</p>
              <h2 className="font-display text-lg font-semibold">{selected.name}</h2>
            </div>
            <button onClick={() => setSelected(null)} className="rounded p-1 hover:bg-[var(--bg-muted)]">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-4 flex items-center gap-3">
            <span className="font-display text-3xl font-semibold tabular">{selected.priority_score}</span>
            <span className="text-sm text-[var(--text-muted)]">/ 100</span>
            <RiskBadge level={selected.priority_category} pulse />
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ["Flood exposure", `${selected.flood_exposure_pct}%`],
              ["WASH disruption", `${selected.wash_disruption_risk}%`],
              ["Population exposure", `${selected.population_exposure}%`],
              ["Accessibility risk", `${selected.accessibility_risk}%`],
              ["Vulnerability", `${selected.vulnerability_score}%`],
              ["WASH facilities", `${selected.at_risk_facilities}/${selected.num_wash_facilities} at risk`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-[var(--bg-muted)] p-2.5">
                <p className="text-[11px] text-[var(--text-muted)]">{label}</p>
                <p className="font-display font-semibold tabular">{value}</p>
              </div>
            ))}
          </div>

          <p className="mt-4 text-sm font-medium">Estimated population affected</p>
          <p className="font-display text-xl font-semibold tabular">{selected.estimated_population_affected.toLocaleString()}</p>

          <p className="mt-4 text-sm font-medium">Why this score?</p>
          <ul className="mt-1.5 space-y-1.5 text-sm text-[var(--text-muted)]">
            {selected.why.map((w, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-monsoon-500" />
                {w}
              </li>
            ))}
          </ul>

          <p className="mt-4 text-sm font-medium">Vulnerability model — top factors</p>
          <div className="mt-1.5 rounded-lg bg-[var(--bg-muted)] p-3">
            <FeatureImportance factors={selected.vulnerability_factors} />
          </div>

          <p className="mt-4 text-sm font-medium">Recommended action</p>
          <div className="mt-1.5 rounded-lg border border-monsoon-500/25 bg-monsoon-500/8 p-3 text-sm">
            {selected.recommendations[0]}
          </div>
        </div>
      )}
    </div>
  );
}
