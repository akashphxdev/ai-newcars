// src/core/utils/dateRanges.ts
//
// Plain Date math (no date-fns dependency — same convention as
// modules/ai/dashboard/dashboard.service.ts's startOfToday()). Every
// range is a lower bound only (`gte`) — queries are always relative to
// "now", so nothing after `since` needs an upper bound.

export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// Week starts Monday.
export function startOfWeek(): Date {
  const d = startOfToday();
  const day = d.getDay(); // 0 = Sunday
  const diffFromMonday = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diffFromMonday);
  return d;
}

export function startOfMonth(): Date {
  const d = startOfToday();
  d.setDate(1);
  return d;
}

// "YYYY-MM-DD" in the server's LOCAL calendar day — deliberately NOT
// `date.toISOString().slice(0, 10)`, which reads the UTC day instead.
// Trend-chart bucketing (dashboard.service.ts, ai/dashboard's own, and
// pageView's) needs every date it buckets by — today's boundary AND
// each row's own timestamp — read the same way, or the "today" bucket
// silently lands on the wrong day for any server timezone ahead of UTC
// (e.g. IST): local midnight, once serialized back through
// toISOString(), rolls back to the previous UTC day.
export function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
