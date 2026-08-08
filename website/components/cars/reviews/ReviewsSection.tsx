"use client";
import { useEffect, useState } from "react";
import { getReviews } from "@/features/reviews/review.api";
import { getCurrentUser } from "@/features/auth/currentUser";
import { getCarVariants } from "@/features/cars/car.api";
import AuthModal from "@/components/common/AuthModal";
import ReviewSummary from "./ReviewSummary";
import ReviewCard from "./ReviewCard";
import WriteReviewForm from "./WriteReviewForm";
import type { ListReviewsResult } from "@/features/reviews/review.types";
import type { CarDetailVariantOption } from "@/features/cars/car.types";

const PAGE_SIZE = 10;

// Client-fetched (not SSR) — reviews carry the logged-in viewer's own
// helpful/reply state, which only exists in the browser (the auth token
// lives in localStorage, not a cookie the server can read). Variant
// options are also fetched here (rather than passed down from the page's
// car.variantOptions) since that's now capped to a preview subset —
// the Write Review picker needs every variant.
export default function ReviewsSection({
  modelId,
  brandSlug,
  modelSlug,
}: {
  modelId: number;
  brandSlug: string;
  modelSlug: string;
}) {
  const [result, setResult] = useState<ListReviewsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showWriteForm, setShowWriteForm] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [variantOptions, setVariantOptions] = useState<CarDetailVariantOption[]>([]);
  const [variantsLoading, setVariantsLoading] = useState(false);

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

  // Fetched on demand (not on mount) — most visitors read reviews and
  // never open the write-review form, so there's no reason to pay for
  // the full variant list on every page view.
  const handleWriteReviewClick = async () => {
    if (!getCurrentUser()) {
      setShowAuth(true);
      return;
    }
    if (variantOptions.length === 0) {
      setVariantsLoading(true);
      try {
        const all = await getCarVariants(brandSlug, modelSlug);
        setVariantOptions(all);
      } finally {
        setVariantsLoading(false);
      }
    }
    setShowWriteForm(true);
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:py-24">
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10.5px] font-black uppercase tracking-[0.16em] text-brand">Real-world experience</p>
          <h2 className="mt-2 font-head text-3xl font-extrabold text-ink sm:text-4xl">Owner reviews</h2>
          <p className="mt-2 text-[13px] text-muted">Ratings and stories from people who live with this car.</p>
        </div>
        <button
          type="button"
          onClick={handleWriteReviewClick}
          disabled={variantsLoading}
          className="w-full cursor-pointer border border-brand px-5 py-3 text-[11px] font-black uppercase tracking-[0.08em] text-brand transition-colors hover:bg-brand hover:text-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {variantsLoading ? "Loading..." : "Write a Review"}
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
            className="cursor-pointer rounded-md border border-border px-4 py-1.5 text-[12.5px] font-semibold text-ink transition-colors hover:border-brand disabled:cursor-not-allowed disabled:opacity-40"
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
            className="cursor-pointer rounded-md border border-border px-4 py-1.5 text-[12.5px] font-semibold text-ink transition-colors hover:border-brand disabled:cursor-not-allowed disabled:opacity-40"
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
