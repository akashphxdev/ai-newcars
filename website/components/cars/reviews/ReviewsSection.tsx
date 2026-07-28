"use client";
import { useEffect, useState } from "react";
import { getReviews } from "@/features/reviews/review.api";
import { getCurrentUser } from "@/features/auth/currentUser";
import AuthModal from "@/components/common/AuthModal";
import ReviewSummary from "./ReviewSummary";
import ReviewCard from "./ReviewCard";
import WriteReviewForm from "./WriteReviewForm";
import type { ListReviewsResult } from "@/features/reviews/review.types";

const PAGE_SIZE = 10;

// Client-fetched (not SSR) — reviews carry the logged-in viewer's own
// helpful/reply state, which only exists in the browser (the auth token
// lives in localStorage, not a cookie the server can read).
export default function ReviewsSection({
  modelId,
  variantOptions,
}: {
  modelId: number;
  variantOptions: { id: number; variantName: string }[];
}) {
  const [result, setResult] = useState<ListReviewsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showWriteForm, setShowWriteForm] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const load = async (targetPage: number) => {
    setLoading(true);
    try {
      const data = await getReviews(modelId, targetPage, PAGE_SIZE);
      setResult(data);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelId, page]);

  const handleWriteReviewClick = () => {
    if (!getCurrentUser()) {
      setShowAuth(true);
      return;
    }
    setShowWriteForm(true);
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-head text-lg font-extrabold text-ink">Owner Reviews</h2>
        <button
          type="button"
          onClick={handleWriteReviewClick}
          className="w-full cursor-pointer rounded-xl border-[1.5px] border-brand px-4 py-2.5 text-[13px] font-bold text-brand transition-colors hover:bg-orange-50 sm:w-auto sm:py-2"
        >
          Write a Review
        </button>
      </div>

      {result && <ReviewSummary summary={result.summary} />}

      <div className="mt-5 flex flex-col gap-4">
        {loading && !result && <p className="py-8 text-center text-[13px] text-muted">Loading reviews...</p>}

        {result?.reviews.map((review) => (
          <ReviewCard key={review.id} review={review} onRequireLogin={() => setShowAuth(true)} />
        ))}
      </div>

      {result && result.pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => p - 1)}
            className="cursor-pointer rounded-full border border-border px-4 py-1.5 text-[12.5px] font-semibold text-ink transition-colors hover:border-brand disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-[12.5px] font-medium text-muted">
            Page {result.pagination.page} of {result.pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= result.pagination.totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
            className="cursor-pointer rounded-full border border-border px-4 py-1.5 text-[12.5px] font-semibold text-ink transition-colors hover:border-brand disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {showWriteForm && (
        <WriteReviewForm
          modelId={modelId}
          variantOptions={variantOptions}
          onClose={() => setShowWriteForm(false)}
          onSubmitted={() => load(page)}
        />
      )}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </section>
  );
}
