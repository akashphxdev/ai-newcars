import Image from "next/image";
import Link from "next/link";
import type { BodyType, BodyTypeCarsResult, BodyTypeWithCount } from "@/features/bodyTypes/bodyType.types";
import { formatSinglePrice } from "@/lib/format";

// Same split layout as BrandCarsHero (text left, icon right) — plus an
// "explore other body types" nav strip underneath, which is the one
// thing genuinely specific to browsing by body type.
export default function BodyTypeCarsHero({
  bodyType,
  result,
  otherBodyTypes,
}: {
  bodyType: BodyType;
  result: BodyTypeCarsResult;
  otherBodyTypes: BodyTypeWithCount[];
}) {
  const brandNames = result.filters.brands.map((b) => b.name);
  const others = otherBodyTypes.filter((bt) => bt.slug !== bodyType.slug && bt.count > 0);

  return (
    <div className="border-b border-border bg-page">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
        <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-[13px] font-semibold" aria-label="Breadcrumb">
          <Link href="/" className="text-ink">
            Home
          </Link>
          <span className="text-muted">{">"}</span>
          <span className="text-brand">{bodyType.name} Cars</span>
        </nav>

        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[28px]">{bodyType.name} Cars</h1>
            <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed font-normal text-muted">
              {bodyType.description ??
                `Explore every ${bodyType.name} car available in India. Browse detailed specifications, on-road prices, and mileage across brands, and compare variants to find the ${bodyType.name} that fits your budget and needs.`}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-border bg-surface px-3 py-1.5 text-[12px] font-semibold text-ink">
                {result.pagination.total} model{result.pagination.total === 1 ? "" : "s"}
              </span>
              <span className="rounded-full border border-border bg-surface px-3 py-1.5 text-[12px] font-semibold text-ink">
                From {formatSinglePrice(result.filters.priceRange.min)}
              </span>
              {brandNames.length > 0 && (
                <span className="rounded-full border border-border bg-surface px-3 py-1.5 text-[12px] font-semibold text-ink">
                  {brandNames.length} brand{brandNames.length === 1 ? "" : "s"}
                </span>
              )}
            </div>
          </div>

          {bodyType.iconUrl && (
            <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl border border-border bg-surface p-3 sm:size-28">
              <Image src={bodyType.iconUrl} alt={bodyType.name} fill sizes="112px" className="object-contain p-3" />
            </div>
          )}
        </div>

        {others.length > 0 && (
          <div className="mt-6 border-t border-border pt-5">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">Explore other body types</p>
            <div className="flex flex-wrap gap-2">
              {others.map((bt) => (
                <a
                  key={bt.id}
                  href={`/${bt.slug}-cars`}
                  className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-[12px] font-semibold text-ink transition-colors hover:border-brand hover:text-brand"
                >
                  {bt.name} <span className="text-muted">({bt.count})</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
