"use client";
import { useEffect } from "react";
import type { RandomPairCar } from "@/features/compare/compare.types";
import { RECENT_COMPARISONS_KEY, MAX_RECENT_COMPARISONS, type RecentComparison } from "./recentComparisons";

// Fire-and-forget: on visiting a comparison result page, remember it
// (first 2 cars only, just enough for a mini preview) so /compare can
// offer a "Continue Comparing" row. Renders nothing — pure side effect.
export default function RecordRecentComparison({ comparisonSlug, cars }: { comparisonSlug: string; cars: RandomPairCar[] }) {
  useEffect(() => {
    if (cars.length < 2) return;
    try {
      const raw = localStorage.getItem(RECENT_COMPARISONS_KEY);
      const existing: RecentComparison[] = raw ? JSON.parse(raw) : [];
      const withoutCurrent = existing.filter((e) => e.comparisonSlug !== comparisonSlug);
      const entry: RecentComparison = { comparisonSlug, cars: cars.slice(0, 2), viewedAt: Date.now() };
      const next = [entry, ...withoutCurrent].slice(0, MAX_RECENT_COMPARISONS);
      localStorage.setItem(RECENT_COMPARISONS_KEY, JSON.stringify(next));
    } catch {
      // localStorage unavailable (private mode, quota, etc.) — not critical, skip silently.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comparisonSlug]);

  return null;
}
