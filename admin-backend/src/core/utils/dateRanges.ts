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
