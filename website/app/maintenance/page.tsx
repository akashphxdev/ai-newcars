import type { Metadata } from "next";
import Link from "next/link";
import { getSiteSettings } from "@/features/siteSettings/siteSetting.api";

// Not admin-managed (no "maintenance" entry in the SEO Manager) — this
// page is always noindex/nofollow with fixed copy, and it's the one page
// where skipping an extra backend call actually matters: it's shown
// precisely when something may already be wrong, so it shouldn't gain a
// new dependency on the SEO endpoint being healthy.
export const metadata: Metadata = {
  title: "Under Maintenance | TimesAuto",
  robots: { index: false, follow: false },
};

const DEFAULT_MESSAGE =
  "We're currently performing scheduled maintenance to bring you a faster, smoother TimesAuto. We'll be back on the road shortly — thanks for your patience.";

export default async function MaintenancePage() {
  const { maintenanceMessage } = await getSiteSettings();

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-page p-6">
      {/* Soft brand-colored glow behind the card — plain bg-page alone read
          as a little flat for a page that's the entire viewport with
          nothing else to anchor it. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[-12%] left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-brand opacity-[0.08] blur-[110px]"
      />

      <div className="relative flex w-full max-w-[520px] flex-col items-center gap-7">
        <div className="flex flex-col items-center gap-1">
          <p className="text-[26px] font-bold tracking-tight text-ink">
            Times<span className="text-brand italic">Auto</span>
          </p>
          <p className="text-[10px] font-bold tracking-[0.16em] text-muted uppercase">India&apos;s Auto Guide</p>
        </div>

        <div className="flex w-full flex-col items-center gap-5 rounded-[20px] border border-border bg-surface p-10 pb-8 text-center shadow-[0_1px_2px_rgba(17,24,39,0.04),0_8px_28px_rgba(17,24,39,0.06)]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3.5 py-1.5 text-[11px] font-bold tracking-[0.12em] text-brand uppercase">
            <span className="size-1.5 animate-pulse rounded-full bg-brand" />
            Scheduled maintenance
          </span>

          <RoadIcon />

          <h1 className="text-[24px] leading-snug font-extrabold tracking-tight text-balance text-ink">
            We&apos;re tuning up the engine
          </h1>

          <div className="w-full rounded-2xl border border-border-soft bg-page p-4 text-[14px] leading-relaxed text-muted">
            {maintenanceMessage || DEFAULT_MESSAGE}
          </div>

          <div className="flex w-full flex-col items-center gap-3 border-t border-border-soft pt-5">
            <Link
              href="/"
              className="block w-full rounded-xl bg-brand px-5 py-2.5 text-center text-[13px] font-bold text-white transition-colors hover:bg-brand-hover"
            >
              Check again
            </Link>
            <p className="text-[13px] text-muted">
              Need urgent help? Email{" "}
              <a href="mailto:support@timesauto.in" className="border-b border-border font-bold text-ink">
                support@timesauto.in
              </a>
            </p>
          </div>
        </div>

        <p className="text-[11.5px] text-muted">© {new Date().getFullYear()} TimesAuto, a Girnar Software Pvt. Ltd. brand.</p>
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
      <line x1="0" y1="17" x2="260" y2="17" stroke="var(--color-border)" strokeWidth="3" strokeDasharray="10 10" />
      <g className="road-car">
        <rect x="0" y="8" width="30" height="12" rx="4" fill="var(--color-brand)" />
        <rect x="6" y="3" width="14" height="8" rx="3" fill="var(--color-brand)" />
        <circle cx="7" cy="21" r="3.4" fill="var(--color-ink)" />
        <circle cx="23" cy="21" r="3.4" fill="var(--color-ink)" />
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
