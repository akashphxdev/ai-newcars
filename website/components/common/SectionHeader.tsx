// components/common/SectionHeader.tsx
//
// The eyebrow-label + title + optional subtitle + optional "view all"
// link pattern repeated at the top of every home page section — was
// hand-rolled slightly differently in each one.
import { ChevronIcon } from "./icons";

export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
  href,
  linkLabel = "View all",
  dark = false,
  className = "",
  after,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  /** Section has a dark background (e.g. Electric Cars) — flips text to white/brand-ev. */
  dark?: boolean;
  className?: string;
  /** Extra content placed after the "view all" link, e.g. scroll arrows. */
  after?: React.ReactNode;
}) {
  return (
    <div className={`mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between ${className}`}>
      <div>
        <p
          className={`mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] ${
            dark ? "text-ev" : "text-brand"
          }`}
        >
          {eyebrow}
        </p>
        <h2 className={`text-[32px] font-bold tracking-tight ${dark ? "text-white" : "text-ink"}`}>
          {title}
        </h2>
        {subtitle && (
          <p className={`mt-1 text-[13px] ${dark ? "text-white/50" : "text-muted"}`}>{subtitle}</p>
        )}
      </div>

      {(href || after) && (
        <div className="flex items-center gap-3">
          {href && (
            <a
              href={href}
              className={`inline-flex items-center gap-1.5 text-[12.5px] font-bold whitespace-nowrap transition-colors ${
                dark ? "text-white hover:text-ev" : "text-ink hover:text-brand"
              }`}
            >
              {linkLabel}
              <ChevronIcon />
            </a>
          )}
          {after}
        </div>
      )}
    </div>
  );
}
