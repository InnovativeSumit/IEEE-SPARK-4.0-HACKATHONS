import { useEffect, useState } from "react";
import { api } from "../services/api";

const STEPS = [
  { n: "01", title: "Earth Observation", body: "Sentinel-1 SAR and Sentinel-2 optical imagery, before and after the flood, form the raw input. SAR penetrates cloud cover, which matters for monsoon-season flash floods." },
  { n: "02", title: "Flood mapping", body: "A segmentation model (U-Net class) turns imagery into a flood probability mask and severity bands. In demo mode this is a labelled synthetic dataset — the interface never presents it as an observed measurement." },
  { n: "03", title: "Geospatial analysis", body: "GeoPandas / Rasterio join the flood mask against WASH facility locations, roads, rivers, population and elevation to compute per-facility and per-community exposure." },
  { n: "04", title: "Machine learning", body: "An XGBoost classifier estimates WASH disruption probability from flood exposure, distance to river, elevation and road accessibility, explained per-prediction with SHAP." },
  { n: "05", title: "WASH priority scoring", body: "A transparent weighted formula combines flood exposure, WASH disruption, population exposure, accessibility risk, vulnerability and isolation into one 0-100 score." },
  { n: "06", title: "Human verification", body: "Field responders confirm, reject, or flag predictions for inspection. Verified outcomes are captured as a labelled dataset for future retraining." },
  { n: "07", title: "Response planning", body: "Ranked communities and facilities, each with a plain-language reason and recommended action, are handed to responders through the dashboard, map and reports." },
];

export default function Methodology() {
  const [weights, setWeights] = useState<any>(null);

  useEffect(() => {
    api.priorityWeights().then(setWeights);
  }, []);

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Methodology</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--text-muted)]">
          Every score on this platform traces back to a step below. Nothing is a black box —
          the weighting formula is shown in full underneath the pipeline.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {STEPS.map((s) => (
          <div key={s.n} className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 shadow-panel">
            <p className="font-display text-sm font-semibold text-monsoon-500 dark:text-monsoon-300">{s.n}</p>
            <p className="mt-1 font-display text-base font-semibold">{s.title}</p>
            <p className="mt-1.5 text-sm text-[var(--text-muted)]">{s.body}</p>
          </div>
        ))}
      </div>

      {weights && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 shadow-panel">
          <p className="font-display text-sm font-semibold">WASH priority formula</p>
          <p className="mt-2 font-mono text-xs leading-relaxed text-[var(--text-muted)] sm:text-sm">{weights.formula}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Object.entries(weights.weights as Record<string, number>).map(([k, v]) => (
              <div key={k} className="rounded-lg bg-[var(--bg-muted)] p-3">
                <p className="text-[11px] capitalize text-[var(--text-muted)]">{k.replace(/_/g, " ")}</p>
                <p className="font-display text-lg font-semibold tabular">{(v * 100).toFixed(0)}%</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 shadow-panel">
        <p className="font-display text-sm font-semibold">Data provenance labels used throughout</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {["OBSERVED", "MODELED", "ESTIMATED", "PREDICTED", "DEMO"].map((label) => (
            <span key={label} className="rounded-full border border-[var(--border)] px-3 py-1 font-medium">{label}</span>
          ))}
        </div>
        <p className="mt-3 text-sm text-[var(--text-muted)]">
          Outputs are described as "potential disruption risk" or "requires field verification" —
          never as confirmed contamination or destruction — until a human confirms them.
        </p>
      </div>
    </div>
  );
}
