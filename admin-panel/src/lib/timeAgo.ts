// src/lib/timeAgo.ts
//
// Shared by Ai/Dashboard/Dashboard.tsx and Dashboard/Dashboard.tsx — was
// duplicated between the two before this extraction (per the project's
// "reusable code goes in a common location" rule).

export function formatRelativeToNow(iso: string | null, future: boolean): string {
  if (!iso) return "—";
  const target = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = future ? target - now : now - target;
  if (future && diffMs <= 0) return "any moment now";
  const abs = Math.abs(diffMs);
  const mins = Math.round(abs / 60000);
  if (mins < 1) return future ? "any moment now" : "just now";
  if (mins < 60) return future ? `in ${mins} min` : `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return future ? `in ${hrs} hr${hrs === 1 ? "" : "s"}` : `${hrs} hr${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  return future ? `in ${days} day${days === 1 ? "" : "s"}` : `${days} day${days === 1 ? "" : "s"} ago`;
}
