"use client";
import { useState } from "react";
import SectionHeader from "@/components/common/SectionHeader";
import ScrollArrows from "@/components/common/ScrollArrows";
import { useScrollRail } from "@/components/common/useScrollRail";
import { WishlistButton } from "@/components/common/CardBits";
import { ChevronIcon, GaugeIcon } from "@/components/common/icons";

type Car = {
  name: string;
  trim: string;
  fuel: string;
  type: string;
  img: string;
  price: string;
  engineCc: string;
  mileage: string;
  seater: string;
};

const CARS: Car[] = [
  {
    name: "Maruti Suzuki e-Vitara",
    trim: "Zeta+",
    fuel: "Electric",
    type: "SUV",
    img: "https://stimg.cardekho.com/images/carexteriorimages/630x420/Maruti/e-Vitara/13326/1771560398854/front-left-side-47.jpg?tr=w-300",
    price: "₹17.00 - 24.00 Lakh*",
    engineCc: "Electric Motor",
    mileage: "500 km range",
    seater: "5 Seater",
  },
  {
    name: "Tata Punch EV",
    trim: "Empowered+",
    fuel: "Electric",
    type: "SUV",
    img: "https://stimg.cardekho.com/images/carexteriorimages/630x420/Tata/Punch-EV/13330/1772693950592/front-left-side-47.jpg?tr=w-300",
    price: "₹10.99 - 15.49 Lakh",
    engineCc: "Electric Motor",
    mileage: "421 km range",
    seater: "5 Seater",
  },
  {
    name: "Renault Duster",
    trim: "RXZ Turbo",
    fuel: "Petrol",
    type: "SUV",
    img: "https://stimg.cardekho.com/images/carexteriorimages/630x420/Renault/Duster/9674/1774331005907/front-left-side-47.jpg?tr=w-300",
    price: "₹9.99 - 17.49 Lakh*",
    engineCc: "1498 cc",
    mileage: "17.9 kmpl",
    seater: "5 Seater",
  },
  {
    name: "Volkswagen Tayron",
    trim: "Elegance",
    fuel: "Petrol",
    type: "SUV",
    img: "https://stimg.cardekho.com/images/carexteriorimages/630x420/Volkswagen/Tayron/12605/1784192866768/front-left-side-47.jpg?tr=w-300",
    price: "₹32.00 - 38.00 Lakh*",
    engineCc: "1984 cc",
    mileage: "17.5 kmpl",
    seater: "5/7 Seater",
  },
  {
    name: "Tata Sierra",
    trim: "Adventure",
    fuel: "Petrol",
    type: "SUV",
    img: "https://stimg.cardekho.com/images/carexteriorimages/630x420/Tata/Sierra/12271/1765181428462/front-left-side-47.jpg?tr=w-300",
    price: "₹14.99 - 19.99 Lakh*",
    engineCc: "1500 cc",
    mileage: "17.0 kmpl",
    seater: "5 Seater",
  },
  {
    name: "Maruti Suzuki Brezza",
    trim: "ZXi+",
    fuel: "Petrol",
    type: "SUV",
    img: "https://stimg.cardekho.com/images/carexteriorimages/630x420/Maruti/Brezza/10400/1770885013083/front-left-side-47.jpg?tr=w-300",
    price: "₹8.34 - 14.14 Lakh*",
    engineCc: "1462 cc",
    mileage: "19.80 kmpl",
    seater: "5 Seater",
  },
  {
    name: "Mahindra Thar Roxx",
    trim: "AX7L",
    fuel: "Diesel",
    type: "SUV",
    img: "https://stimg.cardekho.com/images/carexteriorimages/630x420/Mahindra/Thar/12264/1776055307473/front-left-side-47.jpg?tr=w-300",
    price: "₹12.99 - 22.49 Lakh*",
    engineCc: "2184 cc",
    mileage: "15.2 kmpl",
    seater: "5 Seater",
  },
];
const BRANDS = ["All Brands", "Maruti Suzuki", "Hyundai", "Tata", "Mahindra", "Kia", "Honda", "Toyota", "Volkswagen"];

const ORANGE = "#f2650f";
const DARK = "#111827";
const MUTED = "#6b7280";
const BORDER = "#e5e7eb";
const PAGE_BG = "#f4f5f9";

// Distinctive icons kept local since they're visually different from the
// generic common/icons.tsx equivalents (or have no equivalent there).
const FilterIcon = () => (
  <svg className="size-3.5" viewBox="0 0 24 24" fill="none">
    <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <circle cx="8" cy="6" r="1.6" fill={DARK} />
    <circle cx="16" cy="12" r="1.6" fill={DARK} />
    <circle cx="12" cy="18" r="1.6" fill={DARK} />
  </svg>
);

const EngineIcon = () => (
  <svg className="size-4" viewBox="0 0 24 24" fill="none">
    <path d="M3 13v3a1 1 0 0 0 1 1h1M3 13V9a1 1 0 0 1 1-1h6l3 3h4a2 2 0 0 1 2 2v2a1 1 0 0 1-1 1h-1M3 13h9" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M7 17v2M11 17v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const SeaterIcon = () => (
  <svg className="size-4" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="7" r="3" stroke="currentColor" strokeWidth="1.6" />
    <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const Spec = ({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) => (
  <div className="flex items-center gap-1.5">
    <span style={{ color: "#9aa1ad" }}>{icon}</span>
    <div className="leading-tight">
      <p className="text-[12.5px] font-bold" style={{ color: DARK }}>
        {value}
      </p>
      <p className="text-[10.5px] font-medium" style={{ color: MUTED }}>
        {label}
      </p>
    </div>
  </div>
);

const Card = ({ car }: { car: Car }) => {
  return (
    <div
      className="flex h-full w-[290px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl bg-white"
      style={{ border: `1px solid ${BORDER}` }}
    >
      <div className="relative aspect-[4/3] overflow-hidden" style={{ background: PAGE_BG }}>
        <img src={car.img} alt={car.name} className="size-full object-cover" />

        <span
          className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide"
          style={{ color: DARK }}
        >
          <span className="size-1.5 rounded-full" style={{ background: "#22c55e" }} />
          New Launch
        </span>

        <div className="absolute right-3 top-3">
          <WishlistButton size="md" />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-4 pt-4">
        <div>
          <h3 className="text-[16.5px] font-bold leading-tight" style={{ color: DARK }}>
            {car.name}
          </h3>
        </div>

        <p className="text-[19px] font-extrabold" style={{ color: DARK }}>
          ₹ {car.price}
          <span className="text-[12.5px] font-semibold" style={{ color: MUTED }}>
            {" "}
          </span>
        </p>

        <div className="flex items-center justify-between border-t pt-3" style={{ borderColor: "#f0f1f4" }}>
          <Spec icon={<EngineIcon />} value={car.engineCc} label="Engine" />
          <Spec icon={<GaugeIcon className="size-4" />} value={car.mileage} label="Mileage" />
          <Spec icon={<SeaterIcon />} value={car.seater.split(" ")[0]} label="Seater" />
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2.5 px-4 pb-4 pt-3.5">
        <button
          type="button"
          className="flex-1 rounded-xl px-4 py-2.5 text-[13px] font-bold"
          style={{ border: `1px solid ${BORDER}`, color: DARK }}
        >
          View Details
        </button>
        <button
          type="button"
          className="flex-1 whitespace-nowrap rounded-xl px-4 py-2.5 text-[13px] font-bold transition-colors hover:bg-orange-50"
          style={{ border: `1.5px solid ${ORANGE}`, color: ORANGE }}
        >
          Check Price
        </button>
      </div>
    </div>
  );
};

export default function LatestCars() {
  const [activeBrand, setActiveBrand] = useState("All Brands");
  const { trackRef, canScrollLeft, canScrollRight, updateArrows, scrollBy } = useScrollRail<HTMLDivElement>();

  return (
    <div style={{ background: PAGE_BG }}>
      <section className="py-10">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeader
            title="Latest Cars"
            titleSize="lg"
            underline
            divider
            subtitle="Explore the newest launches in the market. Stay ahead with the latest features, designs, and innovation."
            after={
              <>
                <button
                  type="button"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl px-5 py-3 text-[13.5px] font-bold"
                  style={{ border: `1px solid ${ORANGE}`, color: ORANGE }}
                >
                  View All New Cars
                  <ChevronIcon />
                </button>
                <ScrollArrows
                  canScrollLeft={canScrollLeft}
                  canScrollRight={canScrollRight}
                  onLeft={() => scrollBy("left")}
                  onRight={() => scrollBy("right")}
                />
              </>
            }
          />

          {/* Brand chips scroll horizontally on mobile on their own —
              "All Filters" stays outside that scroll area so it's
              always visible without having to scroll the chips. */}
          <div className="mb-7 flex items-center gap-2.5">
            <div className="scrollbar-none flex min-w-0 flex-1 flex-nowrap items-center gap-2.5 overflow-x-auto sm:flex-wrap">
              {BRANDS.map((brand) => {
                const active = brand === activeBrand;
                return (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => setActiveBrand(brand)}
                    className="shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-semibold transition-colors"
                    style={{
                      background: "#fff",
                      color: active ? ORANGE : DARK,
                      border: `1.5px solid ${active ? ORANGE : BORDER}`,
                    }}
                  >
                    {brand}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-4 py-2 text-[13px] font-semibold"
              style={{ border: `1px solid ${BORDER}`, color: DARK }}
            >
              <FilterIcon />
              All Filters
            </button>
          </div>

          <div
            ref={trackRef}
            onScroll={updateArrows}
            className="scrollbar-none flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2"
          >
            {CARS.map((car) => (
              <Card key={car.name} car={car} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
