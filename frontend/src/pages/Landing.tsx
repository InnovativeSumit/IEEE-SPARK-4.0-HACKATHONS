import { Link } from "react-router-dom";
import { ArrowRight, Satellite, Waves, Users, Brain, HeartHandshake, Boxes, Database, Layers } from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import TiltCard from "../components/TiltCard";

const PIPELINE = [
  { icon: Satellite, label: "Satellite" },
  { icon: Waves, label: "Flood Detection" },
  { icon: Waves, label: "WASH Risk" },
  { icon: Users, label: "Vulnerability" },
  { icon: Brain, label: "AI Priority" },
  { icon: HeartHandshake, label: "Response" },
];

const CAPABILITIES = [
  { icon: Brain, title: "Two trained ML models", body: "XGBoost classifier for WASH disruption risk and XGBoost regressor for community vulnerability, both explained per-prediction with SHAP." },
  { icon: Layers, title: "KMeans response zones", body: "Unsupervised clustering groups communities by risk signature into operational zones for logistics planning." },
  { icon: Database, title: "Retrieval-augmented agent", body: "A trained intent classifier routes questions to real tools; a TF-IDF vector store grounds free-text answers in the platform's own data — no fabricated numbers." },
  { icon: Boxes, title: "Interactive 3D risk terrain", body: "Priority scores rendered as an explorable 3D bar map you can rotate, zoom, and click through." },
];

function PixelGrid() {
  const cells = Array.from({ length: 96 });
  return (
    <div className="grid grid-cols-12 gap-[3px] opacity-70">
      {cells.map((_, i) => {
        const seed = (i * 47) % 100;
        const on = seed > 62;
        return (
          <div
            key={i}
            className={`aspect-square rounded-[2px] ${
              on ? (seed > 86 ? "bg-risk-critical/70" : "bg-monsoon-400/70") : "bg-[var(--border)]"
            }`}
          />
        );
      })}
    </div>
  );
}

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      <div className="blob h-[420px] w-[420px] bg-monsoon-500" style={{ top: "-8%", left: "-6%" }} />
      <div className="blob h-[380px] w-[380px] bg-indigo-500" style={{ top: "10%", right: "-8%", animationDelay: "3s" }} />
      <div className="blob h-[300px] w-[300px] bg-risk-critical" style={{ bottom: "-6%", left: "30%", animationDelay: "6s" }} />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-monsoon-400 to-indigo-500">
            <Waves className="h-5 w-5 text-white" strokeWidth={2.5} />
          </span>
          <span className="font-display text-[15px] font-semibold">JALRAKSHA AI</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/methodology" className="hidden text-sm text-[var(--text-muted)] hover:text-[var(--text)] sm:block">
            Methodology
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="perspective-scene relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 px-6 pb-24 pt-10 lg:grid-cols-[1.1fr_0.9fr] lg:pt-16">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-monsoon-500 dark:text-monsoon-300">
            SPARK 4.0 EO Hackathon 2026 · Problem 05 — After the Flood: WASH
          </p>
          <h1 className="mt-4 font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            From satellite pixels
            <br />
            to <span className="text-monsoon-500 dark:text-monsoon-300">WASH action.</span>
          </h1>
          <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-[var(--text-muted)]">
            JALRAKSHA AI turns Earth Observation and geospatial data into a ranked, explainable
            priority list of communities and WASH facilities after a flood — backed by trained ML
            models, an agentic RAG assistant, and an interactive 3D risk terrain — so limited response
            resources reach the people who need them first.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-monsoon-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-monsoon-500/20 transition-colors hover:bg-monsoon-600"
            >
              Launch Disaster Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/terrain-3d"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--text)] transition-colors hover:bg-[var(--bg-muted)]"
            >
              <Boxes className="h-4 w-4" /> Explore 3D Risk Terrain
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4">
            {PIPELINE.map((step, i) => (
              <div key={step.label} className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-elevated)]">
                  <step.icon className="h-4 w-4 text-monsoon-500 dark:text-monsoon-300" />
                </span>
                <span className="font-medium">{step.label}</span>
                {i < PIPELINE.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-[var(--border)]" />}
              </div>
            ))}
          </div>
        </div>

        <TiltCard maxTilt={10} className="rounded-2xl">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 shadow-panel">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-display text-sm font-semibold">Flood-exposure raster</p>
              <span className="rounded-full bg-monsoon-500/12 px-2 py-0.5 text-[10px] font-semibold text-monsoon-600 dark:text-monsoon-300">
                DEMO DATA
              </span>
            </div>
            <PixelGrid />
            <div className="mt-5 grid grid-cols-3 gap-3 border-t border-[var(--border)] pt-4">
              <div>
                <p className="font-display text-xl font-semibold tabular">137</p>
                <p className="text-[11px] text-[var(--text-muted)]">Critical communities</p>
              </div>
              <div>
                <p className="font-display text-xl font-semibold tabular">1,842</p>
                <p className="text-[11px] text-[var(--text-muted)]">At-risk WASH assets</p>
              </div>
              <div>
                <p className="font-display text-xl font-semibold tabular">94/100</p>
                <p className="text-[11px] text-[var(--text-muted)]">Top priority score</p>
              </div>
            </div>
          </div>
        </TiltCard>
      </main>

      <section className="relative border-t border-[var(--border)] bg-[var(--bg-muted)]/40">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="font-display text-2xl font-semibold">Most flood platforms stop at the flood map.</h2>
          <p className="mt-2 max-w-2xl text-[var(--text-muted)]">
            JALRAKSHA AI continues the chain — from what flooded, to which WASH assets it touched, to which
            communities are exposed, to what should happen next, and why.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {["Flood", "WASH exposure", "Community impact", "Priority", "Explanation", "Action"].map((s, i) => (
              <TiltCard key={s} maxTilt={8} className="rounded-xl">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
                  <p className="font-display text-lg font-semibold text-monsoon-500 dark:text-monsoon-300">{i + 1}</p>
                  <p className="mt-1 text-sm font-medium">{s}</p>
                </div>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-6 py-14">
        <h2 className="font-display text-2xl font-semibold">Built with real ML, not just a pretty map</h2>
        <p className="mt-2 max-w-2xl text-[var(--text-muted)]">
          Every capability below is wired to a live backend endpoint — nothing here is a static mockup.
        </p>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CAPABILITIES.map((c) => (
            <TiltCard key={c.title} maxTilt={7} className="rounded-xl">
              <div className="h-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 shadow-panel">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-monsoon-500/12">
                  <c.icon className="h-4 w-4 text-monsoon-500 dark:text-monsoon-300" />
                </span>
                <p className="mt-3 font-display text-sm font-semibold">{c.title}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-muted)]">{c.body}</p>
              </div>
            </TiltCard>
          ))}
        </div>
      </section>

      <footer className="relative mx-auto max-w-6xl px-6 py-8 text-xs text-[var(--text-muted)]">
        JALRAKSHA AI — built for SPARK 4.0 EO Hackathon 2026. Demo mode uses a synthetic research dataset.
      </footer>
    </div>
  );
}
