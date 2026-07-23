// components/common/ScrollArrows.tsx
// Pairs with useScrollRail — the left/right circular arrow buttons shown
// next to a section's "View all" link on desktop.
import { ChevronIcon } from "./icons";

export default function ScrollArrows({
  canScrollLeft,
  canScrollRight,
  onLeft,
  onRight,
  dark = false,
}: {
  canScrollLeft: boolean;
  canScrollRight: boolean;
  onLeft: () => void;
  onRight: () => void;
  dark?: boolean;
}) {
  const base =
    "flex size-8 items-center justify-center rounded-full border cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed";
  const theme = dark ? "border-white/15 text-white" : "border-border text-ink";

  return (
    <div className="hidden items-center gap-1.5 sm:flex">
      <button type="button" aria-label="Scroll left" onClick={onLeft} disabled={!canScrollLeft} className={`${base} ${theme}`}>
        <ChevronIcon dir="left" />
      </button>
      <button type="button" aria-label="Scroll right" onClick={onRight} disabled={!canScrollRight} className={`${base} ${theme}`}>
        <ChevronIcon />
      </button>
    </div>
  );
}
