"use client";
import { useMemo, useState } from "react";
import Image from "next/image";
import type { Brand } from "@/features/brands/brand.types";

const DARK = "#111827";
const MUTED = "#6b7280";
const BORDER = "#e5e7eb";
const FALLBACK_LOGO =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' rx='16' fill='%23e5e7eb'/%3E%3C/svg%3E";

const BrandCard = ({ brand }: { brand: Brand }) => (
  <a
    href={`/brands/${brand.slug}`}
    className="flex flex-col items-center gap-3 rounded-2xl bg-surface p-5 text-center transition-colors hover:border-brand"
    style={{ border: `1px solid ${BORDER}` }}
  >
    <div className="relative size-16">
      <Image src={brand.logoUrl ?? FALLBACK_LOGO} alt={brand.name} fill sizes="64px" className="object-contain" />
    </div>
    <span className="text-[13.5px] font-bold" style={{ color: DARK }}>
      {brand.name}
    </span>
  </a>
);

export default function BrandsGrid({ brands }: { brands: Brand[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return brands;
    return brands.filter((b) => b.name.toLowerCase().includes(q));
  }, [brands, search]);

  return (
    <div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search brands..."
        className="mb-8 w-full max-w-sm rounded-xl px-4 py-2.5 text-sm outline-none"
        style={{ border: `1px solid ${BORDER}` }}
      />

      {filtered.length > 0 ? (
        <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((brand) => (
            <BrandCard key={brand.id} brand={brand} />
          ))}
        </div>
      ) : (
        <p className="text-sm" style={{ color: MUTED }}>
          No brands match &quot;{search}&quot;.
        </p>
      )}
    </div>
  );
}
