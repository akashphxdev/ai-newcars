import SectionHeader from "@/components/common/SectionHeader";
import { BoltIcon } from "@/components/common/icons";
import CarCard from "@/components/cars/CarCard";
import type { HomeCar } from "@/features/cars/car.types";

// Uses the shared CarCard in rail form (fixed width, snap-scroll) in a
// plain scroll rail — not a copy of the home page's ElectricCars section,
// which uses its own bigger rail card with an "Electric" ribbon + smart
// badges. Same data, different look, so this page doesn't feel like a
// re-skin of the homepage.
export default function BrandElectricCarsRail({
  cars,
  eyebrow = "Zero Emissions",
  title,
  subtitle,
}: {
  cars: HomeCar[];
  eyebrow?: string;
  title: string;
  subtitle: string;
}) {
  if (cars.length === 0) return null;

  return (
    <section className="bg-surface py-12 sm:py-14">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeader
          icon={<BoltIcon className="size-3.5" />}
          tone="ev"
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          href="/electric-cars"
          linkLabel="View all EVs"
        />

        <div className="flex gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {cars.map((car) => (
            <div key={car.id} className="w-[270px] shrink-0">
              <CarCard car={car} variant="rail" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
