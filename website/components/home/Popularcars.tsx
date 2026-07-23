"use client";
import SectionHeader from "@/components/common/SectionHeader";
import ScrollArrows from "@/components/common/ScrollArrows";
import { useScrollRail } from "@/components/common/useScrollRail";
import { WishlistButton } from "@/components/common/CardBits";
import { PowerIcon, TorqueIcon, GaugeIcon } from "@/components/common/icons";

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

        <div className="absolute right-3 top-3">
          <WishlistButton size="md" />
        </div>

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
          <Spec icon={<PowerIcon className="size-4" />} value={car.power} label="Power" />
          <Spec icon={<TorqueIcon className="size-4" />} value={car.torque} label="Torque" />
          <Spec icon={<GaugeIcon className="size-4" />} value={car.mileage} label="Mileage" />
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
  const { trackRef, canScrollLeft, canScrollRight, updateArrows, scrollBy } = useScrollRail<HTMLDivElement>();

  return (
    <section className="py-12 sm:py-16" style={{ background: SURFACE }}>
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeader
          eyebrow="Most Searched"
          title="Popular cars"
          href="#"
          linkLabel="View all popular cars"
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
