// features/seo/seo.api.ts
//
// Fetches admin-managed SEO meta (title/description/OG/JSON-LD) for a
// page. Every route's generateMetadata() should go through getSeoMeta()
// rather than hardcoding copy, so an editor can change it from the admin
// panel without a code deploy.

import type { Metadata } from "next";
import { apiFetch, getUploadUrl } from "@/lib/apiClient";
import { SEO_PAGE_TYPE } from "./seo.types";
import type { PublicSeoMeta, PublicSeoRedirect, SeoMetaQuery, SeoPageType } from "./seo.types";

export async function getSeoMeta(query: SeoMetaQuery): Promise<PublicSeoMeta | null> {
  const params = new URLSearchParams({ pageType: String(query.pageType) });
  if (query.entityId != null) params.set("entityId", String(query.entityId));
  if (query.staticPageSlug) params.set("staticPageSlug", query.staticPageSlug);

  try {
    return await apiFetch<PublicSeoMeta | null>(`/seo/meta?${params.toString()}`, { next: { revalidate: 300 } });
  } catch {
    // A slow/failed SEO lookup should never take down the page it's only
    // meant to decorate — every caller already treats `null` here the
    // same as "admin hasn't configured this page yet" and falls back to
    // its own built-in copy, so swallowing the error degrades gracefully
    // instead of crashing the whole route.
    return null;
  }
}

// Called from proxy.ts on every request (see admin panel's SEO > Redirects)
// to check the current path against every active old-URL -> new-URL rule.
// Never throws — a failed lookup should never block navigation, same
// fail-open reasoning as proxy.ts's own maintenanceMode check.
export async function getActiveRedirects(): Promise<PublicSeoRedirect[]> {
  try {
    return await apiFetch<PublicSeoRedirect[]>("/seo/redirects", { next: { revalidate: 60 } });
  } catch {
    return [];
  }
}

// Admin's robotsMeta is a free-typed string (e.g. "index,follow" or
// "noindex,nofollow") — Next's Metadata.robots wants booleans. Defaults to
// index+follow when unset, since an unconfigured page should still be
// crawlable rather than accidentally hidden from search engines.
export function parseRobotsMeta(robotsMeta: string | null): Metadata["robots"] {
  if (!robotsMeta) return { index: true, follow: true };
  const directives = robotsMeta.toLowerCase();
  return {
    index: !directives.includes("noindex"),
    follow: !directives.includes("nofollow"),
  };
}

// <link rel="canonical"> value: admin's explicit URL if they set one,
// otherwise the page's own real path — a page should never ship without a
// canonical just because an editor left the field blank. Works as either
// a relative path (resolved against metadataBase) or an absolute URL, per
// Next's URL composition rules.
export function resolveCanonical(canonicalUrl: string | null | undefined, pagePath: string): string {
  return canonicalUrl?.trim() || pagePath;
}

// Generic {{token}} substitution for any SeoMeta text/schema field. Used
// both by entity pages (a Brand/Model/Variant/BodyType/NewsCategory row —
// specific or the shared "default template" for that pageType, see
// getSeoMeta's entityId fallback) and by fillComparePlaceholders below.
// Any token in `value` that isn't in `vars` is stripped rather than left
// as literal "{{...}}" text — the admin's default template can reasonably
// reference a token that doesn't apply to every entity of that type (e.g.
// a variant-only token reused on a model-level default).
export function fillPlaceholders(value: string | null | undefined, vars: Record<string, string>): string | null {
  if (!value) return null;
  let result = value;
  for (const [key, val] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, val);
  }
  return result.replace(/\{\{[a-zA-Z0-9_]+\}\}/g, "");
}

// Escapes a value for safe insertion into a JSON string's text content.
// fillSchemaPlaceholders below uses this so a name containing a raw
// quote, backslash, newline, or other JSON-breaking character (rare, but
// not impossible — e.g. a variant name with an inches mark, or a pasted
// multi-line value) can't corrupt the schema JSON it's substituted into;
// without it, SeoJsonLd's JSON.parse would fail and silently drop the
// whole schema. JSON.stringify already implements every JSON escape
// correctly (not just \ and "), so this reuses it rather than
// hand-maintaining a partial list of characters to escape.
function escapeForJsonString(value: string): string {
  return JSON.stringify(value).slice(1, -1);
}

// Same substitution as fillPlaceholders, but for filling {{tokens}} into
// a schema (JSON-LD) field specifically, where the result must still be
// valid JSON afterwards — every `vars` value is JSON-escaped first. Plain
// text fields (title/description/keywords/OG) don't need this since
// they're never re-parsed as JSON.
export function fillSchemaPlaceholders(value: string | null | undefined, vars: Record<string, string>): string | null {
  const escapedVars = Object.fromEntries(Object.entries(vars).map(([key, val]) => [key, escapeForJsonString(val)]));
  return fillPlaceholders(value, escapedVars);
}

// "compare-detail" is the one shared SeoMeta template used by every
// /compare/[slug] pair (see the STATIC_PAGE_SLUG_OPTIONS comment in
// admin-panel/lib/lookups.ts) — its text/schema fields carry {{car1_name}}/
// {{car1_slug}} .. {{car4_name}}/{{car4_slug}} tokens (a comparison can have
// 2-4 cars, see MAX_CARS in the comparison page) that admins fill in
// instead of writing one row per comparison. This fills them in with the
// actual cars being viewed, in order, before the value is used anywhere.
function compareVars(cars: { name: string; slug: string }[]): Record<string, string> {
  const vars: Record<string, string> = {};
  cars.forEach((car, i) => {
    const n = i + 1;
    vars[`car${n}_name`] = car.name;
    vars[`car${n}_slug`] = car.slug;
  });
  return vars;
}

export function fillComparePlaceholders(value: string | null | undefined, cars: { name: string; slug: string }[]): string | null {
  return fillPlaceholders(value, compareVars(cars));
}

// Schema-safe counterpart of fillComparePlaceholders — use this one when
// filling {{tokens}} into a compare-detail schema (JSON-LD) field.
export function fillCompareSchemaPlaceholders(value: string | null | undefined, cars: { name: string; slug: string }[]): string | null {
  return fillSchemaPlaceholders(value, compareVars(cars));
}

// All JSON-LD fields on a SeoMeta record, in one array — for
// <SeoJsonLd schemas={...}>, which renders whichever ones are non-null.
// A page doesn't need to reason about which schema types apply to it;
// that's the admin's call when they fill in that page's SeoMeta row.
//
// `exclude` drops specific fields — for pages where a schema type is
// instead auto-generated in code from real, existing data (see
// lib/schema.ts's buildFaqPageSchema), so the admin-authored version
// never renders alongside a second one for the same schema.org type.
const SCHEMA_KEYS = ["vehicleSchema", "reviewSchema", "articleSchema", "authorSchema", "breadcrumbSchema"] as const;

export function getAllSchemas(seo: PublicSeoMeta | null, exclude: (typeof SCHEMA_KEYS)[number][] = []): (string | null)[] {
  if (!seo) return [];
  return SCHEMA_KEYS.filter((key) => !exclude.includes(key)).map((key) => seo[key]);
}

// Shared generateMetadata() body for every static page (home, brands,
// calculators, ...). Fetches that page's admin-managed SeoMeta row and
// merges it over the given fallback — a page keeps working with sensible
// copy even before an editor has filled in its SEO, and picks up the
// admin's values automatically once they do.
export async function getStaticPageMetadata(
  staticPageSlug: string,
  fallback: { title: string; description: string; robots?: Metadata["robots"] },
  pagePath: string,
): Promise<Metadata> {
  const seo = await getSeoMeta({ pageType: SEO_PAGE_TYPE.STATIC, staticPageSlug });

  const title = seo?.metaTitle ?? fallback.title;
  const description = seo?.metaDescription ?? fallback.description;
  const ogImage = getUploadUrl(seo?.ogImage);

  return {
    title,
    description,
    keywords: seo?.metaKeywords ?? undefined,
    alternates: { canonical: resolveCanonical(seo?.canonicalUrl, pagePath) },
    robots: seo?.robotsMeta ? parseRobotsMeta(seo.robotsMeta) : (fallback.robots ?? parseRobotsMeta(null)),
    openGraph: {
      title: seo?.ogTitle ?? title,
      description: seo?.ogDescription ?? description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

// Shared generateMetadata() body for entity pages (Brand/Model/Variant/
// BodyType/NewsCategory listing — see SEO_PAGE_TYPE). getSeoMeta already
// falls back from an entity-specific row to that pageType's shared
// "default template" row server-side (entityId: null), so most entities
// never need their own row — `vars` fills in whichever {{tokens}} that
// template (or a specific row) uses.
//
// Canonical is always this entity's own real path, never the admin's
// value — many entities can share one default-template row, so trusting
// its canonicalUrl would point all of them at the same URL.
export async function getEntityPageMetadata(
  pageType: SeoPageType,
  entityId: number,
  vars: Record<string, string>,
  fallback: { title: string; description: string },
  canonicalPath: string,
): Promise<Metadata> {
  const seo = await getSeoMeta({ pageType, entityId });

  const title = fillPlaceholders(seo?.metaTitle, vars) ?? fallback.title;
  const description = fillPlaceholders(seo?.metaDescription, vars) ?? fallback.description;
  const ogImage = getUploadUrl(seo?.ogImage);

  return {
    title,
    description,
    keywords: fillPlaceholders(seo?.metaKeywords, vars) ?? undefined,
    alternates: { canonical: canonicalPath },
    robots: parseRobotsMeta(seo?.robotsMeta ?? null),
    openGraph: {
      title: fillPlaceholders(seo?.ogTitle, vars) ?? title,
      description: fillPlaceholders(seo?.ogDescription, vars) ?? description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

// JSON-LD schemas for an entity page, tokens already filled in — pairs
// with getEntityPageMetadata (same pageType/entityId/vars), for
// <SeoJsonLd schemas={...}> in the page component.
export async function getEntitySchemas(
  pageType: SeoPageType,
  entityId: number,
  vars: Record<string, string>,
  exclude: (typeof SCHEMA_KEYS)[number][] = [],
): Promise<(string | null)[]> {
  const seo = await getSeoMeta({ pageType, entityId });
  return getAllSchemas(seo, exclude).map((s) => fillSchemaPlaceholders(s, vars));
}
