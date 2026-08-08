"use client";

import { useMemo, useState } from "react";
import { carTitle } from "@/lib/format";
import Image from "next/image";
import Link from "next/link";
import {
  BatteryIcon,
  BoltIcon,
  ChevronDownIcon,
  ChevronIcon,
  FuelIcon,
  GaugeIcon,
} from "@/components/common/icons";
import type { HomeCar } from "@/features/cars/car.types";
import { routes } from "@/lib/routes";

const FALLBACK_IMG =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180' viewBox='0 0 320 180'%3E%3Crect width='320' height='180' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-family='sans-serif' font-size='13' fill='%239ca3af'%3EImage unavailable%3C/text%3E%3C/svg%3E";
const ELECTRICITY_RATE = 8;

function batteryNumber(car: HomeCar): number | null {
  const match = car.specs?.batteryCapacity?.match(/[\d.]+/);
  return match ? Number(match[0]) : null;
}

function rangeNumber(car: HomeCar): number | null {
  return car.specs?.range ?? null;
}

function runningCost(car: HomeCar): number | null {
  const battery = batteryNumber(car);
  const range = rangeNumber(car);
  if (!battery || !range) return null;
  return (battery * ELECTRICITY_RATE) / range;
}

function formatBattery(car: HomeCar): string {
  const battery = batteryNumber(car);
  return battery ? `${battery} kWh` : "Not listed";
}

function CarThumb({ car, className = "" }: { car: HomeCar; className?: string }) {
  const [src, setSrc] = useState(car.coverImageUrl ?? FALLBACK_IMG);
  return (
    <Image
      src={src}
      alt={`${carTitle(car)}`}
      fill
      sizes="120px"
      onError={() => setSrc(FALLBACK_IMG)}
      className={`object-contain ${className}`}
    />
  );
}

function RangeBar({ value, max }: { value: number | null; max: number }) {
  const width = value ? Math.max(12, Math.min(100, (value / max) * 100)) : 0;
  return (
    <span className="mt-2 block h-1 w-full overflow-hidden rounded-full bg-ev/10">
      <span className="block h-full rounded-full bg-ev transition-[width] duration-500" style={{ width: `${width}%` }} />
    </span>
  );
}

function MobileRankCard({ car, rank, maxRange }: { car: HomeCar; rank: number; maxRange: number }) {
  const range = rangeNumber(car);
  const cost = runningCost(car);
  return (
    <article className="rounded-[7px] border border-border bg-white p-4">
      <div className="grid grid-cols-[38px_76px_minmax(0,1fr)] items-center gap-3">
        <span className="flex size-8 items-center justify-center rounded-full border border-ev text-[12px] font-extrabold text-ev">{rank}</span>
        <Link href={routes.model(car.brand.slug, car.slug)} className="relative h-14">
          <CarThumb car={car} />
        </Link>
        <div className="min-w-0">
          <p className="truncate text-[10px] font-bold uppercase tracking-[0.08em] text-muted">{car.brand.name}</p>
          <h3 className="truncate text-[14px] font-extrabold text-ink">{car.name}</h3>
          <p className="mt-1 text-[12px] font-bold text-ev">{range ? `${range} km range` : "Range not listed"}</p>
        </div>
      </div>
      <RangeBar value={range} max={maxRange} />
      <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-border-soft pt-3">
        <div><dt className="text-[9px] uppercase text-muted">Battery</dt><dd className="mt-1 truncate text-[11px] font-bold text-ink">{formatBattery(car)}</dd></div>
        <div><dt className="text-[9px] uppercase text-muted">Charge</dt><dd className="mt-1 truncate text-[11px] font-bold text-ink">{car.specs?.chargeTime ?? "Not listed"}</dd></div>
        <div><dt className="text-[9px] uppercase text-muted">Cost / km</dt><dd className="mt-1 text-[11px] font-bold text-ink">{cost ? `₹${cost.toFixed(1)}` : "-"}</dd></div>
      </dl>
    </article>
  );
}

function IntelligenceItem({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3 px-5 py-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-ev/20 bg-white text-ev">{icon}</span>
      <div className="min-w-0">
        <p className="truncate text-[11.5px] font-bold text-ink">{title}</p>
        <p className="mt-1 truncate text-[10px] text-muted">{text}</p>
      </div>
    </div>
  );
}

export default function ElectricCars({ cars }: { cars: HomeCar[] }) {
  const [monthlyDrive, setMonthlyDrive] = useState(1200);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const rankedCars = useMemo(
    () => [...cars].sort((a, b) => (rangeNumber(b) ?? 0) - (rangeNumber(a) ?? 0)).slice(0, 4),
    [cars],
  );
  const maxRange = Math.max(...rankedCars.map((car) => rangeNumber(car) ?? 0), 1);
  const costs = rankedCars.map(runningCost).filter((value): value is number => value != null);
  const averageCost = costs.length ? costs.reduce((sum, value) => sum + value, 0) / costs.length : null;
  const monthlyEstimate = averageCost ? averageCost * monthlyDrive : null;

  if (rankedCars.length === 0) return null;

  return (
    <section className="bg-page py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-[1536px] px-5 sm:px-8 xl:px-10 2xl:px-0">
        <div className="overflow-hidden rounded-[8px] border border-border bg-white shadow-[0_30px_90px_-70px_rgba(17,24,39,0.7)]">
          <div className="grid lg:grid-cols-[44%_56%]">
            <div className="relative min-h-[620px] overflow-hidden sm:min-h-[700px] lg:min-h-[730px]">
              <Image
                src="/design/ev-intelligence-hero.png"
                alt="Electric SUV connected to a mountain-road charging station"
                fill
                sizes="(max-width: 1024px) 100vw, 680px"
                className="object-cover object-center"
              />
              <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.99)_0%,rgba(255,255,255,0.92)_25%,rgba(255,255,255,0.12)_55%,rgba(17,24,39,0.08)_100%)]" />
              <div className="relative z-10 p-7 sm:p-10 lg:p-11">
                <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-ev sm:text-[12px]">
                  <BoltIcon className="size-4" /> EV intelligence
                </p>
                <h2 className="mt-5 max-w-[560px] text-balance font-head text-[39px] font-extrabold leading-[1.02] text-ink sm:text-[48px] xl:text-[52px]">
                  EVs ranked by real range
                </h2>
                <p className="mt-5 max-w-[490px] text-[14px] leading-7 text-muted sm:text-[15px]">
                  Compare range, battery, charging speed, and city-ready running cost before you shortlist.
                </p>
              </div>
              <div className="absolute inset-x-6 bottom-6 z-10 rounded-[7px] border border-white/70 bg-white/92 p-4 shadow-[0_16px_40px_-28px_rgba(17,24,39,0.6)] backdrop-blur-sm sm:inset-x-auto sm:bottom-8 sm:left-8 sm:max-w-[310px]">
                <div className="flex gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ev-soft text-ev"><BoltIcon className="size-5" /></span>
                  <div><p className="text-[12px] font-bold text-ev">Go electric, spend less</p><p className="mt-1 text-[10.5px] leading-5 text-muted">Cost estimates use ₹{ELECTRICITY_RATE}/kWh and each model&apos;s listed battery and range.</p></div>
                </div>
              </div>
            </div>

            <div className="flex min-w-0 flex-col px-5 py-7 sm:px-8 sm:py-9 lg:px-9">
              <div className="flex flex-col gap-4 border-b border-border pb-7 sm:flex-row sm:items-center sm:justify-between">
                <label className="relative flex min-h-16 min-w-[250px] items-center rounded-[7px] border border-border bg-white">
                  <GaugeIcon className="pointer-events-none absolute left-4 size-6 text-ink" />
                  <span className="pointer-events-none absolute left-14 top-2.5 text-[10px] text-muted">Monthly drive</span>
                  <select
                    aria-label="Monthly driving distance"
                    value={monthlyDrive}
                    onChange={(event) => setMonthlyDrive(Number(event.target.value))}
                    className="h-full w-full cursor-pointer appearance-none bg-transparent pb-2 pl-14 pr-11 pt-7 text-[14px] font-extrabold text-ink outline-none"
                  >
                    {[800, 1200, 1600, 2000].map((distance) => <option key={distance} value={distance}>{distance.toLocaleString("en-IN")} km</option>)}
                  </select>
                  <ChevronDownIcon className="pointer-events-none absolute right-4 size-4 text-muted" />
                </label>
                <div className="sm:text-right">
                  <p className="text-[10px] uppercase tracking-[0.1em] text-muted">Estimated monthly charging</p>
                  <p className="mt-1 text-[20px] font-extrabold text-ink">{monthlyEstimate ? `₹${Math.round(monthlyEstimate).toLocaleString("en-IN")}` : "Data pending"}</p>
                  <p className="mt-1 text-[10px] text-muted">Indicative cost for comparison</p>
                </div>
              </div>

              <div className="mt-5 hidden lg:block">
                <div className="grid grid-cols-[40px_70px_minmax(100px,1.2fr)_88px_82px_100px_82px_24px] items-center gap-2 border-b border-border px-2 pb-4 text-[10px] font-bold text-muted">
                  <span>Rank</span><span /><span>Model</span><span>Range</span><span>Battery</span><span>Fast charge</span><span>Cost / km</span><span />
                </div>
                {rankedCars.map((car, index) => {
                  const range = rangeNumber(car);
                  const cost = runningCost(car);
                  const expanded = expandedId === car.id;
                  return (
                    <div key={car.id} className="border-b border-border-soft last:border-b-0">
                      <div className="grid min-h-[112px] grid-cols-[40px_70px_minmax(100px,1.2fr)_88px_82px_100px_82px_24px] items-center gap-2 px-2 py-4">
                        <span className="flex size-8 items-center justify-center rounded-full border border-ev text-[12px] font-extrabold text-ev">{index + 1}</span>
                        <Link href={routes.model(car.brand.slug, car.slug)} className="relative h-16"><CarThumb car={car} /></Link>
                        <div className="min-w-0"><p className="truncate text-[10px] font-bold uppercase text-muted">{car.brand.name}</p><p className="truncate text-[13px] font-extrabold text-ink">{car.name}</p><p className="mt-1 truncate text-[10px] text-muted">{car.bodyType?.name ?? "Electric car"}</p></div>
                        <div><p className="text-[13px] font-extrabold text-ink">{range ? `${range} km` : "-"}</p><RangeBar value={range} max={maxRange} /><p className="mt-1.5 text-[9px] text-muted">{car.specs?.rangeEstimated ? "Estimated" : "Listed"}</p></div>
                        <div><p className="text-[12px] font-bold text-ink">{formatBattery(car)}</p><p className="mt-1 text-[9px] text-muted">Usable data</p></div>
                        <div><p className="line-clamp-2 text-[11px] font-bold leading-4 text-ink">{car.specs?.chargeTime ?? "Not listed"}</p><p className="mt-1 text-[9px] text-muted">Manufacturer stated</p></div>
                        <div><p className="text-[13px] font-extrabold text-ink">{cost ? `₹${cost.toFixed(1)}` : "-"}</p><p className="mt-1 text-[9px] text-ev">estimated</p></div>
                        <button type="button" aria-label={`${expanded ? "Hide" : "Show"} ${car.name} details`} onClick={() => setExpandedId(expanded ? null : car.id)} className="flex size-7 cursor-pointer items-center justify-center text-muted focus-visible:outline-2 focus-visible:outline-brand"><ChevronDownIcon className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`} /></button>
                      </div>
                      {expanded && (
                        <div className="flex items-center justify-between bg-page px-5 py-3 text-[11px] text-muted">
                          <span>{car.specs?.powerPs ? `${car.specs.powerPs} PS` : "Power not listed"} · {car.specs?.topSpeedKmph ? `${car.specs.topSpeedKmph} km/h top speed` : "Top speed not listed"}</span>
                          <Link href={routes.model(car.brand.slug, car.slug)} className="font-bold text-ev no-underline">View model <ChevronIcon className="ml-1 inline size-3" /></Link>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 space-y-3 lg:hidden">
                {rankedCars.map((car, index) => <MobileRankCard key={car.id} car={car} rank={index + 1} maxRange={maxRange} />)}
              </div>

              <div className="mt-auto flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
                <Link href={`${routes.compare()}?fuelType=electric`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[7px] bg-brand px-7 text-[13px] font-bold text-white no-underline transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-brand-hover active:translate-y-0">Compare EVs <ChevronIcon className="size-4" /></Link>
                <Link href={routes.electricCars()} className="inline-flex min-h-12 items-center justify-center gap-2 px-5 text-[12.5px] font-bold text-brand no-underline hover:text-brand-hover">See all electric cars <ChevronIcon className="size-4" /></Link>
              </div>
            </div>
          </div>

          <div className="grid border-t border-border bg-ev-soft/30 sm:grid-cols-3 sm:divide-x sm:divide-border-soft">
            <IntelligenceItem icon={<BatteryIcon className="size-5" />} title="Understand usable range" text="Compare listed range consistently" />
            <IntelligenceItem icon={<BoltIcon className="size-5" />} title="Know your running cost" text="Battery, range, and charging rate" />
            <IntelligenceItem icon={<FuelIcon className="size-5" />} title="Plan charging clearly" text="Check stated charging times" />
          </div>
        </div>
      </div>
    </section>
  );
}
