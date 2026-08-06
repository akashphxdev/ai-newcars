// src/components/common/CommandPalette.tsx
//
// ⌘K / Ctrl+K navigation. Searches the same route list the sidebar
// renders (SEARCHABLE_ROUTES), so it can never drift out of sync with the
// menu.

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SEARCHABLE_ROUTES, type SearchableRoute } from "../layout/Sidebar";

const ACCENT = "#D4300F";
const MAX_RESULTS = 12;

// Subsequence match, so "brnd" finds "Brands" and "nclead" finds "New Car
// Leads". Returns a score where lower is better: earlier first match and
// tighter grouping rank higher, which keeps exact prefixes at the top.
function fuzzyScore(text: string, query: string): number | null {
  const t = text.toLowerCase();
  const q = query.toLowerCase();
  if (!q) return 0;

  let ti = 0;
  let score = 0;
  let lastHit = -1;

  for (const ch of q) {
    const found = t.indexOf(ch, ti);
    if (found === -1) return null;
    // Gaps between matched characters cost more than consecutive ones.
    score += found - (lastHit + 1);
    lastHit = found;
    ti = found + 1;
  }
  // Prefer shorter labels when scores tie, so "Brands" beats
  // "Brand Articles" for the query "brand".
  return score * 10 + t.length;
}

interface Ranked extends SearchableRoute {
  score: number;
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (e.key === "Escape") setOpen(false);
    };
    // Capture phase: an input inside the page would otherwise swallow the
    // shortcut before it reaches the document.
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      // Focus after the dialog paints, otherwise the element is not
      // mounted yet.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const results = useMemo<Ranked[]>(() => {
    const scored: Ranked[] = [];
    for (const route of SEARCHABLE_ROUTES) {
      // Match against the breadcrumb too, so "leads insurance" works.
      const haystack = [route.group, route.parent, route.label].filter(Boolean).join(" ");
      const direct = fuzzyScore(route.label, query);
      const broad = fuzzyScore(haystack, query);
      const score = direct ?? broad;
      if (score !== null) scored.push({ ...route, score: direct !== null ? score : score + 500 });
    }
    return scored.sort((a, b) => a.score - b.score).slice(0, MAX_RESULTS);
  }, [query]);

  useEffect(() => setActive(0), [query]);

  if (!open) return null;

  const go = (href: string) => {
    navigate(href);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % Math.max(results.length, 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + results.length) % Math.max(results.length, 1));
    }
    if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      go(results[active].href);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-[2px] flex items-start justify-center pt-[12vh] px-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search navigation"
        className="w-full max-w-[520px] bg-white border border-[#e8e4dc] rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#f0ece4]">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c0bab0" strokeWidth="1.8">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search pages..."
            className="flex-1 bg-transparent text-sm text-[#1c1a17] outline-none placeholder:text-[#c0bab0]"
          />
          <kbd className="text-[9px] font-bold text-[#c0bab0] bg-[#f7f5f1] border border-[#e8e4dc] rounded px-1.5 py-0.5">
            ESC
          </kbd>
        </div>

        <div className="max-h-[52vh] overflow-y-auto py-1.5">
          {results.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-[#a39e96]">
              No pages match “{query}”.
            </p>
          ) : (
            results.map((r, i) => (
              <button
                key={r.href}
                onClick={() => go(r.href)}
                onMouseEnter={() => setActive(i)}
                className={`w-full text-left px-4 py-2.5 flex items-center gap-2 transition-colors ${
                  i === active ? "bg-[#f7f5f1]" : "bg-transparent"
                }`}
              >
                <span
                  className="w-1 h-4 rounded-full shrink-0"
                  style={{ background: i === active ? ACCENT : "transparent" }}
                />
                <span className="text-[13px] font-semibold text-[#1c1a17]">{r.label}</span>
                <span className="text-[10.5px] text-[#a39e96] ml-auto">
                  {r.parent ? `${r.group} › ${r.parent}` : r.group}
                </span>
              </button>
            ))
          )}
        </div>

        <div className="px-4 py-2 border-t border-[#f0ece4] flex items-center gap-3 text-[10px] text-[#a39e96]">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span className="ml-auto">{results.length} result{results.length === 1 ? "" : "s"}</span>
        </div>
      </div>
    </div>
  );
}
