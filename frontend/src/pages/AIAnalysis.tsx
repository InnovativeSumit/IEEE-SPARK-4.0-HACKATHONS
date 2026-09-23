import { useState, useRef, useEffect } from "react";
import { Bot, Send, User, Sparkles, Wrench, Database, ChevronDown } from "lucide-react";
import { api } from "../services/api";
import { AgentTrace } from "../types";

const SUGGESTIONS = [
  "Which communities should receive emergency water support first?",
  "Which WASH facilities are most likely disrupted?",
  "What are the response zones?",
  "How accurate is the model?",
];

interface Msg {
  role: "user" | "ai";
  text: string;
  confidence?: number;
  recommendations?: string[];
  trace?: AgentTrace;
}

function TracePanel({ trace }: { trace: AgentTrace }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2 border-t border-[var(--border)] pt-2">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] hover:text-[var(--text)]">
        <Wrench className="h-3 w-3" /> agent trace: {trace.tool_used}
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="mt-2 space-y-1.5 rounded-lg bg-[var(--bg)] p-2.5">
          <p className="text-[11px] text-[var(--text-muted)]">
            Intent classified as <span className="font-mono">{trace.intent}</span> → tool <span className="font-mono">{trace.tool_used}</span> executed against live scoring data.
          </p>
          {trace.retrieved_sources.length > 0 && (
            <div>
              <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-[var(--text-muted)]">
                <Database className="h-3 w-3" /> RAG sources retrieved
              </p>
              <ul className="mt-1 space-y-1">
                {trace.retrieved_sources.map((s) => (
                  <li key={s.id} className="text-[11px] text-[var(--text-muted)]">
                    <span className="font-mono text-monsoon-500 dark:text-monsoon-300">{s.id}</span> (relevance {s.relevance.toFixed(2)}) — {s.excerpt}…
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AIAnalysis() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "ai",
      text: "I'm the JALRAKSHA AI Agent — a trained intent classifier routes each question to a tool that queries the live scoring engine, and a TF-IDF vector store retrieves grounding context (RAG). Nothing is invented. Ask me about priority communities, at-risk facilities, response zones, or model accuracy.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (question: string) => {
    if (!question.trim() || loading) return;
    setMessages((m) => [...m, { role: "user", text: question }]);
    setInput("");
    setLoading(true);
    try {
      const res = await api.aiQuery(question);
      setMessages((m) => [...m, { role: "ai", text: res.answer, confidence: res.confidence, recommendations: res.recommendations, trace: res.agent_trace }]);
    } catch (e: any) {
      setMessages((m) => [...m, { role: "ai", text: `I couldn't reach the backend: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col p-6">
      <div className="mb-4">
        <h1 className="font-display text-2xl font-semibold">AI Agent</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Agentic, retrieval-grounded answers over the live priority model — expand "agent trace" on any reply to see exactly how it got there.
        </p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 shadow-panel">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${m.role === "ai" ? "bg-gradient-to-br from-monsoon-400 to-indigo-500" : "bg-[var(--bg-muted)]"}`}>
              {m.role === "ai" ? <Bot className="h-4 w-4 text-white" /> : <User className="h-4 w-4 text-[var(--text-muted)]" />}
            </span>
            <div className={`max-w-[75%] rounded-xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line ${m.role === "ai" ? "bg-[var(--bg-muted)]" : "bg-monsoon-500 text-white"}`}>
              {m.text}
              {m.recommendations && m.recommendations.length > 0 && (
                <div className="mt-2 space-y-1 border-t border-[var(--border)] pt-2">
                  {m.recommendations.map((r, j) => (
                    <p key={j} className="flex items-start gap-1.5 text-xs text-[var(--text-muted)]">
                      <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-monsoon-500" /> {r}
                    </p>
                  ))}
                </div>
              )}
              {m.confidence !== undefined && (
                <p className="mt-2 text-[11px] text-[var(--text-muted)]">Model confidence: {(m.confidence * 100).toFixed(0)}%</p>
              )}
              {m.trace && <TracePanel trace={m.trace} />}
            </div>
          </div>
        ))}
        {loading && <p className="text-xs text-[var(--text-muted)]">Classifying intent, calling tool, retrieving context…</p>}
        <div ref={bottomRef} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => send(s)}
            className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-muted)] hover:text-[var(--text)]"
          >
            {s}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="mt-3 flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-2 shadow-panel"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about priority communities, WASH risk, zones, or model accuracy…"
          className="flex-1 bg-transparent px-2 py-2 text-sm outline-none"
        />
        <button type="submit" disabled={loading} className="flex h-9 w-9 items-center justify-center rounded-lg bg-monsoon-500 text-white disabled:opacity-50">
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
