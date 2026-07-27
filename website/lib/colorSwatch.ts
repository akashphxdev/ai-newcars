// lib/colorSwatch.ts
//
// A colour can be a single shade or a dual/triple-tone combo (e.g. "Nainital
// Nocturne + Black Roof"). Rendering each shade as its own block side by
// side (in a flex row) grows the swatch into a stretched pill instead of
// staying a fixed-size dot, so every shade gets an equal pie-slice of one
// circle via conic-gradient instead — used by every colour dot on the site
// (model page hero overlay, Colours section, photos page picker).
export function buildSwatchBackground(shades: { colorHex: string }[]): string {
  if (shades.length === 0) return "#d1d5db";
  if (shades.length === 1) return shades[0].colorHex;

  const step = 100 / shades.length;
  const stops = shades.map((s, i) => `${s.colorHex} ${(i * step).toFixed(2)}% ${((i + 1) * step).toFixed(2)}%`).join(", ");
  return `conic-gradient(${stops})`;
}
