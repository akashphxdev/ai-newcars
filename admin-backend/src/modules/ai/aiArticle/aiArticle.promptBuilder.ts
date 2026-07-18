// src/modules/ai/aiArticle/aiArticle.promptBuilder.ts
//
// Builds the prompt sent to the AI provider for Article generation.
// Same pure-function shape as aiFaq.promptBuilder.ts — no DB access,
// easy to test/swap on its own.

export interface AiArticlePromptInput {
  brandName: string;
  categoryName: string;
  existingTitles: string[];
  count: number;
  language: string;
}

const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  english: 'Write in clear, simple English.',
  hindi: 'हिंदी में लिखें (Devanagari script), simple aur clear tarike se.',
  hinglish: 'Write in Hinglish (Hindi words in Roman/English script), the way Indian car buyers casually talk.',
};

export function buildAiArticlePrompt(input: AiArticlePromptInput): string {
  const { brandName, categoryName, existingTitles, count, language } = input;

  const avoidLine =
    existingTitles.length > 0
      ? `Do NOT repeat these already-published titles/topics:\n${existingTitles.map((t) => `- ${t}`).join('\n')}`
      : '';

  return [
    `You are an automotive content writer for an Indian car portal.`,
    `Write ${count} article(s) about "${brandName}" cars, for the "${categoryName}" content category.`,
    `Each article can be brand-wide (e.g. "5 things to know before buying a ${brandName}") — do not invent a specific model name unless it is a well-known real ${brandName} model sold in India.`,
    avoidLine,
    LANGUAGE_INSTRUCTIONS[language] ?? LANGUAGE_INSTRUCTIONS.english,
    ``,
    `Write for Indian car buyers — practical, factual, no filler.`,
    ``,
    `The "body" field is rendered directly in a rich-text editor on the site, so it MUST be HTML (not markdown, not plain text) — do not repeat the article title as an <h1> inside the body, that's shown separately by the page itself. Structure it like this real example (same tags, same nesting):`,
    `<p>Opening paragraph that introduces the topic.</p><h2>First Section Heading</h2><p>Paragraph content for this section.</p><h2>Another Section Heading</h2><p>More content.</p><ul><li><p>Bullet point one</p></li><li><p>Bullet point two</p></li></ul><h2>Pros</h2><ul><li><p>Pro one</p></li></ul><h2>Cons</h2><ul><li><p>Con one</p></li></ul><h2>Verdict</h2><p>Closing summary paragraph.</p>`,
    `Rules for the body's HTML: only use <h2>, <p>, <ul>, <li> tags (wrap each <li>'s text in its own <p>, exactly like the example — this is how the editor stores list items). Use 6-10 <h2> sections with headings relevant to THIS specific topic (not always "Pros/Cons/Verdict" — only include those where they genuinely fit, e.g. skip them for a "top 5 SUVs" listicle). Each section should have at least 2-3 sentences of substantive content, not just one short line. Aim for at least 500-700 words in the body overall. No markdown (no #, no **, no -). The whole body must be one continuous string with no literal line breaks — the HTML tags themselves provide the structure.`,
    `Respond with ONLY a JSON array, no other text, in this exact shape and exact field order (put the short fields first, "body" LAST — this matters, do not reorder):`,
    `[{"title": "...", "slug": "...", "excerpt": "...", "metaTitle": "...", "metaDescription": "...", "metaKeywords": "...", "body": "..."}]`,
    `All 7 fields are MANDATORY on every item. Do NOT omit "metaTitle", "metaDescription", or "metaKeywords" even though "body" is the longest field — write those three short fields first, then write "body".`,
    `Rules for the other fields:`,
    `- title: max 200 characters, no clickbait.`,
    `- slug: lowercase, hyphen-separated, derived from the title, max 200 characters, only [a-z0-9-].`,
    `- excerpt: max 300 characters, a one-line summary, plain text (no HTML).`,
    `- metaTitle: max 160 characters, plain text.`,
    `- metaDescription: max 300 characters, plain text.`,
    `- metaKeywords: max 255 characters, comma-separated keywords, plain text.`,
    `The array must have exactly ${count} item(s).`,
  ]
    .filter(Boolean)
    .join('\n');
}