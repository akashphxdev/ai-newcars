// src/modules/ai/aiFaq/aiFaq.promptBuilder.ts
//
// Builds the prompt sent to the AI provider for FAQ generation. Kept
// as a pure function (no DB access) so it's easy to test on its own
// and swap out later without touching the generation service.

export interface CarFaqPromptInput {
  brandName: string;
  modelName: string;
  bodyType: string | null;
  priceMin: number | null;
  priceMax: number | null;
  variantNames: string[];
  fuelTypes: string[];
  transmissionNames: string[];
  existingQuestions: string[];
  count: number;
  language: string;
}

const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  english: 'Write in clear, simple English.',
  hindi: 'हिंदी में लिखें (Devanagari script), simple aur clear tarike se.',
  hinglish: 'Write in Hinglish (Hindi words in Roman/English script), the way Indian car buyers casually talk.',
};

export function buildAiFaqPrompt(input: CarFaqPromptInput): string {
  const {
    brandName, modelName, bodyType, priceMin, priceMax,
    variantNames, fuelTypes, transmissionNames, existingQuestions, count, language,
  } = input;

  const priceLine =
    priceMin != null && priceMax != null
      ? `Price range: ₹${priceMin.toLocaleString('en-IN')} - ₹${priceMax.toLocaleString('en-IN')} (ex-showroom).`
      : '';

  const avoidLine =
    existingQuestions.length > 0
      ? `Do NOT repeat these already-answered questions:\n${existingQuestions.map((q) => `- ${q}`).join('\n')}`
      : '';

  return [
    `You are an automotive content writer for an Indian car portal.`,
    `Write ${count} frequently-asked-question (FAQ) entries for the ${brandName} ${modelName}${bodyType ? ` (${bodyType})` : ''}.`,
    priceLine,
    variantNames.length ? `Available variants: ${variantNames.join(', ')}.` : '',
    fuelTypes.length ? `Fuel types: ${fuelTypes.join(', ')}.` : '',
    transmissionNames.length ? `Transmissions: ${transmissionNames.join(', ')}.` : '',
    avoidLine,
    LANGUAGE_INSTRUCTIONS[language] ?? LANGUAGE_INSTRUCTIONS.english,
    ``,
    `Cover practical buyer questions — pricing, mileage, safety, features, comparison with rivals, ownership costs — not generic filler.`,
    `Respond with ONLY a JSON array, no other text, in this exact shape:`,
    `[{"question": "...", "answer": "..."}]`,
    `The array must have exactly ${count} item(s). Each answer should be 2-4 sentences.`,
  ]
    .filter(Boolean)
    .join('\n');
}
