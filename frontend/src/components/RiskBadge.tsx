const STYLES: Record<string, string> = {
  CRITICAL: "bg-risk-critical/15 text-risk-critical border-risk-critical/30",
  "VERY HIGH": "bg-risk-high/15 text-risk-high border-risk-high/30",
  HIGH: "bg-risk-high/15 text-risk-high border-risk-high/30",
  MODERATE: "bg-risk-moderate/15 text-[#a5810f] dark:text-risk-moderate border-risk-moderate/30",
  LOW: "bg-risk-low/15 text-risk-low border-risk-low/30",
};

export default function RiskBadge({ level, pulse = false }: { level: string; pulse?: boolean }) {
  const style = STYLES[level] || STYLES.LOW;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide ${style}`}
    >
      {level === "CRITICAL" && (
        <span className={`h-1.5 w-1.5 rounded-full bg-risk-critical ${pulse ? "pulse-critical" : ""}`} />
      )}
      {level}
    </span>
  );
}
