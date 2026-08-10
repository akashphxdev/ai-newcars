// components/cars/ModelSidebar.tsx
//
// The rail that runs beside everything below the model hero.
//
// It carries the things a reader reaches for while still deciding — the
// tools priced against this car, the ways to see it beside something
// else — plus an ad slot. Sticky, because those questions arrive at any
// point down a long page, not only at the top.

import Link from "next/link";
import { ChevronIcon } from "@/components/common/icons";
import { SidebarAdSlot } from "@/components/common/PageSidebar";
import { formatSinglePrice, carTitle } from "@/lib/format";
import { routes } from "@/lib/routes";
import type { CarDetailResult, CarDetailSelectedVariant } from "@/features/cars/car.types";

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <p className="border-b border-border-soft px-4 py-3 text-[12px] font-bold uppercase tracking-[0.1em] text-muted">
        {title}
      </p>
      {children}
    </div>
  );
}

function Row({ href, label, note }: { href: string; label: string; note?: string }) {
  return (
    <li className="border-b border-border-soft last:border-b-0">
      <Link
        href={href}
        className="flex items-center justify-between gap-3 px-4 py-3 no-underline transition-colors hover:bg-page"
      >
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-semibold text-ink">{label}</span>
          {note && <span className="block truncate text-[11px] text-muted">{note}</span>}
        </span>
        <ChevronIcon dir="right" className="size-3.5 shrink-0 text-faint" />
      </Link>
    </li>
  );
}

export default function ModelSidebar({
  car,
  variant,
}: {
  car: CarDetailResult;
  variant: CarDetailSelectedVariant | null;
}) {
  const name = carTitle(car);
  const bodyType = car.bodyType;

  return (
    <div className="space-y-5">
      <Block title={`Work out the ${car.name}`}>
        <ul>
          <Row
            href={routes.emiCalculator()}
            label="Monthly EMI"
            note={variant ? `On ${formatSinglePrice(variant.price)} ex-showroom` : "What it costs a month"}
          />
          <Row href={routes.downPaymentCalculator()} label="Down payment" note="What to put down" />
          <Row href={routes.mileageCalculator()} label="Running cost" note="What every km costs" />
          {variant?.isElectric ? (
            <Row href={routes.evChargingCalculator()} label="Charging time" note="How long a charge takes" />
          ) : (
            <Row
              href={routes.fuelComparisonCalculator()}
              label="Petrol vs diesel vs CNG"
              note="Which fuel pays off"
            />
          )}
        </ul>
      </Block>

      <SidebarAdSlot id="model-page" />

      <Block title="See it beside others">
        <ul>
          <Row href={routes.compare()} label={`Compare the ${car.name}`} note="Two models side by side" />
          {bodyType && (
            <Row
              href={routes.bodyType(bodyType.slug)}
              label={`Other ${bodyType.name}s`}
              note={`Every ${bodyType.name.toLowerCase()} on sale`}
            />
          )}
          <Row href={routes.brand(car.brand.slug)} label={`All ${car.brand.name} cars`} note="The full lineup" />
          <Row href={routes.modelPhotos(car.brand.slug, car.slug)} label={`${name} photos`} note={`${car.images.length} images`} />
        </ul>
      </Block>
    </div>
  );
}
