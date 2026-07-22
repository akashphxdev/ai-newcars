"use client";
import { useRef, useState, useEffect } from "react";

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

const FuelIcon = () => (
  <svg className="size-4" viewBox="0 0 24 24" fill="none">
    <path d="M6 21V6a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v15" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M6 21H3M15 21h4M15 10h1.5a1.5 1.5 0 0 1 1.5 1.5V17a1.5 1.5 0 0 0 3 0v-5l-2.5-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 8h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const GearIcon = () => (
  <svg className="size-4" viewBox="0 0 24 24" fill="none">
    <rect x="4" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.6" />
    <path d="M7 9V6.5M4 12H2.5M10 12h1.5M7 15v2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M14 7h6.5M14 12h6.5M14 17h6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const StarIcon = () => (
  <svg className="size-3" viewBox="0 0 24 24" fill={ORANGE}>
    <path d="m12 2.5 2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.6l-5.9 3.1 1.2-6.6-4.8-4.6 6.6-.9L12 2.5Z" />
  </svg>
);

const Spec = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <div className="flex items-center gap-1.5">
    <span style={{ color: "#9aa1ad" }}>{icon}</span>
    <span className="text-[11.5px] font-semibold" style={{ color: DARK }}>
      {label}
    </span>
  </div>
);

const Card = ({ car }: { car: Car }) => {
  const [saved, setSaved] = useState(false);
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

          <button
            type="button"
            onClick={() => setSaved((s) => !s)}
            aria-label="Save to wishlist"
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/95 backdrop-blur-sm transition-transform hover:scale-105"
            style={{ color: saved ? ORANGE : "#374151" }}
          >
            <HeartIcon filled={saved} />
          </button>
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
          <StarIcon />
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
          <Spec icon={<FuelIcon />} label={car.fuel} />
          <Spec icon={<GearIcon />} label={car.transmission} />
        </div>
      </div>

      <div className="mt-auto px-4 pb-4 pt-3.5">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-[12.5px] font-bold transition-colors hover:bg-orange-50"
          style={{ border: `1.5px solid ${ORANGE}`, color: ORANGE }}
        >
          {isUpcoming ? "Notify me at launch" : "Check Offers"}
          <ChevronIcon />
        </button>
      </div>
    </div>
  );
};

export default function UpcomingLaunches() {
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
              Latest Launches
            </p>
            <h2 className="text-2xl sm:text-[28px] font-bold tracking-tight" style={{ color: DARK }}>
              Upcoming cars in India
            </h2>
            <p className="mt-1 text-[13px] font-medium" style={{ color: MUTED }}>
              Real-time countdowns for the most anticipated launches
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="#"
              className="inline-flex items-center gap-1.5 text-[12.5px] font-bold"
              style={{ color: DARK }}
            >
              View all launches
              <ChevronIcon />
            </a>
            <div className="hidden items-center gap-1.5 sm:flex">
              <button
                type="button"
                aria-label="Scroll left"
                onClick={() => scrollBy("left")}
                disabled={!canScrollLeft}
                className="flex size-8 items-center justify-center rounded-full bg-white transition-colors disabled:opacity-30"
                style={{ border: `1px solid ${BORDER}`, color: DARK }}
              >
                <ChevronIcon dir="left" />
              </button>
              <button
                type="button"
                aria-label="Scroll right"
                onClick={() => scrollBy("right")}
                disabled={!canScrollRight}
                className="flex size-8 items-center justify-center rounded-full bg-white transition-colors disabled:opacity-30"
                style={{ border: `1px solid ${BORDER}`, color: DARK }}
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