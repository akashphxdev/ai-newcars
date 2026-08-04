// lib/format.ts
//
// admin-backend's CarModel.priceMin/priceMax are stored (and returned by
// the public API) in plain rupees, e.g. "1449000" — the website always
// displays these in Lakh, so every price-showing card converts through
// this one place instead of re-deriving the /100000 math locally.

function toLakh(rupees: string | null): string | null {
  if (!rupees) return null;
  const n = Number(rupees);
  if (Number.isNaN(n)) return null;
  return (n / 100000).toFixed(2);
}

export function formatPriceRange(priceMin: string | null, priceMax: string | null): string {
  const min = toLakh(priceMin);
  const max = toLakh(priceMax);
  if (!min || !max) return "Price on request";
  return `₹${min} - ${max} Lakh*`;
}

export function formatSinglePrice(priceMin: string | null, fallback = "-"): string {
  const lakh = toLakh(priceMin);
  return lakh ? `₹${lakh}L` : fallback;
}

// CarVariant has no dedicated slug column (schema stays untouched per
// project rule) — variant URLs derive one from variantName on the fly,
// matched back the same way when resolving a URL to a variant.
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Shared by the model page's Overview cards and the variant page's
// Features/Safety lists — a feature with a value reads as "Name: Value"
// (e.g. "Airbags: 6"), a plain toggle feature (e.g. "Sunroof") just as its name.
export function featureLabel(item: { name: string; value: string | null }): string {
  return item.value ? `${item.name}: ${item.value}` : item.name;
}
