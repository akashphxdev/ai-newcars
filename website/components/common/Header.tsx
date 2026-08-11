"use client"
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import AuthModal from "./AuthModal";
import BudgetPromo from "./BudgetPromo";
import { isChromelessRoute, routes } from "@/lib/routes";
import { getCurrentUser, getUserInitials, clearCurrentUser, subscribeAuthChange } from "@/features/auth/currentUser";
import { searchCars } from "@/features/search/search.api";
import type { AuthUser } from "@/features/auth/auth.types";
import type { SearchCarResult } from "@/features/search/search.types";
import type { BodyType } from "@/features/bodyTypes/bodyType.types";
import type { ArticleCategory } from "@/features/articles/article.types";
import {
  CompareIcon, BoltIcon, ClockIcon, TagIcon, CalculatorIcon, PercentIcon,
  GaugeIcon, FuelIcon, BatteryIcon, RoadIcon, WalletIcon, ChevronDownIcon,
  PinIcon, SearchIcon,
  CarIcon,
  NewsIcon,
  ChevronIcon,
  DropletIcon,
} from "@/components/common/icons";
import CitySelector from "@/components/common/CitySelector";
import SearchResultsList from "@/components/common/SearchResultsList";


// Token references, kept as constants purely because the remaining inline
// styles in this file read them. New markup below uses the Tailwind token
// utilities (text-ink, bg-surface, ...) directly instead.
const ORANGE = "var(--color-brand)";
const ORANGE_SOFT = "rgba(242,101,15,0.08)";
const DARK = "var(--color-ink)";
const MUTED = "var(--color-muted)";
const FAINT = "var(--color-subtle)";
const BORDER = "var(--color-border)";
const SURFACE = "var(--color-surface)";
const PAGE_BG = "var(--color-page)";

/* ---------------- Search results dropdown ---------------- */

type NavLink = { label: string; href: string; desc?: string; icon?: React.ReactNode };
type NavIconName = "new-cars" | "compare" | "tools" | "news";
type NavColumn = { heading: string; links: NavLink[] };

type NavItem = {
  label: string;
  href?: string;
  // A mega panel of grouped columns. Preferred for menus with more than a
  // handful of entries: "New Cars" used to be a single scrolling column of
  // 15 body types, which buried the things people actually arrive wanting
  // (upcoming, electric, by budget) beneath a taxonomy list.
  // Drawer rows are scanned by shape before they are read.
  navIcon?: NavIconName;
  columns?: NavColumn[];
  promo?: { eyebrow: string; title: string; sub: string; cta: string; href: string; image: string };
  // A row of shortcuts along the foot of the panel, and the link out of it.
  footerLinks?: NavLink[];
  footerCta?: { label: string; href: string };
  // Flat list, still right for a short menu like news categories.
  dropdown?: NavLink[];
};

// Budget bands in rupees. These map to the /new-cars maxPrice filter, so
// they need no new route.
const BUDGET_BANDS: NavLink[] = [
  { label: "Under \u20b95 Lakh", href: "/new-cars?maxPrice=500000" },
  { label: "Under \u20b910 Lakh", href: "/new-cars?maxPrice=1000000" },
  { label: "Under \u20b915 Lakh", href: "/new-cars?maxPrice=1500000" },
  { label: "Under \u20b920 Lakh", href: "/new-cars?maxPrice=2000000" },
  { label: "Under \u20b940 Lakh", href: "/new-cars?maxPrice=4000000" },
  { label: "Above \u20b940 Lakh", href: "/new-cars?minPrice=4000000" },
];

const TOOL_LINKS: NavLink[] = [
  { label: "EMI Calculator", href: "/car-loan-emi-calculator", desc: "Monthly payment by tenure and rate", icon: <CalculatorIcon className="size-4" /> },
  { label: "Down Payment", href: "/down-payment-calculator", desc: "How much to put down upfront", icon: <PercentIcon className="size-4" /> },
  { label: "Affordability", href: "/car-affordability-calculator", desc: "What your budget really buys", icon: <WalletIcon className="size-4" /> },
  { label: "Mileage", href: "/mileage-calculator", desc: "Running cost per kilometre", icon: <GaugeIcon className="size-4" /> },
  { label: "EV Charging Time", href: "/ev-charging-time-calculator", desc: "Charge duration by charger type", icon: <BatteryIcon className="size-4" /> },
];

// Not a calculator — a daily data page, so it gets its own group rather
// than sitting under "Calculators" where it would misdescribe itself.
const PRICE_LINKS: NavLink[] = [
  { label: "Fuel Price in India", href: routes.fuelPrice(), desc: "Petrol, diesel and CNG, updated daily", icon: <FuelIcon className="size-4" /> },
  { label: "Fuel Comparison", href: "/fuel-comparison-calculator", desc: "Compare petrol, diesel, CNG and EV", icon: <DropletIcon className="size-4" /> },
]

const NAV_ICONS: Record<NavIconName, React.ReactNode> = {
  "new-cars": <CarIcon className="size-[18px]" />,
  compare: <CompareIcon className="size-[18px]" />,
  tools: <CalculatorIcon className="size-[18px]" />,
  news: <NewsIcon className="size-[18px]" />,
};

// Some article categories were saved with the slug in the name column
// ("used-cars"), which reads as "Used-Cars" once capitalised. Presented
// properly here so the menu is legible; the real fix is renaming those
// rows in the admin panel.
function categoryLabel(name: string): string {
  if (!/^[a-z0-9-]+$/.test(name)) return name;
  return name.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function buildNavItems(bodyTypes: BodyType[], articleCategories: ArticleCategory[]): NavItem[] {
  return [
    {
      label: "New Cars",
      navIcon: "new-cars",
      columns: [
        {
          heading: "Browse",
          links: [
            { label: "All New Cars", href: "/new-cars", desc: "Every model on sale in India", icon: <RoadIcon className="size-4" /> },
            { label: "Upcoming Cars", href: "/upcoming-cars", desc: "Launch dates and expected prices", icon: <ClockIcon className="size-4" /> },
            { label: "Electric Cars", href: "/electric-cars", desc: "Ranked by real-world range", icon: <BoltIcon className="size-4" /> },
            { label: "Compare Cars", href: "/compare-cars", desc: "Two cars, one spec table", icon: <CompareIcon className="size-4" /> },
            { label: "All Brands", href: "/brands", desc: "Browse by manufacturer", icon: <TagIcon className="size-4" /> },
          ],
        },
        {
          heading: "By Body Type",
          links: bodyTypes.slice(0, 8).map((bt) => ({ label: bt.name, href: routes.bodyType(bt.slug) })),
        },
        { heading: "By Budget", links: BUDGET_BANDS },
      ],
      promo: {
        eyebrow: "EV guide",
        title: "Go farther on every charge",
        sub: "Compare estimated real-world range and charging time.",
        cta: "Explore electric cars",
        href: routes.electricCars(),
        image: "/design/ev-charging.png",
      },
    },
    { label: "Compare", href: "/compare-cars", navIcon: "compare" },
    {
      label: "Tools",
      navIcon: "tools",
      columns: [
        { heading: "Calculators", links: TOOL_LINKS },
        { heading: "Fuel & prices", links: PRICE_LINKS },
      ],
      footerLinks: [
        { label: "Car loan EMI", href: "/car-loan-emi-calculator" },
        { label: "Running cost", href: "/mileage-calculator" },
        { label: "Fuel prices", href: "/fuel-price" },
      ],
      footerCta: { label: "Browse all cars", href: "/new-cars" },
    },
    {
      label: "News",
      navIcon: "news",
      dropdown: articleCategories.map((c) => ({ label: categoryLabel(c.name), href: routes.newsCategory(c.slug) })),
    },
  ];
}

/* ---------------- Search results dropdown ---------------- */


/* ---------------- Header ---------------- */

export default function Header({ bodyTypes, articleCategories }: { bodyTypes: BodyType[]; articleCategories: ArticleCategory[] }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  const NAV_ITEMS = buildNavItems(bodyTypes, articleCategories);

  // Hover intent. The panel used to be pure CSS :hover, which closed the
  // moment the cursor left the trigger — including while travelling the
  // few pixels down into the panel, or diagonally across it toward a
  // column on the far side. That made sub-items genuinely hard to click.
  // A short close delay keeps the panel open across those gaps; entering
  // the panel cancels the pending close outright.
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };
  const openNow = (label: string) => {
    cancelClose();
    setOpenMenu(label);
  };
  const closeSoon = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpenMenu(null), 220);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenu(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      cancelClose();
    };
  }, []);


  const isActive = (href?: string) => !!href && href !== "#" && pathname === href;

  // Client-only — no cookie/SSR session, so this can only resolve after
  // hydration (a one-frame "Login / Signup" flash for already-logged-in
  // users on a fresh page load is the accepted tradeoff of that). Also
  // re-syncs on "auth-change" — e.g. apiClient auto-clearing a dead
  // token — so the avatar disappears immediately instead of only on the
  // next full page load.
  useEffect(() => {
    setUser(getCurrentUser());
    return subscribeAuthChange(() => setUser(getCurrentUser()));
  }, []);

  useEffect(() => {
    if (!profileMenuOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [profileMenuOpen]);

  const handleLogout = () => {
    clearCurrentUser();
    setProfileMenuOpen(false);
    // Full reload (not router.push) — same convention as AuthModal's
    // post-login reload, so every already-rendered "logged in" bit of
    // UI on the page resets in one go instead of needing individual
    // auth-change listeners everywhere.
    window.location.href = "/";
  };

  useEffect(() => {
    if (!mobileOpen) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  /* ---- search ---- */
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchCarResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const handle = setTimeout(async () => {
      try {
        const deviceType = typeof window !== "undefined" && window.innerWidth < 768 ? "mobile" : "desktop";
        const res = await searchCars(q, { pageUrl: pathname, deviceType });
        setSearchResults(res.results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [searchQuery, pathname]);

  const selectSearchResult = (car: SearchCarResult) => {
    setSearchQuery("");
    setSearchResults([]);
    setSearchOpen(false);
    setMobileOpen(false);
    router.push(routes.model(car.brand.slug, car.slug));
  };

  if (isChromelessRoute(pathname)) return null;

  return (
    <header className="sticky top-0 z-50 w-full" style={{ background: SURFACE, borderBottom: `1px solid ${BORDER}` }}>
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">

        {/* Left group: logo + nav */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex shrink-0 flex-col items-start gap-0 leading-none no-underline">
            <span className="font-head text-2xl font-extrabold tracking-tight" style={{ color: DARK }}>
              Times<span style={{ color: ORANGE }}>Auto</span>
            </span>
            <span
              className="mt-0.5 text-[9.5px] font-bold uppercase tracking-[0.16em]"
              style={{ color: FAINT }}
            >
              India&apos;s Auto Guide
            </span>
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              const hasPanel = Boolean(item.columns || item.dropdown);
              const isOpen = openMenu === item.label;

              return (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => (hasPanel ? openNow(item.label) : closeSoon())}
                  onMouseLeave={closeSoon}
                >
                  {item.href && !hasPanel ? (
                    <Link
                      href={item.href}
                      className="relative flex items-center rounded-md px-3 py-2 text-[13px] font-semibold transition-colors"
                      style={{ color: active ? ORANGE : DARK }}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <button
                      className="flex cursor-pointer items-center gap-1 rounded-md border-none bg-transparent px-3 py-2 text-[13px] font-semibold transition-colors"
                      style={{ color: isOpen ? ORANGE : DARK }}
                      aria-expanded={isOpen}
                      aria-haspopup="true"
                      onFocus={() => openNow(item.label)}
                      onClick={() => (isOpen ? setOpenMenu(null) : openNow(item.label))}
                    >
                      {item.label}
                      <ChevronDownIcon className={`size-2.5 text-subtle transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Mega panel. Rendered here rather than inside each trigger so
              it can span the full header width, and so there is no gap
              between trigger and panel for the cursor to fall through. */}
          {NAV_ITEMS.filter((i) => i.columns || i.dropdown).map((item) => {
            const cols = item.columns ?? [{ heading: item.label, links: item.dropdown! }];
            return (
              <div
                key={`panel-${item.label}`}
                onMouseEnter={cancelClose}
                onMouseLeave={closeSoon}
                className={`absolute inset-x-0 top-full z-50 hidden px-4 pt-2 lg:block ${
                  openMenu === item.label ? "opacity-100" : "pointer-events-none invisible opacity-0"
                } transition-opacity duration-150`}
              >
                <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_28px_70px_-28px_rgba(15,23,42,0.4)]">
                <div className="flex items-start gap-8 p-5">
                  {cols.map((col) => (
                    <div key={col.heading || item.label} className={cols.length === 1 ? "flex-1" : col.links.length > 8 && !col.links[0]?.icon ? "min-w-96" : col.links[0]?.icon ? "min-w-[268px]" : "min-w-52"}>
                      {col.heading && (
                        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-subtle">
                          {col.heading}
                        </p>
                      )}
                      <ul
                        className={
                          cols.length === 1
                            ? "grid max-w-2xl grid-cols-2 gap-x-8 gap-y-0.5"
                            : col.links.length > 8 && !col.links[0]?.icon
                              ? "columns-2 gap-8 space-y-0.5 pr-2"
                              : col.links[0]?.icon
                                ? "space-y-2"
                                : "space-y-0.5 pr-2"
                        }
                      >
                        {col.links.map((link) => (
                          <li key={link.href}>
                            <Link
                              href={link.href}
                              onClick={() => setOpenMenu(null)}
                              className={
                                link.icon
                                  ? "flex items-center gap-3 rounded-xl border border-border px-3 py-2.5 no-underline transition-colors hover:border-brand hover:bg-brand-soft/40"
                                  : "flex items-center gap-2.5 rounded-md px-2.5 py-2 no-underline transition-colors hover:bg-page"
                              }
                            >
                              {link.icon && (
                                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                                  {link.icon}
                                </span>
                              )}
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[13px] font-semibold capitalize text-ink">
                                  {link.label}
                                </span>
                                {link.desc && (
                                  <span className="mt-0.5 block truncate text-[11px] leading-snug text-muted">
                                    {link.desc}
                                  </span>
                                )}
                              </span>
                              {link.icon && <ChevronIcon className="size-3 shrink-0 text-faint" />}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}

                  {item.promo && (
                    <Link
                      href={item.promo.href}
                      onClick={() => setOpenMenu(null)}
                      className="relative ml-auto hidden min-h-[196px] w-[300px] shrink-0 overflow-hidden rounded-xl bg-ink no-underline xl:block"
                    >
                      <Image
                        src={item.promo.image}
                        alt=""
                        fill
                        sizes="300px"
                        className="pointer-events-none object-cover object-right"
                      />
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(9,11,16,0.94)_0%,rgba(9,11,16,0.72)_52%,transparent_100%)]"
                      />
                      <span className="relative flex h-full flex-col p-5">
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-ev">
                          {item.promo.eyebrow}
                        </span>
                        <span className="mt-2 font-head text-[19px] font-extrabold leading-tight text-white">
                          {item.promo.title}
                        </span>
                        <span className="mt-2 text-[12px] leading-5 text-white/70">
                          {item.promo.sub}
                        </span>
                        <span className="mt-auto pt-4 text-[12px] font-bold text-ev">
                          {item.promo.cta} →
                        </span>
                      </span>
                    </Link>
                  )}

                  {item.navIcon === "tools" && <BudgetPromo onNavigate={() => setOpenMenu(null)} />}
                </div>

                {/* The shortcuts people came for, under everything else —
                    a reader who did not find their tool in the columns is
                    one row away from the rest. */}
                {item.footerLinks && (
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border-soft bg-page px-5 py-3">
                    <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted">
                      Popular
                    </span>
                    {item.footerLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setOpenMenu(null)}
                        className="text-[12.5px] font-semibold text-ink no-underline transition-colors hover:text-brand"
                      >
                        {link.label}
                      </Link>
                    ))}
                    {item.footerCta && (
                      <Link
                        href={item.footerCta.href}
                        onClick={() => setOpenMenu(null)}
                        className="ml-auto flex items-center gap-1.5 text-[12.5px] font-bold text-brand no-underline hover:text-brand-hover"
                      >
                        {item.footerCta.label}
                        <ChevronIcon className="size-3" />
                      </Link>
                    )}
                  </div>
                )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right group: search + location + login + hamburger */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-5">
          <div className="relative hidden items-center md:flex">
            <div
              className="flex items-center gap-2 rounded-md px-3.5 py-2 transition-all"
              style={{
                background: PAGE_BG,
                width: searchOpen ? 260 : 38,
                cursor: searchOpen ? "text" : "pointer",
              }}
              onClick={() => !searchOpen && setSearchOpen(true)}
            >
              <span style={{ color: MUTED }}>
                <SearchIcon />
              </span>
              {searchOpen && (
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onBlur={() => setSearchOpen(false)}
                  placeholder="Search cars..."
                  className="w-full bg-transparent text-[13px] outline-none"
                  style={{ color: DARK }}
                />
              )}
            </div>

            {searchOpen && (
              <SearchResultsList results={searchResults} searching={searching} onSelect={selectSearchResult} />
            )}
          </div>

          <div className="hidden sm:block">
            <CitySelector />
          </div>

          {user ? (
            <div className="relative hidden sm:block" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setProfileMenuOpen((v) => !v)}
                aria-label="Account menu"
                aria-expanded={profileMenuOpen}
                className="flex shrink-0 cursor-pointer items-center justify-center rounded-full border-none text-[13px] font-bold text-white"
                style={{ background: ORANGE, width: 36, height: 36 }}
              >
                {getUserInitials(user)}
              </button>

              {profileMenuOpen && (
                <div
                  className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-xl py-1.5"
                  style={{ background: SURFACE, border: `1px solid ${BORDER}`, boxShadow: "0 12px 28px rgba(17,24,39,0.12)" }}
                >
                  <Link
                    href="/profile"
                    onClick={() => setProfileMenuOpen(false)}
                    className="block px-3.5 py-2 text-[13px] font-medium no-underline"
                    style={{ color: DARK }}
                  >
                    My Profile
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="block w-full cursor-pointer border-none bg-transparent px-3.5 py-2 text-left text-[13px] font-medium"
                    style={{ color: DARK }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setAuthOpen(true)}
              className="hidden whitespace-nowrap rounded-md px-4 py-2 text-[13px] font-semibold transition-colors hover:bg-orange-50 sm:block"
              style={{ border: `1.5px solid ${ORANGE}`, color: ORANGE, background: "transparent" }}
            >
              Login / Signup
            </button>
          )}

          <button
            className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-page lg:hidden"
            style={{ color: MUTED }}
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              {mobileOpen ? (
                <path d="M3 3l10 10M13 3 3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              ) : (
                <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile drawer — absolutely positioned so it overlays the page
          instead of pushing content (e.g. the Hero section) down when
          it opens; header is `sticky`, which gives it a positioning
          context for this. */}
      {mobileOpen && (
        <div
          className="absolute inset-x-0 top-full z-40 max-h-[calc(100vh-4rem)] overflow-y-auto px-6 py-2 shadow-lg lg:hidden"
          style={{ borderTop: `1px solid ${BORDER}`, background: SURFACE }}
        >
          <div className="relative mb-2">
            <div
              className="flex items-center gap-2 rounded-md px-3.5 py-2.5"
              style={{ background: PAGE_BG }}
            >
              <span style={{ color: MUTED }}>
                <SearchIcon />
              </span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cars..."
                className="w-full bg-transparent text-[13px] outline-none"
                style={{ color: DARK }}
              />
            </div>
            <SearchResultsList results={searchResults} searching={searching} onSelect={selectSearchResult} />
          </div>

          {NAV_ITEMS.map((item) => (
            <div key={item.label} style={{ borderBottom: `1px solid ${BORDER}` }} className="last:border-none">
              {item.columns || item.dropdown ? (
                <>
                  <button
                    className="flex w-full cursor-pointer items-center gap-3 border-none bg-transparent py-3 text-left text-sm font-semibold"
                    style={{ color: DARK }}
                    onClick={() => setMobileExpanded((v) => (v === item.label ? null : item.label))}
                    aria-expanded={mobileExpanded === item.label}
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                      {NAV_ICONS[item.navIcon ?? "new-cars"]}
                    </span>
                    <span className="flex-1">{item.label}</span>
                    <ChevronDownIcon className={`size-3 text-subtle transition-transform ${mobileExpanded === item.label ? "rotate-180" : ""}`} />
                  </button>
                  {mobileExpanded === item.label && (
                    <div className="pb-3">
                      {/* The desktop mega panel's columns become labelled
                          groups here — stacking them unlabelled would run
                          "Browse", body types and budgets together into one
                          undifferentiated list of 25 links. */}
                      {(item.columns ?? [{ heading: "", links: item.dropdown! }]).map((col) => (
                        <div key={col.heading} className="mb-2 last:mb-0">
                          {col.heading && (
                            <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.1em] text-subtle">
                              {col.heading}
                            </p>
                          )}
                          {/* One per row with its icon: the two-column
                              grid of bare labels gave every entry the same
                              silhouette, so the list could only be read
                              word by word. */}
                          <div className="grid gap-0.5">
                            {col.links.map((link) => (
                              <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setMobileOpen(false)}
                                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 no-underline transition-colors active:bg-page"
                              >
                                {link.icon && (
                                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-page text-brand">
                                    {link.icon}
                                  </span>
                                )}
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-[13px] font-semibold capitalize text-ink">{link.label}</span>
                                  {link.desc && <span className="block truncate text-[11px] text-muted">{link.desc}</span>}
                                </span>
                                <ChevronIcon className="size-3 shrink-0 text-faint" />
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href ?? "#"}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 py-3 text-sm font-semibold no-underline"
                  style={{ color: isActive(item.href) ? ORANGE : DARK }}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                    {NAV_ICONS[item.navIcon ?? "compare"]}
                  </span>
                  <span className="flex-1">{item.label}</span>
                  <ChevronIcon className="size-3 shrink-0 text-faint" />
                </Link>
              )}
            </div>
          ))}

          <CitySelector variant="mobile" />

          {user ? (
            <div className="my-2 flex flex-col">
              <Link
                href="/profile"
                onClick={() => setMobileOpen(false)}
                className="flex w-full items-center gap-2 rounded-full py-2.5 pl-1 text-sm font-semibold no-underline"
                style={{ color: DARK }}
              >
                <span
                  className="flex shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white"
                  style={{ background: ORANGE, width: 32, height: 32 }}
                >
                  {getUserInitials(user)}
                </span>
                My Profile
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  handleLogout();
                }}
                className="w-full cursor-pointer border-none bg-transparent py-2.5 pl-11 text-left text-sm font-semibold"
                style={{ color: DARK }}
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAuthOpen(true)}
              className="my-2 w-full rounded-full py-2.5 text-sm font-semibold transition-colors hover:bg-orange-50"
              style={{ border: `1.5px solid ${ORANGE}`, color: ORANGE, background: "transparent" }}
            >
              Login / Signup
            </button>
          )}
        </div>
      )}

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </header>
  );
}
