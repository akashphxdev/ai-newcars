# TimesAuto — Website

Public-facing frontend, built with **Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4**.

This app has no backend of its own — it reads everything from `admin-backend`'s
public, unauthenticated, Redis-cached API (`admin-backend/src/modules/public/**`,
mounted under `/api/public/v1`). There is no separate `public-backend` service.

```
website (Next.js) ──fetch──▶ admin-backend  /api/public/v1/*  ──reads──▶ PostgreSQL
                                    ▲
                                    └── Redis cache-aside (admin-backend/src/core/cache)
```

## Project structure

```
app/            Routes (App Router). One page.tsx per route, metadata/generateMetadata inline.
components/     Presentational components, grouped by domain:
                  brands/ cars/ cars/reviews/ compare/ bodyTypes/ calculators/
                  articles/ stories/ leads/ home/ common/ (cross-page: Header, Footer,
                  Pagination, AuthModal, PageViewTracker, icons, ...)
features/       Data layer, mirrors components/ by domain. Each folder has:
                  <domain>.api.ts   — server-side fetch functions, calls apiFetch()
                  <domain>.types.ts — response types
lib/            Cross-cutting utilities:
                  apiClient.ts   — the one fetch wrapper every features/*.api.ts must use
                                   (base URL, response envelope, 401 handling, getUploadUrl())
                  routes.ts      — single source of truth for "chromeless" routes
                                   (maintenance page, photo viewer)
                  format.ts, calculatorFormat.ts, emiMath.ts, mileageMath.ts, colorSwatch.ts
public/         Static assets
proxy.ts        Next 16's renamed middleware.ts — currently only gates maintenance mode
next.config.ts  Vanity-URL rewrites (e.g. /tata-motors-cars -> /listing-cars/:slug)
                + next/image remotePatterns allowlist
```

## Routing

Static routes: `/`, `/brands`, `/new-cars`, `/upcoming-cars`, `/electric-cars`, `/stories`,
`/compare-cars`, `/profile`, `/maintenance`, plus finance calculators
(`/car-loan-emi-calculator`, `/car-affordability-calculator`, `/down-payment-calculator`,
`/fuel-comparison-calculator`, `/mileage-calculator`, `/ev-charging-time-calculator`).

Dynamic routes:
- `app/listing-cars/[slug]` — brand or body-type listing
- `app/car-model/[brandSlug]/[modelSlug]` — model overview
- `app/car-model/[brandSlug]/[modelSlug]/[variantSlug]` — full variant specs
- `app/car-model/[brandSlug]/[modelSlug]/photos` — fullscreen photo viewer
- `app/compare/[comparisonSlug]` — a specific two-car comparison
- `app/news/[categorySlug]` and `app/news/[categorySlug]/[articleSlug]`

`next.config.ts` rewrites SEO-friendly vanity URLs (e.g. `/tata-motors-cars/nexon`) to the
real dynamic routes above without changing the visible URL. Rewrite order matters — more
specific literal paths (like `/photos`) must be registered before the wildcard segment they'd
otherwise be shadowed by.

## Data fetching

Every `features/<domain>/<domain>.api.ts` function calls `apiFetch()` / `apiFetchPaginated()`
from `lib/apiClient.ts`, which:
- reads `NEXT_PUBLIC_API_BASE_URL` (see `.env.example`)
- unwraps admin-backend's `{ success, message, data }` response envelope
- throws `ApiError` on failure, clears the stored user on a 401
- exposes `getUploadUrl()` to resolve host-relative upload paths returned by the API

Data is fetched with Next's fetch-level ISR (`{ next: { revalidate: N } }`), tuned per
resource — short TTL for high-churn data (banners, click counts), long TTL for near-static
data (cities, body types). `app/car-model/[brandSlug]/[modelSlug]/page.tsx` also uses
`generateStaticParams` to pre-render the top popular models at build time.

Do not call `fetch()` directly in a new feature — go through `apiClient.ts` so base URL,
envelope parsing, and auth-error handling stay in one place.

## Setup

```bash
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_API_BASE_URL to admin-backend's public API
npm run dev
```

Requires `admin-backend` running locally (default `http://localhost:5000/api/public/v1`).

## Known gaps (as of writing)

- No `app/sitemap.ts` / `app/robots.ts` — sitemap/robots generation isn't implemented yet.
- `admin-backend`/`admin-panel` support managing SEO redirects (`SeoRedirect`), but `proxy.ts`
  doesn't consume them yet — old-URL-to-new-URL redirects aren't served on the live site.
