"use client"
import { useState, useEffect } from "react";
import Link from "next/link";

type NavItem = {
  label: string;
  dropdown?: { heading: string; links: { label: string; href: string }[] }[];
};

const NAV_ITEMS: NavItem[] = [
  {
    label: "New Cars",
    dropdown: [
      {
        heading: "By budget",
        links: [
          { label: "Under ₹10 lakh", href: "#" },
          { label: "₹10–20 lakh", href: "#" },
          { label: "₹20–30 lakh", href: "#" },
          { label: "Above ₹30 lakh", href: "#" },
        ],
      },
      {
        heading: "By body type",
        links: [
          { label: "SUV", href: "#" },
          { label: "Sedan", href: "#" },
          { label: "Hatchback", href: "#" },
          { label: "MUV", href: "#" },
        ],
      },
      {
        heading: "Popular brands",
        links: [
          { label: "Maruti Suzuki", href: "#" },
          { label: "Hyundai", href: "#" },
          { label: "Tata", href: "#" },
          { label: "Mahindra", href: "#" },
        ],
      },
    ],
  },
  {
    label: "Used Cars",
    dropdown: [
      {
        heading: "Buy used",
        links: [
          { label: "Used cars in Delhi", href: "#" },
          { label: "Used cars in Mumbai", href: "#" },
          { label: "Used cars in Jaipur", href: "#" },
        ],
      },
      {
        heading: "Sell your car",
        links: [
          { label: "Get a valuation", href: "#" },
          { label: "Instant quote", href: "#" },
        ],
      },
    ],
  },
  {
    label: "Tools",
    dropdown: [
      {
        heading: "Calculators",
        links: [
          { label: "EMI Calculator", href: "/emi-calculator" },
          { label: "Fuel Cost Calculator", href: "/fuel-cost-calculator" },
          { label: "Mileage Calculator", href: "/mileage-calculator" },
        ],
      },
    ],
  },
  { label: "Reviews" },
  { label: "Videos" },
];

const ACCENT = "#D4300F";

/* ---------------- Shared OTP step ---------------- */

type AuthStep = "mobile" | "otp" | "signupForm";

const PhoneStep = ({
  mobile,
  setMobile,
  onSubmit,
}: {
  mobile: string;
  setMobile: (v: string) => void;
  onSubmit: () => void;
}) => (
  <div className="flex flex-col gap-4">
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-gray-500 dark:text-gray-400">Mobile number</label>
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800">
        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">+91</span>
        <input
          type="tel"
          inputMode="numeric"
          maxLength={10}
          value={mobile}
          onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
          placeholder="98765 43210"
          className="flex-1 bg-transparent text-sm font-medium text-gray-900 outline-none placeholder:text-gray-400 dark:text-white"
        />
      </div>
    </div>
    <button
      onClick={onSubmit}
      disabled={mobile.length !== 10}
      className="rounded-lg py-2.5 text-sm font-bold text-white transition-opacity disabled:opacity-40"
      style={{ background: ACCENT }}
    >
      Send OTP
    </button>
  </div>
);

const OtpStep = ({
  mobile,
  otp,
  setOtp,
  onSubmit,
  onBack,
}: {
  mobile: string;
  otp: string;
  setOtp: (v: string) => void;
  onSubmit: () => void;
  onBack: () => void;
}) => (
  <div className="flex flex-col gap-4">
    <p className="text-xs text-gray-500 dark:text-gray-400">
      OTP sent to <span className="font-semibold text-gray-900 dark:text-white">+91 {mobile}</span>{" "}
      <button onClick={onBack} className="font-semibold" style={{ color: ACCENT }}>
        Change
      </button>
    </p>
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-gray-500 dark:text-gray-400">Enter OTP</label>
      <input
        type="text"
        inputMode="numeric"
        maxLength={6}
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
        placeholder="• • • • • •"
        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-center text-lg font-bold tracking-[0.4em] text-gray-900 outline-none placeholder:tracking-normal placeholder:font-normal placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
      />
    </div>
    <button
      onClick={onSubmit}
      disabled={otp.length !== 6}
      className="rounded-lg py-2.5 text-sm font-bold text-white transition-opacity disabled:opacity-40"
      style={{ background: ACCENT }}
    >
      Verify & continue
    </button>
  </div>
);

/* ---------------- Login / Signup modal ---------------- */

const AuthModal = ({ onClose }: { onClose: () => void }) => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [step, setStep] = useState<AuthStep>("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const switchMode = (m: "login" | "signup") => {
    setMode(m);
    setStep("mobile");
    setOtp("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-t-2xl bg-white p-6 dark:bg-gray-900 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-black text-gray-900 dark:text-white">
            {mode === "login" ? "Log in" : "Create account"}
          </h2>
          <button onClick={onClose} className="text-gray-400 dark:text-gray-500" aria-label="Close">
            <svg className="size-5" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {mode === "login" && step === "mobile" && (
          <PhoneStep mobile={mobile} setMobile={setMobile} onSubmit={() => setStep("otp")} />
        )}

        {mode === "login" && step === "otp" && (
          <OtpStep
            mobile={mobile}
            otp={otp}
            setOtp={setOtp}
            onSubmit={onClose}
            onBack={() => setStep("mobile")}
          />
        )}

        {mode === "signup" && step === "mobile" && (
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-500 dark:text-gray-400">Full name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900 outline-none placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-500 dark:text-gray-400">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900 outline-none placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-500 dark:text-gray-400">Mobile number</label>
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800">
                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">+91</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                  placeholder="98765 43210"
                  className="flex-1 bg-transparent text-sm font-medium text-gray-900 outline-none placeholder:text-gray-400 dark:text-white"
                />
              </div>
            </div>
            <button
              onClick={() => setStep("otp")}
              disabled={!name || !email || mobile.length !== 10}
              className="rounded-lg py-2.5 text-sm font-bold text-white transition-opacity disabled:opacity-40"
              style={{ background: ACCENT }}
            >
              Send OTP
            </button>
          </div>
        )}

        {mode === "signup" && step === "otp" && (
          <OtpStep
            mobile={mobile}
            otp={otp}
            setOtp={setOtp}
            onSubmit={onClose}
            onBack={() => setStep("mobile")}
          />
        )}

        <p className="mt-5 text-center text-xs text-gray-500 dark:text-gray-400">
          {mode === "login" ? (
            <>
              New here?{" "}
              <button onClick={() => switchMode("signup")} className="font-bold" style={{ color: ACCENT }}>
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button onClick={() => switchMode("login")} className="font-bold" style={{ color: ACCENT }}>
                Log in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

/* ---------------- Sell my car modal ---------------- */

const SellModal = ({ onClose }: { onClose: () => void }) => {
  const [step, setStep] = useState<"mobile" | "otp">("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-t-2xl bg-white p-6 dark:bg-gray-900 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-black text-gray-900 dark:text-white">Sell my car</h2>
          <button onClick={onClose} className="text-gray-400 dark:text-gray-500" aria-label="Close">
            <svg className="size-5" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
          Verify your number to get an instant valuation for your car.
        </p>

        {step === "mobile" ? (
          <PhoneStep mobile={mobile} setMobile={setMobile} onSubmit={() => setStep("otp")} />
        ) : (
          <OtpStep mobile={mobile} otp={otp} setOtp={setOtp} onSubmit={onClose} onBack={() => setStep("mobile")} />
        )}
      </div>
    </div>
  );
};

/* ---------------- Header ---------------- */

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [sellOpen, setSellOpen] = useState(false);

  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return (
    <header
      className="sticky top-0 z-50 w-full bg-white dark:bg-gray-950"
      style={{ boxShadow: scrolled ? "0 4px 20px rgba(28,26,22,0.10)" : "0 1px 0 #e2ddd5" }}
    >
      {/* Ticker */}
      <div className="hidden sm:flex items-center h-[30px] bg-[#f7f5f1] border-b border-[#e8e4dc] px-7 dark:bg-gray-900 dark:border-gray-800">
        <div className="max-w-[1400px] w-full mx-auto flex items-center">
          <FuelChip label="Petrol" value="₹106.79/L" />
          <span className="w-px h-[11px] bg-[#dedad2] mx-3.5 dark:bg-gray-700" />
          <FuelChip label="Diesel" value="₹93.45/L" />
          <span className="ml-auto text-[10px] font-medium tracking-[0.05em] text-[#b0ab9f]">{today}</span>
        </div>
      </div>

      {/* Main bar */}
      <div className="border-b border-[#e8e4dc] bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="max-w-[1400px] mx-auto flex items-center h-16 px-7">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 select-none shrink-0 mr-8 no-underline">
            <img src="/weblogo.png" alt="TimesAuto" className="h-8 w-auto sm:h-14" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex h-16 items-center flex-1 gap-0.5">
            {NAV_ITEMS.map((item) => (
              <div key={item.label} className="relative h-16 flex items-center group">
                <button className="h-full px-[14px] flex items-center gap-[5px] text-[12.5px] font-semibold tracking-[0.01em] text-[#7a7670] bg-transparent border-none cursor-pointer transition-colors duration-150 group-hover:text-[#1c1a17] dark:text-gray-400 dark:group-hover:text-white whitespace-nowrap">
                  {item.label}
                  {item.dropdown && (
                    <svg className="w-[9px] h-[9px] text-[#c0bab0] transition-transform duration-[280ms] group-hover:rotate-180 group-hover:text-[#7a7670] dark:group-hover:text-gray-300" viewBox="0 0 12 8" fill="none">
                      <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>

                <span className="absolute bottom-0 left-[14px] right-[14px] h-[2px] rounded-t opacity-0 group-hover:opacity-100 transition-opacity duration-150" style={{ background: ACCENT }} />

                {item.dropdown && (
                  <div
                    className="absolute top-full left-0 mt-2 min-w-[225px] bg-white border border-[#e8e4dc] rounded-[12px] z-50 pointer-events-none opacity-0 grid grid-rows-[0fr] group-hover:grid-rows-[1fr] group-hover:opacity-100 group-hover:pointer-events-auto overflow-hidden origin-top dark:bg-gray-900 dark:border-gray-800"
                    style={{
                      borderTop: `2px solid ${ACCENT}`,
                      transition: "grid-template-rows 0.6s cubic-bezier(.25,.8,.25,1), opacity 0.45s ease",
                      boxShadow: "0 20px 48px rgba(28,26,22,0.12), 0 6px 14px rgba(28,26,22,0.06)",
                    }}
                  >
                    <div className="overflow-hidden min-h-0">
                      {item.dropdown.map((section, i) => (
                        <div key={section.heading} className={i > 0 ? "border-t border-[#f2efe8] dark:border-gray-800" : ""}>
                          <p className="px-[18px] pt-3 pb-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-[#c0bab0]">
                            {section.heading}
                          </p>
                          {section.links.map((link) => (
                            <Link
                              key={link.label}
                              href={link.href}
                              className="flex items-center justify-between mx-1.5 px-[14px] py-2 rounded-[8px] text-[12.5px] font-medium text-[#4a4844] no-underline transition-colors duration-150 hover:text-[#D4300F] hover:bg-[#fdf8f6] dark:text-gray-300 dark:hover:bg-gray-800 group/l"
                            >
                              {link.label}
                              <span className="text-[10px] opacity-0 -translate-x-1 group-hover/l:opacity-100 group-hover/l:translate-x-0 transition-all duration-200" style={{ color: ACCENT }}>→</span>
                            </Link>
                          ))}
                          <div className="pb-2" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Right actions */}
          <div className="ml-auto flex items-center gap-3">
            {/* Dark mode toggle */}
            <button
              onClick={() => setDarkMode((v) => !v)}
              aria-label="Toggle dark mode"
              className="flex items-center justify-center size-9 rounded-full border border-[#e4e0d8] bg-transparent text-[#4a4844] transition-colors hover:bg-[#faf8f4] dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {darkMode ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.1 5.1l2.1 2.1M16.8 16.8l2.1 2.1M5.1 18.9l2.1-2.1M16.8 7.2l2.1-2.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4 7 7 0 0 0 20 14.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                </svg>
              )}
            </button>

            {/* Login / Signup */}
            <button
              onClick={() => setAuthOpen(true)}
              className="hidden xl:flex items-center gap-1.5 pl-3 pr-4 py-[7px] rounded-full text-[12px] font-semibold text-white no-underline transition-all hover:shadow-md hover:-translate-y-[1px] active:translate-y-0 whitespace-nowrap"
              style={{ background: ACCENT }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="shrink-0">
                <circle cx="12" cy="8" r="3.6" stroke="currentColor" strokeWidth="1.8" />
                <path d="M4.5 19.2c1.4-3.2 4.2-5 7.5-5s6.1 1.8 7.5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              Login / Signup
            </button>

            {/* Sell */}
            <button
              onClick={() => setSellOpen(true)}
              className="hidden md:flex items-center px-4 py-[7px] rounded-full text-[12px] font-bold text-white no-underline transition-all hover:shadow-md hover:-translate-y-[1px]"
              style={{ background: ACCENT }}
            >
              Sell my car
            </button>

            {/* Hamburger */}
            <button
              className="lg:hidden flex items-center justify-center w-9 h-9 border border-[#e4e0d8] rounded-[6px] bg-transparent cursor-pointer text-[#4a4844] transition-colors hover:bg-[#faf8f4] dark:border-gray-700 dark:text-gray-300"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-b border-[#e8e4dc] dark:bg-gray-950 dark:border-gray-800">
          <div className="px-6 pb-1">
            {NAV_ITEMS.map((item) => (
              <div key={item.label} className="border-b border-[#f5f2ec] last:border-none dark:border-gray-800">
                {item.dropdown ? (
                  <>
                    <button
                      className="w-full flex items-center justify-between py-3.5 text-[13.5px] font-semibold text-[#1c1a17] bg-transparent border-none cursor-pointer dark:text-white"
                      onClick={() => setMobileExpanded((v) => (v === item.label ? null : item.label))}
                    >
                      {item.label}
                      <svg
                        className="w-[9px] h-[9px] text-[#c0bab0] transition-transform duration-[280ms]"
                        style={{ transform: mobileExpanded === item.label ? "rotate(180deg)" : "none" }}
                        viewBox="0 0 12 8" fill="none"
                      >
                        <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    {mobileExpanded === item.label && (
                      <div className="pl-3 pb-2">
                        {item.dropdown.flatMap((s) => s.links).map((link) => (
                          <Link
                            key={link.label}
                            href={link.href}
                            onClick={() => setMobileOpen(false)}
                            className="block py-2 px-2 text-[12.5px] text-[#7a7670] no-underline rounded transition-colors hover:text-[#D4300F] dark:text-gray-400"
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <a href="#" className="block py-3.5 text-[13.5px] font-semibold text-[#1c1a17] no-underline dark:text-white">
                    {item.label}
                  </a>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2 px-6 pb-4 pt-2 border-t border-[#f5f2ec] dark:border-gray-800">
            <button
              onClick={() => setAuthOpen(true)}
              className="flex-1 flex items-center justify-center gap-1.5 text-center py-2.5 rounded-full text-[12.5px] font-semibold text-white no-underline"
              style={{ background: ACCENT }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0">
                <circle cx="12" cy="8" r="3.6" stroke="currentColor" strokeWidth="1.8" />
                <path d="M4.5 19.2c1.4-3.2 4.2-5 7.5-5s6.1 1.8 7.5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              Login / Signup
            </button>
            <button
              onClick={() => setSellOpen(true)}
              className="flex-1 text-center py-2.5 rounded-full text-[12.5px] font-bold text-white no-underline border border-[#1c1a17]/10"
              style={{ background: "#1c1a17" }}
            >
              Sell my car
            </button>
          </div>
        </div>
      )}

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
      {sellOpen && <SellModal onClose={() => setSellOpen(false)} />}
    </header>
  );
}

function FuelChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-[9px] font-bold uppercase tracking-[0.06em] text-[#a39e96]">{label}</span>
      <span className="text-[11px] font-bold text-[#2c2a27] dark:text-gray-200">{value}</span>
    </span>
  );
}