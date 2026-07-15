"use client"

type EVCar = {
  name: string;
  brand: string;
  price: string;
  range: number;
  maxRange: number;
  battery: string;
  chargeTime: string;
  topSpeed: string;
  rating: number;
  img: string;
  badge?: string;
  launchDate?: string;
};

const MAX_RANGE = 600;

const CARS: EVCar[] = [
  {
    name: "e-Vitara",
    brand: "Maruti Suzuki",
    price: "₹18L",
    range: 500,
    maxRange: MAX_RANGE,
    battery: "61 kWh",
    chargeTime: "0–80% in 45 min",
    topSpeed: "160 km/h",
    rating: 4.4,
    img: "https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=1200&auto=format&fit=crop",
    badge: "Bookings Open",
    launchDate: "Launched: 15 Aug 2024",
  },
  {
    name: "Creta EV",
    brand: "Hyundai",
    price: "₹20L",
    range: 473,
    maxRange: MAX_RANGE,
    battery: "51.4 kWh",
    chargeTime: "0–80% in 58 min",
    topSpeed: "170 km/h",
    rating: 4.3,
    img: "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?q=80&w=1200&auto=format&fit=crop",
    badge: "Coming Soon",
    launchDate: "Launched: 15 Aug 2024",
  },
  {
    name: "XEV 9e",
    brand: "Mahindra",
    price: "₹21L",
    range: 542,
    maxRange: MAX_RANGE,
    battery: "79 kWh",
    chargeTime: "0–80% in 35 min",
    topSpeed: "200 km/h",
    rating: 4.6,
    img: "https://images.unsplash.com/photo-1617470702761-2bb9c41523c5?q=80&w=1200&auto=format&fit=crop",
    badge: "Top Spec: ZX1+",
    launchDate: "Launched: 15 Aug 2024",
  },
  {
    name: "Nexon EV",
    brand: "Tata",
    price: "₹14.7L",
    range: 489,
    maxRange: MAX_RANGE,
    battery: "45 kWh",
    chargeTime: "0–80% in 56 min",
    topSpeed: "150 km/h",
    rating: 4.2,
    img: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?q=80&w=1200&auto=format&fit=crop",
    badge: "First Drive Review",
    launchDate: "Launched: 15 Aug 2024",
  },
];

const BoltIcon = () => (
  <svg className="size-3.5" viewBox="0 0 24 24" fill="none">
    <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);

const BatteryIcon = () => (
  <svg className="size-3.5" viewBox="0 0 24 24" fill="none">
    <rect x="2" y="8" width="17" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    <path d="M21 10.5v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M6 8v8" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

const ClockIcon = () => (
  <svg className="size-3.5" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
    <path d="M12 8v4l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SpeedIcon = () => (
  <svg className="size-3.5" viewBox="0 0 24 24" fill="none">
    <path d="M4 14a8 8 0 1 1 16 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M12 14 16 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg className="size-3" viewBox="0 0 20 20" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.3">
    <path d="M10 2.5 12.5 7.5 18 8.3 14 12.2 15 17.7 10 15 5 17.7 6 12.2 2 8.3 7.5 7.5 10 2.5Z" strokeLinejoin="round" />
  </svg>
);

const SpecChip = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white/80">
    {icon}
    {label}
  </span>
);

const Card = ({ car }: { car: EVCar }) => {
  const pct = Math.round((car.range / car.maxRange) * 100);

  return (
    <a
      href="#"
      className="group flex flex-col overflow-hidden rounded-xl bg-[#10241f] ring-1 ring-white/10 transition-shadow duration-300 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-black/20">
        <img
          src={car.img}
          alt={`${car.brand} ${car.name}`}
          className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#10241f] via-transparent to-transparent" />
        
        <div className="absolute left-2 top-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#3ddc97]/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#3ddc97] ring-1 ring-[#3ddc97]/30">
            <BoltIcon />
            Electric
          </span>
          {car.badge && (
            <span className="mt-1 inline-block rounded-full bg-[#3ddc97] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#06120f]">
              {car.badge}
            </span>
          )}
        </div>

        <button
          onClick={(e) => e.preventDefault()}
          className="absolute right-2 top-2 rounded-full bg-white/10 p-1.5 transition-colors hover:bg-white/20"
        >
          <svg className="size-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
          </svg>
        </button>

        <span className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-full bg-black/40 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
          <StarIcon filled />
          {car.rating}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-white/40">{car.brand}</p>
          <h3 className="text-sm font-bold text-white">{car.name}</h3>
          <p className="text-xs text-white/50">{car.launchDate}</p>
          <p className="mt-1 text-base font-black text-[#3ddc97]">{car.price}</p>
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-white/40">Range</span>
            <span className="text-sm font-black text-white">{car.range} km</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-[#3ddc97]" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="space-y-2 border-t border-white/10 pt-2">
          <div className="flex flex-wrap gap-1">
            <SpecChip icon={<BatteryIcon />} label={car.battery} />
            <SpecChip icon={<SpeedIcon />} label={car.topSpeed} />
          </div>

          <p className="flex items-center gap-1 text-[10px] font-semibold text-white/50">
            <ClockIcon />
            <span>{car.chargeTime}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={(e) => e.preventDefault()}
          className="mt-auto w-full flex items-center justify-between rounded-lg bg-[#3ddc97] px-3 py-2 text-xs font-bold text-[#06120f] transition-colors hover:bg-[#33c787] active:bg-[#2ab877]"
        >
          Check Offers
          <svg className="size-3" viewBox="0 0 12 12" fill="none">
            <path d="M2 6h8M8 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </a>
  );
};

export default function ElectricCars() {
  return (
    <section className="bg-[#0a1a16] py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[#3ddc97]">Zero Emissions</p>
            <h2 className="text-2xl sm:text-3xl font-black text-white">Electric cars</h2>
            <p className="mt-1 text-xs text-white/50">Updated Today</p>
          </div>
          <a href="#" className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-white hover:text-[#3ddc97]">
            View all EVs
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