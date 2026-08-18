// src/core/utils/dateRanges.ts
// Plain Date math helpers used by dashboard and analytics queries.
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
// Trend-chart bucketing needs every date read in the same local-calendar way,
// or the today bucket can land on the wrong day for timezones ahead of UTC.
export function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
