# timesauto MCP server

Operational tools for this site, exposed over MCP so an agent can run
them. Registered in `.mcp.json` at the repo root.

Dependency-free: the stdio transport is line-delimited JSON-RPC, and a
tool whose job is to make deploys safer should not itself pull in a
dependency tree.

## Tools

| Tool | What it does |
|---|---|
| `deploy` | Build and ship `website` or `go`, with pre-flight gates |
| `health` | API endpoints, pages, image optimisation, service state |
| `query` | Read-only SQL against production |
| `logs` | `journalctl` for a timesauto unit |
| `flush_cache` | Delete the Go public-cache keys in Redis |

## Why `deploy` refuses things

This pipeline has silently broken production three times:

1. A build with **placeholder data** prerendered into pages, because the
   build could not reach the API.
2. A bundle with **`localhost:5000` compiled in**, because
   `.env.production` did not exist and `apiClient.ts` has a localhost
   fallback. Every visitor's browser then fetched their own machine.
3. A **macOS `sharp`** binary rsynced to the x86_64 server, where
   `require('sharp')` throws and Next.js quietly falls back to serving
   unoptimised originals — 67 KB instead of 18 KB, with no error in any
   log.

None of the three produced a failure at deploy time. All three were found
by a person looking at the site. The gates are those failures turned into
refusals:

- no standalone output → refuse
- `localhost:5000` in any client chunk → refuse
- placeholder slugs in prerendered pages → refuse
- production API base not compiled in → refuse
- `sharp` will not load on the server → refuse **before** restarting

The rsync also excludes `node_modules/@img`, `node_modules/sharp` and
`.env.production`, so a local build never overwrites the platform-correct
`sharp` installed on the server or the server's own env file.

A `go` deploy always flushes the Redis public cache afterwards: restarting
alone keeps serving the previous build's JSON until the TTL expires, which
reads as "the deploy did nothing".

## `query` is read-only

Single statement, must start with `SELECT`/`WITH`/`EXPLAIN`/`SHOW`, and
any write keyword is rejected. Results are wrapped in a `LIMIT`.

This is a guard against mistakes, not against a determined caller. The
real boundary is the database role: **an agent should connect as a role
with no write grants**, and this check is the second lock, not the only
one.

## Adding a tool

Add the implementation to `tools` and its schema to `SCHEMA`. Anything
that writes to the database or to a live table does not belong here —
that boundary is the point of the whole file.
