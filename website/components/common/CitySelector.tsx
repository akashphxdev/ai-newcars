// components/common/CitySelector.tsx
//
// The header's city control. Resolution order, cheapest and least
// intrusive first:
//   1. A city the visitor already chose (localStorage) — wins silently.
//   2. Cloudflare's IP hint, shown as a question ("You're in Jaipur?").
//      A suggestion, never applied on its own.
//   3. GPS, only after an explicit tap. Never fired on page load: a
//      mis-tapped "Block" is sticky and costs the feature permanently.
//   4. Pick from the list.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PinIcon, SearchIcon } from "@/components/common/icons";
import {
  CITY_EVENT,
  dismissCityPrompt,
  getCurrentCity,
  isCityPromptDismissed,
  saveCurrentCity,
} from "@/features/location/currentCity";
import { detectCityFromIp, getLocationCities, reverseGeocode } from "@/features/location/location.api";
import type { LocationCity } from "@/features/location/location.types";

// City-level accuracy is all this needs, so the cheap fix is fine and a
// 5-minute cached position is preferable to waking the GPS again.
const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 10_000,
  maximumAge: 300_000,
};

export default function CitySelector({ variant = "desktop" }: { variant?: "desktop" | "mobile" }) {
  const [city, setCity] = useState<LocationCity | null>(null);
  const [cities, setCities] = useState<LocationCity[]>([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [locating, setLocating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [suggested, setSuggested] = useState<LocationCity | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCity(getCurrentCity());
    const sync = (e: Event) => setCity((e as CustomEvent<LocationCity>).detail);
    window.addEventListener(CITY_EVENT, sync);
    return () => window.removeEventListener(CITY_EVENT, sync);
  }, []);

  // The IP hint is the only thing fetched unprompted, and only when we
  // have no answer yet.
  useEffect(() => {
    if (getCurrentCity() || isCityPromptDismissed()) return;
    let alive = true;
    detectCityFromIp().then((hit) => {
      if (alive && hit?.city) setSuggested(hit.city);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Fetched on first open rather than on mount — most visits never touch
  // the picker, and this keeps it off the page-load path.
  const loadCities = useCallback(() => {
    if (cities.length) return;
    getLocationCities()
      .then(setCities)
      .catch(() => setNotice("Could not load cities."));
  }, [cities.length]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (next: LocationCity) => {
    saveCurrentCity(next);
    setSuggested(null);
    setOpen(false);
    setQuery("");
    setNotice(null);
  };

  const useMyLocation = () => {
    setNotice(null);
    if (!("geolocation" in navigator)) {
      setNotice("This browser can't share your location.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const hit = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
        if (hit?.city) {
          choose(hit.city);
          return;
        }
        // Recognised the place but we don't cover it — say which, so the
        // visitor knows the feature worked and picks a nearby city.
        setNotice(
          hit?.detected
            ? `We aren't in ${hit.detected} yet — pick a nearby city.`
            : "We couldn't work out your city.",
        );
        loadCities();
      },
      (err) => {
        setLocating(false);
        setNotice(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied — pick your city below."
            : "Couldn't get your location — pick your city below.",
        );
        loadCities();
      },
      GEO_OPTIONS,
    );
  };

  const shown = query
    ? cities.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
    : cities;

  const label = city?.name ?? "Select city";
  const isMobile = variant === "mobile";

  return (
    <div ref={boxRef} className={isMobile ? "relative w-full" : "relative shrink-0"}>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          loadCities();
        }}
        aria-expanded={open}
        aria-label="Select your city"
        className={`flex cursor-pointer items-center gap-1 text-[13px] font-semibold text-ink ${
          isMobile ? "my-2 w-full py-2" : ""
        }`}
      >
        <span className="text-brand">
          <PinIcon />
        </span>
        {label}
      </button>

      {/* The IP hint, offered once and only while no city is set. */}
      {suggested && !city && !open && (
        <div
          className={`absolute z-50 mt-2 w-64 rounded-2xl border border-border bg-surface p-3 shadow-lg ${
            isMobile ? "left-0" : "right-0"
          }`}
        >
          <p className="text-[13px] font-semibold text-ink">You&apos;re in {suggested.name}?</p>
          <p className="mt-0.5 text-[11px] text-muted">So we can show cars and offers near you.</p>
          <div className="mt-2.5 flex gap-2">
            <button
              type="button"
              onClick={() => choose(suggested)}
              className="flex-1 cursor-pointer rounded-md bg-brand px-3 py-1.5 text-[12px] font-bold text-white transition-colors hover:bg-brand-hover"
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => {
                setSuggested(null);
                dismissCityPrompt();
                setOpen(true);
                loadCities();
              }}
              className="flex-1 cursor-pointer rounded-md border border-border px-3 py-1.5 text-[12px] font-bold text-ink transition-colors hover:bg-page"
            >
              Change
            </button>
          </div>
        </div>
      )}

      {open && (
        <div
          className={`absolute z-50 mt-2 w-72 rounded-2xl border border-border bg-surface p-3 shadow-lg ${
            isMobile ? "left-0" : "right-0"
          }`}
        >
          <button
            type="button"
            onClick={useMyLocation}
            disabled={locating}
            className="flex w-full cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-[12px] font-bold text-brand transition-colors hover:bg-page disabled:opacity-60"
          >
            <PinIcon />
            {locating ? "Locating…" : "Use my current location"}
          </button>

          {notice && <p className="mt-2 text-[11px] leading-snug text-muted">{notice}</p>}

          <div className="mt-2.5 flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5">
            <span className="text-subtle">
              <SearchIcon />
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search city"
              className="w-full bg-transparent text-[13px] text-ink placeholder:text-subtle"
            />
          </div>

          <ul className="mt-2 max-h-64 space-y-0.5 overflow-y-auto">
            {shown.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => choose(c)}
                  className={`w-full cursor-pointer rounded-md px-2.5 py-2 text-left text-[13px] font-semibold transition-colors hover:bg-page ${
                    c.id === city?.id ? "text-brand" : "text-ink"
                  }`}
                >
                  {c.name}
                </button>
              </li>
            ))}
            {cities.length > 0 && shown.length === 0 && (
              <li className="px-2.5 py-2 text-[12px] text-muted">No city matches “{query}”.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
