"use client";
import { useState } from "react";

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
];
const BRANDS = ["All Brands", "Maruti Suzuki", "Hyundai", "Tata", "Mahindra", "Kia", "Honda", "Toyota", "Volkswagen"];

const ORANGE = "#f2650f";
const DARK = "#111827";
const MUTED = "#6b7280";
const BORDER = "#e5e7eb";
const PAGE_BG = "#f4f5f9";
const PEACH = "#fde3d3";

const ChevronIcon = ({ dir = "right" }: { dir?: "left" | "right" | "down" }) => (
  <svg
    className="size-3.5"
    viewBox="0 0 12 12"
    fill="none"
    style={{ transform: dir === "left" ? "rotate(180deg)" : dir === "down" ? "rotate(90deg)" : "none" }}
  >
    <path d="M2 6h8M8 2l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg className="size-4" viewBox="0 0 24 24" fill={filled ? ORANGE : "none"}>
    <path
      d="M12 20.5s-7.5-4.6-10-9.3C.4 7.6 2.3 4 6 4c2.1 0 3.6 1.1 4.7 2.6C11.8 5.1 13.3 4 15.4 4c3.7 0 5.6 3.6 4 7.2-2.5 4.7-10 9.3-10 9.3Z"
      stroke={filled ? ORANGE : "currentColor"}
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

const PinIcon = () => (
  <svg className="size-3.5" viewBox="0 0 24 24" fill="none">
    <path d="M12 21s7-6.3 7-11.5A7 7 0 0 0 5 9.5C5 14.7 12 21 12 21Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    <circle cx="12" cy="9.5" r="2.2" stroke="currentColor" strokeWidth="1.7" />
  </svg>
);

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

const GaugeIcon = () => (
  <svg className="size-4" viewBox="0 0 24 24" fill="none">
    <path d="M4 14.5a8 8 0 1 1 16 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M12 14.5 16.2 9.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="12" cy="14.5" r="1" fill="currentColor" />
  </svg>
);

const SeaterIcon = () => (
  <svg className="size-4" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="7" r="3" stroke="currentColor" strokeWidth="1.6" />
    <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="size-5" viewBox="0 0 24 24" fill="none">
    <path d="M12 3 4.5 6v6c0 5 3.2 8.4 7.5 9 4.3-.6 7.5-4 7.5-9V6L12 3Z" stroke={ORANGE} strokeWidth="1.6" strokeLinejoin="round" />
    <path d="m8.5 12.2 2.2 2.3 4.8-5" stroke={ORANGE} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const RupeeIcon = () => (
  <svg className="size-5" viewBox="0 0 24 24" fill="none">
    <path d="M7 5h10M7 9h10M7 5c4 0 6 1.5 6 4s-2 4-6 4h-1l7 6" stroke={ORANGE} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CompareIcon = () => (
  <svg className="size-5" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="6" width="8" height="12" rx="1.5" stroke={ORANGE} strokeWidth="1.6" />
    <rect x="13" y="6" width="8" height="12" rx="1.5" stroke={ORANGE} strokeWidth="1.6" />
    <path d="m16 20 3-3-3-3" stroke={ORANGE} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SupportIcon = () => (
  <svg className="size-5" viewBox="0 0 24 24" fill="none">
    <circle cx="9" cy="8" r="3" stroke={ORANGE} strokeWidth="1.6" />
    <path d="M3.5 19c0-3.3 2.5-6 5.5-6M15 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" stroke={ORANGE} strokeWidth="1.6" strokeLinecap="round" />
    <path d="M13.5 19c0-2.4 1.6-4.4 4-5" stroke={ORANGE} strokeWidth="1.6" strokeLinecap="round" />
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
  const [saved, setSaved] = useState(false);

  return (
    <div
      className="flex h-full w-full shrink-0 flex-col overflow-hidden rounded-2xl bg-white"
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

        <button
          type="button"
          onClick={() => setSaved((s) => !s)}
          aria-label="Save to wishlist"
          className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-white"
          style={{ color: saved ? ORANGE : "#374151" }}
        >
          <HeartIcon filled={saved} />
        </button>
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
          <Spec icon={<GaugeIcon />} value={car.mileage} label="Mileage" />
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

const FEATURES = [
  {
    icon: <ShieldIcon />,
    title: "100% Verified Cars",
    desc: "All cars listed are verified for a safe experience",
  },
  {
    icon: <RupeeIcon />,
    title: "Best Price Guarantee",
    desc: "Find the best prices across all brands",
  },
  {
    icon: <CompareIcon />,
    title: "Compare Easily",
    desc: "Compare specs, features and prices side-by-side",
  },
  {
    icon: <SupportIcon />,
    title: "Expert Assistance",
    desc: "Get help from our automotive experts anytime",
  },
];

export default function LatestCars() {
  const [activeBrand, setActiveBrand] = useState("All Brands");

  return (
    <div style={{ background: PAGE_BG }} className="min-h-screen">
      <section className="py-10">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-7 flex flex-col gap-4 border-b pb-7 sm:flex-row sm:items-start sm:justify-between" style={{ borderColor: BORDER }}>
            <div>
              <h2 className="text-[32px] font-bold tracking-tight" style={{ color: DARK }}>
                Latest Cars
              </h2>
              <span className="mt-2 mb-3 block h-[3px] w-10 rounded-full" style={{ background: ORANGE }} />
              <p className="max-w-md text-[14px] font-medium leading-relaxed" style={{ color: MUTED }}>
                Explore the newest launches in the market. Stay ahead with the latest features, designs, and innovation.
              </p>
            </div>

            <button
              type="button"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl px-5 py-3 text-[13.5px] font-bold"
              style={{ border: `1px solid ${ORANGE}`, color: ORANGE }}
            >
              View All New Cars
              <ChevronIcon />
            </button>
          </div>

          <div className="mb-7 flex flex-wrap items-center gap-2.5">
            {BRANDS.map((brand) => {
              const active = brand === activeBrand;
              return (
                <button
                  key={brand}
                  type="button"
                  onClick={() => setActiveBrand(brand)}
                  className="rounded-full px-4 py-2 text-[13px] font-semibold transition-colors"
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
            <button
              type="button"
              className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-semibold"
              style={{ border: `1px solid ${BORDER}`, color: DARK }}
            >
              <FilterIcon />
              All Filters
            </button>
          </div>

          <div className="relative">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {CARS.map((car) => (
                <Card key={car.name} car={car} />
              ))}
            </div>

            <button
              type="button"
              aria-label="See more cars"
              className="absolute right-[-18px] top-1/2 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white lg:flex"
              style={{ boxShadow: "0 4px 12px rgba(17,24,39,0.12)", color: DARK }}
            >
              <ChevronIcon />
            </button>
          </div>

          <div className="mt-9 grid grid-cols-1 gap-8 rounded-2xl bg-white p-8 sm:grid-cols-2 lg:grid-cols-4" style={{ border: `1px solid ${BORDER}` }}>
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-start gap-3.5">
                <span
                  className="flex size-11 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: PEACH }}
                >
                  {f.icon}
                </span>
                <div>
                  <p className="text-[14.5px] font-bold" style={{ color: DARK }}>
                    {f.title}
                  </p>
                  <p className="mt-0.5 text-[12.5px] font-medium leading-relaxed" style={{ color: MUTED }}>
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}