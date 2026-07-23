"use client";
import { useState, useEffect } from "react";
import SectionHeader from "@/components/common/SectionHeader";
import ScrollArrows from "@/components/common/ScrollArrows";
import { useScrollRail } from "@/components/common/useScrollRail";
import { WishlistButton } from "@/components/common/CardBits";
import { FuelIcon, GearIcon, StarIcon } from "@/components/common/icons";

type Car = {
  name: string;
  cat: string;
  date: string;
  price: string;
  fuel: string;
  transmission: string;
  rating: number;
  img: string;
  badge?: string;
};

const CARS: Car[] = [
  {
    name: "Tata Sierra",
    cat: "SUV",
    date: "2026-07-14",
    price: "₹14.5L",
    fuel: "Petrol",
    transmission: "Automatic",
    rating: 4.3,
    img: "https://stimg.cardekho.com/images/carexteriorimages/630x420/Maruti/Brezza-2026/12258/1784291755589/front-left-side-47.jpg?tr=w-300",
    badge: "Coming Soon",
  },
  {
    name: "Maruti e-Vitara",
    cat: "EV SUV",
    date: "2026-08-02",
    price: "₹18L",
    fuel: "Electric",
    transmission: "Automatic",
    rating: 4.4,
    img: "https://stimg.cardekho.com/images/carexteriorimages/630x420/Audi/A6-2026/12513/1770183324417/front-left-side-47.jpg?tr=w-300",
    badge: "Coming Soon",
  },
  {
    name: "Hyundai Creta EV",
    cat: "EV SUV",
    date: "2026-08-21",
    price: "₹20L",
    fuel: "Electric",
    transmission: "Automatic",
    rating: 4.5,
    img: "https://stimg.cardekho.com/images/carexteriorimages/630x420/Toyota/Hilux-2026/13623/1781861197533/front-left-side-47.jpg?tr=w-300",
    badge: "Coming Soon",
  },
  {
    name: "Mahindra XEV 9e",
    cat: "EV SUV",
    date: "2026-09-09",
    price: "₹21L",
    fuel: "Electric",
    transmission: "Automatic",
    rating: 4.6,
    img: "https://stimg.cardekho.com/images/carexteriorimages/630x420/Mercedes-Benz/AMG-E-53/13668/1784012657850/front-left-side-47.jpg?tr=w-300",
    badge: "Coming Soon",
  },
  {
    name: "Skoda Kylaq",
    cat: "SUV",
    date: "2026-08-05",
    price: "₹9.9L",
    fuel: "Petrol",
    transmission: "Manual",
    rating: 4.2,
    img: "https://stimg.cardekho.com/images/carexteriorimages/630x420/Maruti/Brezza-2026/12258/1784291755589/front-left-side-47.jpg?tr=w-300",
    badge: "Coming Soon",
  },
  {
    name: "Toyota Land Cruiser 250",
    cat: "SUV",
    date: "2026-09-25",
    price: "₹92L",
    fuel: "Diesel",
    transmission: "Automatic",
    rating: 4.7,
    img: "https://stimg.cardekho.com/images/carexteriorimages/630x420/Audi/A6-2026/12513/1770183324417/front-left-side-47.jpg?tr=w-300",
    badge: "Flagship",
  },
];

const ORANGE = "#f2650f";
const DARK = "#111827";
const MUTED = "#6b7280";
const BORDER = "#e5e7eb";
const SURFACE = "#f4f5f9";

const DATE_FMT = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const useDaysLeft = (date: string) => {
  const [days, setDays] = useState(0);
  useEffect(() => {
    const calc = () => setDays(Math.max(0, Math.ceil((new Date(date).getTime() - Date.now()) / 86400000)));
    calc();
    const interval = setInterval(calc, 3600000);
    return () => clearInterval(interval);
  }, [date]);
  return days;
};

const Spec = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <div className="flex items-center gap-1.5">
    <span style={{ color: "#9aa1ad" }}>{icon}</span>
    <span className="text-[11.5px] font-semibold" style={{ color: DARK }}>
      {label}
    </span>
  </div>
);

const Card = ({ car }: { car: Car }) => {
  const days = useDaysLeft(car.date);
  const formatted = DATE_FMT.format(new Date(car.date));
  const isUpcoming = days > 0;

  return (
    <div
      className="group flex h-full w-[260px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl bg-white transition-all duration-300 hover:-translate-y-1"
      style={{ border: `1px solid ${BORDER}`, boxShadow: "0 1px 2px rgba(17,24,39,0.04)" }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 12px 28px rgba(17,24,39,0.12)")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 1px 2px rgba(17,24,39,0.04)")}
    >
      <div className="relative aspect-[4/3] overflow-hidden" style={{ background: SURFACE }}>
        <img
          src={car.img}
          alt={car.name}
          className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
        />

        <div
          className="absolute inset-x-0 top-0 h-16"
          style={{ background: "linear-gradient(180deg, rgba(17,24,39,0.35), transparent)" }}
        />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <div className="flex items-center gap-1.5">
            <span
              className="inline-flex items-center rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide backdrop-blur-sm"
              style={{ color: DARK }}
            >
              {car.cat}
            </span>
            {car.badge && (
              <span
                className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white"
                style={{ background: ORANGE }}
              >
                {car.badge}
              </span>
            )}
          </div>

          <WishlistButton size="sm" />
        </div>

        {isUpcoming && (
          <span
            className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm"
            style={{ background: "rgba(17,24,39,0.78)" }}
          >
            <span className="tabular-nums" style={{ color: "#ff8a3d" }}>
              {days}
            </span>{" "}
            {days === 1 ? "day" : "days"} left
          </span>
        )}

        <span
          className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10.5px] font-bold backdrop-blur-sm"
          style={{ color: DARK }}
        >
          <StarIcon filled className="size-3 text-amber-400" />
          {car.rating}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-4 pt-4">
        <div>
          <h3 className="text-[15.5px] font-bold leading-tight" style={{ color: DARK }}>
            {car.name}
          </h3>
          <p className="mt-1 text-[11px] font-medium" style={{ color: MUTED }}>
            Launching on {formatted}
          </p>
        </div>

        <div>
          <p className="text-[18px] font-bold leading-none" style={{ color: DARK }}>
            {car.price}
            <span className="ml-1 align-middle text-[10.5px] font-semibold" style={{ color: MUTED }}>
              *est.
            </span>
          </p>
          <p className="mt-1 text-[10px] font-medium" style={{ color: "#9aa1ad" }}>
            Estimated price, subject to change
          </p>
        </div>

        <div className="flex items-center gap-3 border-t pt-3" style={{ borderColor: "#f0f1f4" }}>
          <Spec icon={<FuelIcon className="size-4" />} label={car.fuel} />
          <Spec icon={<GearIcon className="size-4" />} label={car.transmission} />
        </div>
      </div>

      <div className="mt-auto px-4 pb-4 pt-3.5">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-[12.5px] font-bold transition-colors hover:bg-orange-50"
          style={{ border: `1.5px solid ${ORANGE}`, color: ORANGE }}
        >
          {isUpcoming ? "Notify me at launch" : "Check Offers"}
        </button>
      </div>
    </div>
  );
};

export default function UpcomingLaunches() {
  const { trackRef, canScrollLeft, canScrollRight, updateArrows, scrollBy } = useScrollRail<HTMLDivElement>();

  return (
    <section className="py-12 sm:py-16" style={{ background: SURFACE }}>
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeader
          eyebrow="Latest Launches"
          title="Upcoming cars in India"
          subtitle="Real-time countdowns for the most anticipated launches"
          href="#"
          linkLabel="View all launches"
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
