// src/components/common/SearchFilterBar.tsx
import type { ChangeEvent, ReactNode } from "react";

export function SearchFilterBar({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-2 flex-wrap">{children}</div>
      {right && <div className="whitespace-nowrap">{right}</div>}
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  width = "220px",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  width?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ width }}
      className="text-sm font-medium text-[#1c1a17] bg-white border border-[#e2ddd5] rounded-xl px-3 py-2 outline-none transition-all focus:border-[#D4300F]"
    />
  );
}

export function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  value: string | number;
  /** Raw string from the <select> — convert to Number() yourself if the filter is numeric-id based. */
  onChange: (value: string) => void;
  options: { value: string | number; label: string }[];
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="cursor-pointer text-sm font-medium text-[#1c1a17] bg-white border border-[#e2ddd5] rounded-xl px-3 py-2 outline-none transition-all focus:border-[#D4300F] disabled:opacity-50"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}