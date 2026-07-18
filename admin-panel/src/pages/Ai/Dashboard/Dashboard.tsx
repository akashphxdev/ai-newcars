// src/pages/Ai/Dashboard/Dashboard.tsx
// Live AI Studio dashboard — every number here comes from
// GET /ai/dashboard (see dashboard.api.ts), polled every 20s so an
// automation being turned on/off, or a scheduled run firing, shows up
// here without a manual refresh.

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGetAiDashboardQuery, POLL_INTERVAL_MS, type AiDashboardFeatureStatus } from "./dashboard.api";
import { useToggleAutomationRuleMutation } from "../Settings/automationRule.api";
import { extractApiError } from "../../../lib/apiClient";
import { AI_FEATURE_OPTIONS, getAiFeatureLabel } from "../../../lib/aiLookups";

const ACCENT = "#D4300F";

type RunState = "running" | "paused" | "error" | "not_built";

const FEATURE_ROUTES: Record<number, string> = {
  1: "/ai/article/review",
  2: "/ai/story/review",
  3: "/ai/seo/review",
  4: "/ai/car-faqs/review",
};

function deriveState(f: AiDashboardFeatureStatus): RunState {
  if (!f.built) return "not_built";
  if (f.enabled && f.isError) return "error";
  if (f.enabled) return "running";
  return "paused";
}

function formatFrequency(minutes: number | null, countPerRun: number | null): string {
  if (minutes == null) return "Not configured";
  const label =
    minutes % 1440 === 0 && minutes >= 1440
      ? `Every ${minutes / 1440} day${minutes / 1440 === 1 ? "" : "s"}`
      : minutes % 60 === 0 && minutes >= 60
      ? `Every ${minutes / 60} hr${minutes / 60 === 1 ? "" : "s"}`
      : `Every ${minutes} min`;
  return countPerRun ? `${label} · ${countPerRun} per run` : label;
}

function formatRelativeToNow(iso: string | null, future: boolean): string {
  if (!iso) return "—";
  const target = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = future ? target - now : now - target;
  if (future && diffMs <= 0) return "any moment now";
  const abs = Math.abs(diffMs);
  const mins = Math.round(abs / 60000);
  if (mins < 1) return future ? "any moment now" : "just now";
  if (mins < 60) return future ? `in ${mins} min` : `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return future ? `in ${hrs} hr${hrs === 1 ? "" : "s"}` : `${hrs} hr${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  return future ? `in ${days} day${days === 1 ? "" : "s"}` : `${days} day${days === 1 ? "" : "s"} ago`;
}

function StatePill({ state }: { state: RunState }) {
  const map: Record<RunState, { bg: string; text: string; label: string; dot: string; pulse: boolean }> = {
    running: { bg: "#f0fdf4", text: "#15803d", label: "Running", dot: "#22c55e", pulse: true },
    paused: { bg: "#f7f5f1", text: "#7a7670", label: "Paused", dot: "#a39e96", pulse: false },
    error: { bg: "#fef2f0", text: ACCENT, label: "Error", dot: ACCENT, pulse: false },
    not_built: { bg: "#f7f5f1", text: "#c0bab0", label: "Not Built", dot: "#c0bab0", pulse: false },
  };
  const s = map[state];
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10.5px] font-bold px-2 py-1 rounded-full"
      style={{ background: s.bg, color: s.text }}
    >
      <span className="relative flex w-1.5 h-1.5">
        {s.pulse && (
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
            style={{ background: s.dot }}
          />
        )}
        <span className="relative inline-flex rounded-full w-1.5 h-1.5" style={{ background: s.dot }} />
      </span>
      {s.label}
    </span>
  );
}

function Toggle({ checked, disabled, onChange }: { checked: boolean; disabled?: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      aria-pressed={checked}
      className="relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      style={{ background: checked ? ACCENT : "#e2ddd4" }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: checked ? "translateX(16px)" : "translateX(0)" }}
      />
    </button>
  );
}

function LogStatusPill({ status }: { status: number }) {
  // 1 = SUCCESS, 2 = FAILED — see AI_LOG_STATUS in each generator's service.ts
  const isSuccess = status === 1;
  return (
    <span
      className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{
        background: isSuccess ? "#f0fdf4" : "#fef2f0",
        color: isSuccess ? "#15803d" : ACCENT,
      }}
    >
      {isSuccess ? "Success" : "Failed"}
    </span>
  );
}

// 30-bar trend chart, no charting library — thin rounded data-ends, a
// hover tooltip per bar, values only shown on hover (not stamped on
// every bar). With this many bars the x-axis only labels every 5th day
// (plus today) so it doesn't collapse into unreadable text.
function TrendChart({ trend }: { trend: { date: string; count: number }[] }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const max = Math.max(1, ...trend.map((t) => t.count));
  const labelEvery = trend.length > 14 ? 5 : 1;

  return (
    <div className="flex items-end gap-[3px] h-[100px] px-1">
      {trend.map((point, i) => {
        const heightPct = Math.max(3, (point.count / max) * 100);
        const isToday = i === trend.length - 1;
        const showLabel = isToday || i % labelEvery === 0;
        const dateObj = new Date(point.date + "T00:00:00");
        const dayLabel = dateObj.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
        const fullLabel = dateObj.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
        return (
          <div
            key={point.date}
            className="relative flex-1 flex flex-col items-center justify-end h-full min-w-0"
            onMouseEnter={() => setHoverIdx(i)}
            onMouseLeave={() => setHoverIdx((cur) => (cur === i ? null : cur))}
          >
            {hoverIdx === i && (
              <div
                className="absolute -top-9 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white px-2 py-1 rounded-md whitespace-nowrap z-10"
                style={{ background: "#1c1a17" }}
              >
                {point.count} generated
                <span className="block text-[9px] font-medium text-white/70">{fullLabel}</span>
              </div>
            )}
            <div
              className="w-full rounded-t-[3px] transition-all duration-300"
              style={{
                height: `${heightPct}%`,
                background: isToday ? ACCENT : "#f0c4b8",
                opacity: hoverIdx === null || hoverIdx === i ? 1 : 0.55,
              }}
            />
            <span
              className={`text-[9px] mt-1.5 font-semibold whitespace-nowrap ${isToday ? "text-[#1c1a17]" : "text-[#a39e96]"} ${showLabel ? "" : "opacity-0"}`}
            >
              {dayLabel}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function AIDashboard() {
  const navigate = useNavigate();
  const { data, isLoading, isFetching, error, refetch } = useGetAiDashboardQuery(undefined, {
    pollingInterval: POLL_INTERVAL_MS,
  });
  const [toggleAutomationRule] = useToggleAutomationRuleMutation();
  const [togglingFeature, setTogglingFeature] = useState<number | null>(null);
  const [toggleError, setToggleError] = useState("");

  const handleToggle = async (featureKey: number, nextEnabled: boolean) => {
    setToggleError("");
    setTogglingFeature(featureKey);
    try {
      await toggleAutomationRule({ featureKey, enabled: nextEnabled }).unwrap();
      // Toggling changes enabled/nextRunAt, which this same screen also
      // shows per-feature — refetch immediately instead of waiting out
      // the poll interval, so flipping the switch reflects right away.
      refetch();
    } catch (err) {
      setToggleError(extractApiError(err));
    } finally {
      setTogglingFeature(null);
    }
  };

  const topStats = useMemo(() => {
    if (!data) return [];
    return [
      {
        label: "Active Automations",
        value: `${data.activeAutomations}`,
        sub: `of ${data.totalFeatures} features`,
        positive: data.activeAutomations > 0,
      },
      {
        label: "Generated Today",
        value: `${data.generatedToday}`,
        sub: `${data.pendingReviewTotal} pending review`,
        positive: data.generatedToday > 0,
      },
      {
        label: "Unused Pool Images",
        value: `${data.imagesUnusedInPool}`,
        sub: "ready to be picked",
        positive: data.imagesUnusedInPool > 0,
      },
      {
        label: "Auto-Deleted Today",
        value: `${data.autoDeletedToday}`,
        sub: "oldest items cleared",
        positive: false,
      },
    ];
  }, [data]);

  if (isLoading) {
    return <div className="py-20 text-center text-[13px] text-[#a39e96]">Loading AI dashboard...</div>;
  }

  if (error || !data) {
    return (
      <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">
        <p className="text-red-500 text-xs font-medium">{error ? extractApiError(error) : "No data available."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold text-[#1c1a17]">AI Dashboard</h1>
          <p className="text-[12.5px] text-[#7a7670] mt-0.5">
            {data.activeAutomations} of {data.totalFeatures} automations active · live, refreshes every{" "}
            {POLL_INTERVAL_MS / 1000}s{isFetching ? " · syncing…" : ""}
          </p>
        </div>
        <button
          onClick={() => navigate("/ai/settings")}
          className="cursor-pointer text-[12.5px] font-semibold text-white px-4 py-2 rounded-lg transition-opacity hover:opacity-90"
          style={{ background: ACCENT }}
        >
          Configure Automation
        </button>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {topStats.map((card) => (
          <div key={card.label} className="bg-white border border-[#e8e4dc] rounded-xl p-4 flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#a39e96]">{card.label}</span>
            <p className="text-2xl font-black text-[#1c1a17] leading-none">{card.value}</p>
            <p className={`text-[11px] font-medium ${card.positive ? "text-emerald-600" : "text-[#a39e96]"}`}>
              {card.sub}
            </p>
          </div>
        ))}
      </div>

      {/* 30-day generation trend */}
      <div className="bg-white border border-[#e8e4dc] rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] font-bold text-[#1c1a17]">Generated — Last 30 Days</h2>
          <span className="text-[11px] text-[#a39e96]">across all automations</span>
        </div>
        <TrendChart trend={data.trend} />
      </div>

      {toggleError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">
          <p className="text-red-500 text-xs font-medium">{toggleError}</p>
        </div>
      )}

      {/* Per-feature live cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {AI_FEATURE_OPTIONS.map((opt) => {
          const f = data.features.find((x) => x.featureKey === opt.value);
          if (!f) return null;
          const state = deriveState(f);
          const notBuilt = state === "not_built";
          return (
            <div
              key={opt.value}
              className={`bg-white border rounded-xl p-4 ${notBuilt ? "border-dashed border-[#e2ddd4] opacity-70" : "border-[#e8e4dc]"}`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-[13px] font-bold text-[#1c1a17]">{getAiFeatureLabel(opt.value)}</p>
                <div className="flex items-center gap-2.5">
                  <StatePill state={state} />
                  {!notBuilt && (
                    <Toggle
                      checked={f.enabled}
                      disabled={togglingFeature === opt.value}
                      onChange={() => handleToggle(opt.value, !f.enabled)}
                    />
                  )}
                </div>
              </div>
              <p className="text-[11.5px] text-[#7a7670] mb-3 line-clamp-2 min-h-[16px]">
                {notBuilt ? "This generator hasn't been built yet." : f.lastLogMessage ?? "No activity yet."}
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11.5px] mb-3">
                <div className="bg-[#faf8f5] rounded-lg px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wide text-[#a39e96] font-semibold mb-0.5">Next Run</p>
                  <p className="font-semibold text-[#1c1a17]">
                    {state === "running" ? formatRelativeToNow(f.nextRunAt, true) : "—"}
                  </p>
                </div>
                <div className="bg-[#faf8f5] rounded-lg px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wide text-[#a39e96] font-semibold mb-0.5">Today</p>
                  <p className="font-semibold text-[#1c1a17]">
                    {notBuilt ? "—" : `${f.generatedToday} generated`}
                    {!notBuilt && f.pendingReview > 0 ? ` · ${f.pendingReview} pending` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#a39e96]">
                  {notBuilt ? "Coming soon" : formatFrequency(f.frequencyMinutes, f.countPerRun)}
                </span>
                {!notBuilt && (
                  <button
                    onClick={() => navigate(FEATURE_ROUTES[opt.value])}
                    className="cursor-pointer text-[11.5px] font-semibold hover:opacity-75 transition-opacity"
                    style={{ color: ACCENT }}
                  >
                    Review queue →
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Live activity feed */}
      <div className="bg-white border border-[#e8e4dc] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#f0ece6]">
          <h2 className="text-[13px] font-bold text-[#1c1a17]">Live Activity</h2>
          <span className="text-[11px] text-[#a39e96]">most recent {data.recentActivity.length} events</span>
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
              {data.recentActivity.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-[#a39e96]">
                    No activity yet — enable an automation or generate something manually.
                  </td>
                </tr>
              ) : (
                data.recentActivity.map((row) => (
                  <tr key={row.id} className="hover:bg-[#faf8f5] transition-colors">
                    <td className="px-5 py-3 font-semibold text-[#1c1a17]">{getAiFeatureLabel(row.featureKey)}</td>
                    <td className="px-5 py-3 text-[#4a4640] max-w-[420px] truncate" title={row.message}>
                      {row.message}
                    </td>
                    <td className="px-5 py-3">
                      <LogStatusPill status={row.status} />
                    </td>
                    <td className="px-5 py-3 text-[#a39e96] whitespace-nowrap">
                      {formatRelativeToNow(row.createdAt, false)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
