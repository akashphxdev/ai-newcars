// components/calculators/SliderRow.tsx
//
// A labelled slider with its value in an editable pill and its bounds
// written underneath.
//
// A loan is a set of continuous trade-offs, and a stack of text boxes
// hides that: you cannot feel what a year of tenure costs by typing 6.
// Dragging shows the answer moving, and the pill keeps the exact figure
// reachable for anyone who already knows what they want.

"use client";

export default function SliderRow({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  minLabel,
  maxLabel,
  format,
  prefix,
  suffix,
  hint,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  minLabel: string;
  maxLabel: string;
  format?: (value: number) => string;
  prefix?: string;
  suffix?: string;
  hint?: string;
}) {
  const clamp = (n: number) => Math.min(Math.max(n, min), max);
  const pct = max > min ? ((clamp(value) - min) / (max - min)) * 100 : 0;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[13px] font-semibold text-white/85">{label}</span>
        <span className="flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5">
          {prefix && <span className="text-[12px] font-semibold text-muted">{prefix}</span>}
          <input
            type="text"
            inputMode="numeric"
            value={format ? format(value) : String(value)}
            onChange={(e) => {
              const raw = Number(e.target.value.replace(/[^0-9.]/g, ""));
              if (!Number.isNaN(raw)) onChange(clamp(raw));
            }}
            className="w-[7ch] bg-transparent text-right text-[13.5px] font-bold text-ink outline-none tabular-nums"
            aria-label={label}
          />
          {suffix && <span className="text-[12px] font-semibold text-muted">{suffix}</span>}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={clamp(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className="mt-2.5 h-1.5 w-full cursor-pointer appearance-none rounded-full outline-none
          [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
          [&::-webkit-slider-thumb]:shadow-[0_0_0_3px_var(--color-brand)]
          [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white"
        style={{
          background: `linear-gradient(to right, var(--color-brand) ${pct}%, rgba(255,255,255,0.18) ${pct}%)`,
        }}
      />

      <div className="mt-1.5 flex items-center justify-between text-[10.5px] text-white/45">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
      {hint && <p className="mt-1.5 text-[10.5px] text-white/45">{hint}</p>}
    </div>
  );
}
