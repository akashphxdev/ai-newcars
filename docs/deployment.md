# Deployment

Every hostname is on `timesauto.net`, all proxied through Cloudflare.

| Host | Serves | Origin process |
|---|---|---|
| `timesauto.net` | Website | Next.js, `:3000` |
| `www.timesauto.net` | 301 → apex | — |
| `admin.timesauto.net` | Admin panel | static build, nginx |
| `api.timesauto.net` | All API | Go `:5001` + Node `:5000`, split by path |
| `static.timesauto.net` | Uploaded assets | nginx, see [asset-cdn.md](./asset-cdn.md) |

## Why one API hostname

The admin and public APIs are the same Node process, and the website
calls both ported (Go) and unported (Node) endpoints — it can only hold
one API base URL. So the split is by path, not by host:

- `/api/public/v1/*` → Go, for the endpoints ported so far
- `/api/v1/*` → Node, admin only

A second `admin-api.` hostname would buy nothing: CORS is decided from
the request's `Origin` header rather than the host called, auth is a
Bearer token rather than a cookie, and Cloudflare rate-limit and Access
rules both match on `http.request.uri.path`. Admin can be locked down at
the edge by path on this single hostname.

## Environment

```sh
# admin-backend
PORT=5000
CORS_ORIGIN=https://timesauto.net,https://www.timesauto.net,https://admin.timesauto.net
ASSET_STORAGE_ROOT=/var/www/static.timesauto.net
ASSET_PUBLIC_BASE_URL=https://static.timesauto.net

# go-backend  (reads admin-backend's .env; only these are its own)
GO_PORT=5001
DB_MAX_CONNS=25

# website
NEXT_PUBLIC_API_BASE_URL=https://api.timesauto.net/api/public/v1
NEXT_PUBLIC_ASSET_BASE_URL=https://static.timesauto.net

# admin-panel
VITE_API_BASE_URL=https://api.timesauto.net/api/v1
VITE_ASSET_BASE_URL=https://static.timesauto.net
```

`CORS_ORIGIN` must list real origins: production refuses to boot on `*`
while `credentials: true` is set, which is deliberate.

## nginx

### api.timesauto.net

```nginx
server {
    listen 443 ssl http2;
    server_name api.timesauto.net;

    ssl_certificate     /etc/letsencrypt/live/api.timesauto.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.timesauto.net/privkey.pem;

    client_max_body_size 100M;   # media uploads

    # Ported public endpoints. Move prefixes up here as more are ported;
    # rolling one back is a one-line revert.
    location ~ ^/api/public/v1/(home|cars|brands|body-types|states|cities|lenders|site-settings|search)(/|$) {
        proxy_pass http://127.0.0.1:5001;
        include /etc/nginx/proxy_params;
    }

    # Everything else: admin API, plus the 28 public endpoints still on
    # Node (auth, leads, reviews, compare, articles).
    location / {
        proxy_pass http://127.0.0.1:5000;
        include /etc/nginx/proxy_params;
    }
}
```

`/etc/nginx/proxy_params`:

```nginx
proxy_http_version 1.1;
proxy_set_header Host              $host;
proxy_set_header X-Real-IP         $remote_addr;
proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_read_timeout 60s;
```

`X-Forwarded-For` matters: both backends trust exactly one proxy hop to
derive the client IP for rate limiting and audit logs.

### timesauto.net + www

```nginx
server {
    listen 443 ssl http2;
    server_name www.timesauto.net;
    return 301 https://timesauto.net$request_uri;
}

server {
    listen 443 ssl http2;
    server_name timesauto.net;

    location / {
        proxy_pass http://127.0.0.1:3000;
        include /etc/nginx/proxy_params;
    }
}
```

### admin.timesauto.net

```nginx
server {
    listen 443 ssl http2;
    server_name admin.timesauto.net;

    root /var/www/admin.timesauto.net;
    index index.html;

    # Client-side routing: unknown paths are routes, not 404s.
    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Vite fingerprints filenames under `/assets/`, so the immutable TTL is
safe. `index.html` must stay uncached or a deploy will not be picked up.

## Cloudflare

DNS — all proxied:

| Name | Type | Value |
|---|---|---|
| `@` | A | web box |
| `www` | CNAME | `timesauto.net` |
| `admin` | A | web box |
| `api` | A | API box |
| `static` | A | static origin |

SSL/TLS mode **Full (strict)** — Flexible would leave Cloudflare→origin
unencrypted.

Rules on `api.timesauto.net`, both matching by path:

- **Rate limiting** — separate budgets for `/api/v1/*` and
  `/api/public/v1/*`. Both backends also run an in-process limiter of
  1000 requests per 15 minutes per IP, which is a single shared bucket;
  the edge rule is what actually separates admin from public.
- **Access / IP allowlist** on `/api/v1/*` — takes the admin API off the
  open internet without touching public traffic.

Cache: default (no caching on `api.`), *Cache Everything* on `static.`.

## Order of deployment

1. Postgres and Redis reachable from the API box.
2. Apply the migration, **then** deploy the backend build that goes with
   it — `20260806120000` drops `roles.permission_ids`, and a build still
   reading that column 500s on every admin request.
3. Re-run `prisma/seed-site-settings-and-permissions.ts` for the
   `assets.*` permissions.
4. Start Node, then Go. Check `/api/v1/health` and
   `/api/public/v1/health`.
5. `rsync` the existing `uploads/` tree to `ASSET_STORAGE_ROOT`, bring up
   `static.`, and confirm a known file resolves.
6. Build and deploy the website — **the API must already be reachable**,
   because the build fetches page data for the SSG routes and fails
   outright if it is not.
7. Build and deploy the admin panel.

## As deployed

Host `82.180.147.1` (Ubuntu 22.04, 4 cores, 5.8 GB RAM). **Shared** — it also
runs TimesMoney plus ~9 other production databases, mail, FTP and MongoDB,
and had 24 OOM kills in its kernel log before we arrived. Both services
therefore carry a systemd `MemoryMax` so that under memory pressure they
die rather than a neighbouring site. Nothing is built on this box:
artifacts are built locally and rsynced, because `next build` alone peaks
at 1–2 GB.

| Component | Where | Port |
|---|---|---|
| Node API | `/var/www/timesauto/admin-backend` (systemd `timesauto-api`) | 5000 |
| Go API | `/var/www/timesauto/go-backend` (systemd `timesauto-go`) | 5001 |
| Admin panel | `/var/www/timesauto_ne_usr/data/www/admin.timesauto.net` | static |
| Assets | `…/data/www/static.timesauto.net/uploads` | static |
| Website | not deployed yet | 3002 reserved (3000 is taken) |

### nginx is FastPanel-managed

Vhosts live in `/etc/nginx/fastpanel2-available/timesauto_ne_usr/` and are
**regenerated if the site is re-saved in the FastPanel UI**, which would
revert the upstream ports and the Go/Node split. A backup of the working
set is at `/root/vhost-backup-2026-08-06/`. FastPanel generated all four
vhosts pointing at `127.0.0.1:8899`, a port belonging to another site
entirely; each was repointed by hand.

One trap worth remembering, because it cuts both ways: the api vhost must
**not** use `location ^~` for the Go split (`^~` stops nginx before regex
locations, so every request silently goes to Node and the Go service sits
idle), while the static vhost **must** use it for `/uploads/` (that vhost
also carries a generic `\.(jpg|png|pdf|…)$` regex location, which
otherwise serves the file and skips the immutable cache headers).

### Redis

Shared with every other site on the host — db0 holds ~194k of their keys.
TimesAuto uses **db5**, and its cache keys are prefixed
`public-cache:go:` to stay clear of the Node backend's own namespace.

### Backups

`/usr/local/bin/timesauto-backup`, nightly at 03:15 via
`/etc/cron.d/timesauto-backup`, 14-day retention, into `/root/db-backups`.
There was no backup of any kind before this.

The database was restored from a PostgreSQL 18 dump onto this PostgreSQL
16 server, which needs `postgresql-client-17` (installed, client only) —
16's own `pg_restore` cannot read the v1.16 archive header at all.
`timesauto_seedonly` is the pre-restore database, kept for reference.

## Open items

- **Admin panel does not compile.** `tsc -b` fails with 5 errors,
  including `App.tsx` importing `./pages/Ai/Logs/AllAiLogs`, which has
  never existed in the repository. No deployable artifact exists until
  these are fixed.
- **28 of 58 public endpoints are still on Node.** The nginx location
  block above lists only the ported prefixes for that reason; routing
  all of `/api/public/v1/` to Go would break auth, leads, compare,
  reviews and news.
- **Schedulers run inside the web process.** `startAllSchedulers()` is
  called from `server.ts`, so every additional Node replica runs the AI
  article/story/FAQ jobs again concurrently — duplicate generation and
  duplicate writes. Split these into their own single-instance process
  before scaling Node past one replica.
- **No cache invalidation.** Public responses expire only by TTL, so an
  admin edit is not visible until it lapses.
- **The API must be able to write to the asset volume.** Fine on one
  host or a shared mount; separate machines need NFS/EFS or a push step.
  See [asset-cdn.md](./asset-cdn.md).
- **`timesauto.in` still appears in the UI** — form placeholders in the
  admin panel and `support@timesauto.in` on the website's maintenance
  page. The latter is user-visible.
