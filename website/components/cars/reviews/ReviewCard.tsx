"use client";
import { useState } from "react";
import { StarIcon } from "@/components/common/icons";
import { getCurrentUser } from "@/features/auth/currentUser";
import { toggleHelpful, postReviewReply } from "@/features/reviews/review.api";
import type { ReviewResult } from "@/features/reviews/review.types";

const DATE_FMT = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" });

// Same first+last-letter logic as features/auth/currentUser.ts's
// getUserInitials, but that helper is typed against the full AuthUser
// shape (the logged-in viewer) — a review's author is only ever a
// { id, name } summary, so this stays a small local duplicate rather
// than forcing a fake AuthUser object through the shared one.
function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0]!.toUpperCase();
  return (parts[0][0]! + parts[parts.length - 1][0]!).toUpperCase();
}

const Stars = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <StarIcon key={i} filled={i < Math.round(rating)} className="size-3.5 text-brand" />
    ))}
  </div>
);

export default function ReviewCard({
  review,
  onRequireLogin,
}: {
  review: ReviewResult;
  // Reviews section owns the AuthModal — bubble up "please log in" rather
  // than each card managing its own copy of that modal.
  onRequireLogin: () => void;
}) {
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount);
  const [marked, setMarked] = useState(review.hasMarkedHelpful);
  const [togglingHelpful, setTogglingHelpful] = useState(false);

  const [replies, setReplies] = useState(review.replies);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [postingReply, setPostingReply] = useState(false);

  const rating = review.rating ? Number(review.rating) : 0;

  const handleToggleHelpful = async () => {
    if (!getCurrentUser()) {
      onRequireLogin();
      return;
    }
    setTogglingHelpful(true);
    try {
      const result = await toggleHelpful(review.id);
      setMarked(result.marked);
      setHelpfulCount(result.helpfulCount);
    } catch {
      // best-effort — leave state as-is on failure
    } finally {
      setTogglingHelpful(false);
    }
  };

  const handleOpenReply = () => {
    if (!getCurrentUser()) {
      onRequireLogin();
      return;
    }
    setReplyOpen((v) => !v);
  };

  const handlePostReply = async () => {
    const body = replyBody.trim();
    if (!body) return;
    setPostingReply(true);
    try {
      const reply = await postReviewReply(review.id, body);
      setReplies((prev) => [...prev, reply as (typeof prev)[number]]);
      setReplyBody("");
      setReplyOpen(false);
    } catch {
      // best-effort — the textarea keeps its content so the user can retry
    } finally {
      setPostingReply(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[11.5px] font-black text-brand sm:size-10 sm:text-[12px]">
            {initialsFromName(review.user.name)}
          </span>
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-1.5 text-[13px] font-bold text-ink sm:text-[13.5px]">
              {review.user.name}
              {review.isVerifiedOwner && (
                <span className="rounded-full bg-ev/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-ev sm:text-[9.5px]">
                  Verified Owner
                </span>
              )}
            </p>
            <p className="text-[10.5px] font-medium text-faint sm:text-[11px]">{DATE_FMT.format(new Date(review.createdAt))}</p>
          </div>
        </div>
        <Stars rating={rating} />
      </div>

      {(review.ownershipDuration || review.kmDriven || review.variant) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {review.variant && (
            <span className="rounded-full bg-page px-2.5 py-1 text-[10.5px] font-semibold text-muted">{review.variant.variantName}</span>
          )}
          {review.ownershipDuration && (
            <span className="rounded-full bg-page px-2.5 py-1 text-[10.5px] font-semibold text-muted">Owned {review.ownershipDuration}</span>
          )}
          {review.kmDriven != null && (
            <span className="rounded-full bg-page px-2.5 py-1 text-[10.5px] font-semibold text-muted">
              {review.kmDriven.toLocaleString("en-IN")} km driven
            </span>
          )}
        </div>
      )}

      {review.title && <h3 className="mt-3 text-[14.5px] font-bold text-ink">{review.title}</h3>}
      {review.body && <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-relaxed text-muted">{review.body}</p>}

      {review.categoryScores.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {review.categoryScores.map((c, i) => (
            <span key={i} className="rounded-lg border border-border-soft px-2.5 py-1 text-[11px] font-semibold text-ink">
              {c.category}: <span className="text-brand">{c.score}★</span>
            </span>
          ))}
        </div>
      )}

      {review.images.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {review.images.map((img) => (
            // eslint-disable-next-line @next/next/no-img-element -- small gallery thumb, not worth next/image's overhead here
            <img key={img.id} src={img.imageUrl} alt="" className="size-16 rounded-lg border border-border object-cover" />
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-4 border-t border-border-soft pt-3">
        <button
          type="button"
          onClick={handleToggleHelpful}
          disabled={togglingHelpful}
          className={`flex cursor-pointer items-center gap-1.5 text-[12px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            marked ? "text-brand" : "text-muted hover:text-brand"
          }`}
        >
          {marked ? "Helpful ✓" : "Helpful?"} {helpfulCount > 0 && `(${helpfulCount})`}
        </button>
        <button
          type="button"
          onClick={handleOpenReply}
          className="cursor-pointer text-[12px] font-bold text-muted transition-colors hover:text-brand"
        >
          Reply
        </button>
      </div>

      {replies.length > 0 && (
        <div className="mt-3 flex flex-col gap-2.5 border-t border-border-soft pt-3">
          {replies.map((r) => (
            <div key={r.id} className="rounded-xl bg-page px-3.5 py-2.5">
              <p className="text-[11.5px] font-bold text-ink">
                {r.admin ? <span className="text-brand">{r.admin.name} · Official Response</span> : (r.user?.name ?? "Unknown")}
                <span className="ml-2 font-medium text-faint">{DATE_FMT.format(new Date(r.createdAt))}</span>
              </p>
              <p className="mt-0.5 whitespace-pre-wrap text-[12.5px] text-muted">{r.body}</p>
            </div>
          ))}
        </div>
      )}

      {replyOpen && (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start">
          <textarea
            autoFocus
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            placeholder="Write a reply..."
            rows={2}
            maxLength={2000}
            className="flex-1 rounded-xl border border-border px-3 py-2 text-[12.5px] outline-none focus:border-brand"
          />
          <button
            type="button"
            onClick={handlePostReply}
            disabled={postingReply || !replyBody.trim()}
            className="w-full shrink-0 cursor-pointer rounded-xl border-[1.5px] border-brand px-3.5 py-2 text-[12px] font-bold text-brand transition-colors hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {postingReply ? "Posting..." : "Post"}
          </button>
        </div>
      )}
    </div>
  );
}
