"use client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { CompareVariantOption } from "@/features/compare/compare.types";

export default function VariantPicker({
  paramKey,
  options,
  selectedId,
}: {
  /** URL search-param key for this car's variant override, e.g. "v0".."v3". */
  paramKey: string;
  options: CompareVariantOption[];
  selectedId: number | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (options.length <= 1) return null;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(paramKey, e.target.value);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <select
      value={selectedId ?? ""}
      onChange={handleChange}
      className="w-full max-w-[220px] rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[12.5px] font-semibold text-ink outline-none"
    >
      {options.map((v) => (
        <option key={v.id} value={v.id}>
          {v.variantName}
        </option>
      ))}
    </select>
  );
}
