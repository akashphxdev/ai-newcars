"use client";
import SectionHeader from "@/components/common/SectionHeader";
import ScrollArrows from "@/components/common/ScrollArrows";
import { useScrollRail } from "@/components/common/useScrollRail";

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
      className="size-7 sm:size-9"
    />
  );
};

const CityCard = ({ city }: { city: City }) => (
  <a
    href="#"
    className="relative flex min-h-[130px] flex-col items-center justify-center gap-2 rounded-2xl bg-white p-3 text-center sm:min-h-[160px] sm:gap-3 sm:p-5"
    style={{ border: "1px solid " + BORDER, boxShadow: "0 1px 2px rgba(17,24,39,0.04)" }}
  >
    <CityIcon type={city.icon} />

    <div>
      <p className="text-[10px] font-semibold text-muted">Used cars in</p>
      <p className="text-sm font-bold text-ink">{city.name}</p>
    </div>
  </a>
);

// 2 rows, columns scroll together — cities flow into rows column-by-column
// (grid-flow-col + grid-rows-2), so the whole grid is one horizontally
// scrollable unit instead of two separately-scrolling rows.
const ROWS = 2;

export default function TrustedUsedCars() {
  const { trackRef, canScrollLeft, canScrollRight, updateArrows } = useScrollRail<HTMLDivElement>();

  const scrollByColumn = (dir: "left" | "right") => {
    const el = trackRef.current;
    if (!el) return;
    const first = el.children[0] as HTMLElement | undefined;
    const nextColumn = el.children[ROWS] as HTMLElement | undefined; // same row, next column over
    const step = first && nextColumn ? nextColumn.offsetLeft - first.offsetLeft : el.clientWidth * 0.8;
    el.scrollBy({ left: dir === "left" ? -step : step, behavior: "smooth" });
  };

  return (
    <section className="py-12 sm:py-16" style={{ background: SURFACE }}>
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeader
          eyebrow="Find Nearby"
          title="Get trusted used cars in your city"
          subtitle="Browse verified listings across India's top cities"
          href="#"
          linkLabel="View all cities"
          after={
            <ScrollArrows
              canScrollLeft={canScrollLeft}
              canScrollRight={canScrollRight}
              onLeft={() => scrollByColumn("left")}
              onRight={() => scrollByColumn("right")}
            />
          }
        />

        {/* Fixed column width — stays this size no matter how many cities
            are added; extras slide in via scroll instead of shrinking
            everyone to re-fit the row. Smaller on mobile, unchanged from
            sm: up. */}
        <div
          ref={trackRef}
          onScroll={updateArrows}
          className="scrollbar-none grid grid-flow-col grid-rows-2 auto-cols-[130px] gap-2 overflow-x-auto pb-2 sm:auto-cols-[240px] sm:gap-3"
        >
          {CITIES.map((city) => (
            <CityCard key={city.name} city={city} />
          ))}
        </div>
      </div>
    </section>
  );
}