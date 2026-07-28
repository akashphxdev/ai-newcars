import { StarIcon } from "@/components/common/icons";
import type { ReviewsSummary } from "@/features/reviews/review.types";

export default function ReviewSummary({ summary }: { summary: ReviewsSummary }) {
  const { averageRating, totalReviews, ratingBreakdown } = summary;

  if (totalReviews === 0) {
    return (
      <div className="rounded-2xl border border-border bg-white p-5 text-center">
        <p className="text-[13.5px] font-medium text-muted">No reviews yet — be the first to share your experience.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 rounded-2xl border border-border bg-white p-4 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-6 sm:p-5">
      <div className="flex flex-col items-center border-b border-border-soft pb-4 sm:border-b-0 sm:border-r sm:border-border sm:pb-0 sm:pr-6">
        <p className="font-head text-3xl font-extrabold text-ink sm:text-4xl">{averageRating ?? "—"}</p>
        <div className="mt-1 flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <StarIcon key={i} filled={!!averageRating && i < Math.round(averageRating)} className="size-4 text-brand" />
          ))}
        </div>
        <p className="mt-1 text-[12px] font-medium text-muted">
          {totalReviews.toLocaleString("en-IN")} review{totalReviews === 1 ? "" : "s"}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        {ratingBreakdown.map(({ star, count }) => {
          const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
          return (
            <div key={star} className="flex items-center gap-2.5">
              <span className="w-10 shrink-0 text-[11.5px] font-semibold text-muted">{star} star</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-page">
                <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
              </div>
              <span className="w-8 shrink-0 text-right text-[11px] font-medium text-faint">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
