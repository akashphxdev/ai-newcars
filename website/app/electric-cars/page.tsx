import type { Metadata } from "next";
import { getAllCars } from "@/features/cars/car.api";
import ElectricCarsHero from "@/components/cars/ElectricCarsHero";
import ElectricCarCard from "@/components/cars/ElectricCarCard";
import Pagination from "@/components/common/Pagination";

export const metadata: Metadata = {
  title: "Electric Cars in India | TimesAuto",
  description: "Browse all electric cars available in India — compare range, battery, charging time, and on-road prices.",
};

type Props = { searchParams: Promise<{ page?: string }> };

export default async function ElectricCarsPage({ searchParams }: Props) {
  const { page } = await searchParams;
  const pageNum = Math.max(1, Number(page) || 1);

  const { cars, pagination } = await getAllCars("electric", pageNum, 12);

  return (
    <div>
      <ElectricCarsHero />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
        <p className="max-w-2xl text-muted">
          Browse all {pagination.total} electric cars available in India. Compare real-world range, battery
          capacity, charging time, and on-road prices to find the EV that fits your driving needs.
        </p>

        {cars.length > 0 ? (
          <>
            <div className="mt-8 flex flex-wrap gap-5">
              {cars.map((car) => (
                <ElectricCarCard key={car.id} car={car} />
              ))}
            </div>
            <Pagination pagination={pagination} basePath="/electric-cars" />
          </>
        ) : (
          <p className="mt-8 text-muted">No electric cars found.</p>
        )}
      </div>
    </div>
  );
}
