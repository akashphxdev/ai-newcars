# Project Rules for Claude Code

## 1. Always Follow the Existing Project Structure (Per Area)
- Always follow the EXISTING folder structure, naming conventions, and coding patterns used in this project — but scoped to the correct area:
  - **Admin panel** → follow the admin panel's own existing structure/pattern.
  - **Backend** → follow the backend's own existing structure/pattern.
  - **Website (frontend)** → follow whatever is the proper, best-practice structure for a website — it does not need to match admin or backend structure.
- It is NOT required that admin, backend, and website all use one identical structure. Each area follows its own correct/best convention.
- Do not invent a new structure or pattern on your own. Before creating a new file/component, check how similar things are already done in that same area (admin/backend/website) and follow that same pattern.
- If anything about the existing structure is unclear or seems missing, ask me — do not decide on your own.

## 2. No Code Changes Without Explicit Permission
- Never make changes to the code until I clearly say: **"Yes, make the changes now."**
- If you only need to analyze, explain, or propose a plan, that's fine — but do not edit or write any files without my clear permission first.
- If you think something needs to be fixed or changed, first tell me WHAT needs to change and WHY, then wait for my "yes."

## 3. NEVER Touch the Database — No Exceptions
- Never make any changes to the database — schema, tables, data, migrations, nothing. Ever.
- This rule is **absolute**, even if I say "go ahead and change the database" or "database changes are okay now" — still do not do it. Just remind me that this rule is fixed and database changes are not allowed.
- Only READ-ONLY database operations are permitted (SELECT queries, connectivity checks like `Test-NetConnection`). No INSERT/UPDATE/DELETE/ALTER/DROP/TRUNCATE, under any circumstance.

## 4. Reusable Code — Always Extract to a Common Location
- If any function/component/logic is used (or will be used) in two or more places, move it into a shared/common file right away.
- **Use the existing common location — don't create a new one.** Find out where shared/common code already lives in that area of the project (e.g. `src/components/common/`, `src/lib/`, `src/utils/` — whatever the actual project uses) and put new shared code there. Explore the project first, then place it in the existing convention.
- Never write duplicate code — always check for existing common functions/components first, and reuse them if they already exist.

## 5. Proactive Suggestions — Tell, Don't Do
- If you notice something that could be improved or optimized (performance, structure, reusability, security), or if something needs to be linked/connected to something else, do not implement it yourself.
- Instead, tell me:
  - What could be better
  - Why it's needed
  - If something needs to be linked/connected, specify exactly what and why
- Only implement it once I clearly say "yes, do it" (per Rule #2).
- Keep this check running at all times — whenever you're working on related code, look out for improvements or missing links and flag them to me.

## 6. This Is a Production-Grade Project — Be Extra Careful
- This is a production-level, advanced project — avoid any risky, breaking, or "quick hack" style changes.
- If something I'm asking for is a bad approach, or could cause maintainability/performance/security issues down the line, tell me CLEARLY:
  - What the problem could be
  - Why it's risky
  - What a better alternative would look like
- Do not silently follow an instruction you think is wrong — warn me first. Only proceed after I confirm I still want it (and even then, this never overrides Rule #2 or Rule #3).

## 7. General Discipline
- Before any change, give a one-line reason: "why this change is needed."
- Break large changes into smaller steps, and check in after each step if there's any uncertainty.
- Ask before installing any new dependency/package too.

## 8. Bug Fixing & Better-Approach Discipline
- **While I'm writing/asking for code:** if the approach I'm using could cause bugs down the line (missed edge cases, performance issues, race conditions, security gaps, etc.), tell me clearly BEFORE any change is made — what the risk is and why (per Rule #6). Don't just silently code it and let the bug surface later.
- **If a better way already exists** (either as an existing pattern already used elsewhere in that area of the project, or a generally better practice), tell me about it and explain why it's better. Do not switch to it yourself — only after I say "yes, do it" (Rule #2 & #5).
- **When fixing a bug:**
  - Do NOT just patch the symptom and call it fixed.
  - Find the root cause first, and explain it to me.
  - Propose a proper fix that follows the existing project's conventions/patterns for that area (Rule #1) — not a random one-off hack.
  - Avoid quick "band-aid" fixes. If a temporary fix is genuinely the only option for some reason, say so explicitly: "this is temporary, the proper fix should be ___."
  - Give the one-line reason for the fix (Rule #7) and wait for my explicit "yes" before editing any file (Rule #2).
- **Database-related bugs:** Rule #3 still applies without exception — diagnose and explain the issue and the fix needed, but never execute the actual database change yourself.

## 9. Performance Is a Fixed Goal — Never Trade Speed Away
- **Fast loading is a non-negotiable goal** for this website. No change should make the site slower — not even a little — even if it's easier, quicker to write, or I ask for it casually.
- If a request/approach would slow down the site (extra unoptimized calls, unindexed queries, large bundles, blocking scripts, etc.), **do not implement it silently**. Tell me clearly: what will get slower, why, and what the faster alternative is (per Rule #6). Only proceed after I explicitly confirm — and even then, prefer the faster approach if one exists.
- This rule is fixed like Rule #3 — "just do it anyway" from me doesn't override it; flag it and remind me.

## 10. Required Performance Tooling — Indexing, Redis, Compression
- Database indexing, Redis caching, and response compression are **mandatory parts of this project's performance strategy** — not optional suggestions.
- Whenever new queries, endpoints, or heavy data are added, actively check: does this need an index? Can this be cached in Redis? Should this response be compressed? If yes, tell me (per Rule #5) and implement once I say yes.
- **Indexing = database schema change, so Rule #3 applies fully here.** Claude will **never run** the actual index creation (no `ALTER TABLE ... ADD INDEX`, no migration execution) — no exceptions, even if I say it's okay.
- Instead, Claude will only **tell me**:
  - Which column(s)/table needs an index
  - Why (which query/slow path it fixes)
  - The exact SQL/migration statement I (or the DBA) should run manually
- Redis caching and compression are **not** database changes, so those can be implemented directly once I say "yes" (per Rule #2), same as normal code changes.

## 11. Keep Code Lean — No Unnecessary Bloat
- When building UI or implementing any feature, keep the code as small/clean as reasonably possible. Don't over-engineer or add unnecessary abstraction, files, or complexity.
- If something is reused or reusable, extract it into the existing common location immediately (per Rule #4) — don't let duplicate or bloated code pile up "for now."

## 12. Always Use the Proper Standard Approach (Not Just "A" Way)
- Whenever there are multiple ways to implement something, always default to the **proper, standard, production-grade approach** — the one commonly used in large, real-world websites — not a quick/hacky/unconventional way, even if it's faster to write.
- If there's a genuinely better or more modern approach available, tell me what it is and why it's better (per Rule #5/#6), but implement only after I confirm.
- This applies to both frontend (UI patterns, state management, component structure) and backend (API design, caching, query patterns) work.

## 13. Environment Variables & Secrets — Never Hardcode
- API keys, DB credentials, Redis connection strings, tokens — never hardcode these in code.
- Always use `.env` / the existing config pattern already used in this project.
- If a new secret/env variable is needed, tell me (what's needed, why) — don't add it yourself without telling me first.

## 14. Security Checks — Flag, Don't Silently Fix or Ignore
- Whether working on frontend or backend, whenever writing/reviewing code, check for security gaps: SQL injection risk, XSS, exposed API endpoints without auth, CORS misconfiguration, sensitive data in responses/logs.
- If anything is found, flag it immediately (what the risk is, where it is) — even if I'm not directly working on that piece, flag it if related code is being touched.

## 15. Performance Regression Check Before/After Changes
- Whenever adding a new feature/UI/API, consider whether it could negatively impact existing loading speed (bigger bundle size? extra API call? N+1 query?).
- If there's a possible impact, tell me first — linked with Rule #9.

## 16. No Silent Breaking Changes to Existing Features
- Whenever modifying shared/common code (Rule #4) or any existing API/component, first check where else it's being used.
- If the change could break something elsewhere, clearly say so before implementing — even if I only asked to fix one specific place.

## 17. Git / Version Control Discipline (if applicable)
- Before any risky or large change, tell me whether it's a "small change safe to commit directly" or "better kept in a separate branch/commit" so rollback stays easy if something goes wrong.
- Do not commit/push/merge yourself without me saying so (if Claude Code has git access).

## 18. Logging & Error Handling Consistency
- When writing new code, follow the existing error-handling and logging pattern already used in this project — don't invent a new pattern of your own.
- If proper error handling is missing somewhere, flag it — implement only once I say "yes."

## 19. Comments — Only What's Truly Necessary
- Do not add unnecessary/obvious comments in code. A comment must earn its place — write one only when it's genuinely needed (e.g. explaining non-obvious logic, a tricky workaround, a business-rule reason, a warning about a gotcha).
- Do not write comments that just restate what the code already says (e.g. `// set loading to true` above `setLoading(true)`).
- When editing or touching any existing file that has excessive/unnecessary comments, clean it up: remove the unneeded ones and keep only the most important, genuinely-needed comments.
- When creating a new file, keep comments minimal from the start — only the essential ones, not one per line/block.

## 20. APIs — Fetch Only the Data That's Needed (No `SELECT *`, No Over-fetching)
- Whenever building or updating a website API, only fetch/select the exact fields/columns that are actually needed for that screen/response — never `SELECT *` or return the full row/object "just in case."
- Extra unused fields mean extra data over the network and extra DB work for nothing — this directly conflicts with Rule #9 (performance is non-negotiable), so it's not allowed even if it's quicker to just grab everything.
- This applies at both levels: the DB query (select only needed columns) and the API response (don't send back fields the frontend doesn't use).
- If you find an existing endpoint/query already over-fetching, don't fix it silently — flag it to me first (per Rule #5), then fix once I say "yes."