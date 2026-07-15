"use client"

type City = {
  name: string;
  icon: "gate" | "dome" | "tower" | "fort" | "beach" | "skyline" | "arch" | "minar" | "temple";
  badge?: string;
};

const CITIES: City[] = [
  { name: "Ahmedabad", icon: "tower", badge: "2.5K+ cars" },
  { name: "Bangalore", icon: "dome", badge: "Top search" },
  { name: "Chennai", icon: "temple", badge: "1.8K+ cars" },
  { name: "Delhi NCR", icon: "minar", badge: "3.2K+ cars" },
  { name: "Gurgaon", icon: "skyline", badge: "Premium hub" },
  { name: "Hyderabad", icon: "fort", badge: "2.1K+ cars" },
  { name: "Jaipur", icon: "tower", badge: "You're here" },
  { name: "Kolkata", icon: "beach", badge: "1.6K+ cars" },
  { name: "Mumbai", icon: "gate", badge: "Top search" },
  { name: "New Delhi", icon: "arch", badge: "2.8K+ cars" },
  { name: "Noida", icon: "tower", badge: "Popular" },
  { name: "Pune", icon: "temple", badge: "2.3K+ cars" },
];

const CityIcon = ({ type }: { type: City["icon"] }) => {
  const icons: Record<City["icon"], React.ReactNode> = {
    gate: (
      <g>
        <path d="M20 50V24h6v26M44 50V24h-6v26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M20 24a12 12 0 0 1 24 0" stroke="currentColor" strokeWidth="2" />
        <path d="M16 50h32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </g>
    ),
    dome: (
      <g>
        <path d="M22 50V30h20v20" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M22 30a10 10 0 0 1 20 0" stroke="currentColor" strokeWidth="2" />
        <path d="M32 14v6M28 18l4-4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 50h32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </g>
    ),
    tower: (
      <g>
        <rect x="24" y="20" width="6" height="30" rx="1" stroke="currentColor" strokeWidth="2" />
        <rect x="34" y="20" width="6" height="30" rx="1" stroke="currentColor" strokeWidth="2" />
        <path d="M24 20l3-6 3 6M34 20l3-6 3 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 50h32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </g>
    ),
    fort: (
      <g>
        <path d="M20 50V28h24v22" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M20 28v-5h4v5M28 28v-5h4v5M36 28v-5h4v5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <circle cx="32" cy="38" r="3.5" stroke="currentColor" strokeWidth="2" />
        <path d="M16 50h32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </g>
    ),
    beach: (
      <g>
        <circle cx="22" cy="18" r="3" stroke="currentColor" strokeWidth="2" />
        <path d="M14 36q6-8 12 0t12 0 12 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M14 44q6-8 12 0t12 0 12 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </g>
    ),
    skyline: (
      <g>
        <rect x="16" y="30" width="8" height="20" stroke="currentColor" strokeWidth="2" />
        <rect x="28" y="20" width="8" height="30" stroke="currentColor" strokeWidth="2" />
        <rect x="40" y="26" width="8" height="24" stroke="currentColor" strokeWidth="2" />
        <path d="M14 50h36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </g>
    ),
    arch: (
      <g>
        <path d="M22 50V28a10 10 0 0 1 20 0v22" stroke="currentColor" strokeWidth="2" />
        <path d="M22 50h-4M42 50h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M16 50h32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </g>
    ),
    minar: (
      <g>
        <path d="M28 50V22l4-6 4 6v28" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M26 32h12M26 40h12" stroke="currentColor" strokeWidth="2" />
        <path d="M16 50h32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </g>
    ),
    temple: (
      <g>
        <path d="M32 14l4 8h-8l4-8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M26 22h12v6h-12z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M22 28h20v22h-20z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M16 50h32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </g>
    ),
  };

  return (
    <svg viewBox="0 0 64 64" className="size-12 text-red-600">
      {icons[type]}
    </svg>
  );
};

const CityCard = ({ city }: { city: City }) => (
  <a
    href="#"
    className="group relative flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white p-4 text-center transition-all hover:border-red-200 hover:shadow-lg"
  >
    {city.badge && (
      <span className="absolute -top-2 left-2 rounded-full bg-red-600 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white">
        {city.badge}
      </span>
    )}

    <button
      onClick={(e) => e.stopPropagation()}
      className="absolute right-2 top-2 rounded-full bg-gray-100 p-1 opacity-0 transition-all group-hover:opacity-100"
    >
      <svg className="size-3 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      </svg>
    </button>

    <span className="flex size-14 items-center justify-center rounded-full bg-red-50 transition-all group-hover:bg-red-100">
      <CityIcon type={city.icon} />
    </span>

    <div>
      <p className="text-[10px] font-semibold text-gray-500">Used cars in</p>
      <p className="text-sm font-bold text-gray-900">{city.name}</p>
    </div>
  </a>
);

export default function TrustedUsedCars() {
  return (
    <section className="bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-8">
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-red-600">Find Nearby</p>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
            Get trusted used cars in your city
          </h2>
          <p className="mt-1 text-xs text-gray-500">Browse verified listings across India's top cities</p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 gap-3 lg:grid-cols-6">
          {CITIES.map((city) => (
            <CityCard key={city.name} city={city} />
          ))}
        </div>
      </div>
    </section>
  );
}