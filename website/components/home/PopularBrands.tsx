"use client";
import SectionHeader from "@/components/common/SectionHeader";

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

const ORANGE = "#f2650f";
const DARK = "#111827";
const BORDER = "#e5e7eb";
const PAGE_BG = "#f4f5f9";
const PEACH = "#fde3d3";

const BrandCard = ({ brand }: { brand: Brand }) => (
  <a href="#" className="flex cursor-pointer flex-col items-center gap-3 p-4 text-center">
    <div className="flex size-16 items-center justify-center rounded-2xl p-3 sm:size-20"  >
      <img src={brand.logo} alt={brand.name} className="size-full object-contain" />
    </div>
    <h3 className="text-[13px] font-bold" style={{ color: DARK }}>
      {brand.name}
    </h3>
  </a>
);

export default function PopularBrands() {
  return (
    <section style={{ background: "#fff" }} className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeader
          eyebrow="Browse Manufacturers"
          title="Popular brands"
          subtitle={`Explore top manufacturers across ${BRANDS.length} brands. Find your perfect car today.`}
          href="#"
          linkLabel="View all brands"
        />

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 md:grid-cols-7">
          {BRANDS.map((brand) => (
            <BrandCard key={brand.name} brand={brand} />
          ))}
        </div>
      </div>
    </section>
  );
}