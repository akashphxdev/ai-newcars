"use client";
import { useRef, useState, useEffect } from "react";

type EVCar = {
  name: string;
  brand: string;
  price: number; // in Lakh
  range: number; // km
  battery: string;
  chargeTime: string;
  chargeMinutes: number;
  topSpeed: string;
  rating: number;
  img: string;
};

const RAW_CARS: EVCar[] = [
  {
    name: "e-Vitara",
    brand: "Maruti Suzuki",
    price: 17,
    range: 500,
    battery: "61 kWh",
    chargeTime: "0–80% in 45 min",
    chargeMinutes: 45,
    topSpeed: "160 km/h",
    rating: 4.4,
    img: "https://stimg.cardekho.com/images/carexteriorimages/630x420/Maruti/e-Vitara/13326/1771560398854/front-left-side-47.jpg?tr=w-300",
  },
  {
    name: "Sierra EV",
    brand: "Tata",
    price: 19.85,
    range: 502,
    battery: "65 kWh",
    chargeTime: "0–80% in 40 min",
    chargeMinutes: 40,
    topSpeed: "170 km/h",
    rating: 4.5,
    img: "https://stimg.cardekho.com/images/carexteriorimages/630x420/Tata/Sierra-EV/7515/1782837409488/front-left-side-47.jpg?tr=w-300",
  },
  {
    name: "Punch EV",
    brand: "Tata",
    price: 10.99,
    range: 421,
    battery: "35 kWh",
    chargeTime: "0–80% in 56 min",
    chargeMinutes: 56,
    topSpeed: "150 km/h",
    rating: 4.2,
    img: "https://stimg.cardekho.com/images/carexteriorimages/630x420/Tata/Punch-EV/13330/1772693950592/front-left-side-47.jpg?tr=w-300",
  },
  {
    name: "Tiago EV",
    brand: "Tata",
    price: 7.99,
    range: 315,
    battery: "24 kWh",
    chargeTime: "0–80% in 58 min",
    chargeMinutes: 58,
    topSpeed: "120 km/h",
    rating: 4.1,
    img: "https://stimg.cardekho.com/images/carexteriorimages/630x420/Tata/Tiago-EV/13563/1779961723416/front-left-side-47.jpg?tr=w-300",
  },
  {
    name: "XEV 9e",
    brand: "Mahindra",
    price: 21.90,
    range: 542,
    battery: "79 kWh",
    chargeTime: "0–80% in 20 min",
    chargeMinutes: 20,
    topSpeed: "200 km/h",
    rating: 4.6,
    img: "https://stimg.cardekho.com/images/carexteriorimages/630x420/Mahindra/XEV-9e/9262/1755776058045/front-left-side-47.jpg?tr=w-300",
  },
  {
    name: "AMG E 53 Hybrid",
    brand: "Mercedes-Benz",
    price: 111,
    range: 33,
    battery: "17.8 kWh",
    chargeTime: "0–100% in 90 min",
    chargeMinutes: 90,
    topSpeed: "250 km/h",
    rating: 4.5,
    img: "https://stimg.cardekho.com/images/carexteriorimages/630x420/Mercedes-Benz/AMG-E-53/13668/1784012657850/front-left-side-47.jpg?tr=w-300",
  },
  {
    name: "EQE 500 4MATIC",
    brand: "Mercedes-Benz",
    price: 140,
    range: 550,
    battery: "90 kWh",
    chargeTime: "0–80% in 32 min",
    chargeMinutes: 32,
    topSpeed: "210 km/h",
    rating: 4.6,
    img: "https://stimg.cardekho.com/images/carexteriorimages/630x420/Mercedes-Benz/AMG-E-53/13668/1784012657850/front-left-side-47.jpg?tr=w-300", // ⚠️ same image reused — replace with actual EQE photo
  },
];

// Curated order: longest range first, feels like a ranked, data-driven list
const CARS = [...RAW_CARS].sort((a, b) => b.range - a.range);
const MAX_RANGE = Math.max(...CARS.map((c) => c.range));

const longestRangeCar = CARS.reduce((a, b) => (a.range > b.range ? a : b));
const fastestChargingCar = CARS.reduce((a, b) => (a.chargeMinutes < b.chargeMinutes ? a : b));
const bestValueCar = CARS.reduce((a, b) => (a.price < b.price ? a : b));

const smartBadge = (car: EVCar): string | null => {
  if (car.name === longestRangeCar.name) return "Longest Range";
  if (car.name === fastestChargingCar.name) return "Fastest Charging";
  if (car.name === bestValueCar.name) return "Best Value";
  return null;
};

const ORANGE = "#f2650f";
const DARK = "#0f172a";
const MUTED = "#64748b";
const BORDER = "#e5e7eb";
const SURFACE = "#f4f5f9";
const TEAL = "#0d9488";
const TEAL_SOFT = "#e6f6f4";
const STAR = "#f5a623";

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

const StarIcon = () => (
  <svg className="size-3" viewBox="0 0 24 24" fill={STAR}>
    <path d="m12 2 2.9 6.6 7.1.6-5.4 4.8 1.7 7-6.3-3.9L5.7 21l1.7-7-5.4-4.8 7.1-.6L12 2Z" />
  </svg>
);

const BoltIcon = () => (
  <svg className="size-3.5" viewBox="0 0 24 24" fill="none">
    <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
  </svg>
);

const BatteryIcon = () => (
  <svg className="size-4" viewBox="0 0 24 24" fill="none">
    <rect x="2.5" y="7" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
    <path d="M20.5 10v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M6 10.5h4l-1.5 3H10l-2.5 3 .8-2.5H6.8L6 10.5Z" fill="currentColor" />
  </svg>
);

const ClockIcon = () => (
  <svg className="size-4" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
    <path d="M12 7.5v4.7l3.2 1.9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SpeedIcon = () => (
  <svg className="size-4" viewBox="0 0 24 24" fill="none">
    <path d="M4 14.5a8 8 0 1 1 16 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M12 14.5 16.2 9.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="12" cy="14.5" r="1" fill="currentColor" />
  </svg>
);

const MiniSpec = ({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) => (
  <div className="flex items-center gap-2 rounded-xl px-2.5 py-2" style={{ background: SURFACE }}>
    <span
      className="flex size-7 shrink-0 items-center justify-center rounded-lg"
      style={{ background: TEAL_SOFT, color: TEAL }}
    >
      {icon}
    </span>
    <div className="leading-tight">
      <p className="text-[12px] font-bold" style={{ color: DARK }}>
        {value}
      </p>
      <p className="text-[9.5px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>
        {label}
      </p>
    </div>
  </div>
);

const Card = ({ car }: { car: EVCar }) => {
  const [saved, setSaved] = useState(false);
  const pct = Math.round((car.range / MAX_RANGE) * 100);
  const badge = smartBadge(car);

  return (
    <div
      className="flex h-full w-[320px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl bg-white transition-all duration-300 hover:-translate-y-1"
      style={{ border: `1px solid ${BORDER}`, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}
    >
      <div className="relative aspect-[16/10] overflow-hidden" style={{ background: SURFACE }}>
        <img src={car.img} alt={`${car.brand} ${car.name}`} className="size-full object-cover" />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white"
            style={{ background: TEAL }}
          >
            <BoltIcon />
            Electric
          </span>

          <button
            type="button"
            onClick={() => setSaved((s) => !s)}
            aria-label="Save to wishlist"
            className="flex size-8 items-center justify-center rounded-full bg-white"
            style={{ color: saved ? ORANGE : "#374151" }}
          >
            <HeartIcon filled={saved} />
          </button>
        </div>

        {badge && (
          <span
            className="absolute bottom-3 left-3 rounded-md bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide"
            style={{ color: DARK }}
          >
            {badge}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3.5 px-4 pt-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED }}>
              {car.brand}
            </p>
            <h3 className="text-[17px] font-bold leading-tight" style={{ color: DARK }}>
              {car.name}
            </h3>
          </div>
          <div className="flex shrink-0 items-center gap-1 pt-0.5">
            <StarIcon />
            <span className="text-[12.5px] font-bold" style={{ color: DARK }}>
              {car.rating}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <MiniSpec icon={<BatteryIcon />} value={car.battery} label="Battery" />
          <MiniSpec icon={<ClockIcon />} value={car.chargeTime.replace("0–80% in ", "")} label="0–80% Charge" />
          <MiniSpec icon={<SpeedIcon />} value={car.topSpeed} label="Top Speed" />
          <MiniSpec icon={<BoltIcon />} value={`₹${car.price}L`} label="Starting Price" />
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2 px-4 pb-4 pt-3.5">
        <button
          type="button"
          className="flex h-11 flex-1 items-center justify-center rounded-xl px-3 text-[12.5px] font-bold"
          style={{ border: `1px solid ${BORDER}`, color: DARK }}
        >
          View Details
        </button>
        <button
          type="button"
          className="flex h-11 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-[12.5px] font-bold transition-colors hover:bg-orange-50"
          style={{ border: `1.5px solid ${ORANGE}`, color: ORANGE }}
        >
          Check Offers
          <ChevronIcon />
        </button>
      </div>
    </div>
  );
};

export default function ElectricCars() {
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
    <section className="py-14 sm:py-16" style={{ background: "#fff" }}>
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-8 flex flex-col gap-4 border-b pb-8 sm:flex-row sm:items-end sm:justify-between" style={{ borderColor: BORDER }}>
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span
                className="flex size-6 items-center justify-center rounded-full"
                style={{ background: TEAL_SOFT, color: TEAL }}
              >
                <BoltIcon />
              </span>
              <span className="text-[11.5px] font-bold uppercase tracking-[0.14em]" style={{ color: TEAL }}>
                Zero Emissions
              </span>
            </div>
            <h2 className="text-2xl sm:text-[30px] font-bold tracking-tight" style={{ color: DARK }}>
              Electric cars, ranked by range
            </h2>
            <p className="mt-1.5 max-w-lg text-[13.5px] font-medium leading-relaxed" style={{ color: MUTED }}>
              Real-world tested range, battery, and charging specs — updated today so you can compare with confidence.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a href="#" className="inline-flex items-center gap-1.5 text-[12.5px] font-bold" style={{ color: DARK }}>
              View all EVs
              <ChevronIcon />
            </a>
            <div className="hidden items-center gap-1.5 sm:flex">
              <button
                type="button"
                aria-label="Scroll left"
                onClick={() => scrollBy("left")}
                disabled={!canScrollLeft}
                className="flex size-9 items-center justify-center rounded-full border bg-white transition-colors disabled:opacity-30"
                style={{ borderColor: BORDER, color: DARK }}
              >
                <ChevronIcon dir="left" />
              </button>
              <button
                type="button"
                aria-label="Scroll right"
                onClick={() => scrollBy("right")}
                disabled={!canScrollRight}
                className="flex size-9 items-center justify-center rounded-full border bg-white transition-colors disabled:opacity-30"
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
          className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {CARS.map((car) => (
            <Card key={car.name} car={car} />
          ))}
        </div>
      </div>
    </section>
  );
}