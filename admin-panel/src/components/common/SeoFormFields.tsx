// src/components/common/SeoFormFields.tsx
//
// Shared form primitives for the SEO Manager's two modals — SeoMetaModal
// (static pages) and DynamicSeoMetaModal (Brand/Model/Variant/BodyType/
// News Category) had these duplicated line-for-line; pulled out per the
// project's "extract shared logic" rule now that a visual pass touches
// both anyway.
import { useState } from "react";

const ACCENT = "#D4300F";

export const inputClass =
  "w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white focus:shadow-[0_0_0_3px_rgba(212,48,15,0.08)]";
export const selectClass = "cursor-pointer " + inputClass;
export const monoClass =
  "w-full text-[12px] font-mono text-[#1c1a17] bg-[#f7f5f1] border rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white focus:shadow-[0_0_0_3px_rgba(212,48,15,0.08)] resize-y";

export function RequiredMark() {
  return <span style={{ color: ACCENT }}>*</span>;
}

// Small section-header icons — used by SectionCard in both SEO modals.
export function InfoSectionIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M9 13h6M9 17h6" />
    </svg>
  );
}

export function SearchEngineSectionIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export function SocialSectionIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

export function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[10.5px] font-bold uppercase tracking-wider text-[#8a8579] mb-1.5">
        {label} {required && <RequiredMark />}
      </label>
      {children}
      {hint && <p className="text-[10.5px] text-[#a39e96] mt-1 leading-snug">{hint}</p>}
    </div>
  );
}

// One-off copy action for the Social Preview card — OG title/description
// already fall back to meta title/description automatically when left
// blank (see website's getStaticPageMetadata/getEntityPageMetadata), but
// an admin who wants to explicitly set OG copy (then maybe tweak it)
// shouldn't have to retype the meta fields by hand.
export function CopyFromMetaButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer shrink-0 text-[10px] font-bold text-[#4a4640] px-2.5 py-1 rounded-lg border border-[#e2ddd5] bg-white hover:bg-[#f7f5f1] transition-colors"
    >
      Copy from Meta
    </button>
  );
}

// Groups related fields under a small icon + title strip — breaks a long
// flat form into scannable sections instead of one uniform wall of inputs.
export function SectionCard({
  title,
  icon,
  headerAction,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-[#ece7dd] rounded-2xl overflow-hidden bg-white">
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-[#fbf8f3] border-b border-[#ece7dd]">
        <div className="flex items-center gap-2">
          <span className="h-5 w-5 rounded-md flex items-center justify-center shrink-0" style={{ background: "#fbeae6", color: ACCENT }}>
            {icon}
          </span>
          <h3 className="text-[11.5px] font-black uppercase tracking-wide text-[#4a4640]">{title}</h3>
        </div>
        {headerAction}
      </div>
      <div className="p-4 space-y-3.5">{children}</div>
    </div>
  );
}

// Clickable pills for pages whose SEO fields support substitution tokens
// (e.g. "compare-detail"'s {{car1_name}}) — appends the token to the
// field's current value on click, so an admin never hand-types (and
// typos) a token like `{{car_1_name}}` instead of `{{car1_name}}`.
export function TokenPalette({ tokens, onInsert }: { tokens: string[]; onInsert: (token: string) => void }) {
  if (tokens.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {tokens.map((token) => (
        <button
          key={token}
          type="button"
          onClick={() => onInsert(token)}
          className="cursor-pointer text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md border border-[#e2ddd5] text-[#8a6a5c] bg-[#fbf8f3] hover:bg-white hover:border-[#d8a894] transition-colors"
        >
          + {token}
        </button>
      ))}
    </div>
  );
}

export function TextField({
  value,
  onChange,
  placeholder,
  error,
  inputRef,
  maxLength,
  tokens,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  maxLength?: number;
  tokens?: string[];
}) {
  return (
    <div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className={inputClass}
        style={{ borderColor: error ? "#f0997b" : "#e2ddd5" }}
      />
      {tokens && <TokenPalette tokens={tokens} onInsert={(t) => onChange(value ? `${value} ${t}` : t)} />}
      {error && (
        <p className="text-[11px] font-medium mt-1" style={{ color: ACCENT }}>
          {error}
        </p>
      )}
    </div>
  );
}

export function TextAreaField({
  value,
  onChange,
  placeholder,
  maxLength,
  rows = 2,
  error,
  tokens,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  error?: string;
  tokens?: string[];
}) {
  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows}
        className={inputClass + " resize-none"}
        style={{ borderColor: error ? "#f0997b" : "#e2ddd5" }}
      />
      {tokens && <TokenPalette tokens={tokens} onInsert={(t) => onChange(value ? `${value} ${t}` : t)} />}
      {error && (
        <p className="text-[11px] font-medium mt-1" style={{ color: ACCENT }}>
          {error}
        </p>
      )}
    </div>
  );
}

// One JSON-LD textarea + a "Format" button that pretty-prints valid JSON
// in place, so an admin pasting minified JSON can visually verify it
// before saving. Purely a UX aid — validation happens on submit either way.
export function SchemaJsonField({
  label,
  hint,
  value,
  onChange,
  error,
  tokens,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  tokens?: string[];
}) {
  const handleFormat = () => {
    if (!value.trim()) return;
    try {
      const parsed = JSON.parse(value);
      onChange(JSON.stringify(parsed, null, 2));
    } catch {
      // Leave as-is — the error message below already flags invalid JSON.
    }
  };

  const filled = !!value.trim();

  // Schema values are JSON, not free text — appending a token to the end
  // would usually land outside any string value and break the JSON, so
  // clicking a token here copies it instead of inserting it. The admin
  // pastes it into the right spot themselves (e.g. inside a "name" field).
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [copyFailed, setCopyFailed] = useState(false);
  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token).then(
      () => {
        setCopyFailed(false);
        setCopiedToken(token);
        setTimeout(() => setCopiedToken(null), 1500);
      },
      // Clipboard write can be denied (unfocused document, insecure
      // context, permissions) — surface that instead of leaving the
      // admin thinking nothing happened.
      () => {
        setCopyFailed(true);
        setTimeout(() => setCopyFailed(false), 2500);
      },
    );
  };

  return (
    <div
      className="border rounded-xl p-3.5 transition-colors"
      style={{ borderColor: error ? "#f0997b" : filled ? "#f0d9d2" : "#e8e4dc", background: filled ? "#fefaf9" : "#fbfaf8" }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: filled ? ACCENT : "#d8d3c8" }} />
          <label className="text-[11px] font-bold text-[#1c1a17]">{label}</label>
        </div>
        <button
          type="button"
          onClick={handleFormat}
          disabled={!filled}
          className="cursor-pointer text-[10px] font-bold text-[#4a4640] px-2 py-1 rounded-lg border border-[#e2ddd5] hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Format JSON
        </button>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder='{ "@context": "https://schema.org", "@type": "..." }'
        rows={6}
        className={monoClass}
        style={{ borderColor: error ? "#f0997b" : "#e2ddd5" }}
      />
      {tokens && tokens.length > 0 && (
        <div className="mt-1.5">
          <TokenPalette tokens={tokens} onInsert={handleCopyToken} />
          {copiedToken && <p className="text-[10px] font-semibold text-green-600 mt-1">Copied {copiedToken} — paste it into the JSON above.</p>}
          {copyFailed && <p className="text-[10px] font-semibold text-[#D4300F] mt-1">Couldn't copy — select and copy the token text manually.</p>}
        </div>
      )}
      <p className="text-[10.5px] text-[#a39e96] mt-1 leading-snug">{hint}</p>
      {error && (
        <p className="text-[11px] font-medium mt-1" style={{ color: ACCENT }}>
          {error}
        </p>
      )}
    </div>
  );
}
