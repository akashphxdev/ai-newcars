// src/pages/Analytics/PageViews/AllPageViews.tsx
//
// Traffic dashboard, not a raw event log — backed by the aggregated
// PageViewDailyStat table (one row per page per day), so every range
// here stays a cheap query no matter how much traffic the site gets.
import { useState } from "react";
import { useGetPageViewSummaryQuery, type PageViewRange, type PageViewTopPage } from "./pageView.api";
import { extractApiError } from "../../../lib/apiClient";

const ACCENT = "#D4300F";

const RANGE_OPTIONS: { value: PageViewRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "1m", label: "Last 1 Month" },
  { value: "6m", label: "Last 6 Months" },
  { value: "1y", label: "Last 1 Year" },
];

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#e8e4dc] rounded-xl p-5">
      <h2 className="text-[13px] font-bold text-[#1c1a17] mb-4">{title}</h2>
      {children}
    </div>
  );
}

function TopPagesList({ pages }: { pages: PageViewTopPage[] }) {
  const max = Math.max(1, ...pages.map((p) => p.count));

  if (pages.length === 0) {
    return <p className="text-[12px] text-[#a39e96] py-8 text-center">No page views recorded in this range yet.</p>;
  }

  return (
    <div className="space-y-2.5">
      {pages.map((p, i) => (
        <div key={p.pageUrl} className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-[#a39e96] w-4 shrink-0">{i + 1}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[12px] font-semibold text-[#1c1a17] truncate" title={p.pageUrl}>
                {p.pageUrl}
              </span>
              <span className="text-[12px] font-bold text-[#4a4640] shrink-0">{p.count}</span>
            </div>
            <div className="h-1.5 rounded-full bg-[#f0ece4] overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${(p.count / max) * 100}%`, background: ACCENT }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AllPageViews() {
  const [range, setRange] = useState<PageViewRange>("1m");
  const { data, isLoading, isFetching, error: queryError } = useGetPageViewSummaryQuery(range);

  const error = queryError ? extractApiError(queryError) : "";
  const loading = isLoading || isFetching;
  const trend = data?.trend ?? [];
  const topPages = data?.topPages ?? [];
  const totalViews = trend.reduce((sum, t) => sum + t.count, 0);

  return (
    <div className="space-y-5 max-w-[1000px]">
      <div>
        <h1 className="text-[18px] font-black text-[#1c1a17]">Page Views</h1>
        <p className="text-[12px] text-[#a39e96] mt-0.5">
          Traffic across the website, recorded automatically on every page load.
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setRange(opt.value)}
            className="cursor-pointer text-[12px] font-bold px-3.5 py-2 rounded-lg transition-colors border-0"
            style={range === opt.value ? { background: ACCENT, color: "#fff" } : { background: "#f7f5f1", color: "#7a7670" }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">
          <p className="text-red-500 text-xs font-medium">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-[13px] text-[#a39e96]">Loading page views...</div>
      ) : (
        <>
          <div className="bg-white border border-[#e8e4dc] rounded-xl p-4 flex flex-col gap-2 w-fit min-w-[160px]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#a39e96]">
              {range === "today" ? "Views Today" : "Total Views"}
            </span>
            <p className="text-2xl font-black text-[#1c1a17] leading-none">{totalViews}</p>
          </div>

          <SectionCard title="Top Pages">
            <TopPagesList pages={topPages} />
          </SectionCard>
        </>
      )}
    </div>
  );
}
