import { useEffect, useState } from "react";
import { Satellite, Map as MapIcon, Mountain, Users2, Landmark } from "lucide-react";
import { api } from "../services/api";

const ICONS: Record<string, any> = {
  "Sentinel-1 SAR": Satellite,
  "Sentinel-2 Optical": Satellite,
  OpenStreetMap: MapIcon,
  "Digital Elevation Model (DEM)": Mountain,
  "Population raster": Users2,
  "Administrative boundaries": Landmark,
};

export default function DataSources() {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    api.dataSources().then((r) => setRows(r.results));
  }, []);

  return (
    <div className="space-y-5 p-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Data Sources</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Datasets the pipeline is designed around. In demo mode each is represented by a synthetic
          stand-in with the same schema — swap in the real feed via the paths in <code className="font-mono text-xs">.env</code>.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((d) => {
          const Icon = ICONS[d.name] || MapIcon;
          return (
            <div key={d.name} className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 shadow-panel">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-monsoon-500/12">
                  <Icon className="h-4 w-4 text-monsoon-500 dark:text-monsoon-300" />
                </span>
                <p className="font-display text-sm font-semibold">{d.name}</p>
              </div>
              <dl className="mt-4 space-y-1.5 text-xs">
                <div className="flex justify-between"><dt className="text-[var(--text-muted)]">Type</dt><dd>{d.type}</dd></div>
                <div className="flex justify-between"><dt className="text-[var(--text-muted)]">Resolution</dt><dd>{d.resolution}</dd></div>
                <div className="flex justify-between"><dt className="text-[var(--text-muted)]">Status</dt><dd className="text-right">{d.status}</dd></div>
              </dl>
              <p className="mt-3 border-t border-[var(--border)] pt-3 text-xs text-[var(--text-muted)]">{d.usage}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
