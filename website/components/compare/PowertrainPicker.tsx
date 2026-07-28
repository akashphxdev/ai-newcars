"use client";
import type { CompareVariantPowertrainOption } from "@/features/compare/compare.types";

export default function PowertrainPicker({
  options,
  selectedId,
  onChange,
  disabled,
}: {
  options: CompareVariantPowertrainOption[];
  selectedId: number | null;
  onChange: (powertrainId: number) => void;
  disabled?: boolean;
}) {
  if (options.length <= 1) return null;

  return (
    <select
      value={selectedId ?? ""}
      disabled={disabled}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full max-w-55 cursor-pointer rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[12.5px] font-semibold text-ink outline-none disabled:cursor-wait disabled:opacity-60"
    >
      {options.map((p) => (
        <option key={p.id} value={p.id}>
          {p.label}
        </option>
      ))}
    </select>
  );
}
