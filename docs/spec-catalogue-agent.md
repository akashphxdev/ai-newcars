# Catalogue data agent — specification

## Why this one first

Measured gaps across the catalogue (10 Aug 2026):

| Gap | Missing | Share | Agent-solvable? |
|---|---|---|---|
| ICE variants missing `claimed_fe` (mileage) | 633 / 1,743 | 36% | **yes — published, citable** |
| EV variants missing `ac_charging_output` | 116 / 267 | 43% | yes, same shape |
| Models with no images at all | 132 / 455 | 29% | no — licensing, not research |
| ICE missing `power_ps` / `torque_nm` | 4 / 1,743 | 0.2% | not worth automating |
| Colours missing their render | 5 / 2,405 | 0.2% | not worth automating |

Mileage leads because it is the only large gap that is **published by the
manufacturer, quotable, and checkable by a reviewer in seconds** — and
because it is load-bearing: the mileage and fuel-comparison calculators
both read it, and both show blank for 36% of the catalogue today.

### Rejected: colour-tagging gallery images

`car_images.color_id` is null on all 15,151 rows, which looks like the
biggest gap in the database. It is not worth closing.

Only `looks` images (2,719) are exterior; the rest are interiors and
details where a colour tag would be *wrong*, not missing. And a prototype
against four models showed galleries carry only 1–3 of a model's colours:

| Model | Colours | Distinct colours in photos |
|---|---|---|
| Nexon | 14 | ~1 |
| Victoris | 10 | 2 |
| Creta | 9 | 3 |
| Scorpio N | 5 | 3 |

Matching by body colour also separates families (blue vs grey vs beige)
but not shades — Royal Blue and Ocean Blue landed within 0.5–6.2 ΔE of
each other. Tagging would enrich two colours per model and leave the rest
visibly poorer than the uniform per-colour render they fall back to today.

## Hard rule: the agent proposes, a human accepts

Nothing the agent produces is written to `car_powertrains_ice`,
`car_powertrains_electric`, or any live table.

On 10 Aug the on-road endpoint returned a road tax figure ₹42,000 too low
because litres were read into a cc column. The JSON looked entirely
plausible; it was caught only when the number reached a screen. An agent
filling specs will generate plausible-wrong values at a rate no reviewer
notices unless the pipeline forces them to look at the source.

```sql
CREATE TABLE spec_proposals (
  id            bigserial PRIMARY KEY,
  target_table  text    NOT NULL,   -- car_powertrains_ice | _electric
  target_id     integer NOT NULL,   -- variant_id
  field         text    NOT NULL,   -- claimed_fe, ac_charging_output, ...
  current_value text,               -- what is stored now, for the diff
  proposed_value text   NOT NULL,
  source_url    text    NOT NULL,
  source_quote  text    NOT NULL,   -- the exact sentence it came from
  confidence    numeric(3,2) NOT NULL,
  agent_run_id  uuid    NOT NULL,
  status        text    NOT NULL DEFAULT 'pending',  -- pending|accepted|rejected|superseded
  reviewed_by   integer REFERENCES admin_users(id),
  reviewed_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (target_table, target_id, field, agent_run_id)
);
CREATE INDEX spec_proposals_queue_idx ON spec_proposals (status, confidence DESC);
```

A proposal without `source_url` **and** `source_quote` is rejected by the
schema, not by review. If the agent cannot quote where a number came from,
it has not found the number.

## Pipeline

1. **Gap detector — SQL, no model.** Ranks variants by missing fields ×
   model traffic. Runs in milliseconds. Do not point an LLM at 1,743
   variants; the top few hundred hold nearly all the value.
2. **Research agent, one variant per task.** Manufacturer spec page first,
   then two independent sources. Extracts the field, emits a proposal per
   source. Sources that disagree produce two proposals, both flagged —
   never an average.
3. **Adversarial verifier.** A second pass whose prompt is to *refute* the
   proposal. Cheap, and it removes most confident nonsense.
4. **Review queue** in the admin panel: current value, proposed value, the
   quote, and a link to the source, with accept/reject. This is where the
   quality actually comes from.

## Daemon

A long-running worker, not a cron burst — the work is naturally a queue.

- **Claim-based**: `UPDATE ... SET status='running' WHERE id = (SELECT ...
  FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING *`. Two workers never take the
  same task, and a crashed worker's task returns to the queue on timeout.
- **Resumable**: state lives in the queue table, so a restart loses at most
  one task.
- **Cost-capped**: a per-run token budget and a per-day ceiling, both
  enforced in the worker, not in the prompt.
- **Rate-limited per host**, with backoff. We are fetching other people's
  servers; hammering an OEM site is both rude and a good way to get
  blocked.
- **Idempotent**: re-running a variant supersedes its previous pending
  proposal rather than adding a second.

Run it as its own systemd unit (`timesauto-agent`), separate from
`timesauto-go`, so it can be stopped without touching the API.

## MCP tool surface

| Tool | Scope | Notes |
|---|---|---|
| `WebFetch` / `WebSearch` | existing | primary research |
| `catalogue.read` | SELECT on live tables | read-only role, enforced by grants |
| `proposals.write` | INSERT into `spec_proposals` only | **the important boundary** |
| `browser.render` | headless page render | OEM sites are JS-shells; Maruti's is Adobe AEM and `curl` returns nothing |
| `image.inspect` | fetch, measure, classify | studio-vs-location by corner sample — validated 10 Aug |

The DB grants do the enforcing, not the prompt. The agent's role should
have no UPDATE on any `car_*` table.

## Out of scope, deliberately

- **Brochures.** Manufacturer PDFs are copyrighted. Downloading and
  re-serving them is infringement. Link to the OEM's own URL instead.
- **Expert reviews.** An agent writing opinion presented as editorial is
  what E-E-A-T guidance penalises, and it is a trust problem regardless of
  search. Let it draft spec-derived factual summaries; humans write
  judgement.
- **Images.** An agent can find images. It cannot make them licensable.
  The 132 models with none still route back to press-room / IMAGIN / Evox.
