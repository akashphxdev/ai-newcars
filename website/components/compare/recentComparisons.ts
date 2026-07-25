import type { RandomPairCar } from "@/features/compare/compare.types";

// Shared between RecordRecentComparison (writer) and RecentlyViewedComparisons
// (reader) so the storage key/shape can't drift between the two.
export const RECENT_COMPARISONS_KEY = "ta_recent_comparisons";
export const MAX_RECENT_COMPARISONS = 8;

export interface RecentComparison {
  comparisonSlug: string;
  cars: RandomPairCar[];
  viewedAt: number;
}
