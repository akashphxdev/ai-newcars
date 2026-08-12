"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isChromelessRoute, routes } from "@/lib/routes";
// Deliberately not PublicSiteSetting: this is a client component, so
// anything in this object ships to the browser in the page payload even
// when nothing renders it. The registered company name, postal address
// and phone numbers are therefore never passed in.
export type FooterSettings = {
  contactEmail: string | null;
  supportEmail: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  twitterUrl: string | null;
  youtubeUrl: string | null;
  linkedinUrl: string | null;
};
import type { BodyType } from "@/features/bodyTypes/bodyType.types";
import type { ArticleCategory } from "@/features/articles/article.types";
import FooterCta from "@/components/common/FooterCta";
import { ShieldIcon, SparkleIcon, CompareIcon, RupeeIcon } from "@/components/common/icons";

const ORANGE = "var(--color-brand)";
const DARK = "var(--color-ink)";
const MUTED = "var(--color-muted)";
const FAINT = "var(--color-subtle)";
const BORDER = "var(--color-border)";
const SURFACE = "var(--color-surface)";
const PAGE_BG = "var(--color-page)";
const PEACH = "var(--color-brand-soft)";

/* ---------------- Icons ---------------- */

const MailIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="5" width="18" height="14" rx="2.5" stroke={MUTED} strokeWidth="1.7" />
    <path d="m4 7 8 6 8-6" stroke={MUTED} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);


type SocialDef = { label: string; href: string; brand: string; icon: React.ReactNode };

function buildSocials(s: FooterSettings): SocialDef[] {
  const defs: { label: string; href: string | null; brand: string; icon: React.ReactNode }[] = [
    {
      label: "Facebook",
      href: s.facebookUrl,
      brand: "var(--color-social-facebook)",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M13.5 21v-7.6h2.6l.4-3h-3v-1.9c0-.87.24-1.46 1.5-1.46h1.6V4.35A21.4 21.4 0 0 0 13.9 4.2c-2.24 0-3.77 1.37-3.77 3.87v2.16H7.5v3h2.63V21h3.37Z" />
        </svg>
      ),
    },
    {
      label: "Instagram",
      href: s.instagramUrl,
      brand: "linear-gradient(135deg,var(--color-social-instagram-a),var(--color-social-instagram-b),var(--color-social-instagram-c))",
      icon: (
        <svg viewBox="0 0 24 24" fill="none">
          <rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
        </svg>
      ),
    },
    {
      label: "X",
      href: s.twitterUrl,
      brand: "var(--color-social-x)",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.5 3h3l-7.3 8.3L21.5 21h-6.7l-5.2-6.6L3.6 21H.6l7.8-8.9L2.5 3h6.9l4.7 6.1L17.5 3Zm-1.2 16h1.6L7.9 4.9H6.2L16.3 19Z" />
        </svg>
      ),
    },
    {
      label: "YouTube",
      href: s.youtubeUrl,
      brand: "var(--color-social-youtube)",
      icon: (
        <svg viewBox="0 0 24 24" fill="none">
          <rect x="2.5" y="5.5" width="19" height="13" rx="4" stroke="currentColor" strokeWidth="1.6" />
          <path d="M10.5 9.5v5l4.3-2.5-4.3-2.5Z" fill="currentColor" />
        </svg>
      ),
    },
    {
      label: "LinkedIn",
      href: s.linkedinUrl,
      brand: "var(--color-social-linkedin)",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M6.94 8.5H3.56V20h3.38V8.5ZM5.25 3.5a1.96 1.96 0 1 0 0 3.92 1.96 1.96 0 0 0 0-3.92ZM20.5 20v-6.4c0-3.43-1.83-5.02-4.27-5.02-1.97 0-2.85 1.08-3.34 1.84V8.5H9.5c.04.96 0 11.5 0 11.5h3.39v-6.42c0-.34.02-.68.12-.93.27-.68.9-1.38 1.94-1.38 1.37 0 1.92 1.04 1.92 2.57V20h3.63Z" />
        </svg>
      ),
    },
  ];

  return defs.filter((d): d is SocialDef => !!d.href);
}

/* ---------------- Data ---------------- */

const FEATURES = [
  { icon: <ShieldIcon className="size-5" />, title: "100% Verified", sub: "Trusted listings only" },
  { icon: <SparkleIcon className="size-5" />, title: "AI Assist", sub: "Find your car faster" },
  { icon: <RupeeIcon className="size-5" />, title: "Best Price", sub: "No hidden charges" },
  { icon: <CompareIcon className="size-5" />, title: "Compare Easily", sub: "Decode the right car" },
];

type FooterCol = {
  title: string;
  links: { label: string; href: string }[];
};

const TOOLS_COL: FooterCol = {
  title: "Tools",
  links: [
    { label: "EMI Calculator", href: "/car-loan-emi-calculator" },
    { label: "Mileage Calculator", href: "/mileage-calculator" },
    { label: "Down Payment", href: "/down-payment-calculator" },
    { label: "Car Affordability", href: "/car-affordability-calculator" },
    { label: "EV Charging Time", href: "/ev-charging-time-calculator" },
    { label: "Fuel Comparison", href: "/fuel-comparison-calculator" },
  ],
};

// "New Cars" and "News" mirror the exact same data Header's nav dropdowns
// use (body types / article categories) — same labels, same routes.
// Both lists grow with the catalogue: every body type, every news
// category. Left uncapped they made the footer a 1,100px wall — taller
// than the phone screen it sat under — so each column shows the first
// few and the listing pages carry the rest.
const FOOTER_COL_LIMIT = 6;

function buildFooterCols(bodyTypes: BodyType[], articleCategories: ArticleCategory[]): FooterCol[] {
  return [
    {
      title: "News",
      links: articleCategories.slice(0, FOOTER_COL_LIMIT).map((c) => ({ label: c.name, href: `/news/${c.slug}` })),
    },
    {
      title: "New Cars",
      links: [
        ...bodyTypes.slice(0, FOOTER_COL_LIMIT - 2).map((bt) => ({ label: bt.name, href: routes.bodyType(bt.slug) })),
        { label: "Electric", href: "/electric-cars" },
        { label: "All new cars", href: routes.newCars() },
      ],
    },
    TOOLS_COL,
  ];
}

const LEGAL_LINKS = [
  { label: "About Us", href: "#" },
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Use", href: "#" },
  { label: "Sitemap", href: "#" },
];

/* ---------------- Component ---------------- */

export default function Footer({
  siteSettings,
  bodyTypes,
  articleCategories,
}: {
  siteSettings: FooterSettings;
  bodyTypes: BodyType[];
  articleCategories: ArticleCategory[];
}) {
  const pathname = usePathname();
  if (isChromelessRoute(pathname)) return null;

  const socials = buildSocials(siteSettings);
  const footerCols = buildFooterCols(bodyTypes, articleCategories);

  return (
    <footer className="font-body" style={{ background: SURFACE }}>
      <FooterCta />

      {/* Trust strip */}
      <div className="border-b" style={{ borderColor: BORDER, background: PAGE_BG }}>
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-5 gap-y-4 px-6 py-5 sm:grid-cols-4 sm:gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl text-brand" style={{ background: PEACH }}>
                {f.icon}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-bold" style={{ color: DARK }}>
                  {f.title}
                </p>
                <p className="truncate text-[11.5px] font-medium" style={{ color: MUTED }}>
                  {f.sub}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main columns */}
      <div className="mx-auto max-w-7xl px-6 py-8 sm:py-12">
        <div className="grid grid-cols-2 gap-x-6 gap-y-7 sm:gap-10 lg:grid-cols-5">
          {/* Brand + about — spans both mobile columns, then 2 of 5 at desktop */}
          <div className="col-span-2">
            <Link href="/" className="inline-flex items-center gap-1.5 no-underline">
              <span className="text-xl font-black tracking-tight" style={{ color: DARK }}>
                Times<span style={{ color: ORANGE }}>Auto</span>
              </span>
            </Link>
            <p className="mt-3.5 max-w-sm text-[13.5px] leading-relaxed" style={{ color: MUTED }}>
              India's trusted destination to research, compare and buy your next car — verified
              listings, real owner reviews and unbiased expert opinions in one place.
            </p>

            {/* Email only. The registered company name, postal address and
                both phone numbers were removed from public view — they are
                still in site settings for the admin panel's own use. */}
            <div className="mt-5 flex flex-col gap-2.5">
              {siteSettings.contactEmail && (
                <a href={`mailto:${siteSettings.contactEmail}`} className="flex items-center gap-2 text-[13px] no-underline" style={{ color: MUTED }}>
                  <MailIcon />
                  {siteSettings.contactEmail}
                </a>
              )}
              {siteSettings.supportEmail && siteSettings.supportEmail !== siteSettings.contactEmail && (
                <a href={`mailto:${siteSettings.supportEmail}`} className="flex items-center gap-2 text-[13px] no-underline" style={{ color: MUTED }}>
                  <MailIcon />
                  Support: {siteSettings.supportEmail}
                </a>
              )}
            </div>
          </div>

          {/* Link columns */}
          {footerCols.map((col) => (
            <div key={col.title}>
              <p className="mb-4 text-[13px] font-bold uppercase tracking-wide" style={{ color: DARK }}>
                {col.title}
              </p>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-[13.5px] no-underline transition-colors"
                      style={{ color: MUTED }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = ORANGE)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: `1px solid ${BORDER}` }}>
        <div className="mx-auto flex max-w-7xl flex-col-reverse items-center justify-between gap-3 px-6 py-4 sm:flex-row sm:py-5">
          <p className="text-[12px]" style={{ color: FAINT }}>
            © {new Date().getFullYear()} TimesAuto. All rights reserved.
          </p>

          <div className="flex items-center gap-5">
            <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {LEGAL_LINKS.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  className="text-[12px] font-medium no-underline transition-colors"
                  style={{ color: MUTED }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = DARK)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}
                >
                  {l.label}
                </Link>
              ))}
            </nav>

            {socials.length > 0 && (
              <>
                <div className="hidden h-4 w-px sm:block" style={{ background: BORDER }} />

                <div className="flex items-center gap-2">
                  {socials.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.label}
                      className="flex size-8 items-center justify-center rounded-full transition-colors [&_svg]:size-3.5"
                      style={{ color: MUTED, border: `1px solid ${BORDER}` }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#fff";
                        e.currentTarget.style.background = s.brand;
                        e.currentTarget.style.borderColor = "transparent";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = MUTED;
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.borderColor = BORDER;
                      }}
                    >
                      {s.icon}
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}