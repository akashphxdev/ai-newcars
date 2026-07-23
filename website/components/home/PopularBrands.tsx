"use client";
import SectionHeader from "@/components/common/SectionHeader";
import ScrollArrows from "@/components/common/ScrollArrows";
import { useScrollRail } from "@/components/common/useScrollRail";

type Brand = {
  name: string;
  logo: string;
};

const BRANDS: Brand[] = [
  { name: "Audi", logo: "/logo/audi.jfif" },
  { name: "BMW", logo: "/logo/bmw.png" },
  { name: "Kia", logo: "/logo/kia.png" },
  { name: "Lamborghini", logo: "/logo/lamborghini.jfif" },
  { name: "Mercedes", logo: "/logo/merceds.jfif" },
  { name: "Mustang", logo: "/logo/mustang.png" },
  { name: "Toyota", logo: "/logo/toyoto.jfif" },
];

const DARK = "#111827";

const BrandCard = ({ brand }: { brand: Brand }) => (
  <a href="#" className="flex cursor-pointer flex-col items-center gap-2 p-2 text-center sm:gap-3 sm:p-4">
    <div className="flex size-14 items-center justify-center rounded-2xl p-2 sm:size-20 sm:p-3 md:size-24">
      <img src={brand.logo} alt={brand.name} className="size-full object-contain" />
    </div>
    <h3 className="text-[13px] font-bold" style={{ color: DARK }}>
      {brand.name}
    </h3>
  </a>
);

export default function PopularBrands() {
  const { trackRef, canScrollLeft, canScrollRight, updateArrows, scrollBy } = useScrollRail<HTMLDivElement>();

  return (
    <section style={{ background: "#fff" }} className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeader
          eyebrow="Browse Manufacturers"
          title="Popular brands"
          subtitle={`Explore top manufacturers across ${BRANDS.length} brands. Find your perfect car today.`}
          href="#"
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
          {BRANDS.map((brand) => (
            <BrandCard key={brand.name} brand={brand} />
          ))}
        </div>
      </div>
    </section>
  );
}