# TimesAuto Go backend

Go rewrite of the public (unauthenticated) API. Runs alongside the
existing Node backend against the **same database and the same `.env`** —
the website is moved across one path prefix at a time, not in a single
cutover.

Node keeps serving the ~300 admin endpoints. Those are used by a handful
of staff and are not a traffic or memory problem, so rewriting them buys
almost nothing while carrying the entire regression risk.

## Stack

| | | why |
|---|---|---|
| Router | `chi` + `net/http` | stdlib-compatible. Not Fiber — fasthttp diverges from `net/http` and locks us out of the ecosystem |
| Database | `pgx/v5` + `sqlc` | hand-written SQL, checked against the real schema at build time. An ORM would reintroduce exactly the query problems this rewrite removes |
| Cache | `go-redis/v9` | same Redis as Node, separate key namespace |
| Logging | stdlib `log/slog` | structured JSON in production |

## Layout

```
cmd/api/            entrypoint, graceful shutdown
internal/config/    env loading; normalises Prisma's DATABASE_URL
internal/database/  pgx pool
internal/cache/     Redis wrapper (best-effort, never a hard dependency)
internal/middleware/ recover, real IP, logging, response cache
internal/httpx/      response envelope + error contract (mirrors Node)
internal/handler/    HTTP handlers
internal/store/      sqlc output + hand-written dynamic queries
queries/             .sql source for sqlc
```

### Where the SQL lives

Most queries are static and live in `queries/*.sql`, compiled by `sqlc`.

Three files are hand-written against pgx instead:

- `store/carcards.go` — car listings. The WHERE clause is combinatorial
  (brand × body type × fuel × price × sort). A static query would need
  OR-guarded parameters, and the planner cannot prove a guarded predicate
  is unused, so it falls back to a sequential scan.
- `store/carfacets.go` — browse facets, four cross-filtered CTEs.
- `store/variants.go` — powertrain columns arrive through
  `LEFT JOIN LATERAL`, and sqlc cannot infer nullability across a lateral
  subquery. It types those columns as non-null, which would panic on the
  first variant with no ICE or no electric powertrain.

Regenerate after editing `queries/`:

```bash
sqlc generate
```

`internal/store/schema.sql` is a `pg_dump --schema-only` of the live
database and is what sqlc type-checks against. Refresh it after any
migration:

```bash
pg_dump -U postgres -d timesauto --schema-only --no-owner --no-privileges -f internal/store/schema.sql
```

## Running

Reads the Node backend's `.env` (searches `.env`, `../.env`,
`../admin-backend/.env`) so the two services cannot drift onto different
databases. `GO_PORT` defaults to 5001.

```bash
go run ./cmd/api
```

`DATABASE_URL` is rewritten at startup: Prisma's `?schema=` becomes
`search_path`, and `connection_limit`/`pool_timeout`/`pgbouncer` are
dropped — libpq rejects all of them.

## Tests

```bash
DATABASE_URL="postgresql://postgres:...@localhost:5432/timesauto" go test ./...
```

`store/querycount_test.go` asserts the round-trip count per endpoint via
a pgx tracer. Prisma's nested includes were invisible at the call site —
one `findMany` could become four queries — so the counts are pinned
rather than assumed.

## Measured

Against 4,000 models / 21,600 variants, 50 concurrent workers, 700
requests, cache bypassed, both backends on the same Postgres. Three
runs, each with both services restarted first:

| | req/s | p50 | p95 | peak RSS |
|---|---|---|---|---|
| Node (production build) | 62 | 850 ms | 1250 ms | ~160 MB |
| Go | 162 | 265 ms | 730 ms | ~34 MB |

**~2.6× throughput, ~1.7× lower p95, ~4.7× less memory.** Both services
share one Postgres, which is the common bottleneck — the throughput gap
would widen with a larger pool or read replicas.

Query-level, on the same data:

| | before | after |
|---|---|---|
| Fuel facet counts | 40.3 ms | 0.74 ms |
| Browse page (rating sort) | 2.93 ms | 0.12 ms |
| Browse page round-trips | 11 | 3 |
| Car card list round-trips | 4 | 1 |

## Deliberate differences from the Node backend

Everything else is byte-identical — a 45-case parity harness compares
both services field by field. These are the exceptions:

1. **Sort tiebreak.** Every listing ends its `ORDER BY` with `id`. The
   Node version does not, so a `LIMIT`/`OFFSET` page over tied rows has
   no defined order — Postgres may return a row on page 1 and again on
   page 2 while another is never shown. Ratings and prices tie constantly
   at catalogue scale. Consequence: tied rows can appear in a different
   order than Node returns them.
2. **Facet ordering.** Equal-count facets break ties on `id`. Node sorted
   an unordered `groupBy` in JavaScript, so equal counts could come back
   in a different order on each call.
3. **Cache key normalisation.** `?a=1&b=2` and `?b=2&a=1` are one cache
   entry, not two. Node keyed on the raw URL and fragmented the cache.
4. **Cache namespace.** Keys are prefixed `public-cache:go:` rather than
   `public-cache:`. Sharing a namespace is harmless only while responses
   are byte-identical, and impossible to debug the moment they are not.

## Open items

Not yet ported — 28 of the 58 public endpoints, all of them write paths
or modules with their own infrastructure:

- `auth/*` (6) — OTP send/verify, needs the mailer and JWT minting
- `leads/*` (6) — lead submission, needs OTP verification
- `reviews/*` (4) — read plus write, optional-auth aware
- `compare/*` (7) — large read module
- `articles/*` (3), `brands/{slug}/articles` (1), `POST home/testimonials` (1)

Operational items that need a decision:

- **Cache invalidation.** Neither backend has any — entries only expire
  by TTL, so an admin editing a car price serves stale data until it
  lapses. `cache.InvalidatePrefix` exists for this but nothing calls it;
  wiring it means the Node admin writes must publish invalidations.
- **Rate limiting.** A flat 1000/15min per IP, copied from Node,
  including what will become the lead-submission endpoints. Those need
  their own much tighter bucket before they are ported.
- **Search index.** `SearchCars` uses `ILIKE '%q%'`, which cannot use a
  btree index. At catalogue scale it wants:
  ```sql
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
  CREATE INDEX car_models_name_trgm_idx ON car_models USING gin (name gin_trgm_ops);
  CREATE INDEX brands_name_trgm_idx     ON brands     USING gin (name gin_trgm_ops);
  ```

## Cutover

Route the ported prefixes to Go, everything else to Node. Roll back by
reverting one line.

```nginx
location /api/public/v1/ { proxy_pass http://127.0.0.1:5001; }
location /api/          { proxy_pass http://127.0.0.1:5000; }
```

Until all 58 public endpoints are ported, the split has to be per-path
rather than on the whole `/api/public/v1/` prefix.
