from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent
STATE_FILE = SCRIPTS_DIR / "scheduler-state.json"


@dataclass(frozen=True)
class ScheduledTask:
    name: str
    run_at: time
    session_key: str
    prompt: str
    interval: timedelta | None = None


STAGING_INSTRUCTION = (
    "This is an automatic scheduled TimesAuto Codex job. Inspect the project and database shape yourself. "
    "Use the existing Prisma/client patterns only. Never write to live tables and never change schema/migrations. "
    "If reliable new data is found, save it only as pending rows in the matching codex_* staging table. "
    "When a maximum count is mentioned, treat it as an upper cap only: never force extra rows, and if fewer reliable missing items exist, stage only those. "
    "Before staging, compare against real rows and existing pending/rejected codex rows so duplicates are skipped. "
    "If nothing reliable is found, do not insert anything. Reply with a short human summary of what happened."
)


DEFAULT_TASKS: tuple[ScheduledTask, ...] = (
    ScheduledTask(
        name="daily_brand_check",
        run_at=time(9, 30),
        session_key="scheduler-brand",
        prompt=(
            f"{STAGING_INSTRUCTION} Daily 9 AM brand job: find all new car brands missing from the real brands table. "
            "Verify each brand from official or trusted auto sources, stage every valid missing brand in codex_brands, "
            "and cap the run at 100 staged brand proposals."
        ),
    ),
    ScheduledTask(
        name="daily_model_check",
        run_at=time(10, 30),
        session_key="scheduler-model",
        prompt=(
            f"{STAGING_INSTRUCTION} Daily 11 AM model job: for every real brand, find newly launched or missing car "
            "models that are not in the real car_models table. Verify sources, use the correct real brand relation, "
            "stage every valid missing model in codex_car_models, and cap the run at 100 staged model proposals."
        ),
    ),
    ScheduledTask(
        name="daily_variant_check",
        run_at=time(11, 30),
        session_key="scheduler-variant",
        prompt=(
            f"{STAGING_INSTRUCTION} Daily 1 PM variant job: check real car models for newly launched or missing "
            "variants and core specs. Verify sources, use the correct real model relation, stage valid missing variants "
            "in codex_car_variants and cap the run at 100 staged variant proposals. For every staged or existing variant you inspect, "
            "also verify powertrain data from official or trusted sources. If it is an ICE/hybrid variant and reliable data exists, "
            "stage the linked row in codex_powertrains_ice. If it is an EV variant and reliable data exists, stage the linked row "
            "in codex_powertrains_electric. Use the correct real variantId or staged codexVariantId relation, skip duplicate real/staged "
            "powertrains, and skip powertrain staging when engine/battery/spec data is incomplete or doubtful. Also verify up to 30 "
            "important buyer-visible features per inspected variant. Before staging feature data, read real feature_categories, features, "
            "variant_features and pending/rejected codex_feature_categories, codex_features, codex_variant_features. Prefer real categoryId "
            "and featureId when they already exist; use codexCategoryId or codexFeatureId only when the matching real row is missing but "
            "a matching pending staged row exists. Stage a new codex_feature_categories or codex_features row only when no real or staged "
            "duplicate exists. Stage codex_variant_features only with the correct real variantId or staged codexVariantId and real featureId "
            "or staged codexFeatureId. Skip any variant-feature link that already exists in real or staged rows, normalize simple values "
            "like Yes/No/Standard consistently, and skip ambiguous features, unclear categories, or doubtful source data."
        ),
    ),
    ScheduledTask(
        name="daily_faq_check",
        run_at=time(12, 45),
        session_key="scheduler-faq",
        prompt=(
            f"{STAGING_INSTRUCTION} Daily 3 PM FAQ job: choose up to 20 real car models that need better buyer FAQs today. "
            "Generate exactly 5 useful FAQs for each selected model using current verified model/spec information. "
            "Skip duplicate existing real or staged FAQs. Stage valid new FAQs in codex_car_faqs."
        ),
    ),
    ScheduledTask(
        name="daily_price_check",
        run_at=time(14, 15),
        session_key="scheduler-price",
        prompt=(
            f"{STAGING_INSTRUCTION} Daily 4 PM price job: check real car variants for changed ex-showroom prices. "
            "Use DB MCP to read exact needed fields from brands, car_models, car_variants, and existing pending codex_variant_price_changes. "
            "Use scripts/price-check-state.json as progress state. Continue after last_checked_brand_slug/model_slug/variant_id when possible; "
            "if state is empty or invalid, start from the first active brand/model/variant in stable alphabetical/id order. Check a batch of at least "
            "5 brands or 50 variants per run unless all variants are exhausted or 100 price proposals are staged. Do not stop after the first model "
            "with changes. Verify current prices from official brand pages or trusted Indian auto sources. If a reliable current price differs from "
            "car_variants.price, stage one pending row in codex_variant_price_changes with variant_id, old_price, new_price, price_difference, "
            "currency, price_context, source_name, source_url, detected_at, confidence_score, and notes. Skip uncertain prices, city-specific prices "
            "unless price_context/city_id is clear, and duplicate pending proposals. After the batch, update scripts/price-check-state.json with the "
            "last checked brand/model/variant and last_run_at. If the scan reaches the end of all variants, wrap the next run back to the first brand. "
            "Reply with checked brand count, checked variant count, staged proposal count, skipped duplicate count, and next starting point."
        ),
    ),
    ScheduledTask(
        name="hourly_article_check",
        run_at=time(0, 0),
        session_key="scheduler-article",
        interval=timedelta(hours=1),
        prompt=(
            f"{STAGING_INSTRUCTION} Hourly article job: write exactly 1 useful latest Indian auto news article draft. "
            "Use official or trusted Indian auto sources, choose the correct real article category, link relevant real "
            "brands/models when available, and stage drafts in codex_articles plus relation staging tables when applicable."
        ),
    ),
)


def load_state() -> dict:
    if not STATE_FILE.exists():
        return {"last_run_at": {}, "last_run_dates": {}}
    try:
        state = json.loads(STATE_FILE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {"last_run_at": {}, "last_run_dates": {}}
    return state if isinstance(state, dict) else {"last_run_at": {}, "last_run_dates": {}}


def save_state(state: dict) -> None:
    STATE_FILE.write_text(json.dumps(state, indent=2, sort_keys=True), encoding="utf-8")


def due_tasks(now: datetime | None = None) -> list[ScheduledTask]:
    current = now or datetime.now()
    state = load_state()
    last_run_at = state.get("last_run_at", {})
    last_run_dates = state.get("last_run_dates", {})
    due: list[ScheduledTask] = []

    for task in DEFAULT_TASKS:
        if current.time() < task.run_at:
            continue
        if task.interval:
            previous_value = last_run_at.get(task.name)
            if previous_value:
                try:
                    previous = datetime.fromisoformat(previous_value)
                except (TypeError, ValueError):
                    previous = None
                if previous and current - previous < task.interval:
                    continue
            due.append(task)
            continue

        if last_run_dates.get(task.name) == current.date().isoformat():
            continue
        due.append(task)

    return due


def record_task_run(task_name: str, run_date: date | None = None) -> None:
    state = load_state()
    state.setdefault("last_run_at", {})
    state.setdefault("last_run_dates", {})

    task = next((item for item in DEFAULT_TASKS if item.name == task_name), None)
    if task and task.interval:
        state["last_run_at"][task_name] = datetime.now().isoformat()
    else:
        state["last_run_dates"][task_name] = (run_date or date.today()).isoformat()

    save_state(state)
