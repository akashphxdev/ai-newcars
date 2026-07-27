"use client";
import { useRouter, useSearchParams } from "next/navigation";

const SORT_OPTIONS = [
  { value: "popularity", label: "Popularity (High to Low)" },
  { value: "price-asc", label: "Price (Low to High)" },
  { value: "price-desc", label: "Price (High to Low)" },
  { value: "rating", label: "Rating (High to Low)" },
];

// basePath is the full listing URL (e.g. "/tata-motors-cars" or
// "/suv-cars") — shared by both the brand-cars and body-type-cars pages.
export default function BrandCarsSort({ basePath, sort }: { basePath: string; sort: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "popularity") params.delete("sort");
    else params.set("sort", value);
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="whitespace-nowrap text-[12.5px] font-semibold text-muted">Sort By</span>
      <select
        value={sort}
        onChange={(e) => handleChange(e.target.value)}
        className="cursor-pointer rounded-lg border border-border bg-surface px-3 py-2 text-[12.5px] font-semibold text-ink outline-none"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
