import type { Metadata } from "next";
import { getSiteSettings } from "@/features/siteSettings/siteSetting.api";

export const metadata: Metadata = {
  title: "Under Maintenance | TimesAuto",
  robots: { index: false, follow: false },
};

const DARK = "#111827";
const MUTED = "#6b7280";
const BORDER = "#e5e7eb";
const BORDER_SOFT = "#f0f1f4";
const SURFACE = "#ffffff";
const PAGE_BG = "#f4f5f9";
const ORANGE = "#f2650f";
const ORANGE_SOFT = "#fde3d3";

const DEFAULT_MESSAGE =
  "We're currently performing scheduled maintenance to bring you a faster, smoother TimesAuto. We'll be back on the road shortly — thanks for your patience.";

export default async function MaintenancePage() {
  const { maintenanceMessage } = await getSiteSettings();

  return (
    <div
      className="flex min-h-screen w-full items-center justify-center p-6"
      style={{ background: PAGE_BG }}
    >
      <div className="flex w-full max-w-[520px] flex-col items-center gap-7">
        <div className="flex flex-col items-center gap-1">
          <p className="text-[26px] font-bold tracking-tight" style={{ color: DARK }}>
            Times<span style={{ color: ORANGE, fontStyle: "italic" }}>Auto</span>
          </p>
          <p className="text-[10px] font-bold tracking-[0.16em] uppercase" style={{ color: MUTED }}>
            India&apos;s Auto Guide
          </p>
        </div>

        <div
          className="flex w-full flex-col items-center gap-5 rounded-[20px] p-10 pb-8 text-center"
          style={{ background: SURFACE, border: `1px solid ${BORDER}`, boxShadow: "0 1px 2px rgba(17,24,39,0.04), 0 8px 28px rgba(17,24,39,0.06)" }}
        >
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-bold tracking-[0.12em] uppercase"
            style={{ color: ORANGE, background: ORANGE_SOFT }}
          >
            <span className="size-1.5 animate-pulse rounded-full" style={{ background: ORANGE }} />
            Scheduled maintenance
          </span>

          <RoadIcon />

          <h1 className="text-[24px] leading-snug font-extrabold tracking-tight text-balance" style={{ color: DARK }}>
            We&apos;re tuning up the engine
          </h1>

          <div
            className="w-full rounded-2xl p-4 text-[14px] leading-relaxed"
            style={{ background: PAGE_BG, border: `1px solid ${BORDER_SOFT}`, color: MUTED }}
          >
            {maintenanceMessage || DEFAULT_MESSAGE}
          </div>

          <p className="text-[13px]" style={{ color: MUTED }}>
            Need urgent help? Email{" "}
            <a href="mailto:support@timesauto.in" className="font-bold" style={{ color: DARK, borderBottom: `1px solid ${BORDER}` }}>
              support@timesauto.in
            </a>
          </p>
        </div>

        <p className="text-[11.5px]" style={{ color: MUTED }}>
          © {new Date().getFullYear()} TimesAuto, a Girnar Software Pvt. Ltd. brand.
        </p>
      </div>
    </div>
  );
}

// A slow, looping car-on-a-dashed-road motif — ties the "site is being
// worked on" message to the auto-guide brand instead of a generic
// wrench/gear icon. Respects prefers-reduced-motion via the CSS below.
const RoadIcon = () => (
  <div className="relative h-[34px] w-full max-w-[260px] overflow-hidden">
    <svg viewBox="0 0 260 34" className="block h-full w-full" aria-hidden="true">
      <line x1="0" y1="17" x2="260" y2="17" stroke={BORDER} strokeWidth="3" strokeDasharray="10 10" />
      <g className="road-car">
        <rect x="0" y="8" width="30" height="12" rx="4" fill={ORANGE} />
        <rect x="6" y="3" width="14" height="8" rx="3" fill={ORANGE} />
        <circle cx="7" cy="21" r="3.4" fill={DARK} />
        <circle cx="23" cy="21" r="3.4" fill={DARK} />
      </g>
    </svg>
    <style>{`
      .road-car { animation: road-drive 3.2s linear infinite; }
      @keyframes road-drive {
        from { transform: translateX(-14px); }
        to { transform: translateX(240px); }
      }
      @media (prefers-reduced-motion: reduce) {
        .road-car { animation: none; transform: translateX(113px); }
      }
    `}</style>
  </div>
);
