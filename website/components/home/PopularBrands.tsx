"use client";
import Image from "next/image";
import SectionHeader from "@/components/common/SectionHeader";
import ScrollArrows from "@/components/common/ScrollArrows";
import { useScrollRail } from "@/components/common/useScrollRail";
import type { Brand } from "@/features/brands/brand.types";

const DARK = "#111827";
const FALLBACK_LOGO =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' rx='16' fill='%23e5e7eb'/%3E%3C/svg%3E";

const BrandCard = ({ brand }: { brand: Brand }) => (
  <a
    href={`/${brand.slug}-cars`}
    className="flex cursor-pointer flex-col items-center gap-2 p-2 text-center sm:gap-3 sm:p-4"
  >
    <div className="relative flex size-14 items-center justify-center rounded-2xl p-2 sm:size-20 sm:p-3 md:size-24">
      <Image src={brand.logoUrl ?? FALLBACK_LOGO} alt={brand.name} fill sizes="96px" className="object-contain" />
    </div>
    <h3 className="text-[13px] font-bold" style={{ color: DARK }}>
      {brand.name}
    </h3>
  </a>
);

export default function PopularBrands({ brands }: { brands: Brand[] }) {
  const { trackRef, canScrollLeft, canScrollRight, updateArrows, scrollBy } = useScrollRail<HTMLDivElement>();

  if (brands.length === 0) return null;

  return (
    <section style={{ background: "#fff" }} className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeader
          eyebrow="Browse Manufacturers"
          title="Popular brands"
          subtitle={`Explore top manufacturers across ${brands.length} brands. Find your perfect car today.`}
          href="/brands"
          linkLabel="View all brands"
          after={
            <ScrollArrows
              canScrollLeft={canScrollLeft}
              canScrollRight={canScrollRight}
              onLeft={() => scrollBy("left")}
              onRight={() => scrollBy("right")}
            />
          }
        />

        {/* Fixed column width — stays this size no matter how many brands
            are added; extras slide in via scroll instead of shrinking
            everyone to re-fit the row. Smaller on mobile, unchanged from
            sm: up. */}
        <div
          ref={trackRef}
          onScroll={updateArrows}
          className="scrollbar-none grid grid-flow-col auto-cols-[110px] gap-1 overflow-x-auto pb-2 sm:auto-cols-[171px] sm:gap-2"
        >
          {brands.map((brand) => (
            <BrandCard key={brand.id} brand={brand} />
          ))}
        </div>
      </div>
    </section>
  );
}
