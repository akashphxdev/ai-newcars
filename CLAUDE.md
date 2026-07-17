# Project Rules for Claude Code

## 1. Always Follow the Existing Project Structure
- Always follow the EXISTING folder structure, naming conventions, and coding patterns used in this project.
- Do not invent a new structure or pattern on your own. Before creating a new file/component, check how similar things are already done elsewhere in the codebase and follow that same pattern.
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
- **Use the existing common location — don't create a new one.** Find out where shared/common code already lives in this project (e.g. `src/components/common/`, `src/lib/`, `src/utils/` — whatever the actual project uses) and put new shared code there. Explore the project first, then place it in the existing convention.
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
- **If a better way already exists** (either as an existing pattern already used elsewhere in this project, or a generally better practice), tell me about it and explain why it's better. Do not switch to it yourself — only after I say "yes, do it" (Rule #2 & #5).
- **When fixing a bug:**
  - Do NOT just patch the symptom and call it fixed.
  - Find the root cause first, and explain it to me.
  - Propose a proper fix that follows the existing project's conventions/patterns (Rule #1) — not a random one-off hack.
  - Avoid quick "band-aid" fixes. If a temporary fix is genuinely the only option for some reason, say so explicitly: "this is temporary, the proper fix should be ___."
  - Give the one-line reason for the fix (Rule #7) and wait for my explicit "yes" before editing any file (Rule #2).
- **Database-related bugs:** Rule #3 still applies without exception — diagnose and explain the issue and the fix needed, but never execute the actual database change yourself.