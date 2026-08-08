"use client";

// components/fuel/FuelStateCityPicker.tsx
//
// Select state → select city, the pattern both CarDekho and V3Cars put
// above the fold. It sits alongside the search rather than replacing it:
// our data is district-based, so a visitor in Kochi who does not know to
// type "Ernakulam" can still get there by picking Kerala and reading the
// list.

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDownIcon } from "@/components/common/icons";
import { getFuelCityIndex } from "@/features/fuel/fuel.api";
import type { FuelCityIndexEntry, FuelState } from "@/features/fuel/fuel.types";
import { routes } from "@/lib/routes";

function Select({
  label,
  value,
  onChange,
  disabled,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="relative flex min-h-12 min-w-0 flex-1 items-center rounded-[7px] border border-border bg-surface shadow-[0_12px_34px_-30px_rgba(17,24,39,0.6)] transition focus-within:-translate-y-px focus-within:border-brand hover:border-faint has-disabled:opacity-60">
      <select
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-full w-full min-w-0 cursor-pointer appearance-none bg-transparent py-3 pl-4 pr-9 text-[13px] font-semibold text-ink outline-none disabled:cursor-not-allowed"
      >
        {children}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-3.5 size-3.5 text-muted" />
    </label>
  );
}

export default function FuelStateCityPicker({ states }: { states: FuelState[] }) {
  const router = useRouter();
  const [stateSlug, setStateSlug] = useState("");
  const [cities, setCities] = useState<FuelCityIndexEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Loaded when a state is picked, not on mount — nobody who lands here
  // and scrolls past should pay for the full index.
  function loadCities() {
    if (cities.length > 0 || loading) return;
    setLoading(true);
    getFuelCityIndex()
      .then(setCities)
      .finally(() => setLoading(false));
  }

  const stateCities = useMemo(
    () => cities.filter((city) => city.stateSlug === stateSlug),
    [cities, stateSlug],
  );

  return (
    <div className="flex flex-col gap-2.5 sm:flex-row">
      <Select
        label="Select state"
        value={stateSlug}
        onChange={(value) => {
          setStateSlug(value);
          if (!value) return;
          loadCities();
          router.push(routes.fuelPriceInState(value));
        }}
      >
        <option value="">Select state</option>
        {states.map((state) => (
          <option key={state.id} value={state.slug}>{state.name}</option>
        ))}
      </Select>

      <Select
        label="Select city"
        value=""
        disabled={!stateSlug || loading}
        onChange={(value) => {
          if (value) router.push(routes.fuelPriceInCity(stateSlug, value));
        }}
      >
        <option value="">
          {!stateSlug ? "Select state first" : loading ? "Loading cities…" : "Select city"}
        </option>
        {stateCities.map((city) => (
          <option key={city.citySlug} value={city.citySlug}>{city.cityName}</option>
        ))}
      </Select>
    </div>
  );
}
