"use client";
import Link from "next/link";

const ORANGE = "#f2650f";
const DARK = "#111827";
const MUTED = "#6b7280";
const FAINT = "#9ca3af";
const BORDER = "#e5e7eb";
const SURFACE = "#ffffff";
const PAGE_BG = "#f4f5f9";
const PEACH = "#fde3d3";

/* ---------------- Icons ---------------- */

const ShieldIcon = () => (
  <svg className="size-5" viewBox="0 0 24 24" fill="none">
    <path d="M12 3 4.5 6v6c0 5 3.2 8.4 7.5 9 4.3-.6 7.5-4 7.5-9V6L12 3Z" stroke={ORANGE} strokeWidth="1.6" strokeLinejoin="round" />
    <path d="m8.5 12.2 2.2 2.3 4.8-5" stroke={ORANGE} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SparkleIcon = () => (
  <svg className="size-5" viewBox="0 0 24 24" fill="none">
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" stroke={ORANGE} strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const CompareIcon = () => (
  <svg className="size-5" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="6" width="8" height="12" rx="1.5" stroke={ORANGE} strokeWidth="1.6" />
    <rect x="13" y="6" width="8" height="12" rx="1.5" stroke={ORANGE} strokeWidth="1.6" />
    <path d="m16 20 3-3-3-3" stroke={ORANGE} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const RupeeIcon = () => (
  <svg className="size-5" viewBox="0 0 24 24" fill="none">
    <path d="M7 5h10M7 9h10M7 5c4 0 6 1.5 6 4s-2 4-6 4h-1l7 6" stroke={ORANGE} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PinIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <path d="M12 21s7-6.3 7-11.5A7 7 0 0 0 5 9.5C5 14.7 12 21 12 21Z" stroke={MUTED} strokeWidth="1.7" strokeLinejoin="round" />
    <circle cx="12" cy="9.5" r="2.2" stroke={MUTED} strokeWidth="1.7" />
  </svg>
);

const MailIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="5" width="18" height="14" rx="2.5" stroke={MUTED} strokeWidth="1.7" />
    <path d="m4 7 8 6 8-6" stroke={MUTED} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PhoneIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <path
      d="M6.6 3.5h3.1l1.4 3.9-2 1.7a13.2 13.2 0 0 0 5.8 5.8l1.7-2 3.9 1.4v3.1c0 1-.9 1.8-1.9 1.7C10.9 18.7 5.3 13.1 4.9 5.4c-.1-1 .7-1.9 1.7-1.9Z"
      stroke={MUTED}
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
  </svg>
);

const SOCIALS = [
  {
    label: "Facebook",
    href: "#",
    brand: "#1877F2",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M13.5 21v-7.6h2.6l.4-3h-3v-1.9c0-.87.24-1.46 1.5-1.46h1.6V4.35A21.4 21.4 0 0 0 13.9 4.2c-2.24 0-3.77 1.37-3.77 3.87v2.16H7.5v3h2.63V21h3.37Z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "#",
    brand: "linear-gradient(135deg,#f9ce34,#ee2a7b,#6228d7)",
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
    href: "#",
    brand: "#000000",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.5 3h3l-7.3 8.3L21.5 21h-6.7l-5.2-6.6L3.6 21H.6l7.8-8.9L2.5 3h6.9l4.7 6.1L17.5 3Zm-1.2 16h1.6L7.9 4.9H6.2L16.3 19Z" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "#",
    brand: "#FF0000",
    icon: (
      <svg viewBox="0 0 24 24" fill="none">
        <rect x="2.5" y="5.5" width="19" height="13" rx="4" stroke="currentColor" strokeWidth="1.6" />
        <path d="M10.5 9.5v5l4.3-2.5-4.3-2.5Z" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "#",
    brand: "#0A66C2",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M6.94 8.5H3.56V20h3.38V8.5ZM5.25 3.5a1.96 1.96 0 1 0 0 3.92 1.96 1.96 0 0 0 0-3.92ZM20.5 20v-6.4c0-3.43-1.83-5.02-4.27-5.02-1.97 0-2.85 1.08-3.34 1.84V8.5H9.5c.04.96 0 11.5 0 11.5h3.39v-6.42c0-.34.02-.68.12-.93.27-.68.9-1.38 1.94-1.38 1.37 0 1.92 1.04 1.92 2.57V20h3.63Z" />
      </svg>
    ),
  },
];

/* ---------------- Data ---------------- */

const FEATURES = [
  { icon: <ShieldIcon />, title: "100% Verified", sub: "Trusted listings only" },
  { icon: <SparkleIcon />, title: "AI Assist", sub: "Find your car faster" },
  { icon: <RupeeIcon />, title: "Best Price", sub: "No hidden charges" },
  { icon: <CompareIcon />, title: "Compare Easily", sub: "Decode the right car" },
];

type FooterCol = {
  title: string;
  links: { label: string; href: string }[];
};

const FOOTER_COLS: FooterCol[] = [
  {
    title: "Explore",
    links: [
      { label: "New Cars", href: "#" },
      { label: "Used Cars", href: "#" },
      { label: "Sell Your Car", href: "#" },
      { label: "Compare Cars", href: "/compare" },
      { label: "Upcoming Cars", href: "#" },
    ],
  },
  {
    title: "Tools",
    links: [
      { label: "EMI Calculator", href: "/emi-calculator" },
      { label: "Fuel Cost Calculator", href: "/fuel-cost-calculator" },
      { label: "Mileage Calculator", href: "/mileage-calculator" },
      { label: "On-Road Price", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Advertise With Us", href: "#" },
      { label: "Contact Us", href: "#" },
    ],
  },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Use", href: "#" },
  { label: "Sitemap", href: "#" },
];

/* ---------------- Component ---------------- */

export default function Footer() {
  return (
    <footer className="font-body" style={{ background: SURFACE, borderTop: `1px solid ${BORDER}` }}>
      {/* Trust strip */}
      <div className="border-b" style={{ borderColor: BORDER, background: PAGE_BG }}>
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-6 py-6 sm:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl" style={{ background: PEACH }}>
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
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand + about */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-1.5 no-underline">
              <span className="text-xl font-black tracking-tight" style={{ color: DARK }}>
                Times<span style={{ color: ORANGE }}>Auto</span>
              </span>
            </Link>
            <p className="mt-3.5 max-w-sm text-[13.5px] leading-relaxed" style={{ color: MUTED }}>
              India's trusted destination to research, compare and buy your next car — verified
              listings, real owner reviews and unbiased expert opinions in one place.
            </p>

            <div className="mt-5 flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-[13px]" style={{ color: MUTED }}>
                <PinIcon />
                JMD Megapolis, Sector 48, Jaipur, Rajasthan
              </div>
              <a href="mailto:support@timesauto.in" className="flex items-center gap-2 text-[13px] no-underline" style={{ color: MUTED }}>
                <MailIcon />
                support@timesauto.in
              </a>
              <a href="tel:+911800123456" className="flex items-center gap-2 text-[13px] no-underline" style={{ color: MUTED }}>
                <PhoneIcon />
                1800-123-4567
              </a>
            </div>
          </div>

          {/* Link columns */}
          {FOOTER_COLS.map((col) => (
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
        <div className="mx-auto flex max-w-7xl flex-col-reverse items-center justify-between gap-4 px-6 py-6 sm:flex-row">
          <p className="text-[12px]" style={{ color: FAINT }}>
            © {new Date().getFullYear()} TimesAuto, a Girnar Software Pvt. Ltd. brand. All rights reserved.
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

            <div className="hidden h-4 w-px sm:block" style={{ background: BORDER }} />

            <div className="flex items-center gap-2">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
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
          </div>
        </div>
      </div>
    </footer>
  );
}