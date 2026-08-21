import { prisma } from '../src/prisma/client';

const MAX_MODELS = 20;

const rupeesToLakh = (value: { toString(): string } | null) => {
  if (!value) return null;
  const amount = Number(value.toString());
  if (!Number.isFinite(amount)) return null;
  return `Rs ${(amount / 100000).toFixed(2)} lakh`;
};

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const displayName = (brand: string, model: string) => {
  const cleanModel = model.startsWith(`${brand} `) ? model.slice(brand.length + 1) : model;
  return `${brand} ${cleanModel}`;
};

const listUnique = (values: Array<string | null | undefined>) =>
  [...new Set(values.filter((value): value is string => Boolean(value)))];

const joinList = (values: string[]) => {
  if (values.length <= 1) return values[0] ?? '';
  return `${values.slice(0, -1).join(', ')} and ${values[values.length - 1]}`;
};

const summarizePrice = (min: { toString(): string } | null, max: { toString(): string } | null) => {
  const low = rupeesToLakh(min);
  const high = rupeesToLakh(max);
  if (low && high) return `${low} to ${high}`;
  return low ?? high ?? 'the listed ex-showroom range';
};

function nextDisplayOrders(usedOrders: number[], count: number) {
  const used = new Set(usedOrders);
  const orders: number[] = [];
  let order = 1;
  while (orders.length < count) {
    if (!used.has(order)) orders.push(order);
    order += 1;
  }
  return orders;
}

function buildPowertrainSummary(variants: any[]) {
  const ice = new Map<string, string>();
  const ev = new Map<string, string>();
  let hasCng = false;

  for (const variant of variants) {
    hasCng ||= /cng/i.test(variant.variantName);
    for (const powertrain of variant.icePowertrains) {
      const engine = powertrain.engineDisplacement ? `${powertrain.engineDisplacement.toString()}L` : null;
      const output =
        powertrain.powerPs && powertrain.torqueNm ? `${powertrain.powerPs} PS and ${powertrain.torqueNm} Nm` : null;
      const mileage = powertrain.claimedFe ? `claimed ${powertrain.claimedFe.toString()} km/l` : null;
      const key = [engine, output].filter(Boolean).join(' ');
      if (key) ice.set(key, [engine, output, mileage].filter(Boolean).join(', '));
    }
    for (const powertrain of variant.electricPowertrains) {
      const battery = powertrain.batteryCapacity ? `${powertrain.batteryCapacity.toString()} kWh battery` : null;
      const range = powertrain.claimedRange ? `${powertrain.claimedRange} km claimed range` : null;
      const output =
        powertrain.powerPs && powertrain.torqueNm ? `${powertrain.powerPs} PS and ${powertrain.torqueNm} Nm` : null;
      const key = [battery, range, output].filter(Boolean).join(' ');
      if (key) ev.set(key, [battery, range, output].filter(Boolean).join(', '));
    }
  }

  const parts = [...ice.values(), ...ev.values()].slice(0, 4);
  if (hasCng) parts.push('factory CNG variants where listed');
  return parts.length ? joinList(parts) : 'the listed powertrain options in the current variant data';
}

function buildFaqs(model: any) {
  const name = displayName(model.brand.name, model.name);
  const priceRange = summarizePrice(model.priceMin, model.priceMax);
  const transmissions = joinList(listUnique(model.variants.map((variant: any) => variant.transmission?.name)));
  const lowestVariant = [...model.variants].sort((a: any, b: any) => Number(a.price) - Number(b.price))[0];
  const topSeller = model.variants.find((variant: any) => variant.isTopSeller);
  const sampleVariant = topSeller ?? lowestVariant ?? model.variants[0];
  const dimensions = sampleVariant
    ? [
        sampleVariant.length ? `${sampleVariant.length} mm long` : null,
        sampleVariant.width ? `${sampleVariant.width} mm wide` : null,
        sampleVariant.height ? `${sampleVariant.height} mm tall` : null,
      ].filter(Boolean)
    : [];
  const boot = sampleVariant?.bootSpace ? `${sampleVariant.bootSpace} litres` : null;
  const groundClearance = sampleVariant?.groundClearance ? `${sampleVariant.groundClearance} mm` : null;
  const seats = sampleVariant?.seatingCapacity ?? 5;
  const powertrainSummary = buildPowertrainSummary(model.variants);

  return [
    {
      question: `What is the price range of the ${name}?`,
      answer: `The ${name} is listed from ${priceRange} ex-showroom in the current TimesAuto data. Final on-road prices vary by city, insurance, registration and selected variant, so buyers should confirm the latest quote before booking.`,
    },
    {
      question: `Which powertrain options does the ${name} offer?`,
      answer: `The ${name} variant data includes ${powertrainSummary}. Buyers should compare the fuel or battery option, output and running cost before choosing a variant.`,
    },
    {
      question: `Is the ${name} available with an automatic transmission?`,
      answer: transmissions
        ? `The ${name} lineup lists ${transmissions} transmission options across variants. Automatic variants suit heavy city traffic, while manual variants are worth checking if keeping the purchase price lower is the priority.`
        : `Check the selected ${name} variant carefully because transmission availability changes by trim and powertrain.`,
    },
    {
      question: `How practical is the ${name} for family use?`,
      answer: `The ${name} is listed as a ${seats}-seater${dimensions.length ? ` with dimensions of ${joinList(dimensions)}` : ''}${boot ? ` and ${boot} of boot space` : ''}${groundClearance ? `. Ground clearance is listed at ${groundClearance}` : ''}. Families should compare rear-seat comfort and luggage space on the exact variant they plan to buy.`,
    },
    {
      question: `Which ${name} variant should value-focused buyers start with?`,
      answer: lowestVariant
        ? `Value-focused buyers can start with the ${lowestVariant.variantName}, listed at ${rupeesToLakh(lowestVariant.price)}, then compare the next mid variants for the specific comfort, safety, infotainment or automatic-transmission features they need.`
        : `Value-focused buyers should start with the entry variant, then move up only for features they will use regularly.`,
    },
  ];
}

async function main() {
  const models = await prisma.carModel.findMany({
    where: { launchStatus: 'available', variants: { some: {} } },
    select: {
      id: true,
      name: true,
      priceMin: true,
      priceMax: true,
      brand: { select: { name: true } },
      faqs: { select: { question: true, displayOrder: true } },
      variants: {
        select: {
          variantName: true,
          price: true,
          seatingCapacity: true,
          isTopSeller: true,
          transmission: { select: { name: true } },
          length: true,
          width: true,
          height: true,
          groundClearance: true,
          bootSpace: true,
          icePowertrains: {
            where: { isDeleted: false },
            select: {
              engineDisplacement: true,
              powerPs: true,
              torqueNm: true,
              claimedFe: true,
            },
          },
          electricPowertrains: {
            where: { isDeleted: false },
            select: {
              batteryCapacity: true,
              claimedRange: true,
              powerPs: true,
              torqueNm: true,
            },
          },
        },
        orderBy: [{ isTopSeller: 'desc' }, { price: 'asc' }],
      },
    },
  });

  const staged = await prisma.codexCarFaq.findMany({
    where: { proposalStatus: { in: ['pending', 'rejected'] } },
    select: { modelId: true, question: true, displayOrder: true },
  });

  const stagedByModel = new Map<number, { questions: string[]; orders: number[] }>();
  for (const row of staged) {
    if (!row.modelId) continue;
    const entry = stagedByModel.get(row.modelId) ?? { questions: [], orders: [] };
    entry.questions.push(row.question);
    entry.orders.push(row.displayOrder);
    stagedByModel.set(row.modelId, entry);
  }

  const candidates = models
    .map((model) => {
      const stagedFaqs = stagedByModel.get(model.id) ?? { questions: [], orders: [] };
      const powertrainVariantCount = model.variants.filter(
        (variant) => variant.icePowertrains.length > 0 || variant.electricPowertrains.length > 0,
      ).length;
      return {
        model,
        existingQuestions: new Set([...model.faqs.map((faq) => faq.question), ...stagedFaqs.questions].map(normalize)),
        usedOrders: [...model.faqs.map((faq) => faq.displayOrder), ...stagedFaqs.orders],
        totalFaqs: model.faqs.length + stagedFaqs.questions.length,
        powertrainVariantCount,
      };
    })
    .filter((candidate) => candidate.totalFaqs < 5 && candidate.powertrainVariantCount > 0)
    .sort((a, b) => a.totalFaqs - b.totalFaqs || b.powertrainVariantCount - a.powertrainVariantCount || a.model.id - b.model.id)
    .slice(0, MAX_MODELS);

  const data = [];
  for (const candidate of candidates) {
    const faqs = buildFaqs(candidate.model).filter((faq) => !candidate.existingQuestions.has(normalize(faq.question)));
    if (faqs.length !== 5) continue;
    const orders = nextDisplayOrders(candidate.usedOrders, 5);
    data.push(
      ...faqs.map((faq, index) => ({
        modelId: candidate.model.id,
        question: faq.question,
        answer: faq.answer,
        displayOrder: orders[index],
        isActive: true,
        viewCount: 0,
        proposalStatus: 'pending',
      })),
    );
  }

  if (data.length === 0) {
    console.log(JSON.stringify({ inserted: 0, models: 0, selectedModelIds: [] }));
    return;
  }

  const run = await prisma.codexRun.create({
    data: {
      taskType: 'daily_3pm_car_faqs',
      status: 'running',
      prompt: 'Daily 3 PM FAQ job: stage up to 20 models with exactly 5 buyer FAQs each, skipping existing real and staged questions.',
      sourceUrl: 'Official manufacturer pages and existing TimesAuto structured specs',
    },
    select: { id: true },
  });

  const rows = data.map((row) => ({ ...row, runId: run.id }));
  const result = await prisma.codexCarFaq.createMany({ data: rows });

  await prisma.codexProposalEvent.createMany({
    data: rows.map((row) => ({
      runId: run.id,
      entityType: 'car-faqs',
      action: 'created',
      message: `Staged FAQ for model ${row.modelId}`,
      payload: { modelId: row.modelId, question: row.question },
    })),
  });

  await prisma.codexRun.update({
    where: { id: run.id },
    data: { status: 'completed', finishedAt: new Date() },
  });

  console.log(
    JSON.stringify({
      inserted: result.count,
      models: result.count / 5,
      runId: run.id.toString(),
      selectedModelIds: [...new Set(rows.map((row) => row.modelId))],
    }),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
