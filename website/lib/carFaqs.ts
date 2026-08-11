// lib/carFaqs.ts
//
// The questions a buyer types into Google before they type a URL, answered
// from this car's own data.
//
// Every model page has an FAQ section and an FAQPage schema, and the
// `car_faqs` table is empty across the whole catalogue — so both render
// nothing on every car we publish. Hand-writing rows for six hundred
// models would fix today and rot tomorrow: a price rises, a trim is added,
// and the answer on the page is quietly wrong.
//
// These are computed from the same payload the page already renders, so an
// answer cannot contradict the table beside it, and a model gets its FAQs
// the day it is added. An editor's own rows always win — this fills the
// gap, it does not compete.
//
// Nothing here states a figure we do not hold: each question is dropped
// when its data is missing rather than answered with a hedge.

import { formatPriceRange, formatSinglePrice, carTitle, stripPrefix } from "@/lib/format";
import { formatRupee } from "@/lib/calculatorFormat";
import { calculateRunningCost } from "@/lib/mileageMath";
import type { CarDetailResult, CarDetailSelectedVariant, VariantPick } from "@/features/cars/car.types";
import type { MetroFuelPrices, FuelName } from "@/features/fuel/fuel.types";

export interface GeneratedFaq {
  question: string;
  answer: string;
}

const FUEL_NAMES: Record<string, FuelName> = { petrol: "petrol", diesel: "diesel", cng: "cng" };

// The distance the running-cost answer is quoted against. Stated in the
// answer itself, because a cost per month means nothing without it.
const ASSUMED_MONTHLY_KM = 1000;

function list(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function priceAnswer(car: CarDetailResult): GeneratedFaq | null {
  if (!car.priceMin) return null;
  // formatPriceRange marks the figure with an asterisk for the
  // on-page footnote. An answer quoted in search results has no
  // footnote beside it, so the mark is dropped and the caveat is
  // spelled out in the sentence instead.
  const range = formatPriceRange(car.priceMin, car.priceMax).replace("*", "");
  const spread =
    car.priceMax && car.priceMax !== car.priceMin
      ? ` The ${car.variantCount} variants span that range, so the trim you pick moves the price as much as anything else.`
      : "";
  return {
    question: `What is the price of the ${carTitle(car)}?`,
    answer:
      `The ${carTitle(car)} is priced from ${range} ex-showroom.${spread}` +
      " Ex-showroom excludes road tax, registration and insurance, which is why the on-road price in your city is higher.",
  };
}

function onRoadAnswer(car: CarDetailResult): GeneratedFaq | null {
  if (!car.priceMin) return null;
  return {
    question: `What is the on-road price of the ${carTitle(car)}?`,
    answer:
      "On-road price is ex-showroom plus state road tax, registration and insurance, so it changes with where the car is registered —" +
      " road tax alone runs from roughly 6% to 14% of the price depending on the state, fuel and engine size." +
      ` Pick your city on this page and every ${car.name} variant shows its own on-road figure, itemised.`,
  };
}

function mileageAnswer(variant: CarDetailSelectedVariant, car: CarDetailResult): GeneratedFaq | null {
  if (variant.isElectric) {
    const e = variant.electric;
    const claimed = e?.claimedRange;
    if (!claimed) return null;
    const real = e?.realWorldRange;
    return {
      question: `What is the range of the ${carTitle(car)}?`,
      answer:
        `The ${car.name} has a claimed range of ${claimed} km on a full charge${e?.batteryCapacity ? ` from its ${e.batteryCapacity} kWh battery` : ""}.` +
        (real ? ` Expect closer to ${real} km in real driving.` : " Claimed range is a test figure; real-world range depends on speed, air-conditioning and traffic, and is usually lower.") +
        " Range also varies by variant — the figure here is for the trim selected above.",
    };
  }

  const claimed = variant.ice?.claimedFe;
  if (!claimed) return null;
  const unit = FUEL_NAMES[(variant.ice?.fuelType ?? "").toLowerCase()] === "cng" ? "km/kg" : "kmpl";
  return {
    question: `What is the mileage of the ${carTitle(car)}?`,
    answer:
      `The ${car.name} has a claimed fuel efficiency of ${claimed} ${unit}${variant.ice?.fuelType ? ` on ${variant.ice.fuelType.toLowerCase()}` : ""}.` +
      " That is the rated figure; city driving with air-conditioning typically returns less." +
      " Mileage differs by engine and transmission, so check the variant table for the trim you are considering.",
  };
}

function runningCostAnswer(
  variant: CarDetailSelectedVariant,
  car: CarDetailResult,
  metros: MetroFuelPrices[],
): GeneratedFaq | null {
  if (variant.isElectric || !variant.ice) return null;
  const fuel = FUEL_NAMES[(variant.ice.fuelType ?? "").trim().toLowerCase()];
  if (!fuel) return null;

  const mileage = Number(variant.ice.realWorldMileage) > 0 ? Number(variant.ice.realWorldMileage) : Number(variant.ice.claimedFe);
  if (!(mileage > 0)) return null;

  const priced = metros.map((m) => Number(m.prices[fuel]?.price)).filter((p) => p > 0);
  if (!priced.length) return null;

  const cheapest = Math.min(...priced);
  const cost = calculateRunningCost(cheapest, mileage, ASSUMED_MONTHLY_KM);
  return {
    question: `What does the ${carTitle(car)} cost to run?`,
    answer:
      `At ${mileage} ${fuel === "cng" ? "km/kg" : "kmpl"} and today's pump price, the ${car.name} costs about ${formatRupee(cost.costPerKm)} per kilometre —` +
      ` roughly ${formatRupee(cost.monthlyCost)} a month at ${ASSUMED_MONTHLY_KM} km, or ${formatRupee(cost.yearlyCost)} a year.` +
      " That is fuel only: servicing, tyres, insurance and parking are on top, and fuel prices differ by city.",
  };
}

function variantAnswer(car: CarDetailResult, pick: VariantPick): GeneratedFaq | null {
  if (car.variantCount < 2) return null;
  const base = `The ${carTitle(car)} comes in ${car.variantCount} variants${car.priceMin ? `, starting at ${formatSinglePrice(car.priceMin)} ex-showroom` : ""}.`;
  if (!pick.available || !pick.variantName) {
    return { question: `How many variants does the ${carTitle(car)} have?`, answer: base };
  }
  // The entry trim can itself be the best equipped for its price, in which
  // case there is nothing above it to compare against — the answer is that
  // fact, not a fallback to a bare variant count.
  if (!pick.comparedWith) {
    return {
      question: `Which ${carTitle(car)} variant should I buy?`,
      answer:
        `${base} Counted by equipment per rupee, the entry ${stripPrefix(pick.variantName, car.name)} at ${formatSinglePrice(pick.price!)} is already the best equipped for its price —` +
        " nothing above it adds enough kit to justify the step up on equipment alone." +
        " Pick a higher trim for a specific feature you want, not for value.",
    };
  }
  const trim = stripPrefix(pick.variantName, car.name);
  return {
    question: `Which ${carTitle(car)} variant should I buy?`,
    answer:
      `${base} Counted by equipment per rupee, the ${trim} at ${formatSinglePrice(pick.price!)} is the best-equipped for its price —` +
      ` it adds ${pick.comparedWith.extraFeatures} of the features buyers shortlist on over the ${stripPrefix(pick.comparedWith.variantName, car.name)} for ${formatSinglePrice(pick.comparedWith.extraCost)} more.` +
      " That is a starting point, not a verdict: it cannot know whether you want a diesel, an automatic or a sunroof.",
  };
}

function safetyAnswer(car: CarDetailResult, safetyItems: string[]): GeneratedFaq | null {
  if (!safetyItems.length) return null;
  const ncap = safetyItems.find((item) => /ncap/i.test(item));
  const airbags = safetyItems.find((item) => /airbag/i.test(item));
  const lead = [ncap, airbags].filter(Boolean).join(", ");
  return {
    question: `Is the ${carTitle(car)} safe?`,
    answer:
      (lead ? `${lead}. ` : "") +
      `The ${car.name} lists ${safetyItems.length} safety features on the variant selected here, including ${list(safetyItems.slice(0, 4))}.` +
      " Safety kit varies sharply between trims, so check the exact variant rather than assuming the range shares it.",
  };
}

function seatingAnswer(variant: CarDetailSelectedVariant, car: CarDetailResult): GeneratedFaq | null {
  if (!variant.seatingCapacity) return null;
  const boot = variant.dimensions.bootSpace;
  return {
    question: `How many people can the ${carTitle(car)} seat?`,
    answer:
      `The ${car.name} seats ${variant.seatingCapacity}.` +
      (boot ? ` Boot space is ${boot} litres with the rear seats up.` : "") +
      (variant.dimensions.groundClearance ? ` Ground clearance is ${variant.dimensions.groundClearance} mm.` : ""),
  };
}

function colourAnswer(car: CarDetailResult): GeneratedFaq | null {
  if (car.colors.length === 0) return null;
  const names = car.colors.map((c) => c.colorName);
  const paid = car.colors.filter((c) => c.additionalCost && Number(c.additionalCost) > 0);
  return {
    question: `What colours is the ${carTitle(car)} available in?`,
    answer:
      `The ${car.name} is offered in ${car.colors.length} ${car.colors.length === 1 ? "colour" : "colours"}: ${list(names)}.` +
      (paid.length
        ? ` ${paid.length === 1 ? "One finish carries" : `${paid.length} finishes carry`} an extra cost over the standard palette.`
        : ""),
  };
}

function chargingAnswer(variant: CarDetailSelectedVariant, car: CarDetailResult): GeneratedFaq | null {
  if (!variant.isElectric || !variant.electric) return null;
  const e = variant.electric;
  const parts: string[] = [];
  if (e.acChargingTime) parts.push(`about ${e.acChargingTime} hours on AC charging${e.acChargingOutput ? ` at ${e.acChargingOutput} kW` : ""}`);
  if (e.dcFastChargingTime) parts.push(`${e.dcFastChargingTime} on a DC fast charger${e.dcChargingOutput ? ` at ${e.dcChargingOutput} kW` : ""}`);
  if (!parts.length) return null;
  return {
    question: `How long does the ${carTitle(car)} take to charge?`,
    answer:
      `The ${car.name} takes ${list(parts)}.` +
      " DC charging slows noticeably above 80%, so a 10-80% top-up is much quicker than filling the last fifth of the battery.",
  };
}

function engineAnswer(variant: CarDetailSelectedVariant, car: CarDetailResult): GeneratedFaq | null {
  if (variant.isElectric) {
    const e = variant.electric;
    if (!e?.powerPs && !e?.torqueNm) return null;
    return {
      question: `How powerful is the ${carTitle(car)}?`,
      answer:
        `The ${car.name} makes ${[e?.powerPs && `${e.powerPs} PS`, e?.torqueNm && `${e.torqueNm} Nm`].filter(Boolean).join(" and ")}` +
        `${e?.drivetrain ? `, driving the ${e.drivetrain}` : ""}.`,
    };
  }
  const i = variant.ice;
  if (!i?.cubicCapacity && !i?.powerPs) return null;
  const bits = [
    i?.cubicCapacity && `${i.cubicCapacity} cc`,
    i?.fuelType && i.fuelType.toLowerCase(),
    i?.powerPs && `${i.powerPs} PS`,
    i?.torqueNm && `${i.torqueNm} Nm`,
  ].filter(Boolean) as string[];
  return {
    question: `What engine does the ${carTitle(car)} have?`,
    answer:
      `The variant shown here uses a ${bits.slice(0, 2).join(" ")} engine producing ${bits.slice(2).join(" and ")}` +
      `${variant.transmission ? `, paired with a ${variant.transmission.toLowerCase()} gearbox` : ""}.` +
      " Other variants of this model may use a different engine or transmission.",
  };
}

// Ordered the way a buyer asks: what it costs, what it costs to run, what
// you get, then the details. Google shows the first few, so the money
// questions lead.
export function generateCarFaqs(input: {
  car: CarDetailResult;
  variant: CarDetailSelectedVariant | null;
  variantPick: VariantPick;
  metros: MetroFuelPrices[];
  safetyItems: string[];
}): GeneratedFaq[] {
  const { car, variant, variantPick, metros, safetyItems } = input;

  const faqs = [
    priceAnswer(car),
    onRoadAnswer(car),
    variant && mileageAnswer(variant, car),
    variant && runningCostAnswer(variant, car, metros),
    variantAnswer(car, variantPick),
    variant && chargingAnswer(variant, car),
    variant && engineAnswer(variant, car),
    safetyAnswer(car, safetyItems),
    variant && seatingAnswer(variant, car),
    colourAnswer(car),
  ];

  return faqs.filter((faq): faq is GeneratedFaq => faq !== null && faq !== undefined);
}
