// components/common/useScrollRail.ts
//
// Shared behavior behind every horizontally-scrolling row of cards
// (Latest Cars, Stories, ...) — tracks whether left/right arrow buttons
// should be enabled and exposes a scrollBy() to drive them. Attach
// `trackRef` to the scrollable container and `onScroll={updateArrows}`
// on the same element.
"use client";
import { useRef, useState, useEffect } from "react";

export function useScrollRail<T extends HTMLElement>() {
  const trackRef = useRef<T>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateArrows = () => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateArrows();
  }, []);

  // Distance to the next card = gap between the first two children's left
  // edges (works for any gap-* value the section uses) — falls back to
  // the first card's own width if there's only one card.
  const getCardStep = () => {
    const el = trackRef.current;
    if (!el || el.children.length === 0) return 0;
    const first = el.children[0] as HTMLElement;
    if (el.children.length > 1) {
      const second = el.children[1] as HTMLElement;
      return second.offsetLeft - first.offsetLeft;
    }
    return first.offsetWidth;
  };

  const scrollBy = (dir: "left" | "right") => {
    const el = trackRef.current;
    if (!el) return;
    const step = getCardStep() || el.clientWidth * 0.8;
    el.scrollBy({ left: dir === "left" ? -step : step, behavior: "smooth" });
  };

  return { trackRef, canScrollLeft, canScrollRight, updateArrows, scrollBy };
}
