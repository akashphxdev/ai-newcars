"use client"
import { useState, useEffect } from "react";

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
    img: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?q=80&w=1200&auto=format&fit=crop",
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
    img: "https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=1200&auto=format&fit=crop",
    badge: "Pre-bookings Live",
  },
  {
    name: "Hyundai Creta EV",
    cat: "EV SUV",
    date: "2026-08-21",
    price: "₹20L",
    fuel: "Electric",
    transmission: "Automatic",
    rating: 4.5,
    img: "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?q=80&w=1200&auto=format&fit=crop",
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
    img: "https://images.unsplash.com/photo-1617470702761-2bb9c41523c5?q=80&w=1200&auto=format&fit=crop",
    badge: "Pre-bookings Live",
  },
];

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

const FuelIcon = () => (
  <svg className="size-3.5" viewBox="0 0 24 24" fill="none">
    <path d="M5 21V8l5-5h4v3h2a2 2 0 0 1 2 2v9.5a1.5 1.5 0 0 1-3 0V13a1 1 0 0 0-1-1h-1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 21h9M5 12h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const GearIcon = () => (
  <svg className="size-3.5" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.6" />
    <path d="M12 4v2.5M12 17.5V20M4 12h2.5M17.5 12H20M6.3 6.3l1.8 1.8M15.9 15.9l1.8 1.8M6.3 17.7l1.8-1.8M15.9 8.1l1.8-1.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="size-3.5" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.6" />
    <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg className="size-3" viewBox="0 0 20 20" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.3">
    <path d="M10 2.5 12.5 7.5 18 8.3 14 12.2 15 17.7 10 15 5 17.7 6 12.2 2 8.3 7.5 7.5 10 2.5Z" strokeLinejoin="round" />
  </svg>
);

const SpecChip = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold text-gray-700">
    {icon}
    {label}
  </span>
);

const Card = ({ car }: { car: Car }) => {
  const days = useDaysLeft(car.date);
  const formatted = DATE_FMT.format(new Date(car.date));
  const isUpcoming = days > 0;

  return (
    <a
      href="#"
      className="group relative flex flex-col overflow-hidden rounded-xl bg-white ring-1 ring-gray-200 transition-shadow duration-300 hover:shadow-lg"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <img
          src={car.img}
          alt={car.name}
          className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
        />
        
        {isUpcoming && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xl flex items-center justify-center">
            <div className="text-center">
              <p className="text-white text-[10px] font-bold uppercase tracking-widest mb-2 opacity-90">Launching Soon</p>
              <p className="text-white text-5xl font-black tabular-nums">{days}</p>
              <p className="text-white/95 text-[11px] font-semibold mt-1">{days === 1 ? "day" : "days"} left</p>
            </div>
          </div>
        )}

        <div className="absolute left-2 top-2">
          <span className="inline-block rounded-full bg-white/95 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-gray-900">
            {car.cat}
          </span>
          {car.badge && (
            <span className="ml-1.5 inline-block rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
              {car.badge}
            </span>
          )}
        </div>

        <button
          onClick={(e) => e.preventDefault()}
          className="absolute right-2 top-2 rounded-full bg-white p-1.5 transition-colors hover:bg-gray-100"
        >
          <svg className="size-3.5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
          </svg>
        </button>

        <span className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold text-gray-900">
          <StarIcon filled />
          {car.rating}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div>
          <h3 className="text-sm font-bold text-gray-900">{car.name}</h3>
          <p className="text-xs text-gray-500 mt-1">Launching on {formatted}</p>
          <p className="mt-1 text-base font-black text-red-600">{car.price}</p>
        </div>

        <div className="space-y-2 border-t border-gray-100 pt-2">
          <div className="flex flex-wrap gap-1">
            <SpecChip icon={<FuelIcon />} label={car.fuel} />
            <SpecChip icon={<GearIcon />} label={car.transmission} />
          </div>

          <div className="flex items-center gap-1 text-[10px] font-semibold text-gray-600">
            <CalendarIcon />
            <span className="text-red-600 font-bold">{days}</span>
            <span>{days === 1 ? "day" : "days"} left</span>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => e.preventDefault()}
          className="mt-auto w-full flex items-center justify-between rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-red-700 active:bg-red-800"
        >
          {isUpcoming ? "Notify me at launch" : "Check Offers"}
          <svg className="size-3" viewBox="0 0 12 12" fill="none">
            <path d="M2 6h8M8 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </a>
  );
};

export default function UpcomingLaunches() {
  return (
    <section className="bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-red-600">Latest Launches</p>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">Upcoming cars in India</h2>
            <p className="mt-1 text-xs text-gray-500">Real-time countdowns for the most anticipated launches</p>
          </div>
          <a href="#" className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-900 hover:text-red-600">
            View all launches
            <svg className="size-3" viewBox="0 0 12 12" fill="none">
              <path d="M2 6h8M8 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CARS.map((car) => (
            <Card key={car.name} car={car} />
          ))}
        </div>
      </div>
    </section>
  );
}