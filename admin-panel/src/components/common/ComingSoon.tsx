// src/components/common/ComingSoon.tsx
//
// Placeholder for nav links that already exist in Sidebar.tsx but
// whose actual feature (Used Cars, Sell Leads) isn't built yet — shown
// instead of a silent 404 so it's clear the page is planned, not broken.
// Remove this and swap in the real page once that feature is built.

const ACCENT = "#D4300F";

export default function ComingSoon({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto mb-6 w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "#fef2f0" }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3.5 2" />
          </svg>
        </div>

        <h1 className="text-[18px] font-black text-[#1c1a17]">{title}</h1>
        <p className="mt-1.5 text-[13px] text-[#7a7670] leading-relaxed">
          {description ?? "This section isn't built yet — it's coming in a future update."}
        </p>
      </div>
    </div>
  );
}
