"use client";
import SectionHeader from "@/components/common/SectionHeader";

type City = {
  name: string;
  icon: "gate" | "dome" | "tower" | "fort" | "beach" | "skyline" | "arch" | "minar" | "temple";
};

const SURFACE = "#f4f5f9";
const BORDER = "#e5e7eb";

const CITIES: City[] = [
  { name: "Ahmedabad", icon: "tower" },
  { name: "Bangalore", icon: "dome" },
  { name: "Chennai", icon: "temple" },
  { name: "Delhi NCR", icon: "minar" },
  { name: "Gurgaon", icon: "skyline" },
  { name: "Hyderabad", icon: "fort" },
  { name: "Jaipur", icon: "tower" },
  { name: "Kolkata", icon: "beach" },
  { name: "Mumbai", icon: "gate" },
  { name: "New Delhi", icon: "arch" },
];

// Verified, guaranteed-existing Iconify (mdi set) icon names
const ICON_MAP: Record<City["icon"], string> = {
  gate: "mdi:domain",
  dome: "mdi:mosque",
  tower: "mdi:office-building",
  fort: "mdi:castle",
  beach: "mdi:beach",
  skyline: "mdi:city",
  arch: "mdi:bank",
  minar: "mdi:office-building-outline",
  temple: "mdi:temple-hindu",
};

const CityIcon = ({ type }: { type: City["icon"] }) => {
  const iconName = ICON_MAP[type];
  const src = `https://api.iconify.design/${iconName}.svg`;

  return (
    <img
      src={src}
      alt={type}
      width={36}
      height={36}
      loading="lazy"
      className="size-9"
    />
  );
};

const CityCard = ({ city }: { city: City }) => (
  <a
    href="#"
    className="relative flex w-full flex-col items-center justify-center gap-3 rounded-2xl bg-white p-5 text-center"
    style={{ border: "1px solid " + BORDER, boxShadow: "0 1px 2px rgba(17,24,39,0.04)", minHeight: "160px" }}
  >
    <CityIcon type={city.icon} />

    <div>
      <p className="text-[10px] font-semibold text-muted">Used cars in</p>
      <p className="text-sm font-bold text-ink">{city.name}</p>
    </div>
  </a>
);

export default function TrustedUsedCars() {
  return (
    <section className="py-12 sm:py-16" style={{ background: SURFACE }}>
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeader
          eyebrow="Find Nearby"
          title="Get trusted used cars in your city"
          subtitle="Browse verified listings across India's top cities"
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {CITIES.map((city) => (
            <CityCard key={city.name} city={city} />
          ))}
        </div>
      </div>
    </section>
  );
}