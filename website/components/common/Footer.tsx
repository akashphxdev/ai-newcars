"use client"

import Link from "next/link";

const ACCENT = "#D4300F";

const footerLinks = {
  "New Cars": [
    { label: "Cars under ₹5 Lakh", href: "#" },
    { label: "Cars under ₹10 Lakh", href: "#" },
    { label: "Cars under ₹20 Lakh", href: "#" },
    { label: "Upcoming Cars 2025", href: "#" },
    { label: "Best Mileage Cars", href: "#" },
    { label: "Best Automatic Cars", href: "#" },
  ],
  "Used Cars": [
    { label: "Used Cars in Delhi", href: "#" },
    { label: "Used Cars in Mumbai", href: "#" },
    { label: "Used Cars in Jaipur", href: "#" },
    { label: "Used Cars in Bangalore", href: "#" },
    { label: "Sell My Car", href: "#" },
    { label: "Car Valuation", href: "#" },
  ],
  "Electric Cars": [
    { label: "Best EVs in India", href: "#" },
    { label: "EV under ₹20 Lakh", href: "#" },
    { label: "Charging Station Map", href: "#" },
    { label: "EV vs Petrol Compare", href: "#" },
    { label: "Upcoming EVs 2025", href: "#" },
    { label: "EV Battery Guide", href: "#" },
  ],
  "Tools & Reviews": [
    { label: "EMI Calculator", href: "/emi-calculator" },
    { label: "Fuel Cost Calculator", href: "/fuel-cost-calculator" },
    { label: "Mileage Calculator", href: "/mileage-calculator" },
    { label: "Car Reviews", href: "#" },
    { label: "Expert Videos", href: "#" },
    { label: "Compare Cars", href: "#" },
  ],
};

const popularBrands = [
  "Maruti Suzuki",
  "Hyundai",
  "Tata",
  "Mahindra",
  "Honda",
  "Toyota",
  "Kia",
  "MG",
  "Skoda",
  "Volkswagen",
];

const socialLinks = [
  {
    label: "YouTube",
    href: "#",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23 7s-.3-2-1.2-2.8c-1.1-1.2-2.4-1.2-3-1.3C16.5 2.8 12 2.8 12 2.8s-4.5 0-6.8.2c-.6.1-1.9.1-3 1.3C1.3 5 1 7 1 7S.7 9.1.7 11.3v2c0 2.1.3 4.3.3 4.3s.3 2 1.2 2.8c1.1 1.2 2.6 1.1 3.3 1.2C7.5 21.8 12 21.8 12 21.8s4.5 0 6.8-.2c.6-.1 1.9-.1 3-1.3.9-.8 1.2-2.8 1.2-2.8s.3-2.1.3-4.3v-2C23.3 9.1 23 7 23 7zm-13.4 8.6V8.4l8.2 3.6-8.2 3.6z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "#",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="4.5" />
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: "Twitter / X",
    href: "#",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.2 2h3.5L14 10.5 23 22h-6.7l-5.4-7.1L4.6 22H1.1l8.3-9-8.8-11H7.4l4.9 6.5L18.2 2zm-1.2 18h1.9L7.1 4H5.1L17 20z" />
      </svg>
    ),
  },
  {
    label: "Facebook",
    href: "#",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
];

const appLinks = [
  {
    label: "Google Play",
    href: "#",
    sub: "Get it on",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="m3 3 9.5 9L3 21V3Zm10.5 10 2.5 2.5-10 5.5 7.5-8ZM6 3l10 5.5-2.5 2.5L6 3Zm10.5 7.5 3 1.5-3 1.5v-3Z" />
      </svg>
    ),
  },
  {
    label: "App Store",
    href: "#",
    sub: "Download on the",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
      </svg>
    ),
  },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#f7f5f1] border-t border-[#e8e4dc] dark:bg-gray-950 dark:border-gray-800">

      {/* Top CTA strip */}
      <div
        className="py-8"
        style={{ background: ACCENT }}
      >
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-white/80 text-xs font-semibold uppercase tracking-widest mb-1">Sell Fast. Get Top Price.</p>
            <h3 className="text-white text-xl font-black">Sell your car in 3 easy steps</h3>
          </div>
          <button
            className="shrink-0 bg-white font-bold text-sm px-6 py-3 rounded-full flex items-center gap-2 transition-all hover:shadow-lg"
            style={{ color: ACCENT }}
          >
            Get Free Valuation
            <svg className="size-4" viewBox="0 0 12 12" fill="none">
              <path d="M2 6h8M8 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main footer grid */}
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-6">

          {/* Brand column */}
          <div className="lg:col-span-2">
            <a href="#" className="inline-block mb-4">
              <img src="/weblogo.png" alt="TimesAuto" className="h-10 w-auto" />
            </a>
            <p className="text-sm text-[#7a7670] leading-relaxed mb-5 max-w-xs dark:text-gray-400">
              India's most trusted auto portal. Find new cars, used cars, expert reviews, and tools to make your best car decision.
            </p>

            {/* Social */}
            <div className="flex items-center gap-2 mb-6">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="flex items-center justify-center size-9 rounded-full border border-[#e4e0d8] bg-white text-[#4a4844] transition-colors hover:border-[#D4300F] hover:text-[#D4300F] dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300"
                >
                  {s.icon}
                </a>
              ))}
            </div>

            {/* App download */}
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#b0ab9f] mb-3 dark:text-gray-500">Download the app</p>
            <div className="flex flex-col gap-2">
              {appLinks.map((app) => (
                <a
                  key={app.label}
                  href={app.href}
                  className="inline-flex items-center gap-3 bg-white border border-[#e4e0d8] rounded-xl px-4 py-2.5 transition-all hover:border-[#D4300F] hover:shadow-sm w-fit dark:bg-gray-900 dark:border-gray-700"
                >
                  <span className="text-[#4a4844] dark:text-gray-300">{app.icon}</span>
                  <span>
                    <p className="text-[9px] text-[#a39e96] font-medium dark:text-gray-500">{app.sub}</p>
                    <p className="text-xs font-bold text-[#1c1a17] dark:text-white">{app.label}</p>
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading} className="lg:col-span-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#b0ab9f] mb-3 dark:text-gray-500">
                {heading}
              </p>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-[#4a4844] no-underline transition-colors hover:text-[#D4300F] dark:text-gray-400 dark:hover:text-[#D4300F]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Popular Brands */}
        <div className="mt-10 pt-8 border-t border-[#e8e4dc] dark:border-gray-800">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#b0ab9f] mb-4 dark:text-gray-500">
            Popular brands
          </p>
          <div className="flex flex-wrap gap-2">
            {popularBrands.map((brand) => (
              <a
                key={brand}
                href="#"
                className="rounded-full border border-[#e4e0d8] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#4a4844] no-underline transition-all hover:border-[#D4300F] hover:text-[#D4300F] dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300"
              >
                {brand}
              </a>
            ))}
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-8 pt-8 border-t border-[#e8e4dc] dark:border-gray-800">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#b0ab9f] mb-1 dark:text-gray-500">
                Stay updated
              </p>
              <h4 className="text-sm font-bold text-[#1c1a17] dark:text-white">
                Get latest car news & offers in your inbox
              </h4>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 sm:w-64 rounded-xl border border-[#e4e0d8] bg-white px-4 py-2.5 text-sm text-[#1c1a17] outline-none placeholder:text-[#b0ab9f] transition-colors focus:border-[#D4300F] dark:bg-gray-900 dark:border-gray-700 dark:text-white dark:placeholder:text-gray-500"
              />
              <button
                className="shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:shadow-md"
                style={{ background: ACCENT }}
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[#e8e4dc] bg-white dark:bg-gray-950 dark:border-gray-800">
        <div className="mx-auto max-w-7xl px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-[#b0ab9f] dark:text-gray-500 text-center sm:text-left">
            © {currentYear} TimesAuto — A Times Internet product. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            {["About Us", "Privacy Policy", "Terms of Use", "Sitemap", "Contact Us"].map((item, i, arr) => (
              <span key={item} className="flex items-center gap-4">
                <a
                  href="#"
                  className="text-[11px] text-[#b0ab9f] no-underline hover:text-[#D4300F] dark:text-gray-500 transition-colors whitespace-nowrap"
                >
                  {item}
                </a>
                {i < arr.length - 1 && (
                  <span className="w-px h-3 bg-[#e4e0d8] dark:bg-gray-700" />
                )}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}