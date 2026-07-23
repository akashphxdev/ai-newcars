// components/common/SectionHeader.tsx
//
// The eyebrow-label + title + optional subtitle + optional "view all"
// link pattern repeated at the top of every home page section — was
// hand-rolled slightly differently in each one.
import { ChevronIcon } from "./icons";

type Tone = "brand" | "ev";

const TONE_TEXT: Record<Tone, string> = { brand: "text-brand", ev: "text-ev" };
const TONE_HOVER: Record<Tone, string> = { brand: "hover:text-brand", ev: "hover:text-ev" };
const TONE_ICON_BG: Record<Tone, string> = { brand: "bg-brand/10 text-brand", ev: "bg-ev/10 text-ev" };

export default function SectionHeader({
  eyebrow,
  title,
  titleSize = "md",
  underline = false,
  subtitle,
  href,
  linkLabel = "View all",
  icon,
  tone = "brand",
  dark = false,
  divider = false,
  className = "",
  after,
}: {
  /** Omit when `underline` is true — that variant has no eyebrow row. */
  eyebrow?: string;
  title: string;
  /** "lg" = Latest Cars' bigger 32px title; everything else uses the standard "md" size. */
  titleSize?: "md" | "lg";
  /** Renders a short brand-colored bar under the title instead of the eyebrow row (Latest Cars, Reviews). */
  underline?: boolean;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  /** Small round icon badge shown before the eyebrow label, e.g. Electric Cars' bolt. */
  icon?: React.ReactNode;
  /** Eyebrow/icon-badge/link-hover accent color — "ev" for the teal Electric Cars treatment. */
  tone?: Tone;
  /** Section has a dark background — flips title/subtitle to white. */
  dark?: boolean;
  /** Adds the bottom border + extra padding some sections use to separate the header from the content below. */
  divider?: boolean;
  className?: string;
  /** Extra content placed after the "view all" link, e.g. scroll arrows, or a custom CTA button in place of the link. */
  after?: React.ReactNode;
}) {
  const dividerClass = divider ? (underline ? "mb-7 border-b border-border pb-7" : "mb-8 border-b border-border pb-8") : "mb-6 sm:mb-8";

  return (
    <div
      className={`flex flex-col gap-4 sm:flex-row sm:justify-between ${
        underline ? "sm:items-start" : "sm:items-end"
      } ${dividerClass} ${className}`}
    >
      <div>
        {underline ? (
          <>
            <h2 className={`text-[32px] font-bold tracking-tight ${dark ? "text-white" : "text-ink"}`}>{title}</h2>
            <span className={`mt-2 mb-3 block h-[3px] w-10 rounded-full ${dark ? "bg-white" : "bg-brand"}`} />
          </>
        ) : (
          <>
            <div className="mb-1.5 flex items-center gap-2">
              {icon && (
                <span className={`flex size-6 items-center justify-center rounded-full ${TONE_ICON_BG[tone]}`}>
                  {icon}
                </span>
              )}
              <p className={`text-[11px] font-bold uppercase tracking-[0.14em] ${dark ? "text-ev" : TONE_TEXT[tone]}`}>
                {eyebrow}
              </p>
            </div>
            <h2
              className={`font-bold tracking-tight ${titleSize === "lg" ? "text-[32px]" : "text-2xl sm:text-[28px]"} ${
                dark ? "text-white" : "text-ink"
              }`}
            >
              {title}
            </h2>
          </>
        )}
        {subtitle && (
          <p
            className={`${underline ? "max-w-md text-[14px] leading-relaxed" : "mt-1 text-[13px]"} font-medium ${
              dark ? "text-white/50" : "text-muted"
            }`}
          >
            {subtitle}
          </p>
        )}
      </div>

      {(href || after) && (
        <div className="flex shrink-0 items-center gap-3">
          {href && (
            <a
              href={href}
              className={`inline-flex items-center gap-1.5 text-[12.5px] font-bold whitespace-nowrap transition-colors ${
                dark ? "text-white hover:text-ev" : `text-ink ${TONE_HOVER[tone]}`
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