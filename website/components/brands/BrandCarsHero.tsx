import Image from "next/image";
import Link from "next/link";
import type { Brand, BrandCarsResult } from "@/features/brands/brand.types";
import { formatSinglePrice } from "@/lib/format";

// Deliberately shows only real data (brand name/logo, actual model
// count, actual price floor, actual body types this brand sells) — no
// invented "Trusted Brand / Advanced Safety" marketing badges, since
// none of that is backed by anything in the database. Uses the site's
// normal light theme (bg-page) — no dark hero band.
export default function BrandCarsHero({ brand, result }: { brand: Brand; result: BrandCarsResult }) {
  const bodyTypeNames = result.filters.bodyTypes.map((b) => b.name);

  return (
    <div className="border-b border-border bg-page">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
        <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-[13px] font-semibold" aria-label="Breadcrumb">
          <Link href="/" className="text-ink">
            Home
          </Link>
          <span className="text-muted">{">"}</span>
          <Link href="/brands" className="text-ink">
            Brands
          </Link>
          <span className="text-muted">{">"}</span>
          <span className="text-brand">{brand.name} Cars</span>
        </nav>

        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[28px]">{brand.name} Cars</h1>
            <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed font-normal text-muted">
              Explore the full range of {brand.name} cars in India. Browse detailed specifications, on-road
              prices, and mileage for every {brand.name} model, from hatchbacks to SUVs. Compare variants and
              features to find the {brand.name} car that fits your budget and needs.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-border bg-surface px-3 py-1.5 text-[12px] font-semibold text-ink">
                {result.pagination.total} model{result.pagination.total === 1 ? "" : "s"}
              </span>
              <span className="rounded-full border border-border bg-surface px-3 py-1.5 text-[12px] font-semibold text-ink">
                From {formatSinglePrice(result.filters.priceRange.min)}
              </span>
              {bodyTypeNames.length > 0 && (
                <span className="rounded-full border border-border bg-surface px-3 py-1.5 text-[12px] font-semibold text-ink">
                  {bodyTypeNames.join(" · ")}
                </span>
              )}
            </div>
          </div>

          {brand.logoUrl && (
            <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl border border-border bg-surface p-3 sm:size-28">
              <Image src={brand.logoUrl} alt={brand.name} fill sizes="112px" className="object-contain p-2" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
