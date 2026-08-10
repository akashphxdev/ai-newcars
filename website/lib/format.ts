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
// Values arrive HTML-escaped from the CMS ("Front &amp; Rear") and some
// of them are the string "Not Available", which the overview rendered
// with a tick beside it — a list that claimed the car had the safety kit
// it explicitly lacks.
const ABSENT = /^(not available|na|n\/a|no|none|-)$/i;

export function isFeaturePresent(item: { value: string | null }): boolean {
  const v = (item.value ?? "").trim();
  return v === "" || !ABSENT.test(v);
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

export function featureLabel(item: { name: string; value: string | null }): string {
  const name = decodeEntities(item.name);
  const value = item.value ? decodeEntities(item.value).trim() : "";
  // A bare feature name means "fitted"; a value adds what kind — unless
  // the name already says it: "6 Airbags" + "6" was printing "6 Airbags: 6".
  if (!value) return name;
  const token = new RegExp(`(^|\\W)${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\W|$)`, "i");
  return token.test(name) ? name : `${name}: ${value}`;
}

// Model names in the catalogue already carry the brand ("Maruti Suzuki
// Victoris", "BMW X6"), so composing brand + name yields "Maruti Suzuki
// Maruti Suzuki Victoris". Every caller that needs a full car label goes
// through here rather than re-deriving the rule.
export function carTitle(car: { name: string; brand: { name: string } }): string {
  const brand = car.brand.name.trim();
  const name = car.name.trim();
  return name.toLowerCase().startsWith(brand.toLowerCase()) ? name : `${brand} ${name}`;
}

// The inverse of carTitle. Inside a brand- or model-scoped control the
// prefix is already established by the control above it, so repeating it
// only pushes the part that distinguishes the option out of view —
// "Maruti Suzuki Victoris" in a model select under a Maruti brand select
// truncates to "Maruti Suzuki Vic".
export function stripPrefix(text: string, prefix: string): string {
  const value = text.trim();
  const lead = prefix.trim();
  if (!lead || !value.toLowerCase().startsWith(lead.toLowerCase())) return value;
  return value.slice(lead.length).trim() || value;
}

// Features buyers actually shortlist on, in the order they tend to matter.
// The overview shows only the first few of each group, and the catalogue's
// own order is not meaningful — so without this the Nexon led with
// "Accessory Power Outlet" while its sunroof sat fifteenth.
//
// Substring matched, because the catalogue writes the same feature several
// ways ("Sunroof", "Voice assisted sunroof", "Sunroof: Panoramic").
const FEATURE_PRIORITY = [
  "adas",
  "blind spot",
  "emergency braking",
  "360",
  "camera",
  "airbag",
  "sunroof",
  "ventilated",
  "climate control",
  "cruise control",
  "digital cluster",
  "touchscreen",
  "android auto",
  "carplay",
  "wireless charg",
  "connected",
  "drive mode",
  "keyless",
  "parking sensor",
];

function featureRank(label: string): number {
  const l = label.toLowerCase();
  const i = FEATURE_PRIORITY.findIndex((k) => l.includes(k));
  return i === -1 ? FEATURE_PRIORITY.length : i;
}

// Stable: equally-ranked features keep the catalogue's order rather than
// being shuffled into a different arbitrary one.
export function byFeatureInterest(a: string, b: string): number {
  return featureRank(a) - featureRank(b);
}
