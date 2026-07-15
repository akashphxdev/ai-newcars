"use client"
import { useState, useMemo } from "react";
import Link from "next/link";

const ACCENT = "#D4300F";

type FillUp = {
  id: string;
  odometer: number;
  fuel: number;
};

const SEED: FillUp[] = [
  { id: "1", odometer: 12400, fuel: 32 },
  { id: "2", odometer: 12940, fuel: 30 },
  { id: "3", odometer: 13510, fuel: 31 },
];

const FaqItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-none">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
      >
        <span className="text-sm font-bold text-gray-900">{q}</span>
        <svg
          className="size-4 shrink-0 text-gray-400 transition-transform duration-300"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
          viewBox="0 0 12 8"
          fill="none"
        >
          <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div className="overflow-hidden transition-all duration-300" style={{ maxHeight: open ? "300px" : "0px" }}>
        <p className="pb-4 text-sm leading-relaxed text-gray-600">{a}</p>
      </div>
    </div>
  );
};

const faqs = [
  {
    q: "Why does brochure mileage differ from real-world mileage?",
    a: "Brochure mileage (ARAI/MIDC rating) is tested under controlled lab conditions with no traffic, AC, or load. Real-world mileage is usually 15–25% lower due to traffic, AC usage, driving style, and vehicle load.",
  },
  {
    q: "How is mileage calculated using the fill-up method?",
    a: "Fill your tank completely, note the odometer reading, then drive normally until your next full tank. The distance covered divided by the fuel filled at the next fill-up gives your real mileage in km/l.",
  },
  {
    q: "Why should I always fill a full tank for accurate readings?",
    a: "Partial fill-ups make it hard to know exactly how much fuel was actually consumed. Filling to full each time ensures the fuel amount logged matches the distance driven since the last full tank.",
  },
  {
    q: "What can cause low mileage readings?",
    a: "Common causes include under-inflated tyres, aggressive acceleration and braking, excessive AC use, carrying extra load, dirty air filters, and frequent short city trips with lots of idling.",
  },
  {
    q: "How many fill-ups should I log for an accurate average?",
    a: "At least 3–5 fill-ups give a reasonably reliable average, since it smooths out variations from one-off trips, traffic conditions, or a single odd tank of fuel.",
  },
  {
    q: "Does AC usage really affect mileage that much?",
    a: "Yes. Running the AC continuously, especially in city traffic, can reduce mileage by 5–10% or more, since the compressor adds load on the engine.",
  },
];

export default function MileageCalculatorPage() {
  const [entries, setEntries] = useState<FillUp[]>(SEED);
  const [odometer, setOdometer] = useState("");
  const [fuel, setFuel] = useState("");

  const rows = useMemo(() => {
    const sorted = [...entries].sort((a, b) => a.odometer - b.odometer);
    return sorted.map((entry, i) => {
      if (i === 0) return { ...entry, distance: null as number | null, mileage: null as number | null };
      const distance = entry.odometer - sorted[i - 1].odometer;
      const mileage = entry.fuel > 0 ? distance / entry.fuel : 0;
      return { ...entry, distance, mileage };
    });
  }, [entries]);

  const { avgMileage, totalDistance, totalFuel } = useMemo(() => {
    const valid = rows.filter((r) => r.distance !== null) as { distance: number; fuel: number }[];
    const totalDistance = valid.reduce((s, r) => s + r.distance, 0);
    const totalFuel = valid.reduce((s, r) => s + r.fuel, 0);
    return {
      totalDistance,
      totalFuel,
      avgMileage: totalFuel > 0 ? totalDistance / totalFuel : 0,
    };
  }, [rows]);

  const addEntry = () => {
    const odoNum = Number(odometer);
    const fuelNum = Number(fuel);
    if (!odoNum || !fuelNum) return;
    setEntries((prev) => [...prev, { id: Date.now().toString(), odometer: odoNum, fuel: fuelNum }]);
    setOdometer("");
    setFuel("");
  };

  const removeEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <main className="min-h-screen bg-[#fafafa] py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-10">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-red-600">Track Your Real Mileage</p>
          <h1 className="text-3xl font-black text-gray-900 sm:text-4xl">Mileage calculator</h1>
          <p className="mt-3 max-w-lg text-sm text-gray-500">
            Log your fill-ups and see your car's real-world mileage, not just the brochure number.
          </p>
        </div>

        {/* Summary */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 ring-1 ring-gray-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Average mileage</p>
            <p className="mt-1 text-2xl font-black text-red-600">{avgMileage.toFixed(1)} km/l</p>
          </div>
          <div className="rounded-2xl bg-white p-5 ring-1 ring-gray-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Total distance logged</p>
            <p className="mt-1 text-2xl font-black text-gray-900">{totalDistance.toLocaleString("en-IN")} km</p>
          </div>
          <div className="rounded-2xl bg-white p-5 ring-1 ring-gray-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Total fuel filled</p>
            <p className="mt-1 text-2xl font-black text-gray-900">{totalFuel.toFixed(1)} L</p>
          </div>
        </div>

        {/* Add entry */}
        <div className="mb-6 rounded-2xl bg-white p-6 ring-1 ring-gray-200">
          <p className="mb-4 text-sm font-bold text-gray-900">Add a fill-up</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-semibold text-gray-500">Odometer reading (km)</label>
              <input
                type="number"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                placeholder="e.g. 14080"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900 outline-none placeholder:text-gray-400 focus:border-red-300"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-semibold text-gray-500">Fuel filled (litres)</label>
              <input
                type="number"
                value={fuel}
                onChange={(e) => setFuel(e.target.value)}
                placeholder="e.g. 29.5"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900 outline-none placeholder:text-gray-400 focus:border-red-300"
              />
            </div>
            <button
              onClick={addEntry}
              className="rounded-lg px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: ACCENT }}
            >
              Add entry
            </button>
          </div>
          <p className="mt-3 text-xs text-gray-400">
            Tip: log your odometer reading every time you fill up, full tank to full tank, for the most accurate number.
          </p>
        </div>

        {/* Log table */}
        <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-gray-200">
          <div className="border-b border-gray-100 p-6 pb-4">
            <h2 className="text-base font-black text-gray-900">Fill-up log</h2>
            <p className="mt-1 text-xs text-gray-400">Mileage is calculated between each consecutive fill-up.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-bold uppercase tracking-wide text-gray-400">
                  <th className="px-6 py-3">Odometer</th>
                  <th className="px-6 py-3">Fuel filled</th>
                  <th className="px-6 py-3">Distance covered</th>
                  <th className="px-6 py-3">Mileage</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-gray-50 last:border-none">
                    <td className="px-6 py-3 font-bold text-gray-900">{row.odometer.toLocaleString("en-IN")} km</td>
                    <td className="px-6 py-3 text-gray-600">{row.fuel.toFixed(1)} L</td>
                    <td className="px-6 py-3 text-gray-600">
                      {row.distance !== null ? `${row.distance.toLocaleString("en-IN")} km` : "—"}
                    </td>
                    <td className="px-6 py-3 font-bold text-red-600">
                      {row.mileage !== null ? `${row.mileage.toFixed(1)} km/l` : "—"}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => removeEntry(row.id)}
                        className="text-xs font-semibold text-gray-400 hover:text-red-600"
                        aria-label="Remove entry"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">
                      No fill-ups logged yet. Add your first one above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom cards */}
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {/* Card 1: Related calculators */}
          <div className="rounded-2xl bg-white p-6 ring-1 ring-gray-200">
            <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-red-50">
              <svg className="size-5 text-red-600" viewBox="0 0 24 24" fill="none">
                <rect x="4" y="2" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="1.6" />
                <path d="M8 7h8M8 11h2M12.5 11h2M17 11h0M8 15h2M12.5 15h2M17 15h0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="text-sm font-black text-gray-900">More calculators</h3>
            <p className="mt-1 text-xs text-gray-500">Plan every cost before you buy.</p>
            <div className="mt-4 flex flex-col gap-2">
              <Link
                href="/emi-calculator"
                className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 no-underline transition-colors hover:border-red-200 hover:text-red-600"
              >
                EMI Calculator
                <svg className="size-3" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6h8M8 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link
                href="/fuel-cost-calculator"
                className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 no-underline transition-colors hover:border-red-200 hover:text-red-600"
              >
                Fuel Cost Calculator
                <svg className="size-3" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6h8M8 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Card 2: Tips */}
          <div className="rounded-2xl bg-white p-6 ring-1 ring-gray-200">
            <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-red-50">
              <svg className="size-5 text-red-600" viewBox="0 0 24 24" fill="none">
                <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.3.2.5.6.5 1v.1h6v-.1c0-.4.2-.8.5-1A6 6 0 0 0 12 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="text-sm font-black text-gray-900">Tips to improve mileage</h3>
            <ul className="mt-3 space-y-2 text-xs text-gray-600">
              <li className="flex gap-2">
                <span className="text-red-600">•</span> Check tyre pressure monthly — under-inflation hurts mileage
              </li>
              <li className="flex gap-2">
                <span className="text-red-600">•</span> Avoid unnecessary idling and aggressive acceleration
              </li>
              <li className="flex gap-2">
                <span className="text-red-600">•</span> Service your car on schedule, including air filter checks
              </li>
            </ul>
          </div>

          {/* Card 3: CTA */}
          <div className="flex flex-col rounded-2xl p-6 text-white" style={{ background: ACCENT }}>
            <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-white/15">
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M4 14a8 8 0 1 1 16 0" />
                <path d="M12 14 16 9" />
              </svg>
            </div>
            <h3 className="text-sm font-black">See your fuel cost too</h3>
            <p className="mt-1 text-xs text-white/80">
              Use your real mileage here to get an accurate monthly fuel cost estimate.
            </p>
            <button
              type="button"
              onClick={(e) => e.preventDefault()}
              className="mt-4 w-fit rounded-lg bg-white px-4 py-2 text-xs font-bold text-red-600 transition-opacity hover:opacity-90"
            >
              Open Fuel Calculator
            </button>
          </div>
        </div>

        {/* Educational content */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
          {/* What is mileage / fill-up method */}
          <div className="rounded-2xl bg-white p-6 ring-1 ring-gray-200 sm:p-8">
            <h2 className="text-lg font-black text-gray-900">What is the fill-up method?</h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              The fill-up method is the most reliable way to measure real-world
              mileage. Instead of trusting brochure figures, you track the actual
              distance your car covers per litre of fuel by logging your odometer
              reading at every full-tank fill-up.
            </p>

            <h3 className="mt-5 text-sm font-bold text-gray-900">Formula</h3>
            <div className="mt-2 rounded-lg bg-gray-50 px-4 py-3 font-mono text-xs text-gray-700">
              Mileage (km/l) = Distance Covered ÷ Fuel Filled
            </div>
            <ul className="mt-3 space-y-1.5 text-xs text-gray-500">
              <li><span className="font-bold text-gray-700">Distance Covered</span> = current odometer − previous odometer</li>
              <li><span className="font-bold text-gray-700">Fuel Filled</span> = litres added at the current fill-up</li>
            </ul>
          </div>

          {/* What affects mileage */}
          <div className="rounded-2xl bg-white p-6 ring-1 ring-gray-200 sm:p-8">
            <h2 className="text-lg font-black text-gray-900">What affects your car's mileage?</h2>
            <div className="mt-4 flex flex-col gap-4">
              {[
                { title: "Driving style", desc: "Hard acceleration and braking burn more fuel than smooth, steady driving." },
                { title: "Traffic & idling", desc: "Stop-and-go city traffic and long idling reduce mileage compared to highway driving." },
                { title: "Vehicle load & tyres", desc: "Carrying extra weight and under-inflated tyres both increase fuel consumption." },
                { title: "AC usage", desc: "Running the AC constantly, especially at low speeds, adds noticeable load on the engine." },
              ].map((item) => (
                <div key={item.title} className="flex gap-3">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-red-600" />
                  <div>
                    <p className="text-sm font-bold text-gray-900">{item.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ section */}
        <div className="mt-8 rounded-2xl bg-white p-6 ring-1 ring-gray-200 sm:p-8">
          <h2 className="text-lg font-black text-gray-900">Frequently asked questions</h2>
          <p className="mt-1 text-xs text-gray-400">Everything you need to know about calculating real-world mileage.</p>
          <div className="mt-4">
            {faqs.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}