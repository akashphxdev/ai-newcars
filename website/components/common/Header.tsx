"use client"
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

type NavItem = {
  label: string;
  href?: string;
  dropdown?: { label: string; href: string }[];
};

const NAV_ITEMS: NavItem[] = [
  {
    label: "New Cars",
    dropdown: [
      { label: "SUV", href: "#" },
      { label: "Sedan", href: "#" },
      { label: "Hatchback", href: "#" },
      { label: "Electric", href: "#" },
    ],
  },
  {
    label: "Used Cars",
    dropdown: [
      { label: "Buy used cars", href: "#" },
      { label: "Sell your car", href: "#" },
    ],
  },
  {
    label: "Compare",
    href: "#",
  },
  {
    label: "Tools",
    dropdown: [
      { label: "EMI Calculator", href: "/emi-calculator" },
      { label: "Fuel Cost Calculator", href: "/fuel-cost-calculator" },
      { label: "Mileage Calculator", href: "/mileage-calculator" },
    ],
  },
  { label: "Reviews", href: "#" },
];

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

/* ---------------- Auth modal ---------------- */

type AuthStep = "mobile" | "otp";

const AuthModal = ({ onClose }: { onClose: () => void }) => {
  const [step, setStep] = useState<AuthStep>("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-sm rounded-xl p-6"
        style={{ background: SURFACE }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-bold" style={{ color: DARK }}>
            Log in
          </h2>
          <button onClick={onClose} aria-label="Close" style={{ color: FAINT }}>
            <svg className="size-5" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {step === "mobile" ? (
          <div className="flex flex-col gap-3">
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2.5"
              style={{ border: `1px solid ${BORDER}` }}
            >
              <span className="text-sm font-medium" style={{ color: MUTED }}>
                +91
              </span>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                placeholder="Mobile number"
                autoFocus
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: DARK }}
              />
            </div>
            <button
              onClick={() => setStep("otp")}
              disabled={mobile.length !== 10}
              className="rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
              style={{ background: ORANGE }}
            >
              Send OTP
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-xs" style={{ color: MUTED }}>
              OTP sent to +91 {mobile}{" "}
              <button onClick={() => setStep("mobile")} className="font-semibold" style={{ color: ORANGE }}>
                Change
              </button>
            </p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter OTP"
              autoFocus
              className="w-full rounded-lg px-3 py-2.5 text-center text-sm tracking-[0.3em] outline-none"
              style={{ border: `1px solid ${BORDER}`, color: DARK }}
            />
            <button
              onClick={onClose}
              disabled={otp.length !== 6}
              className="rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
              style={{ background: ORANGE }}
            >
              Verify
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ---------------- Header ---------------- */

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href?: string) => !!href && href !== "#" && pathname === href;

  useEffect(() => {
    if (!mobileOpen) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

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
                      className="invisible absolute left-0 top-full z-50 mt-1 min-w-[180px] rounded-lg py-1.5 opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100"
                      style={{ background: SURFACE, border: `1px solid ${BORDER}`, boxShadow: "0 12px 28px rgba(17,24,39,0.10)" }}
                    >
                      {item.dropdown.map((link) => (
                        <Link
                          key={link.label}
                          href={link.href}
                          className="block px-3.5 py-2 text-[13px] font-medium no-underline transition-colors"
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
          <div className="hidden items-center md:flex">
            <div
              className="flex items-center gap-2 rounded-full px-3.5 py-2 transition-all"
              style={{
                background: PAGE_BG,
                width: searchOpen ? 220 : 38,
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
                  onBlur={() => setSearchOpen(false)}
                  placeholder="Search cars..."
                  className="w-full bg-transparent text-[13px] outline-none"
                  style={{ color: DARK }}
                />
              )}
            </div>
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

          <button
            onClick={() => setAuthOpen(true)}
            className="hidden whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-semibold transition-colors hover:bg-orange-50 sm:block"
            style={{ border: `1.5px solid ${ORANGE}`, color: ORANGE, background: "transparent" }}
          >
            Login / Signup
          </button>

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
          <div
            className="mb-2 flex items-center gap-2 rounded-full px-3.5 py-2.5"
            style={{ background: PAGE_BG }}
          >
            <span style={{ color: MUTED }}>
              <SearchIcon />
            </span>
            <input
              placeholder="Search cars..."
              className="w-full bg-transparent text-[13px] outline-none"
              style={{ color: DARK }}
            />
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
                          className="block py-1.5 text-[13px] no-underline"
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

          <button
            onClick={() => setAuthOpen(true)}
            className="my-2 w-full rounded-full py-2.5 text-sm font-semibold transition-colors hover:bg-orange-50"
            style={{ border: `1.5px solid ${ORANGE}`, color: ORANGE, background: "transparent" }}
          >
            Login / Signup
          </button>
        </div>
      )}

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </header>
  );
}