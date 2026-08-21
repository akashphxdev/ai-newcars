# TimesAuto DB Read-Only MCP

This MCP is for checking database data safely and staging new Codex proposals.

Tools:

- `db_list_tables` - list public tables.
- `db_describe_table` - inspect columns for one table.
- `db_select` - read exact non-sensitive columns from one table.
- `codex_insert_pending` - insert one row into a `codex_*` staging table with `proposal_status = pending`.

Blocked:

- Raw SQL.
- `SELECT *`.
- Sensitive columns like passwords, tokens, OTPs, hashes, secrets, and JWTs.
- Inserts into live tables.
- Updates, deletes, and schema changes.

Run:

```bash
node scripts/mcp/db_guard_mcp_server.js
```

Codex MCP registration:

```bash
codex mcp add timesauto_db_guard -- node D:\phx-mahender-sir\TimesAuto-web\ai-newcars\scripts\mcp\db_guard_mcp_server.js
```

## TimesAuto Memory MCP

Memory MCP stores small long-term notes for future Codex sessions.

Tools:

- `memory_save` - save one non-secret memory.
- `memory_search` - search saved memories.
- `memory_list` - list recent saved memories.

Storage:

```text
scripts/memory/memory.jsonl
```

That file is intentionally gitignored.

Blocked:

- API keys
- tokens
- passwords
- database URLs
- other obvious secrets/credentials

Run:

```bash
node scripts/mcp/memory_mcp_server.js
```

Codex MCP registration:

```bash
codex mcp add timesauto_memory -- node D:\phx-mahender-sir\TimesAuto-web\ai-newcars\scripts\mcp\memory_mcp_server.js
```
