// pages/AI/Dashboard/Dashboard.tsx
// Usage: Drop inside AdminLayout's <Outlet /> at route /ai/dashboard
// NOTE: All data below is MOCK — wire up to real /api/v1/ai/* endpoints later.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const ACCENT = "#D4300F";

// ─── Types ──────────────────────────────────────────────────────────────────

type RunState = "running" | "paused" | "error";

interface FeatureStatus {
  key: string;
  label: string;
  state: RunState;
  nextRun: string;
  lastResult: string;
  generatedToday: number;
  schedule: string;
}

// ─── Mock static data (replace with API calls later) ──────────────────────────

const TOP_STATS = [
  { label: "Active Automations", value: "3", sub: "of 4 features", positive: true },
  { label: "Articles Generated Today", value: "6", sub: "2 pending review", positive: true },
  { label: "Images Auto-Uploaded", value: "9", sub: "from watched folder", positive: true },
  { label: "Auto-Deleted (Rotation)", value: "4", sub: "oldest items cleared", positive: false },
];

const INITIAL_FEATURES: FeatureStatus[] = [
  { key: "article", label: "Article Generator", state: "running", nextRun: "in 42 min", lastResult: "Generated \"Top 5 SUVs under 15L\"", generatedToday: 4, schedule: "Every 3 hrs · 2 per run" },
  { key: "story", label: "Story Generator", state: "running", nextRun: "in 1 hr 10 min", lastResult: "Captioned Diwali offer banner", generatedToday: 2, schedule: "Every 6 hrs · 3 per run" },
  { key: "seo", label: "SEO Generator", state: "paused", nextRun: "—", lastResult: "Filled meta for Hyundai Creta", generatedToday: 0, schedule: "Manual only" },
  { key: "faq", label: "FAQ Generator", state: "error", nextRun: "retry in 15 min", lastResult: "Ollama connection timeout", generatedToday: 0, schedule: "Daily · 5 per run" },
];

const LIVE_FEED = [
  { feature: "Article Generator", detail: "Draft created — \"Tata Nexon EV vs MG ZS EV\"", status: "success", time: "4 min ago" },
  { feature: "Story Generator", detail: "Image picked from /uploads/ai-source/ — caption added", status: "success", time: "22 min ago" },
  { feature: "Article Generator", detail: "Old draft auto-deleted (rotation limit: 10)", status: "cleanup", time: "42 min ago" },
  { feature: "FAQ Generator", detail: "Ollama did not respond within 30s", status: "failed", time: "1 hr ago" },
  { feature: "SEO Generator", detail: "Meta title & description filled — Maruti Brezza", status: "success", time: "2 hr ago" },
  { feature: "Article Generator", detail: "Draft created — \"Best mileage cars for highways\"", status: "success", time: "3 hr ago" },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function StatePill({ state }: { state: RunState }) {
  const map: Record<RunState, { bg: string; text: string; label: string; dot: string }> = {
    running: { bg: "#f0fdf4", text: "#15803d", label: "Running", dot: "#22c55e" },
    paused: { bg: "#f7f5f1", text: "#7a7670", label: "Paused", dot: "#a39e96" },
    error: { bg: "#fef2f0", text: ACCENT, label: "Error", dot: ACCENT },
  };
  const s = map[state];
  return (
    <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold px-2 py-1 rounded-full" style={{ background: s.bg, color: s.text }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
      {s.label}
    </span>
  );
}

function LogStatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    success: { bg: "#f0fdf4", text: "#15803d", label: "Success" },
    failed: { bg: "#fef2f0", text: ACCENT, label: "Failed" },
    cleanup: { bg: "#eef6ff", text: "#1d72c4", label: "Auto-cleanup" },
  };
  const s = map[status] ?? { bg: "#f7f5f1", text: "#7a7670", label: status };
  return (
    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.text }}>
      {s.label}
    </span>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function AIDashboard() {
  const navigate = useNavigate();
  const [features, setFeatures] = useState<FeatureStatus[]>(INITIAL_FEATURES);
  const [clock, setClock] = useState(0);

  // purely cosmetic "live" tick so the page feels alive — replace with real polling
  useEffect(() => {
    const t = setInterval(() => setClock((c) => c + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const toggleFeature = (key: string) => {
    setFeatures((prev) =>
      prev.map((f) =>
        f.key === key
          ? { ...f, state: f.state === "running" ? "paused" : f.state === "paused" ? "running" : f.state }
          : f,
      ),
    );
  };

  const activeCount = features.filter((f) => f.state === "running").length;

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[#1c1a17]">AI Dashboard</h1>
          <p className="text-[12.5px] text-[#7a7670] mt-0.5">
            Live status of your AI automations. Mock data — connect to backend for real polling.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFeatures((prev) => prev.map((f) => ({ ...f, state: "paused" })))}
            className="cursor-pointer text-[12.5px] font-semibold px-4 py-2 rounded-lg border border-[#e8e4dc] text-[#1c1a17] hover:bg-[#f7f5f1] transition-colors"
          >
            Pause All
          </button>
          <button
            onClick={() => navigate("/ai/settings")}
            className="cursor-pointer text-[12.5px] font-semibold text-white px-4 py-2 rounded-lg transition-opacity hover:opacity-90"
            style={{ background: ACCENT }}
          >
            Configure Automation
          </button>
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {TOP_STATS.map((card) => (
          <div key={card.label} className="bg-white border border-[#e8e4dc] rounded-xl p-4 flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#a39e96]">{card.label}</span>
            <p className="text-2xl font-black text-[#1c1a17] leading-none">{card.value}</p>
            <p className={`text-[11px] font-medium ${card.positive ? "text-emerald-600" : "text-[#a39e96]"}`}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Per-feature live cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {features.map((f) => (
          <div key={f.key} className="bg-white border border-[#e8e4dc] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[13px] font-bold text-[#1c1a17]">{f.label}</p>
              <StatePill state={f.state} />
            </div>
            <p className="text-[11.5px] text-[#7a7670] mb-3">{f.lastResult}</p>
            <div className="grid grid-cols-2 gap-2 text-[11.5px] mb-3">
              <div className="bg-[#faf8f5] rounded-lg px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-[#a39e96] font-semibold mb-0.5">Next Run</p>
                <p className="font-semibold text-[#1c1a17]">{f.nextRun}</p>
              </div>
              <div className="bg-[#faf8f5] rounded-lg px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-[#a39e96] font-semibold mb-0.5">Today</p>
                <p className="font-semibold text-[#1c1a17]">{f.generatedToday} generated</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#a39e96]">{f.schedule}</span>
              {f.state !== "error" && (
                <button
                  onClick={() => toggleFeature(f.key)}
                  className="cursor-pointer text-[11.5px] font-semibold hover:opacity-75 transition-opacity"
                  style={{ color: ACCENT }}
                >
                  {f.state === "running" ? "Pause" : "Resume"}
                </button>
              )}
              {f.state === "error" && (
                <button className="cursor-pointer text-[11.5px] font-semibold hover:opacity-75 transition-opacity" style={{ color: ACCENT }}>
                  Retry now
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Live activity feed */}
      <div className="bg-white border border-[#e8e4dc] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#f0ece6]">
          <h2 className="text-[13px] font-bold text-[#1c1a17]">Live Activity</h2>
          <span className="text-[11px] text-[#a39e96]">
            {activeCount} automation{activeCount !== 1 ? "s" : ""} running · updated {clock}s ago
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-left text-[10.5px] uppercase tracking-wider text-[#a39e96] bg-[#faf8f5]">
                <th className="px-5 py-2.5 font-semibold">Feature</th>
                <th className="px-5 py-2.5 font-semibold">Detail</th>
                <th className="px-5 py-2.5 font-semibold">Status</th>
                <th className="px-5 py-2.5 font-semibold">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0ece6]">
              {LIVE_FEED.map((row, i) => (
                <tr key={i} className="hover:bg-[#faf8f5] transition-colors">
                  <td className="px-5 py-3 font-semibold text-[#1c1a17]">{row.feature}</td>
                  <td className="px-5 py-3 text-[#4a4640]">{row.detail}</td>
                  <td className="px-5 py-3"><LogStatusPill status={row.status} /></td>
                  <td className="px-5 py-3 text-[#a39e96]">{row.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}