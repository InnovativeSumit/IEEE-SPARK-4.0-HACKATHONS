import { useEffect, useState } from "react";
import { Users, Waves, ShieldAlert, Building2, Activity, RouteOff } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import StatCard from "../components/StatCard";
import AlertCard from "../components/AlertCard";
import RiskBadge from "../components/RiskBadge";
import { Overview, Community } from "../types";

const CATEGORY_COLORS: Record<string, string> = {
  CRITICAL: "#e1443f",
  "VERY HIGH": "#ef8c2b",
  HIGH: "#ef8c2b",
  MODERATE: "#e0b93f",
  LOW: "#3fb279",
};

export default function Dashboard() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [top, setTop] = useState<Community[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.overview().then(setOverview).catch((e) => setError(e.message));
    api.communityRanking(6).then((r) => setTop(r.results)).catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="p-6">
        <AlertCard level="critical" message={`Could not reach the backend API: ${error}. Is it running on the configured VITE_API_BASE_URL?`} />
      </div>
    );
  }

  if (!overview) {
    return <div className="p-6 text-sm text-[var(--text-muted)]">Loading situational overview…</div>;
  }

  const pieData = Object.entries(overview.priority_breakdown).map(([name, value]) => ({ name, value }));
  const districtBars = top.map((c) => ({ name: c.district, score: c.priority_score }));

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Situational Overview</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Post-flood WASH impact, aggregated across {overview.total_communities} mapped communities.
        </p>
      </div>

      <div className="space-y-2">
        {overview.alerts.map((a, i) => (
          <AlertCard key={i} level={a.level} message={a.message} />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={Users} label="Affected population" value={overview.affected_population.toLocaleString()} accent="indigo" />
        <StatCard icon={Waves} label="Flooded area" value={`${overview.flooded_area_km2} km²`} />
        <StatCard icon={Building2} label="At-risk WASH facilities" value={`${overview.at_risk_wash_facilities.toLocaleString()}`} sub={`of ${overview.total_wash_facilities.toLocaleString()} mapped`} accent="critical" />
        <StatCard icon={ShieldAlert} label="Critical communities" value={`${overview.critical_communities}`} accent="critical" />
        <StatCard icon={Activity} label="Avg. WASH risk" value={`${overview.average_wash_risk}%`} />
        <StatCard icon={RouteOff} label="Accessibility disruptions" value={`${overview.accessibility_disruptions}`} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 shadow-panel lg:col-span-1">
          <p className="font-display text-sm font-semibold">Priority breakdown</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || "#8fa4b6"} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: CATEGORY_COLORS[d.name] }} />
                <span className="text-[var(--text-muted)]">{d.name}</span>
                <span className="font-medium tabular">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 shadow-panel lg:col-span-2">
          <div className="mb-1 flex items-center justify-between">
            <p className="font-display text-sm font-semibold">Top priority scores</p>
            <Link to="/communities" className="text-xs font-medium text-monsoon-600 dark:text-monsoon-300 hover:underline">
              View all communities →
            </Link>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districtBars} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="score" fill="#0f9b8e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-panel">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3.5">
          <p className="font-display text-sm font-semibold">Communities requiring immediate WASH intervention</p>
          <Link to="/communities" className="text-xs font-medium text-monsoon-600 dark:text-monsoon-300 hover:underline">
            Full ranking →
          </Link>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {top.map((c) => (
            <Link
              key={c.id}
              to={`/communities?highlight=${c.id}`}
              className="flex items-center justify-between px-5 py-3 text-sm transition-colors hover:bg-[var(--bg-muted)]"
            >
              <div className="flex items-center gap-4">
                <span className="w-6 text-center font-display font-semibold text-[var(--text-muted)]">#{c.rank}</span>
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{c.district} · {c.estimated_population_affected.toLocaleString()} people est. affected</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-display tabular font-semibold">{c.priority_score}</span>
                <RiskBadge level={c.priority_category} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
