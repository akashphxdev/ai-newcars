// src/components/common/SearchSelect.tsx
//
// Type-to-filter dropdown for picking one item out of a long list (e.g.
// hundreds of car models) — a plain <select> gets unusable to scroll
// through at that size. Selecting an option just calls onSelect and
// clears the search box; the caller decides what "selecting" means
// (add to a tag list, set a single value, etc.), same pattern as
// SmartLinkModal.jsx's search-and-pick list but reusable as a form field.

import { useRef, useState } from "react";

export interface SearchSelectOption {
  id: number;
  label: string;
}

export default function SearchSelect({
  options,
  onSelect,
  placeholder = "Search...",
  disabled = false,
  emptyMessage = "No matches.",
}: {
  options: SearchSelectOption[];
  onSelect: (id: number) => void;
  placeholder?: string;
  disabled?: boolean;
  emptyMessage?: string;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = search.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(search.trim().toLowerCase()))
    : options;

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    // Close only when focus actually leaves the whole widget — not when
    // it moves from the input to one of the option buttons inside it.
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative" onBlur={handleBlur}>
      <input
        type="text"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        disabled={disabled}
        placeholder={placeholder}
        className="cursor-text w-full text-sm font-medium text-[#1c1a17] bg-[#f7f5f1] border border-[#e2ddd5] rounded-xl px-3 py-2.5 outline-none transition-all focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {open && !disabled && (
        <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto bg-white border border-[#e2ddd5] rounded-xl shadow-lg py-1">
          {filtered.length === 0 && <p className="text-[11px] text-[#a39e96] px-3 py-2">{emptyMessage}</p>}
          {filtered.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => {
                onSelect(o.id);
                setSearch("");
                setOpen(false);
              }}
              className="cursor-pointer w-full text-left text-[12.5px] text-[#4a4640] px-3 py-2 hover:bg-[#fef2f0] hover:text-[#D4300F] transition-colors"
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
