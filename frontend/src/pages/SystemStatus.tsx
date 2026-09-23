import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Cpu, Database, GitBranch } from "lucide-react";
import { api } from "../services/api";
import AlertCard from "../components/AlertCard";

export default function SystemStatus() {
  const [health, setHealth] = useState<{ status: string; mode: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<any>(null);
  const [perf, setPerf] = useState<any>(null);
  const [rag, setRag] = useState<any>(null);

  useEffect(() => {
    api.health().then(setHealth).catch((e) => setError(e.message));
    api.overview().then(setOverview).catch(() => {});
    api.modelPerformance().then(setPerf).catch(() => {});
    api.ragIndex().then(setRag).catch(() => {});
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">System Status</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Backend health, trained model metrics, and the RAG/agent pipeline.</p>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 shadow-panel">
        <div className="flex items-center gap-3">
          {health ? <CheckCircle2 className="h-5 w-5 text-risk-low" /> : <XCircle className="h-5 w-5 text-risk-critical" />}
          <div>
            <p className="font-medium">{health ? "FastAPI backend reachable" : "Backend unreachable"}</p>
            <p className="text-xs text-[var(--text-muted)]">
              {health ? `Mode: ${health.mode}` : error || "Start it with: uvicorn app.main:app --reload"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 shadow-panel">
          <div className="flex items-center gap-2"><Cpu className="h-4 w-4 text-monsoon-500" /><p className="font-display text-sm font-semibold">WASH disruption model</p></div>
          {perf ? (
            <div className="mt-3 space-y-1 text-xs text-[var(--text-muted)]">
              <p>Type: {perf.wash_disruption_model.type}</p>
              <p>Training accuracy: <span className="font-medium text-[var(--text)]">{(perf.wash_disruption_model.train_accuracy * 100).toFixed(0)}%</span></p>
              <p>Explainability: {perf.wash_disruption_model.explainability}</p>
            </div>
          ) : <p className="mt-2 text-xs text-[var(--text-muted)]">Loading…</p>}
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 shadow-panel">
          <div className="flex items-center gap-2"><Cpu className="h-4 w-4 text-monsoon-500" /><p className="font-display text-sm font-semibold">Vulnerability model</p></div>
          {perf ? (
            <div className="mt-3 space-y-1 text-xs text-[var(--text-muted)]">
              <p>Type: {perf.vulnerability_model.type}</p>
              <p>MAE: <span className="font-medium text-[var(--text)]">{perf.vulnerability_model.mae}</span> · R²: <span className="font-medium text-[var(--text)]">{perf.vulnerability_model.r2}</span></p>
              <p>Explainability: {perf.vulnerability_model.explainability}</p>
            </div>
          ) : <p className="mt-2 text-xs text-[var(--text-muted)]">Loading…</p>}
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 shadow-panel">
          <div className="flex items-center gap-2"><GitBranch className="h-4 w-4 text-monsoon-500" /><p className="font-display text-sm font-semibold">Response zone clustering</p></div>
          {perf ? (
            <div className="mt-3 space-y-1 text-xs text-[var(--text-muted)]">
              <p>Type: {perf.response_zone_clustering.type}</p>
              <p>Features: {perf.response_zone_clustering.features.length}</p>
            </div>
          ) : <p className="mt-2 text-xs text-[var(--text-muted)]">Loading…</p>}
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 shadow-panel">
        <div className="flex items-center gap-2"><Database className="h-4 w-4 text-monsoon-500" /><p className="font-display text-sm font-semibold">Agentic RAG pipeline</p></div>
        {rag ? (
          <div className="mt-3 grid grid-cols-1 gap-3 text-xs text-[var(--text-muted)] sm:grid-cols-3">
            <div><p className="text-[11px]">Vector store</p><p className="font-medium text-[var(--text)]">{rag.vector_store}</p></div>
            <div><p className="text-[11px]">Indexed documents</p><p className="font-display text-lg font-semibold tabular text-[var(--text)]">{rag.indexed_documents}</p></div>
            <div><p className="text-[11px]">Intent classifier</p><p className="font-medium text-[var(--text)]">{rag.intent_classifier.type} · {rag.intent_classifier.intents} intents / {rag.intent_classifier.training_examples} examples</p></div>
          </div>
        ) : <p className="mt-2 text-xs text-[var(--text-muted)]">Loading…</p>}
      </div>

      {overview && (
        <div className="space-y-2">
          {overview.alerts.map((a: any, i: number) => <AlertCard key={i} level={a.level} message={a.message} />)}
        </div>
      )}
    </div>
  );
}
