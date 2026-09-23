export default function FeatureImportance({ factors }: { factors: { factor: string; contribution_pct: number }[] }) {
  const max = Math.max(...factors.map((f) => Math.abs(f.contribution_pct)), 1);
  return (
    <div className="space-y-2">
      {factors.map((f) => {
        const positive = f.contribution_pct >= 0;
        const width = (Math.abs(f.contribution_pct) / max) * 100;
        return (
          <div key={f.factor} className="flex items-center gap-3 text-xs">
            <span className="w-32 shrink-0 truncate text-[var(--text-muted)]">{f.factor}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--bg-muted)]">
              <div
                className={`h-full rounded-full ${positive ? "bg-risk-critical" : "bg-monsoon-400"}`}
                style={{ width: `${width}%` }}
              />
            </div>
            <span className="w-12 shrink-0 text-right tabular font-medium">
              {positive ? "+" : ""}
              {f.contribution_pct.toFixed(0)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
