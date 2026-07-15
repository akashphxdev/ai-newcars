"use client"
import { useState, useMemo } from "react";
import Link from "next/link";

const ACCENT = "#D4300F";

const formatINR = (n: number) =>
  Math.round(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

type FuelType = "Petrol" | "Diesel" | "CNG" | "Electric";

const FUEL_DEFAULTS: Record<FuelType, { price: number; unit: string; priceLabel: string; min: number; max: number; step: number }> = {
  Petrol: { price: 106.5, unit: "km/l", priceLabel: "₹/litre", min: 80, max: 130, step: 0.5 },
  Diesel: { price: 93.2, unit: "km/l", priceLabel: "₹/litre", min: 75, max: 115, step: 0.5 },
  CNG: { price: 78.0, unit: "km/kg", priceLabel: "₹/kg", min: 60, max: 100, step: 0.5 },
  Electric: { price: 8.5, unit: "km/kWh", priceLabel: "₹/kWh (unit)", min: 4, max: 15, step: 0.1 },
};

const DEFAULT_MILEAGE: Record<FuelType, number> = {
  Petrol: 17,
  Diesel: 21,
  CNG: 26,
  Electric: 7,
};

type SliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (n: number) => string;
  onChange: (v: number) => void;
};

const Slider = ({ label, value, min, max, step, format, onChange }: SliderProps) => {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <label className="text-xs font-semibold text-gray-500">{label}</label>
        <span className="text-base font-black text-gray-900">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full outline-none"
        style={{ background: `linear-gradient(to right, ${ACCENT} ${pct}%, #e5e7eb ${pct}%)` }}
      />
      <style jsx>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          border: 3px solid ${ACCENT};
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
          cursor: pointer;
        }
        input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          border: 3px solid ${ACCENT};
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
          cursor: pointer;
          border-style: solid;
        }
      `}</style>
    </div>
  );
};

const FuelTab = ({
  type,
  active,
  onClick,
}: {
  type: FuelType;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition-colors ${
      active ? "bg-red-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
    }`}
  >
    {type}
  </button>
);

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
    q: "How is fuel cost per km calculated?",
    a: "Fuel cost per km is calculated by dividing the fuel price (₹ per litre, kg, or kWh) by the vehicle's mileage. For example, if petrol is ₹106/litre and your car gives 17 km/l, the cost per km is ₹106 ÷ 17 = ₹6.2 per km.",
  },
  {
    q: "Which fuel type is cheapest to run — Petrol, Diesel, CNG, or Electric?",
    a: "CNG is typically the cheapest to run per km, followed by Electric and Diesel, with Petrol usually being the most expensive. However, the actual savings depend on your vehicle's mileage, daily driving distance, and local fuel prices.",
  },
  {
    q: "Does daily driving distance affect which fuel type is most economical?",
    a: "Yes. If you drive long distances daily, the running-cost savings of CNG or Electric vehicles add up significantly over a month. For low daily usage, the difference may be smaller and other factors like upfront cost matter more.",
  },
  {
    q: "How accurate is this fuel cost calculator?",
    a: "This calculator gives a close estimate based on the mileage and fuel price you enter. Real-world mileage can vary depending on traffic, driving style, AC usage, and vehicle load, so actual costs may differ slightly.",
  },
  {
    q: "Why is Electric vehicle running cost shown in km/kWh?",
    a: "Electric vehicles consume electricity instead of fuel, measured in kilowatt-hours (kWh). Mileage for EVs is expressed as how many kilometers the vehicle travels per unit of electricity consumed.",
  },
  {
    q: "Can I use this calculator for a bike or only cars?",
    a: "While built with cars in mind, the same formula (fuel price ÷ mileage × distance) works for two-wheelers too — just enter your bike's mileage and daily distance.",
  },
];

export default function FuelCostCalculatorPage() {
  const [fuelType, setFuelType] = useState<FuelType>("Petrol");
  const [dailyKm, setDailyKm] = useState(40);
  const [mileage, setMileage] = useState(DEFAULT_MILEAGE.Petrol);
  const [fuelPrice, setFuelPrice] = useState(FUEL_DEFAULTS.Petrol.price);

  const selectFuel = (type: FuelType) => {
    setFuelType(type);
    setMileage(DEFAULT_MILEAGE[type]);
    setFuelPrice(FUEL_DEFAULTS[type].price);
  };

  const { dailyCost, monthlyCost, yearlyCost, costPerKm } = useMemo(() => {
    const costPerKm = mileage > 0 ? fuelPrice / mileage : 0;
    const dailyCost = costPerKm * dailyKm;
    return {
      costPerKm,
      dailyCost,
      monthlyCost: dailyCost * 30,
      yearlyCost: dailyCost * 365,
    };
  }, [dailyKm, mileage, fuelPrice]);

  const comparison = useMemo(() => {
    return (Object.keys(FUEL_DEFAULTS) as FuelType[]).map((type) => {
      const m = DEFAULT_MILEAGE[type];
      const p = FUEL_DEFAULTS[type].price;
      const monthly = (p / m) * dailyKm * 30;
      return { type, monthly };
    });
  }, [dailyKm]);

  const maxMonthly = Math.max(...comparison.map((c) => c.monthly));
  const config = FUEL_DEFAULTS[fuelType];

  return (
    <main className="min-h-screen bg-[#fafafa] py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-10">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-red-600">Plan Your Running Cost</p>
          <h1 className="text-3xl font-black text-gray-900 sm:text-4xl">Fuel cost calculator</h1>
          <p className="mt-3 max-w-lg text-sm text-gray-500">
            See your daily, monthly, and yearly fuel cost — and compare it across fuel types.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
          {/* Inputs */}
          <div className="flex flex-col gap-7 rounded-2xl bg-white p-6 ring-1 ring-gray-200 sm:p-8">
            <div>
              <p className="mb-2.5 text-xs font-semibold text-gray-500">Fuel type</p>
              <div className="flex gap-2">
                {(Object.keys(FUEL_DEFAULTS) as FuelType[]).map((type) => (
                  <FuelTab key={type} type={type} active={fuelType === type} onClick={() => selectFuel(type)} />
                ))}
              </div>
            </div>

            <Slider
              label="Daily driving distance"
              value={dailyKm}
              min={5}
              max={200}
              step={5}
              format={(n) => `${n} km`}
              onChange={setDailyKm}
            />
            <Slider
              label={`Mileage (${config.unit})`}
              value={mileage}
              min={fuelType === "Electric" ? 3 : 8}
              max={fuelType === "Electric" ? 12 : 30}
              step={0.5}
              format={(n) => `${n} ${config.unit}`}
              onChange={setMileage}
            />
            <Slider
              label={`Fuel price (${config.priceLabel})`}
              value={fuelPrice}
              min={config.min}
              max={config.max}
              step={config.step}
              format={(n) => `₹${n.toFixed(1)}`}
              onChange={setFuelPrice}
            />

            <div className="border-t border-gray-100 pt-6">
              <p className="text-xs font-semibold text-gray-400">Cost per km</p>
              <p className="mt-0.5 text-base font-black text-gray-900">₹{costPerKm.toFixed(2)} / km</p>
            </div>
          </div>

          {/* Result */}
          <div className="flex flex-col gap-6 rounded-2xl bg-white p-6 ring-1 ring-gray-200 sm:p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Monthly fuel cost</p>
              <p className="mt-1 text-3xl font-black text-red-600">₹{formatINR(monthlyCost)}</p>
            </div>

            <div className="flex flex-col gap-2.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-600">Per day</span>
                <span className="font-bold text-gray-900">₹{formatINR(dailyCost)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-600">Per month</span>
                <span className="font-bold text-gray-900">₹{formatINR(monthlyCost)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-gray-100 pt-2.5">
                <span className="font-bold text-gray-900">Per year</span>
                <span className="font-black text-gray-900">₹{formatINR(yearlyCost)}</span>
              </div>
            </div>

            {/* Fuel type comparison */}
            <div className="border-t border-gray-100 pt-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Monthly cost by fuel type
              </p>
              <div className="flex flex-col gap-3">
                {comparison.map((c) => (
                  <div key={c.type}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className={`font-bold ${c.type === fuelType ? "text-red-600" : "text-gray-600"}`}>
                        {c.type}
                      </span>
                      <span className="font-semibold text-gray-500">₹{formatINR(c.monthly)}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${(c.monthly / maxMonthly) * 100}%`,
                          background: c.type === fuelType ? ACCENT : "#d1d5db",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
                href="/mileage-calculator"
                className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 no-underline transition-colors hover:border-red-200 hover:text-red-600"
              >
                Mileage Calculator
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
            <h3 className="text-sm font-black text-gray-900">Tips to reduce fuel cost</h3>
            <ul className="mt-3 space-y-2 text-xs text-gray-600">
              <li className="flex gap-2">
                <span className="text-red-600">•</span> Maintain steady speed; avoid harsh acceleration and braking
              </li>
              <li className="flex gap-2">
                <span className="text-red-600">•</span> Keep tyres at the recommended pressure for better mileage
              </li>
              <li className="flex gap-2">
                <span className="text-red-600">•</span> Get regular servicing — a clean air filter improves efficiency
              </li>
            </ul>
          </div>

          {/* Card 3: CTA */}
          <div className="flex flex-col rounded-2xl p-6 text-white" style={{ background: ACCENT }}>
            <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-white/15">
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M5 21V8l5-5h4v3h2a2 2 0 0 1 2 2v9.5a1.5 1.5 0 0 1-3 0V13a1 1 0 0 0-1-1h-1" />
                <path d="M5 21h9M5 12h9" />
              </svg>
            </div>
            <h3 className="text-sm font-black">Looking for a fuel-efficient car?</h3>
            <p className="mt-1 text-xs text-white/80">
              Browse the best mileage cars in India and lower your monthly running cost.
            </p>
            <button
              type="button"
              onClick={(e) => e.preventDefault()}
              className="mt-4 w-fit rounded-lg bg-white px-4 py-2 text-xs font-bold text-red-600 transition-opacity hover:opacity-90"
            >
              Browse Mileage Cars
            </button>
          </div>
        </div>

        {/* Educational content */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
          {/* What is fuel cost */}
          <div className="rounded-2xl bg-white p-6 ring-1 ring-gray-200 sm:p-8">
            <h2 className="text-lg font-black text-gray-900">How is fuel running cost calculated?</h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              Your car's fuel running cost depends on three things — how much fuel
              costs, how far your car travels per unit of fuel (mileage), and how
              much you drive daily. This calculator combines all three to show your
              real running cost per day, month, and year.
            </p>

            <h3 className="mt-5 text-sm font-bold text-gray-900">Formula</h3>
            <div className="mt-2 rounded-lg bg-gray-50 px-4 py-3 font-mono text-xs text-gray-700">
              Cost per km = Fuel Price ÷ Mileage
            </div>
            <div className="mt-2 rounded-lg bg-gray-50 px-4 py-3 font-mono text-xs text-gray-700">
              Monthly Cost = Cost per km × Daily Distance × 30
            </div>
            <ul className="mt-3 space-y-1.5 text-xs text-gray-500">
              <li><span className="font-bold text-gray-700">Fuel Price</span> = ₹ per litre / kg / kWh depending on fuel type</li>
              <li><span className="font-bold text-gray-700">Mileage</span> = distance covered per unit of fuel</li>
              <li><span className="font-bold text-gray-700">Daily Distance</span> = average km driven per day</li>
            </ul>
          </div>

          {/* Fuel type comparison guide */}
          <div className="rounded-2xl bg-white p-6 ring-1 ring-gray-200 sm:p-8">
            <h2 className="text-lg font-black text-gray-900">Petrol vs Diesel vs CNG vs Electric</h2>
            <div className="mt-4 flex flex-col gap-4">
              {[
                { title: "Petrol", desc: "Widely available and smooth to drive, but generally the costliest per km among the four options." },
                { title: "Diesel", desc: "Better mileage than petrol and good for highway driving, with moderate running cost." },
                { title: "CNG", desc: "Lowest running cost per km, ideal for high daily usage like cabs and city commutes." },
                { title: "Electric", desc: "Low running cost and zero tailpipe emissions, though charging time and infrastructure vary by city." },
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
          <p className="mt-1 text-xs text-gray-400">Everything you need to know about fuel running costs.</p>
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