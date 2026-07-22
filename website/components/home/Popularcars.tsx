"use client";
import { useRef, useState, useEffect } from "react";

type Car = {
  rank: number;
  name: string;
  brand: string;
  priceMin: string;
  priceMax: string;
  power: string;
  torque: string;
  mileage: string;
  img: string;
  badge?: string;
};

const CARS: Car[] = [
  {
    rank: 1,
    name: "Sierra",
    brand: "Tata",
    priceMin: "14.99",
    priceMax: "19.99",
    power: "170 PS",
    torque: "280 Nm",
    mileage: "17.0 km/l",
    img: "https://stimg.cardekho.com/images/carexteriorimages/630x420/Tata/Sierra/12271/1765181428462/front-left-side-47.jpg?tr=w-300",
    badge: "Bookings Open",
  },
  {
    rank: 2,
    name: "Brezza",
    brand: "Maruti Suzuki",
    priceMin: "8.34",
    priceMax: "14.14",
    power: "103 PS",
    torque: "137 Nm",
    mileage: "19.80 km/l",
    img: "https://stimg.cardekho.com/images/carexteriorimages/630x420/Maruti/Brezza/10400/1770885013083/front-left-side-47.jpg?tr=w-300",
  },
  {
    rank: 3,
    name: "Punch",
    brand: "Tata",
    priceMin: "6.00",
    priceMax: "10.20",
    power: "86 PS",
    torque: "115 Nm",
    mileage: "20.09 km/l",
    img: "https://stimg.cardekho.com/images/carexteriorimages/630x420/Tata/Punch/13243/1768986024623/front-left-side-47.jpg?tr=w-300",
    badge: "Top Spec: Creative+",
  },
  {
    rank: 4,
    name: "Thar Roxx",
    brand: "Mahindra",
    priceMin: "12.99",
    priceMax: "22.49",
    power: "152 PS",
    torque: "330 Nm",
    mileage: "15.2 km/l",
    img: "https://stimg.cardekho.com/images/carexteriorimages/630x420/Mahindra/Thar/12264/1776055307473/front-left-side-47.jpg?tr=w-300",
  },
  {
    rank: 5,
    name: "Fronx",
    brand: "Maruti Suzuki",
    priceMin: "7.51",
    priceMax: "13.06",
    power: "99 PS",
    torque: "148 Nm",
    mileage: "20.01 km/l",
    img: "https://stimg.cardekho.com/images/carexteriorimages/630x420/Maruti/FRONX/9916/1771931850505/front-left-side-47.jpg?tr=w-300",
  },
  {
    rank: 6,
    name: "Scorpio-N",
    brand: "Mahindra",
    priceMin: "13.65",
    priceMax: "24.60",
    power: "175 PS",
    torque: "370 Nm",
    mileage: "16.2 km/l",
    img: "https://stimg.cardekho.com/images/carexteriorimages/630x420/Mahindra/Scorpio-N/10818/1755775730308/front-left-side-47.jpg?tr=w-300",
  },
  {
    rank: 7,
    name: "Scorpio Classic",
    brand: "Mahindra",
    priceMin: "13.03",
    priceMax: "16.29",
    power: "120 PS",
    torque: "300 Nm",
    mileage: "15.4 km/l",
    img: "https://stimg.cardekho.com/images/carexteriorimages/630x420/Mahindra/Scorpio/10764/1778474504907/front-left-side-47.jpg?tr=w-300",
  },
  {
    rank: 8,
    name: "Nexon",
    brand: "Tata",
    priceMin: "8.10",
    priceMax: "15.60",
    power: "118 PS",
    torque: "260 Nm",
    mileage: "17.44 km/l",
    img: "https://stimg.cardekho.com/images/carexteriorimages/630x420/Tata/Nexon/11115/1779101151711/front-left-side-47.jpg?tr=w-300",
  },
];

const ORANGE = "#f2650f";
const DARK = "#111827";
const MUTED = "#6b7280";
const BORDER = "#e5e7eb";
const SURFACE = "#f4f5f9";

const PowerIcon = () => (
  <svg className="size-4" viewBox="0 0 24 24" fill="none">
    <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
  </svg>
);

const TorqueIcon = () => (
  <svg className="size-4" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.6" />
    <path d="M12 7.5v4.7l3.2 1.9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const GaugeIcon = () => (
  <svg className="size-4" viewBox="0 0 24 24" fill="none">
    <path d="M4 14.5a8 8 0 1 1 16 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M12 14.5 16.2 9.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="12" cy="14.5" r="1" fill="currentColor" />
  </svg>
);

const ChevronIcon = ({ dir = "right" }: { dir?: "left" | "right" }) => (
  <svg
    className="size-3.5"
    viewBox="0 0 12 12"
    fill="none"
    style={{ transform: dir === "left" ? "rotate(180deg)" : "none" }}
  >
    <path d="M2 6h8M8 2l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg className="size-4" viewBox="0 0 24 24" fill={filled ? ORANGE : "none"}>
    <path
      d="M12 20.5s-7.5-4.6-10-9.4C.5 7.6 2.4 4 6 4c2.1 0 3.7 1.2 6 3.6C14.3 5.2 15.9 4 18 4c3.6 0 5.5 3.6 4 7.1-2.5 4.8-10 9.4-10 9.4Z"
      stroke={filled ? ORANGE : "currentColor"}
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

const Spec = ({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) => (
  <div className="flex items-center gap-1.5">
    <span style={{ color: "#9aa1ad" }}>{icon}</span>
    <div className="leading-tight">
      <p className="text-[12px] font-bold" style={{ color: DARK }}>
        {value}
      </p>
      <p className="text-[10px] font-medium" style={{ color: MUTED }}>
        {label}
      </p>
    </div>
  </div>
);

const Card = ({ car }: { car: Car }) => {
  const [saved, setSaved] = useState(false);

  return (
    <div
      className="flex h-full w-[248px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl bg-white"
      style={{ border: `1px solid ${BORDER}` }}
    >
      <div className="relative aspect-[4/3] overflow-hidden" style={{ background: SURFACE }}>
        <img src={car.img} alt={`${car.brand} ${car.name}`} className="size-full object-cover" />

        <span
          className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide"
          style={{ color: DARK }}
        >
          <span className="size-1.5 rounded-full" style={{ background: ORANGE }} />
          #{car.rank} Most Searched
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

        {car.badge && (
          <span
            className="absolute bottom-3 left-3 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white"
            style={{ background: ORANGE }}
          >
            {car.badge}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 px-3.5 pt-3.5">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.06em]" style={{ color: MUTED }}>
            {car.brand}
          </p>
          <h3 className="text-[15px] font-bold leading-tight" style={{ color: DARK }}>
            {car.name}
          </h3>
        </div>

        <p className="text-[16.5px] font-extrabold leading-none" style={{ color: DARK }}>
          ₹{car.priceMin} - {car.priceMax} Lakh
          <span className="block pt-1 text-[11px] font-semibold" style={{ color: MUTED }}>
            *ex-showroom
          </span>
        </p>

        <div className="flex items-center justify-between border-t pt-3" style={{ borderColor: "#f0f1f4" }}>
          <Spec icon={<PowerIcon />} value={car.power} label="Power" />
          <Spec icon={<TorqueIcon />} value={car.torque} label="Torque" />
          <Spec icon={<GaugeIcon />} value={car.mileage} label="Mileage" />
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2 px-3.5 pb-3.5 pt-3">
        <button
          type="button"
          className="flex-1 rounded-xl px-3 py-2.5 text-[12px] font-bold"
          style={{ border: `1px solid ${BORDER}`, color: DARK }}
        >
          View Details
        </button>
        <button
          type="button"
          className="flex-1 whitespace-nowrap rounded-xl px-3 py-2.5 text-[12px] font-bold transition-colors hover:bg-orange-50"
          style={{ border: `1.5px solid ${ORANGE}`, color: ORANGE }}
        >
          Check Offers
        </button>
      </div>
    </div>
  );
};

export default function PopularCars() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateArrows = () => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateArrows();
  }, []);

  const scrollBy = (dir: "left" | "right") => {
    const el = trackRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <section className="py-12 sm:py-16" style={{ background: SURFACE }}>
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: ORANGE }}>
              Most Searched
            </p>
            <h2 className="text-2xl sm:text-[28px] font-bold tracking-tight" style={{ color: DARK }}>
              Popular cars
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="#"
              className="inline-flex items-center gap-1.5 text-[12.5px] font-bold transition-colors"
              style={{ color: DARK }}
            >
              View all popular cars
              <ChevronIcon />
            </a>
            <div className="hidden items-center gap-1.5 sm:flex">
              <button
                type="button"
                aria-label="Scroll left"
                onClick={() => scrollBy("left")}
                disabled={!canScrollLeft}
                className="flex size-8 items-center justify-center rounded-full border bg-white transition-colors disabled:opacity-30"
                style={{ borderColor: BORDER, color: DARK }}
              >
                <ChevronIcon dir="left" />
              </button>
              <button
                type="button"
                aria-label="Scroll right"
                onClick={() => scrollBy("right")}
                disabled={!canScrollRight}
                className="flex size-8 items-center justify-center rounded-full border bg-white transition-colors disabled:opacity-30"
                style={{ borderColor: BORDER, color: DARK }}
              >
                <ChevronIcon />
              </button>
            </div>
          </div>
        </div>

        <div
          ref={trackRef}
          onScroll={updateArrows}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {CARS.map((car) => (
            <Card key={car.name} car={car} />
          ))}
        </div>
      </div>
    </section>
  );
}