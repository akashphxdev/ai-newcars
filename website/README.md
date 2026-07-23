# TimesAuto — Public Backend

Node.js + TypeScript + Express + Prisma + PostgreSQL + Redis.

This is a **separate service from `admin-backend`**, deployed separately,
scaled separately. It only reads from the same PostgreSQL database
(never runs migrations) and exists purely to serve the public Next.js
website — so it's optimized for read speed, not for CMS features.

admin-backend ──writes──▶ PostgreSQL ◀──reads── public-backend ──▶ Next.js website
▲ │
└────────── POST /api/internal/cache/purge ──────────┘
(called right after any admin CUD operation)


## Why this is fast

1. **Redis cache-aside on every list/detail route.** First request hits
   Postgres and populates Redis; every request after that (until TTL
   expiry or an explicit purge) is served straight from memory.
   See `core/cache/cache.util.ts` → `getOrSetCache()`.
2. **Instant cache invalidation, not just TTL.** `admin-backend` calls
   `POST /api/internal/cache/purge` the moment a banner (or any future
   cached resource) is created/updated/deleted, so the site never shows
   >1 request of stale data. TTL is just the safety net if that call
   ever fails.
3. **DB indexes matching every cached query's WHERE + ORDER BY.** See
   `DB_INDEX_TODO.md` — this has to be kept in sync as new modules
   are added.
4. **Gzip/Brotli compression in Node** (see `compression()` in
   `src/app.ts`), plus `Cache-Control` headers Node sets on cacheable
   routes, which Nginx forwards as-is so any CDN / Next.js
   `fetch(..., { next: { revalidate } })` layer in front can also cache.
5. **Narrow `select`s.** Public routes never return admin-only fields
   (`createdBy`, audit fields, etc) — smaller payloads, and no risk of
   leaking internal data.

## Project structure

src/
config/env.ts env loader + validation
core/
cache/
redis.client.ts ioredis connection (degrades gracefully if Redis is down)
cache.util.ts getOrSetCache / purgeCacheKey / purgeCachePrefix
cacheKeys.ts single source of truth for every cache key + prefix
errors/ApiError.ts
middleware/errorHandler.ts
utils/ logger, asyncHandler, sendResponse
health/ /api/v1/health, /api/v1/health/deep (checks DB + Redis)
internal/
cachePurge.routes.ts webhook admin-backend calls after mutations
modules/
home/
banner/ banner.service.ts / .controller.ts / .routes.ts
# next modules go here, same 3-file pattern:
# cars/brand, cars/carModels, articles/article, stories/storyGroup ...
prisma/client.ts Prisma client singleton (read-only consumer)
routes/
index.ts mounts /v1, /health, /internal/cache
v1/v1.ts mounts each module's routes under /v1/<path>
app.ts
server.ts
prisma/schema.prisma COPY of admin-backend's schema — see below


## Adding a new module (e.g. cars listing)

Every module follows the same shape as `modules/home/banner`:

1. `xyz.service.ts` — a DB query function, wrapped in `getOrSetCache(key, fn, ttl)`.
2. `xyz.controller.ts` — thin, just calls the service and sends the response.
3. `xyz.routes.ts` — `GET /` etc.
4. Register the cache key in `core/cache/cacheKeys.ts` (both `CACHE_KEYS`
   and the `CACHE_PREFIXES` map so admin-backend can purge it by name).
5. Mount the router in `routes/v1/v1.ts`.
6. Add/verify the matching DB index (see `DB_INDEX_TODO.md`).

## Keeping the Prisma schema in sync

`admin-backend` owns `prisma/schema.prisma` and all migrations. This
service just needs a matching client to query the same tables. One
command copies the latest schema over and regenerates:

```bash
npm run prisma:sync
```

(Assumes `admin-backend` is a sibling folder of `public-backend`. If
it lives elsewhere, set `ADMIN_BACKEND_PATH` first — see
`scripts/sync-schema.js`.)

Run this **every time admin-backend runs a migration** — even if the
change looks unrelated to what public-backend currently queries, it's
one command, and it keeps both projects from silently drifting apart.

**Never run `prisma migrate` from this repo** — that would create a
second, conflicting migration history against the same database.
admin-backend is the only place migrations happen.

## Wiring up the admin-backend cache purge call

In `admin-backend`'s `banner.service.ts`, after `createBanner` /
`updateBanner` / `updateBannerStatus` / `deleteBanner` succeed, add:

```ts
// admin-backend/src/core/utils/purgePublicCache.ts
export async function purgePublicCache(resource: string) {
  try {
    await fetch(`${process.env.PUBLIC_BACKEND_URL}/api/internal/cache/purge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': process.env.INTERNAL_CACHE_SECRET!,
      },
      body: JSON.stringify({ resource }),
    });
  } catch {
    // Never let a cache-purge failure break the admin's save action —
    // TTL expiry (5 min) is the fallback if this call fails.
  }
}
```

Then call `await purgePublicCache('banner')` at the end of each of
those four functions. `INTERNAL_CACHE_SECRET` must be the same value
in both services' `.env`.

## Public API (so far)

GET /api/v1/home/banners -> active banners, ordered by displayOrder
POST /api/v1/home/banners/:id/click -> increments click count (fire-and-forget from frontend)
GET /api/v1/health -> liveness
GET /api/v1/health/deep -> checks DB + Redis connectivity
POST /api/internal/cache/purge -> internal only, called by admin-backend, IP-locked in nginx


## Setup

```bash
npm install
cp .env.example .env      # fill in DATABASE_URL, REDIS_URL, INTERNAL_CACHE_SECRET
npm run prisma:generate
npm run dev
```

Redis on the VPS (Ubuntu example):

```bash
sudo apt install redis-server
sudo systemctl enable --now redis-server
redis-cli ping   # should return PONG
```

## Nginx (reverse proxy + TLS)

Compression (gzip/brotli) is handled by Node's `compression()` middleware
in `src/app.ts` — Nginx does **not** re-compress responses, it just
terminates TLS, reverse-proxies to Node, and IP-locks the internal
`/api/internal/` route to admin-backend's server only. See
`deploy/nginx.conf` for the full config, including the certbot HTTPS
setup steps commented at the bottom of that file.

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/timesauto-public-api
sudo ln -s /etc/nginx/sites-available/timesauto-public-api /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Remember to replace `<ADMIN_SERVER_IP>` in `deploy/nginx.conf` with
admin-backend's real server IP (or `127.0.0.1` if both services run
on the same box) before reloading.

## Calling this from Next.js (ISR)

```ts
// app/page.tsx (or wherever the homepage banner section lives)
async function getBanners() {
  const res = await fetch(`${process.env.PUBLIC_API_URL}/api/v1/home/banners`, {
    next: { revalidate: 60 }, // matches this API's Cache-Control max-age
  });
  const json = await res.json();
  return json.data;
}
```

Two cache layers now line up: Redis here (5 min, purged instantly on
admin edit) + Next's ISR cache (60s) + whatever CDN sits in front of
the Next.js app. Each layer is a safety net for the one below it.