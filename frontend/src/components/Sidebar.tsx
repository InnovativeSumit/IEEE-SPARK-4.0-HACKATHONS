import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Map, Droplets, Users, Wrench, Bot, FileText,
  Database, Activity, Waves, Menu, X, Boxes, Layers,
} from "lucide-react";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";

const NAV = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/map", label: "Live Map", icon: Map },
  { to: "/terrain-3d", label: "3D Risk Terrain", icon: Boxes },
  { to: "/wash-risk", label: "WASH Risk", icon: Droplets },
  { to: "/response-zones", label: "Response Zones", icon: Layers },
  { to: "/communities", label: "Communities", icon: Users },
  { to: "/infrastructure", label: "Infrastructure", icon: Wrench },
  { to: "/ai-analysis", label: "AI Analyst", icon: Bot },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/data-sources", label: "Data Sources", icon: Database },
  { to: "/system-status", label: "System Status", icon: Activity },
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-30 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-2 md:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[var(--border)] bg-[var(--bg-elevated)] transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 pt-6">
          <NavLink to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-monsoon-400 to-indigo-500">
              <Waves className="h-5 w-5 text-white" strokeWidth={2.5} />
            </span>
            <span>
              <span className="block font-display text-[15px] font-semibold leading-none">JALRAKSHA AI</span>
              <span className="block text-[11px] leading-none text-[var(--text-muted)] mt-1">WASH Intelligence</span>
            </span>
          </NavLink>
          <button onClick={() => setOpen(false)} className="md:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-7 flex-1 space-y-0.5 px-3">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-monsoon-500/12 text-monsoon-600 dark:text-monsoon-300"
                    : "text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text)]"
                }`
              }
            >
              <Icon className="h-4 w-4" strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mx-3 mb-4 rounded-lg border border-monsoon-500/25 bg-monsoon-500/8 px-3 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-monsoon-600 dark:text-monsoon-300">Demo mode</p>
          <p className="mt-0.5 text-[11px] leading-snug text-[var(--text-muted)]">
            Simulated / research dataset — not observed 2026 flood imagery.
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-[var(--border)] px-5 py-4">
          <span className="text-xs text-[var(--text-muted)]">Theme</span>
          <ThemeToggle />
        </div>
      </aside>
    </>
  );
}
