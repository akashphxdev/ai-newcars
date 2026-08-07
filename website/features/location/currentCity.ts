// features/location/currentCity.ts
//
// The visitor's chosen city, kept in localStorage and broadcast on a
// window event — the same shape as features/auth/currentUser.ts, so
// there is one way to share client state in this app rather than two.
//
// Deliberately no expiry: a city is a stable preference, and re-asking
// someone who already answered is the annoying part, not staleness.

import type { LocationCity } from "./location.types";

const CITY_KEY = "user_city";
const PROMPT_DISMISSED_KEY = "user_city_prompt_dismissed";
export const CITY_EVENT = "city-change";

export function getCurrentCity(): LocationCity | null {
  try {
    const raw = localStorage.getItem(CITY_KEY);
    return raw ? (JSON.parse(raw) as LocationCity) : null;
  } catch {
    return null;
  }
}

export function saveCurrentCity(city: LocationCity): void {
  try {
    localStorage.setItem(CITY_KEY, JSON.stringify(city));
  } catch {
    // Private mode — the choice just won't survive the tab.
  }
  window.dispatchEvent(new CustomEvent(CITY_EVENT, { detail: city }));
}

// Session-scoped: dismissing hides the prompt for this tab, but a later
// visit asks again rather than leaving the visitor stuck without a city.
export function isCityPromptDismissed(): boolean {
  try {
    return sessionStorage.getItem(PROMPT_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissCityPrompt(): void {
  try {
    sessionStorage.setItem(PROMPT_DISMISSED_KEY, "1");
  } catch {
    // Nothing to do — the prompt simply shows again.
  }
}
