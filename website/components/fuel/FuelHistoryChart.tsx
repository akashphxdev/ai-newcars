import type { FuelHistory, FuelName } from "@/features/fuel/fuel.types";
import { FUEL_LABELS, formatFuelPrice } from "@/lib/fuel";

const FUELS: FuelName[] = ["petrol", "diesel", "cng"];
const COLOR: Record<FuelName, string> = {
  petrol: "#f2650f",
  diesel: "#374151",
  cng: "#0d9488",
};

function formatDay(day: string): string {
  const date = new Date(`${day}T00:00:00`);
  if (Number.isNaN(date.getTime())) return day;
  return new Intl.DateTimeFormat("en-IN", { month: "short", day: "2-digit" }).format(date);
}

export default function FuelHistoryChart({
  histories,
  cityName,
}: {
  histories: Partial<Record<FuelName, FuelHistory | null>>;
  cityName: string;
}) {
  const series = FUELS.map((fuel) => ({
    fuel,
    points: (histories[fuel]?.series ?? [])
      .map((point) => ({ ...point, numericPrice: Number(point.price) }))
      .filter((point) => Number.isFinite(point.numericPrice)),
  })).filter((item) => item.points.length > 0);

  const allValues = series.flatMap((item) => item.points.map((point) => point.numericPrice));
  if (allValues.length === 0) return null;

  const width = 760;
  const height = 250;
  const left = 48;
  const right = 78;
  const top = 24;
  const bottom = 38;
  const min = Math.floor((Math.min(...allValues) - 3) / 5) * 5;
  const max = Math.ceil((Math.max(...allValues) + 3) / 5) * 5;
  const range = Math.max(max - min, 5);
  const maxLength = Math.max(...series.map((item) => item.points.length));
  const x = (index: number) => left + (index / Math.max(maxLength - 1, 1)) * (width - left - right);
  const y = (value: number) => top + ((max - value) / range) * (height - top - bottom);
  const ticks = Array.from({ length: 5 }, (_, index) => min + (range / 4) * index).reverse();
  const longest = series.reduce((current, item) => item.points.length > current.points.length ? item : current, series[0]);
  const dateIndices = [0, Math.floor((longest.points.length - 1) / 2), longest.points.length - 1];

  return (
    <section className="rounded-[8px] border border-border bg-surface p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-head text-[20px] font-bold text-ink">30-day price trend</h2>
          <p className="mt-1 text-[11px] text-muted">Retail price per litre / kg in {cityName}</p>
        </div>
        <div className="flex flex-wrap gap-4">
          {series.map(({ fuel }) => (
            <span key={fuel} className="flex items-center gap-2 text-[10px] font-semibold text-muted">
              <span className="h-0.5 w-5" style={{ backgroundColor: COLOR[fuel] }} /> {FUEL_LABELS[fuel]}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-auto min-w-[640px] w-full" role="img" aria-label={`30-day fuel price trends in ${cityName}`}>
          {ticks.map((tick) => {
            const tickY = y(tick);
            return (
              <g key={tick}>
                <line x1={left} y1={tickY} x2={width - right} y2={tickY} stroke="#e5e7eb" strokeWidth="1" />
                <text x={left - 10} y={tickY + 4} textAnchor="end" fill="#6b7280" fontSize="10">₹{tick.toFixed(0)}</text>
              </g>
            );
          })}

          {dateIndices.map((index) => {
            const point = longest.points[index];
            if (!point) return null;
            return (
              <text key={`${point.day}-${index}`} x={x(index)} y={height - 10} textAnchor={index === 0 ? "start" : index === longest.points.length - 1 ? "end" : "middle"} fill="#6b7280" fontSize="10">
                {formatDay(point.day)}
              </text>
            );
          })}

          {series.map(({ fuel, points }) => {
            const path = points.map((point, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(1)} ${y(point.numericPrice).toFixed(1)}`).join(" ");
            const last = points[points.length - 1];
            const lastX = x(points.length - 1);
            const lastY = y(last.numericPrice);
            return (
              <g key={fuel}>
                <path d={path} fill="none" stroke={COLOR[fuel]} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx={lastX} cy={lastY} r="4" fill={COLOR[fuel]} />
                <text x={lastX + 10} y={lastY + 4} fill={COLOR[fuel]} fontSize="10" fontWeight="700">
                  {formatFuelPrice(last.price)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-4 grid gap-2 border-t border-border-soft pt-4 sm:grid-cols-3">
        {series.map(({ fuel, points }) => {
          const first = points[0]?.numericPrice ?? 0;
          const last = points[points.length - 1]?.numericPrice ?? 0;
          const movement = last - first;
          return (
            <p key={fuel} className="text-[10px] text-muted">
              <span className="font-bold text-ink">{FUEL_LABELS[fuel]}</span>{" "}
              {Math.abs(movement) < 0.005 ? "unchanged" : `${movement > 0 ? "up" : "down"} ₹${Math.abs(movement).toFixed(2)}`} over 30 days
            </p>
          );
        })}
      </div>
    </section>
  );
}
