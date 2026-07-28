"use client"
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import AuthModal from "./AuthModal";
import { isChromelessRoute } from "@/lib/routes";
import { getCurrentUser, getUserInitials } from "@/features/auth/currentUser";
import { searchCars } from "@/features/search/search.api";
import type { AuthUser } from "@/features/auth/auth.types";
import type { SearchCarResult } from "@/features/search/search.types";
import type { BodyType } from "@/features/bodyTypes/bodyType.types";
import type { ArticleCategory } from "@/features/articles/article.types";

type NavItem = {
  label: string;
  href?: string;
  dropdown?: { label: string; href: string }[];
};

// Compare/Tools never change — "New Cars" and "News" are both data-driven
// (body types / article categories come from the DB, see buildNavItems).
const STATIC_NAV_ITEMS: NavItem[] = [
  {
    label: "Compare",
    href: "/compare-cars",
  },
  {
    label: "Tools",
    dropdown: [
      { label: "EMI Calculator", href: "/emi-calculator" },
      { label: "Fuel Cost Calculator", href: "/fuel-cost-calculator" },
      { label: "Mileage Calculator", href: "/mileage-calculator" },
      { label: "On-Road Price Calculator", href: "/on-road-price-calculator" },
    ],
  },
];

// "Electric" is a fuel-type page, not a body type, but it's kept in this
// same dropdown (matches how the site already groups "browse by new car
// category") — appended after whatever body types the DB has right now.
function buildNavItems(bodyTypes: BodyType[], articleCategories: ArticleCategory[]): NavItem[] {
  return [
    {
      label: "New Cars",
      dropdown: [
        ...bodyTypes.map((bt) => ({ label: bt.name, href: `/${bt.slug}-cars` })),
        { label: "Electric", href: "/electric-cars" },
      ],
    },
    ...STATIC_NAV_ITEMS,
    {
      label: "News",
      dropdown: articleCategories.map((c) => ({ label: c.name, href: `/news/${c.slug}` })),
    },
  ];
}

const ORANGE = "#f2650f";
const ORANGE_SOFT = "rgba(242,101,15,0.08)";
const DARK = "#111827";
const MUTED = "#6b7280";
const FAINT = "#9ca3af";
const BORDER = "#e5e7eb";
const SURFACE = "#ffffff";
const PAGE_BG = "#f4f5f9";

const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
    <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const PinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M12 21s7-6.3 7-11.5A7 7 0 0 0 5 9.5C5 14.7 12 21 12 21Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <circle cx="12" cy="9.5" r="2.2" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

/* ---------------- Search results dropdown ---------------- */

function SearchResultsList({
  results,
  searching,
  onSelect,
}: {
  results: SearchCarResult[];
  searching: boolean;
  onSelect: (car: SearchCarResult) => void;
}) {
  if (!searching && results.length === 0) return null;

  return (
    <div
      // Prevents the input from blurring before a result's click fires —
      // without this, onBlur closes the dropdown first and the click
      // never lands (classic blur-vs-click race).
      onMouseDown={(e) => e.preventDefault()}
      className="absolute left-0 top-full z-50 mt-1.5 max-h-96 w-full min-w-70 overflow-y-auto rounded-xl py-1.5"
      style={{ background: SURFACE, border: `1px solid ${BORDER}`, boxShadow: "0 12px 28px rgba(17,24,39,0.12)" }}
    >
      {searching && results.length === 0 && (
        <p className="px-3.5 py-3 text-[12.5px] font-medium" style={{ color: MUTED }}>
          Searching...
        </p>
      )}
      {results.map((car) => (
        <button
          key={car.id}
          type="button"
          onClick={() => onSelect(car)}
          className="flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2 text-left transition-colors hover:bg-orange-50"
        >
          <span className="relative size-10 shrink-0 overflow-hidden rounded-lg" style={{ background: PAGE_BG }}>
            {car.coverImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- tiny result thumb, not worth next/image's overhead here
              <img src={car.coverImageUrl} alt={car.name} className="size-full object-cover" />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[10.5px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>
              {car.brand.name}
            </span>
            <span className="block truncate text-[13px] font-bold" style={{ color: DARK }}>
              {car.name}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}

/* ---------------- Header ---------------- */

export default function Header({ bodyTypes, articleCategories }: { bodyTypes: BodyType[]; articleCategories: ArticleCategory[] }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  const NAV_ITEMS = buildNavItems(bodyTypes, articleCategories);

  const isActive = (href?: string) => !!href && href !== "#" && pathname === href;

  // Client-only — no cookie/SSR session, so this can only resolve after
  // hydration (a one-frame "Login / Signup" flash for already-logged-in
  // users on a fresh page load is the accepted tradeoff of that).
  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

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
    router.push(`/${car.brand.slug}-cars/${car.slug}`);
  };

  if (isChromelessRoute(pathname)) return null;

  return (
    <header className="sticky top-0 z-50 w-full" style={{ background: SURFACE, borderBottom: `1px solid ${BORDER}` }}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

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
              return (
                <div key={item.label} className="group relative">
                  {item.href && !item.dropdown ? (
                    <Link
                      href={item.href}
                      className="relative flex items-center rounded-md px-3 py-2 text-[13px] font-semibold transition-colors"
                      style={{ color: active ? ORANGE : DARK }}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <button className="flex cursor-pointer items-center gap-1 rounded-md border-none bg-transparent px-3 py-2 text-[13px] font-semibold transition-colors" style={{ color: DARK }}>
                      {item.label}
                      <svg className="size-2.5 transition-transform group-hover:rotate-180" style={{ color: FAINT }} viewBox="0 0 12 8" fill="none">
                        <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  )}

                  {item.dropdown && (
                    <div
                      className="invisible absolute left-0 top-full z-50 mt-1 max-h-[70vh] min-w-45 overflow-y-auto rounded-lg py-1.5 opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100"
                      style={{ background: SURFACE, border: `1px solid ${BORDER}`, boxShadow: "0 12px 28px rgba(17,24,39,0.10)" }}
                    >
                      {item.dropdown.map((link) => (
                        <Link
                          key={link.label}
                          href={link.href}
                          className="block px-3.5 py-2 text-[13px] font-medium capitalize no-underline transition-colors"
                          style={{ color: MUTED }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = ORANGE_SOFT;
                            e.currentTarget.style.color = ORANGE;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.color = MUTED;
                          }}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Right group: search + location + login + hamburger */}
        <div className="flex items-center gap-5">
          <div className="relative hidden items-center md:flex">
            <div
              className="flex items-center gap-2 rounded-full px-3.5 py-2 transition-all"
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

          <button
            className="flex shrink-0 items-center gap-1 text-[13px] font-semibold"
            style={{ color: DARK }}
          >
            <span style={{ color: ORANGE }}>
              <PinIcon />
            </span>
            Jaipur
          </button>

          {user ? (
            <Link
              href="/profile"
              aria-label="View profile"
              className="hidden shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white sm:flex"
              style={{ background: ORANGE, width: 36, height: 36 }}
            >
              {getUserInitials(user)}
            </Link>
          ) : (
            <button
              onClick={() => setAuthOpen(true)}
              className="hidden whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-semibold transition-colors hover:bg-orange-50 sm:block"
              style={{ border: `1.5px solid ${ORANGE}`, color: ORANGE, background: "transparent" }}
            >
              Login / Signup
            </button>
          )}

          <button
            className="flex size-9 items-center justify-center rounded-md lg:hidden"
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
              className="flex items-center gap-2 rounded-full px-3.5 py-2.5"
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
              {item.dropdown ? (
                <>
                  <button
                    className="flex w-full items-center justify-between border-none bg-transparent py-3 text-sm font-semibold"
                    style={{ color: DARK }}
                    onClick={() => setMobileExpanded((v) => (v === item.label ? null : item.label))}
                  >
                    {item.label}
                    <svg
                      className="size-2.5 transition-transform"
                      style={{ color: FAINT, transform: mobileExpanded === item.label ? "rotate(180deg)" : "none" }}
                      viewBox="0 0 12 8" fill="none"
                    >
                      <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {mobileExpanded === item.label && (
                    <div className="pb-2 pl-3">
                      {item.dropdown.map((link) => (
                        <Link
                          key={link.label}
                          href={link.href}
                          onClick={() => setMobileOpen(false)}
                          className="block py-1.5 text-[13px] capitalize no-underline"
                          style={{ color: MUTED }}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href ?? "#"}
                  onClick={() => setMobileOpen(false)}
                  className="block py-3 text-sm font-semibold no-underline"
                  style={{ color: isActive(item.href) ? ORANGE : DARK }}
                >
                  {item.label}
                </Link>
              )}
            </div>
          ))}

          <button
            className="my-2 flex w-full items-center gap-1.5 py-2 text-[13px] font-semibold"
            style={{ color: DARK }}
          >
            <span style={{ color: ORANGE }}>
              <PinIcon />
            </span>
            Jaipur
          </button>

          {user ? (
            <Link
              href="/profile"
              onClick={() => setMobileOpen(false)}
              className="my-2 flex w-full items-center gap-2 rounded-full py-2.5 pl-1 text-sm font-semibold"
              style={{ color: DARK }}
            >
              <span
                className="flex shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white"
                style={{ background: ORANGE, width: 32, height: 32 }}
              >
                {getUserInitials(user)}
              </span>
              View profile
            </Link>
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
