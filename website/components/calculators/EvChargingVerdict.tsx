// components/calculators/EvChargingVerdict.tsx
//
// Hours to charge is the wrong unit for the worry this page exists to
// answer. Nobody plans a day around "6.5 hours"; they plan it around
// whether tonight's charge covers tomorrow's driving.
//
// So this converts the same numbers into range: how far an hour of AC
// charging gets you, and what a normal overnight plug-in delivers.

"use client";

// What a plug-in between getting home and leaving again realistically
// covers. Deliberately conservative — it is the claim being tested, not
// a best case.
const OVERNIGHT_HOURS = 8;

// The same ratio the car cards use when they estimate real-world range
// (go-backend carcards.go). realWorldRange is null for most of the
// catalogue, and a claimed 440 km on a 49 kWh battery implies 9 km/kWh,
// which no EV returns in Indian driving. Charging maths built on that
// number would promise a third more range per hour than the car delivers.
const ARAI_TO_REAL_WORLD = 0.7;

export default function EvChargingVerdict({
  batteryKwh,
  acOutputKw,
  realWorldRangeKm,
  claimedRangeKm,
}: {
  batteryKwh: number;
  acOutputKw: number;
  realWorldRangeKm: number | null;
  claimedRangeKm: number | null;
}) {
  const estimated = !realWorldRangeKm;
  const usableRange = realWorldRangeKm
    ? realWorldRangeKm
    : claimedRangeKm
      ? claimedRangeKm * ARAI_TO_REAL_WORLD
      : 0;

  if (batteryKwh <= 0 || acOutputKw <= 0 || usableRange <= 0) return null;

  // Range per kWh from the car's own rated range, then per hour from what
  // the charger actually delivers.
  const kmPerKwh = usableRange / batteryKwh;
  const kmPerHour = Math.round(kmPerKwh * acOutputKw);
  const overnightKm = Math.min(Math.round(kmPerHour * OVERNIGHT_HOURS), Math.round(usableRange));
  const coversFullCharge = kmPerHour * OVERNIGHT_HOURS >= usableRange;

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <h3 className="text-[13.5px] font-bold text-ink">What that means for your day</h3>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-page p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            An hour on AC adds
          </p>
          <p className="mt-1 font-head text-[22px] font-extrabold leading-none text-ink tabular-nums">
            ~{kmPerHour} km
          </p>
        </div>
        <div className="rounded-xl bg-page p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            Overnight ({OVERNIGHT_HOURS}h) adds
          </p>
          <p className="mt-1 font-head text-[22px] font-extrabold leading-none text-ink tabular-nums">
            ~{overnightKm} km
          </p>
        </div>
      </div>

      <p className="mt-3.5 text-[12.5px] leading-relaxed text-muted">
        {coversFullCharge ? (
          <>
            A normal overnight plug-in fills this car from empty, so home charging alone covers
            everyday driving — the fast charger is for journeys, not for Tuesdays.
          </>
        ) : (
          <>
            An overnight plug-in recovers roughly{" "}
            <span className="font-semibold text-ink">
              {Math.round((overnightKm / usableRange) * 100)}%
            </span>{" "}
            of the range, so a genuinely empty battery needs more than one night on AC.
          </>
        )}
      </p>

      <p className="mt-3 text-[10.5px] leading-relaxed text-subtle">
        {estimated
          ? `Range is estimated at ${Math.round(ARAI_TO_REAL_WORLD * 100)}% of the claimed figure, because the claimed one is an ARAI number Indian driving does not reproduce. `
          : "Worked from the car's measured real-world range. "}
        Real range moves with weather, load and how you drive, and charging slows above roughly 80%.
      </p>
    </div>
  );
}
