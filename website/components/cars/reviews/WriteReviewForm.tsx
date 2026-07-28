"use client";
import { useState } from "react";
import { StarIcon, CloseIcon } from "@/components/common/icons";
import { submitReview } from "@/features/reviews/review.api";

const CATEGORIES = ["Comfort", "Performance", "Mileage", "Value for Money"] as const;

const StarPicker = ({ value, onChange, size = "size-6" }: { value: number; onChange: (n: number) => void; size?: string }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        onClick={() => onChange(n)}
        aria-label={`${n} star`}
        className="cursor-pointer transition-transform hover:scale-110"
      >
        <StarIcon filled={n <= value} className={`${size} text-brand`} />
      </button>
    ))}
  </div>
);

const Label = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-faint">
    {children}
    {required && <span className="text-brand"> *</span>}
  </span>
);

const inputClass =
  "w-full rounded-xl border border-border px-3 py-2.5 text-[13px] text-ink outline-none transition-colors focus:border-brand";

export default function WriteReviewForm({
  modelId,
  variantOptions,
  onClose,
  onSubmitted,
}: {
  modelId: number;
  variantOptions: { id: number; variantName: string }[];
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [variantId, setVariantId] = useState<number | "">("");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [ownershipDuration, setOwnershipDuration] = useState("");
  const [kmDriven, setKmDriven] = useState("");
  const [categoryScores, setCategoryScores] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [bodyError, setBodyError] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBodyError("");
    if (body.trim().length < 10) {
      setBodyError("Your review needs to be at least 10 characters.");
      return;
    }
    setSubmitting(true);
    try {
      await submitReview({
        modelId,
        variantId: variantId === "" ? undefined : variantId,
        rating,
        title: title.trim() || undefined,
        body: body.trim(),
        ownershipDuration: ownershipDuration.trim() || undefined,
        kmDriven: kmDriven ? Number(kmDriven) : undefined,
        categoryScores: Object.entries(categoryScores)
          .filter(([, score]) => score > 0)
          .map(([category, score]) => ({ category, score })),
      });
      setDone(true);
      onSubmitted();
    } catch {
      setError("Something went wrong — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-border bg-white shadow-2xl sm:max-h-[85vh] sm:max-w-md sm:rounded-2xl">
        {/* Drag-handle affordance — mobile only, signals "this sheet can be dismissed" */}
        <div className="flex shrink-0 justify-center pb-1 pt-2.5 sm:hidden">
          <span className="h-1 w-10 rounded-full bg-border" />
        </div>

        <div className="flex shrink-0 items-center justify-between border-b border-border-soft px-5 py-4">
          <h3 className="text-[15px] font-bold text-ink">{done ? "Thank you!" : "Write a Review"}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-full p-1 text-muted transition-colors hover:bg-page hover:text-ink"
          >
            <CloseIcon className="size-4.5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          {done ? (
            <p className="text-[13px] leading-relaxed text-muted">
              Your review has been submitted and will appear here once approved by our team.
            </p>
          ) : (
            <form id="write-review-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col items-center gap-1.5 rounded-xl bg-page py-4">
                <span className="text-[11.5px] font-semibold text-muted">
                  How was your experience? <span className="text-brand">*</span>
                </span>
                <StarPicker value={rating} onChange={setRating} size="size-7" />
              </div>

              <div>
                <Label required>Your Review</Label>
                <textarea
                  value={body}
                  onChange={(e) => {
                    setBody(e.target.value);
                    if (bodyError) setBodyError("");
                  }}
                  placeholder="Share your ownership experience — what do you like, what could be better?"
                  rows={4}
                  maxLength={3000}
                  className={`w-full resize-none rounded-xl border px-3 py-2.5 text-[13px] text-ink outline-none transition-colors ${
                    bodyError ? "border-red-500 focus:border-red-500" : "border-border focus:border-brand"
                  }`}
                />
                {bodyError && <p className="mt-1 text-[11.5px] font-medium text-red-600">{bodyError}</p>}
              </div>

              <div>
                <Label>Review Title</Label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Sum it up in a few words"
                  maxLength={150}
                  className={inputClass}
                />
              </div>

              {variantOptions.length > 0 && (
                <div>
                  <Label>Variant</Label>
                  <select
                    value={variantId}
                    onChange={(e) => setVariantId(e.target.value ? Number(e.target.value) : "")}
                    className={`${inputClass} cursor-pointer`}
                  >
                    <option value="">Not sure / prefer not to say</option>
                    {variantOptions.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.variantName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Owned For</Label>
                  <input
                    value={ownershipDuration}
                    onChange={(e) => setOwnershipDuration(e.target.value)}
                    placeholder="e.g. 6 months"
                    maxLength={50}
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label>Km Driven</Label>
                  <input
                    value={kmDriven}
                    onChange={(e) => setKmDriven(e.target.value.replace(/\D/g, ""))}
                    inputMode="numeric"
                    placeholder="e.g. 12000"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 rounded-xl bg-page px-3.5 py-3.5">
                <p className="text-[10.5px] font-bold uppercase tracking-wide text-faint">Rate specific aspects</p>
                <div className="flex flex-col divide-y divide-border-soft">
                  {CATEGORIES.map((cat) => (
                    <div key={cat} className="flex items-center justify-between py-1.5 first:pt-0 last:pb-0">
                      <span className="text-[12.5px] text-ink">{cat}</span>
                      <StarPicker
                        value={categoryScores[cat] ?? 0}
                        onChange={(n) => setCategoryScores((prev) => ({ ...prev, [cat]: n }))}
                        size="size-3.5"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {error && <p className="text-[12px] font-medium text-red-600">{error}</p>}
            </form>
          )}
        </div>

        {!done && (
          <div className="shrink-0 border-t border-border-soft px-5 py-4">
            <button
              type="submit"
              form="write-review-form"
              disabled={submitting}
              className="w-full cursor-pointer rounded-xl bg-brand py-3 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
