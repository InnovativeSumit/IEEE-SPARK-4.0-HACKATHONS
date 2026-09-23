import { LucideIcon } from "lucide-react";
import TiltCard from "./TiltCard";

export default function StatCard({
  label, value, sub, icon: Icon, accent = "monsoon",
}: {
  label: string; value: string; sub?: string; icon: LucideIcon; accent?: "monsoon" | "indigo" | "critical";
}) {
  const accentColor = {
    monsoon: "text-monsoon-400",
    indigo: "text-indigo-400",
    critical: "text-risk-critical",
  }[accent];

  return (
    <TiltCard maxTilt={6} className="rounded-xl">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 shadow-panel">
        <div className="flex items-start justify-between">
          <p className="text-[13px] font-medium text-[var(--text-muted)]">{label}</p>
          <Icon className={`h-4 w-4 ${accentColor}`} strokeWidth={2} />
        </div>
        <p className="mt-2 font-display text-2xl font-semibold tabular tracking-tight">{value}</p>
        {sub && <p className="mt-1 text-xs text-[var(--text-muted)]">{sub}</p>}
      </div>
    </TiltCard>
  );
}
