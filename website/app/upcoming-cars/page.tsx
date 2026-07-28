import type { Metadata } from "next";
import { getAllCars } from "@/features/cars/car.api";
import UpcomingCarCard from "@/components/cars/UpcomingCarCard";
import Pagination from "@/components/common/Pagination";

export const metadata: Metadata = {
  title: "Upcoming Cars in India | TimesAuto",
  description: "Browse all upcoming car launches in India — expected launch dates, estimated prices, and countdowns.",
};

type Props = { searchParams: Promise<{ page?: string }> };

export default async function UpcomingCarsPage({ searchParams }: Props) {
  const { page } = await searchParams;
  const pageNum = Math.max(1, Number(page) || 1);

  const { cars, pagination } = await getAllCars("upcoming", pageNum, 12);

  return (
    <div>
      <div className="border-b border-border bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
          <h1 className="font-head text-2xl font-extrabold text-ink sm:text-3xl">Upcoming Cars in India</h1>
          <p className="mt-2 max-w-2xl text-muted">
            Real-time countdowns for the most anticipated launches — expected launch dates and estimated prices,
            updated as manufacturers confirm details.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
        {cars.length > 0 ? (
          <>
            <p className="text-[13px] font-medium text-muted">{pagination.total} upcoming cars</p>
            <div className="mt-6 flex flex-wrap gap-5">
              {cars.map((car) => (
                <UpcomingCarCard key={car.id} car={car} />
              ))}
            </div>
            <Pagination pagination={pagination} basePath="/upcoming-cars" />
          </>
        ) : (
          <p className="text-muted">No upcoming launches announced right now.</p>
        )}
      </div>
    </div>
  );
}
