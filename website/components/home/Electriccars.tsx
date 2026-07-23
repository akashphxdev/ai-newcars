"use client";
import SectionHeader from "@/components/common/SectionHeader";
import ScrollArrows from "@/components/common/ScrollArrows";
import { useScrollRail } from "@/components/common/useScrollRail";
import { WishlistButton } from "@/components/common/CardBits";
import { BoltIcon, ClockIcon, GaugeIcon, StarIcon } from "@/components/common/icons";

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

// Distinctive lightning-bolt-cutout battery icon, unique to this section's
// spec chips — not consolidated into common/icons.tsx since it's visually
// different from the generic BatteryIcon used elsewhere.
const BatteryIcon = () => (
  <svg className="size-4" viewBox="0 0 24 24" fill="none">
    <rect x="2.5" y="7" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
    <path d="M20.5 10v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M6 10.5h4l-1.5 3H10l-2.5 3 .8-2.5H6.8L6 10.5Z" fill="currentColor" />
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
            <BoltIcon className="size-3.5" />
            Electric
          </span>

          <WishlistButton size="md" />
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
            <StarIcon filled className="size-3 text-amber-400" />
            <span className="text-[12.5px] font-bold" style={{ color: DARK }}>
              {car.rating}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <MiniSpec icon={<BatteryIcon />} value={car.battery} label="Battery" />
          <MiniSpec icon={<ClockIcon className="size-4" />} value={car.chargeTime.replace("0–80% in ", "")} label="0–80% Charge" />
          <MiniSpec icon={<GaugeIcon className="size-4" />} value={car.topSpeed} label="Top Speed" />
          <MiniSpec icon={<BoltIcon className="size-3.5" />} value={`₹${car.price}L`} label="Starting Price" />
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
        </button>
      </div>
    </div>
  );
};

export default function ElectricCars() {
  const { trackRef, canScrollLeft, canScrollRight, updateArrows, scrollBy } = useScrollRail<HTMLDivElement>();

  return (
    <section className="py-14 sm:py-16" style={{ background: "#fff" }}>
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeader
          icon={<BoltIcon className="size-3.5" />}
          tone="ev"
          divider
          eyebrow="Zero Emissions"
          title="Electric cars, ranked by range"
          subtitle="Real-world tested range, battery, and charging specs — updated today so you can compare with confidence."
          href="#"
          linkLabel="View all EVs"
          after={
            <ScrollArrows
              canScrollLeft={canScrollLeft}
              canScrollRight={canScrollRight}
              onLeft={() => scrollBy("left")}
              onRight={() => scrollBy("right")}
            />
          }
        />

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
