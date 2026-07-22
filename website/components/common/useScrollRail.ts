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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollBy = (dir: "left" | "right") => {
    const el = trackRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return { trackRef, canScrollLeft, canScrollRight, updateArrows, scrollBy };
}
