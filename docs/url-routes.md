# URL scheme — proposed

**Status: draft for approval. Nothing implemented.**

Nothing is indexed yet — no `robots.txt`, no `sitemap.xml`, `sitemap_entries`
and `seo_redirects` both empty — so paths can be replaced outright. No
redirect map, no `seo_redirects` plumbing. That stops being true the moment
Google discovers the site, which is why this is worth settling first.

## What is wrong today

| Problem | Detail |
|---|---|
| Shared namespace | `/:slug-cars` resolves to **either** a brand or a body type, decided at render time. 77 brand slugs and 14 body-type slugs share one namespace with nothing preventing a collision. |
| Wildcard trap | `/:brand-cars/:model/:variantSlug` swallows any third segment. `/photos` only works because it is registered first. Adding `/reviews`, `/colours` or `/on-road-price` later silently 404s as a variant lookup. |
| Variant slugs are not stored | `car_variants` has no slug column; the URL is generated client-side with `slugify(variantName)`. No collisions today, but renaming a variant silently changes its URL, and resolution is a lossy reverse match against the name. |
| Polluted taxonomy | `body_types` contains `diesel-engines`, `hybrids`, `luxury`, `luxury-vehicles` — fuel types and segments, not body types. `luxury` and `luxury-vehicles` duplicate each other. |
| No SEO surface | `robots.txt` and `sitemap.xml` both 404. `seo_meta` has 7 rows for 455 models. |

## Proposed scheme

Keyword-rich brand paths are kept — "tata cars" is a real search query and
the pattern matches CarWale and CarDekho. Body types move under `/new-cars/`,
which is what they actually are: filtered listings of new cars.

| Page | Now | Proposed |
|---|---|---|
| Brand listing | `/tata-cars` | `/tata-cars` *(unchanged)* |
| Body type | `/suv-cars` | **`/new-cars/suv`** |
| Segment | — | **`/new-cars/segment/luxury`** |
| Model | `/tata-cars/nexon` | `/tata-cars/nexon` *(unchanged)* |
| Variant | `/tata-cars/nexon/xz-plus` | **`/tata-cars/nexon/variant/xz-plus`** |
| Photos | `/tata-cars/nexon/photos` | `/tata-cars/nexon/photos` *(now safe)* |
| On-road price | — | **`/tata-cars/nexon/on-road-price/jaipur`** |
| Expert review | — | **`/tata-cars/nexon/review`** |
| Owner reviews | — | **`/tata-cars/nexon/user-reviews`** |
| News article | `/news/[cat]/[slug]` | *(unchanged)* |
| Comparison | `/compare/[a]-vs-[b]` | *(unchanged)* |

What this buys:

- **Namespace split.** Brands own `/*-cars`; body types and segments live
  under `/new-cars/`. A brand and a body type can no longer collide.
- **Third segments freed.** Pinning variants behind the literal `variant`
  means `photos`, `review`, `user-reviews` and `on-road-price` can be added
  without ordering games. This is the change that pays off repeatedly.
- **Room for the high-intent pages** v3cars already ranks for — on-road price
  by city is the biggest long-tail opportunity in the Indian market.

## The one open decision: rewrites

`/tata-cars` cannot be a folder — a Next.js dynamic segment must be a whole
path segment, so `[brand]-cars` is not expressible. Keeping the vanity path
needs one of:

1. **One rewrite** `/:brand-cars → /brand/:brand` (down from four today).
   Keeps the SEO-friendly URL. A rewrite is internal path mapping, not a
   redirect — unrelated to the indexing question.
2. **A catch-all** `/[...slug]` resolved in code, which is what v3cars does.
   No rewrite, but every unmatched path in the app now routes through it.
3. **Drop the vanity path** for `/cars/tata`. No rewrite at all, but loses
   the "tata cars" keyword in the URL.

Recommendation: **option 1.** One rewrite for the brand vanity path, none for
anything else — body types, segments, variants and price pages all become
real folders.

## Alongside this

- **`robots.txt` + generated `sitemap.xml`.** Highest-value item here
  regardless of the URL decision — right now the site cannot be discovered.
  A route handler generating the sitemap from the database beats populating
  `sitemap_entries` by hand.
- **Add `slug` to `car_variants`** so variant URLs are stored, not derived.
  Schema change, so the SQL goes to you rather than being run here.
- **Split the body-type taxonomy** — move `diesel-engines`/`hybrids` to fuel
  type, `luxury`/`luxury-vehicles` to segment, and drop the duplicate.

## Blast radius

13 files build `-cars` URLs from template literals, 4 build `/news/` links.
All are `` `/${slug}-cars` ``-style constructions, so the change is
mechanical — but it should go through one helper rather than 13 call sites,
so the next change is a one-line edit.
