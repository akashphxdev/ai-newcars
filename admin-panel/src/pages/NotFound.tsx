// src/pages/NotFound.tsx
// Path: front/src/pages/NotFound.tsx
//
// Usage in App.tsx:
//   import NotFound from "./pages/NotFound";
//   ...
//   <Route path="*" element={<NotFound />} />   // replace the current
//   `<Navigate to="/dashboard" replace />` catch-all with this

import { Link, useNavigate } from "react-router-dom";

const ACCENT = "#D4300F";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f7f5f1] px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div
          className="mx-auto mb-6 w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{ background: "#fef2f0" }}
        >
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke={ACCENT}
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M9.5 9.5l5 5M14.5 9.5l-5 5" />
          </svg>
        </div>

        {/* 404 code */}
        <p
          className="text-[64px] font-black leading-none tracking-tight"
          style={{ color: ACCENT }}
        >
          404
        </p>

        <h1 className="mt-2 text-[18px] font-black text-[#1c1a17]">
          Page not found
        </h1>
        <p className="mt-1.5 text-[13px] text-[#7a7670] leading-relaxed">
          The page you're looking for doesn't exist, was moved, or you
          don't have access to it.
        </p>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-center gap-2.5">
          <button
            onClick={() => navigate(-1)}
            className="cursor-pointer text-[12.5px] font-semibold px-4 py-2 rounded-lg border border-[#e8e4dc] text-[#4a4640] bg-white hover:bg-[#f0ece6] transition-colors"
          >
            Go back
          </button>
          <Link
            to="/dashboard"
            className="text-[12.5px] font-semibold px-4 py-2 rounded-lg text-white transition-opacity hover:opacity-90"
            style={{ background: ACCENT }}
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}