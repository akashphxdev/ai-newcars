"use client"
import { useState } from "react";

type Car = {
  name: string;
  brand: string;
  priceMin: string;
  priceMax: string;
  power: string;
  torque: string;
  mileage: string;
  fuel: string;
  transmission: string;
  seats: number;
  rating: number;
  img: string;
  badge?: string;
};

const CARS: Car[] = [
  {
    name: "Creta",
    brand: "Hyundai",
    priceMin: "₹11.1L",
    priceMax: "₹20.4L",
    power: "115 PS",
    torque: "250 Nm",
    mileage: "21.4 km/l",
    fuel: "Diesel",
    transmission: "Automatic",
    seats: 5,
    rating: 4.5,
    img: "https://images.unsplash.com/photo-1568844293986-8d0400bd55b9?q=80&w=1200&auto=format&fit=crop",
    badge: "Popular",
  },
  {
    name: "Seltos",
    brand: "Kia",
    priceMin: "₹11.4L",
    priceMax: "₹20.1L",
    power: "115 PS",
    torque: "250 Nm",
    mileage: "20.8 km/l",
    fuel: "Diesel",
    transmission: "Automatic",
    seats: 5,
    rating: 4.3,
    img: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=1200&auto=format&fit=crop",
    badge: "Great Value",
  },
  {
    name: "Nexon",
    brand: "Tata",
    priceMin: "₹8.1L",
    priceMax: "₹15.6L",
    power: "118 PS",
    torque: "260 Nm",
    mileage: "17.4 km/l",
    fuel: "Petrol",
    transmission: "Manual",
    seats: 5,
    rating: 4.3,
    img: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?q=80&w=1200&auto=format&fit=crop",
    badge: "Best Seller",
  },
  {
    name: "Scorpio-N",
    brand: "Mahindra",
    priceMin: "₹13.6L",
    priceMax: "₹24.8L",
    power: "175 PS",
    torque: "370 Nm",
    mileage: "16.3 km/l",
    fuel: "Diesel",
    transmission: "Automatic",
    seats: 7,
    rating: 4.4,
    img: "https://images.unsplash.com/photo-1617470702761-2bb9c41523c5?q=80&w=1200&auto=format&fit=crop",
    badge: "Premium",
  },
];

const MAX_COMPARE = 3;

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg className="size-3" viewBox="0 0 20 20" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.3">
    <path d="M10 2.5 12.5 7.5 18 8.3 14 12.2 15 17.7 10 15 5 17.7 6 12.2 2 8.3 7.5 7.5 10 2.5Z" strokeLinejoin="round" />
  </svg>
);

const Card = ({
  car,
  selected,
  disabled,
  slot,
  onToggle,
}: {
  car: Car;
  selected: boolean;
  disabled: boolean;
  slot: number | null;
  onToggle: () => void;
}) => (
  <div
    className={`group relative flex flex-col overflow-hidden rounded-xl bg-white ring-1 transition-all duration-300 ${
      selected ? "ring-2 ring-red-600 shadow-lg" : "ring-gray-200 hover:shadow-lg"
    }`}
  >
    {selected && (
      <span className="absolute left-2 top-2 z-10 inline-flex size-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
        {slot}
      </span>
    )}

    <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
      <img
        src={car.img}
        alt={`${car.brand} ${car.name}`}
        className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
      />
      
      <div className="absolute left-2 top-2">
        {car.badge && (
          <span className="inline-block rounded-full bg-red-600 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white">
            {car.badge}
          </span>
        )}
      </div>

      <button
        onClick={(e) => e.stopPropagation()}
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

    <div className="flex flex-1 flex-col gap-2 p-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">{car.brand}</p>
        <h3 className="text-sm font-bold text-gray-900">{car.name}</h3>
      </div>

      <p className="text-base font-black text-red-600">
        {car.priceMin} - {car.priceMax}
      </p>

      <div className="space-y-1.5">
        <p className="flex flex-wrap items-center gap-x-1 text-[10px] font-semibold text-gray-600">
          <span>{car.power}</span>
          <span className="text-gray-300">·</span>
          <span>{car.torque}</span>
        </p>
        <p className="flex flex-wrap items-center gap-x-1 text-[10px] font-semibold text-gray-600">
          <span>{car.mileage}</span>
          <span className="text-gray-300">·</span>
          <span>{car.fuel}</span>
        </p>
        <p className="flex flex-wrap items-center gap-x-1 text-[10px] font-semibold text-gray-600">
          <span>{car.transmission}</span>
          <span className="text-gray-300">·</span>
          <span>{car.seats} seats</span>
        </p>
      </div>

      <button
        onClick={onToggle}
        disabled={disabled && !selected}
        className={`mt-auto w-full flex items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-bold transition-all ${
          selected
            ? "bg-red-50 text-red-600 ring-1 ring-red-200"
            : disabled
            ? "cursor-not-allowed bg-gray-50 text-gray-300"
            : "bg-gray-900 text-white hover:bg-gray-800"
        }`}
      >
        {selected ? (
          <>
            <svg className="size-3" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Added
          </>
        ) : (
          <>
            <svg className="size-3" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
            Add
          </>
        )}
      </button>
    </div>
  </div>
);

export default function CompareCars() {
  const [picked, setPicked] = useState<string[]>([]);

  const toggle = (name: string) => {
    setPicked((prev) =>
      prev.includes(name)
        ? prev.filter((n) => n !== name)
        : prev.length < MAX_COMPARE
        ? [...prev, name]
        : prev
    );
  };

  return (
    <section className="bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-8 flex flex-col gap-4 sm:mb-10">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-red-600">Decide Faster</p>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">Compare cars</h2>
            <p className="mt-1 text-xs text-gray-500">
              Pick up to {MAX_COMPARE} cars to compare specs and features side by side
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CARS.map((car) => (
            <Card
              key={car.name}
              car={car}
              selected={picked.includes(car.name)}
              disabled={picked.length >= MAX_COMPARE}
              slot={picked.indexOf(car.name) + 1 || null}
              onToggle={() => toggle(car.name)}
            />
          ))}
        </div>

        {/* Sticky-feel compare bar */}
        {picked.length > 0 && (
          <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-xl bg-gray-900 px-4 py-3 sm:flex-row sm:gap-4">
            <p className="text-xs sm:text-sm font-semibold text-white">
              <span className="text-red-400 font-bold">{picked.length}</span> of <span className="text-red-400 font-bold">{MAX_COMPARE}</span> selected
              <span className="hidden sm:inline"> — {picked.join(", ")}</span>
            </p>
            <button
              disabled={picked.length < 2}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                picked.length < 2
                  ? "cursor-not-allowed bg-white/10 text-white/40"
                  : "bg-red-600 text-white hover:bg-red-700"
              }`}
            >
              Compare {picked.length} cars
            </button>
          </div>
        )}
      </div>
    </section>
  );
}