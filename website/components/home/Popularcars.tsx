"use client"

type Car = {
  rank: number;
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
  launchDate?: string;
};

const CARS: Car[] = [
  {
    rank: 1,
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
    badge: "Bookings Open",
    launchDate: "Launched: 15 Aug 2024",
  },
  {
    rank: 2,
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
    badge: "EV specs: 5kw",
    launchDate: "Launched: 15 Aug 2024",
  },
  {
    rank: 3,
    name: "Swift",
    brand: "Maruti Suzuki",
    priceMin: "₹6.5L",
    priceMax: "₹9.4L",
    power: "82 PS",
    torque: "113 Nm",
    mileage: "22.4 km/l",
    fuel: "Petrol",
    transmission: "Manual",
    seats: 5,
    rating: 4.2,
    img: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=1200&auto=format&fit=crop",
    badge: "Top Spec: ZX1+",
    launchDate: "Launched: 15 Aug 2024",
  },
  {
    rank: 4,
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
    img: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=1200&auto=format&fit=crop",
    badge: "First Drive Review",
    launchDate: "Launched: 15 Aug 2024",
  },
];

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

const SeatIcon = () => (
  <svg className="size-3.5" viewBox="0 0 24 24" fill="none">
    <path d="M7 11V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M5 11h10a2 2 0 0 1 2 2v2H7a2 2 0 0 1-2-2v-2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M7 17v3M15 17v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const GaugeIcon = () => (
  <svg className="size-3.5" viewBox="0 0 24 24" fill="none">
    <path d="M4 14a8 8 0 1 1 16 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M12 14 16 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const PowerIcon = () => (
  <svg className="size-3.5" viewBox="0 0 24 24" fill="none">
    <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);

const TorqueIcon = () => (
  <svg className="size-3.5" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.6" />
    <path d="M12 8v4l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
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

const Card = ({ car }: { car: Car }) => (
  <a
    href="#"
    className="group flex flex-col overflow-hidden rounded-xl bg-white ring-1 ring-gray-200 transition-shadow duration-300 hover:shadow-lg"
  >
    <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
      <img
        src={car.img}
        alt={`${car.brand} ${car.name}`}
        className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
      />
      <div className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-white/95 px-2 py-1 text-[9px] font-bold text-gray-900 backdrop-blur-sm">
        <span className="text-red-600">#{car.rank}</span>
        <span className="text-gray-500">Most searched</span>
      </div>
      
      {car.badge && (
        <span className="absolute left-2 top-9 rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
          {car.badge}
        </span>
      )}
      
      <button
        onClick={(e) => e.preventDefault()}
        className="absolute right-2 top-2 rounded-full bg-white p-1.5 transition-colors hover:bg-gray-100"
      >
        <svg className="size-3.5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        </svg>
      </button>

      <span className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold text-gray-900 backdrop-blur-sm">
        <StarIcon filled />
        {car.rating}
      </span>
    </div>

    <div className="flex flex-1 flex-col gap-2 p-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">{car.brand}</p>
        <h3 className="text-sm font-bold text-gray-900">{car.name}</h3>
        <p className="text-xs text-gray-500">{car.launchDate}</p>
        <p className="mt-1 text-base font-black text-red-600">
          ₹{car.priceMin} - {car.priceMax}
        </p>
        <p className="text-xs text-gray-600 mt-0.5">
          Top Variant: {car.transmission}
        </p>
      </div>

      <div className="space-y-2 border-t border-gray-100 pt-2">
        <div className="flex flex-wrap gap-1">
          <SpecChip icon={<PowerIcon />} label={car.power} />
          <SpecChip icon={<TorqueIcon />} label={car.torque} />
          <SpecChip icon={<GaugeIcon />} label={car.mileage} />
        </div>

        <div className="flex flex-wrap gap-1">
          <SpecChip icon={<FuelIcon />} label={car.fuel} />
          <SpecChip icon={<GearIcon />} label={car.transmission} />
          <SpecChip icon={<SeatIcon />} label={`${car.seats} seat`} />
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => e.preventDefault()}
        className="mt-auto w-full flex items-center justify-between rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-red-700 active:bg-red-800"
      >
        Check Offers
        <svg className="size-3" viewBox="0 0 12 12" fill="none">
          <path d="M2 6h8M8 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  </a>
);

export default function PopularCars() {
  return (
    <section className="bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-red-600">Most Searched</p>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">Popular cars</h2>
            <p className="mt-1 text-xs text-gray-500">Ranked by buyer interest this month</p>
          </div>
          <a href="#" className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-900 hover:text-red-600">
            View full ranking
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