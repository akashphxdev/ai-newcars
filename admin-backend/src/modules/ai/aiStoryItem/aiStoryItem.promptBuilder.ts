// src/modules/ai/aiStoryItem/aiStoryItem.promptBuilder.ts
//
// Builds the prompt sent to the AI provider for Story caption
// generation. The image itself always comes from the AI image pool
// (see aiStoryItem.service.ts) — the AI's only job here is writing a
// short caption/description per image, not inventing media.

export interface AiStoryItemPromptInput {
  groupTitle: string;
  existingDescriptions: string[];
  count: number;
  language: string;
}

const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  english: 'Write in clear, simple English.',
  hindi: 'हिंदी में लिखें (Devanagari script), simple aur clear tarike se.',
  hinglish: 'Write in Hinglish (Hindi words in Roman/English script), the way Indian car buyers casually talk.',
};

export function buildAiStoryItemPrompt(input: AiStoryItemPromptInput): string {
  const { groupTitle, existingDescriptions, count, language } = input;

  const avoidLine =
    existingDescriptions.length > 0
      ? `Do NOT repeat these already-used captions:\n${existingDescriptions.map((d) => `- ${d}`).join('\n')}`
      : '';

  return [
    `You are a social-media caption writer for an Indian automotive news portal.`,
    `Write ${count} short story caption(s) for the story group "${groupTitle}".`,
    `Each caption is shown over a car-related image in a mobile "stories" format (like Instagram Stories) — punchy, attention-grabbing, one or two short sentences.`,
    avoidLine,
    LANGUAGE_INSTRUCTIONS[language] ?? LANGUAGE_INSTRUCTIONS.english,
    ``,
    `Respond with ONLY a JSON array, no other text, in this exact shape:`,
    `[{"description": "..."}]`,
    `Rules: description must be max 300 characters, no hashtags, no emojis.`,
    `The array must have exactly ${count} item(s).`,
  ]
    .filter(Boolean)
    .join('\n');
}
