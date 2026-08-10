// components/calculators/ChargeRange.tsx
//
// Two percentage boxes made the reader hold a battery in their head. This
// draws it: the charge you start with, the charge you want, and the band
// between them that is what the calculation is actually about.
//
// The 80% mark is drawn on the track because DC charging tapers hard
// above it — a range that ends past 80 takes disproportionately longer,
// and the number alone never says so.

"use client";

export default function ChargeRange({
  from,
  to,
  onChange,
}: {
  from: number;
  to: number;
  onChange: (next: { from: number; to: number }) => void;
}) {
  const lo = Math.min(from, to);
  const hi = Math.max(from, to);

  return (
    <div className="rounded-2xl bg-ink p-5">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold text-white/85">Charge from → to</span>
        <span className="rounded-lg bg-white px-2.5 py-1 text-[13px] font-bold text-ink tabular-nums">
          {lo}% → {hi}%
        </span>
      </div>

      <div className="relative mt-5 h-10">
        {/* The band being charged, over the battery it sits in. */}
        <div className="absolute inset-x-0 top-3 h-4 overflow-hidden rounded-full bg-white/12">
          <div
            className="absolute inset-y-0 bg-brand"
            style={{ left: `${lo}%`, width: `${Math.max(hi - lo, 0)}%` }}
          />
        </div>

        {/* Fast charging tapers above 80%, so the line is worth seeing. */}
        <div className="absolute top-1 h-8 border-l border-dashed border-white/35" style={{ left: "80%" }}>
          <span className="absolute -top-0.5 left-1 whitespace-nowrap text-[9.5px] font-semibold text-white/45">
            80%
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={100}
          value={lo}
          onChange={(e) => onChange({ from: Math.min(Number(e.target.value), hi), to: hi })}
          aria-label="Charge from"
          className="absolute inset-x-0 top-3 h-4 w-full cursor-pointer appearance-none bg-transparent
            [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:shadow-[0_0_0_2px_var(--color-brand)]"
        />
        <input
          type="range"
          min={0}
          max={100}
          value={hi}
          onChange={(e) => onChange({ from: lo, to: Math.max(Number(e.target.value), lo) })}
          aria-label="Charge to"
          className="pointer-events-none absolute inset-x-0 top-3 h-4 w-full cursor-pointer appearance-none bg-transparent
            [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-4
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_0_2px_var(--color-brand)]"
        />
      </div>

      <div className="mt-1 flex justify-between text-[10.5px] text-white/45">
        <span>Empty</span>
        <span>Full</span>
      </div>
    </div>
  );
}
