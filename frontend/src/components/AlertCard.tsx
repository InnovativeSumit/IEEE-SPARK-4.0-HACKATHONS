import { AlertTriangle, Info, AlertOctagon } from "lucide-react";

const CONFIG: Record<string, { icon: any; classes: string }> = {
  critical: { icon: AlertOctagon, classes: "border-risk-critical/30 bg-risk-critical/10 text-risk-critical" },
  warning: { icon: AlertTriangle, classes: "border-risk-high/30 bg-risk-high/10 text-risk-high" },
  info: { icon: Info, classes: "border-indigo-400/30 bg-indigo-400/10 text-indigo-500 dark:text-indigo-300" },
};

export default function AlertCard({ level, message }: { level: string; message: string }) {
  const { icon: Icon, classes } = CONFIG[level] || CONFIG.info;
  return (
    <div className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm ${classes}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
      <p className="leading-snug text-[var(--text)]">{message}</p>
    </div>
  );
}
