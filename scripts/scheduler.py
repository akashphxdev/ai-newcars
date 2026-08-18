from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent
DEFAULT_STATE_FILE = SCRIPTS_DIR / "scheduler-state.json"
RETRY_AFTER = timedelta(minutes=30)


@dataclass(frozen=True)
class ScheduledTask:
    name: str
    run_at: time
    prompt: str


STAGING_INSTRUCTION = (
    "This is an automatic scheduled TimesAuto Codex job. Inspect the project and database shape yourself. "
    "Use the existing Prisma/client patterns only. Never write to live tables and never change schema/migrations. "
    "If reliable new data is found, save it only as pending rows in the matching codex_* staging table. "
    "Before staging, compare against the real table and existing codex pending/rejected rows so duplicates are skipped. "
    "Keep source URLs/notes/confidence in the available Codex run/event or metadata fields when the schema supports it. "
    "If an insert/data/format/validation error happens, understand the error, fix the data or format, and retry once. "
    "If nothing reliable is found, do not insert anything. Reply with a short human summary of what happened."
)


DEFAULT_TASKS: tuple[ScheduledTask, ...] = (
    ScheduledTask(
        name="daily_brand_check",
        run_at=time(9, 0),
        prompt=(
            f"{STAGING_INSTRUCTION} Daily 9 AM brand job: find all new car brands missing from the real brands table. "
            "Verify each brand from official or trusted auto sources, stage every valid missing brand in codex_brands, "
            "and cap the run at 100 staged brand proposals. If fewer than 100 are found, stage only those. "
            "If no new brands are found, stage nothing and reply that no new brands were found."
        ),
    ),
    ScheduledTask(
        name="daily_model_check",
        run_at=time(11, 0),
        prompt=(
            f"{STAGING_INSTRUCTION} Daily 11 AM model job: for every real brand, find newly launched or missing car "
            "models that are not in the real car_models table. Verify sources, use the correct real brand relation, "
            "stage every valid missing model in codex_car_models, and cap the run at 100 staged model proposals. "
            "If fewer than 100 are found, stage only those. If no new models are found, stage nothing and reply that no new models were found."
        ),
    ),
    ScheduledTask(
        name="daily_variant_check",
        run_at=time(13, 0),
        prompt=(
            f"{STAGING_INSTRUCTION} Daily 1 PM variant job: check real car models for newly launched or missing "
            "variants and core specs. Verify sources, use the correct real model relation, stage valid missing variants "
            "in codex_car_variants and related codex powertrain tables when the data is reliable, and cap the run at 100 proposals. "
            "If fewer than 100 are found, stage only those. If no new variants or powertrains are found, stage nothing and reply that nothing new was found."
        ),
    ),
    ScheduledTask(
        name="daily_faq_check",
        run_at=time(15, 0),
        prompt=(
            f"{STAGING_INSTRUCTION} Daily 3 PM FAQ job: choose up to 20 real car models that need better buyer FAQs today. "
            "Generate exactly 5 useful FAQs for each selected model using current verified model/spec information. "
            "Skip duplicate existing real or staged FAQs. Stage valid new FAQs in codex_car_faqs. "
            "If fewer than 20 eligible models exist, use only those models."
        ),
    ),
    ScheduledTask(
        name="daily_article_check",
        run_at=time(17, 0),
        prompt=(
            f"{STAGING_INSTRUCTION} Daily 5 PM article job: write 5 useful latest Indian auto news article drafts. "
            "Use official or trusted Indian auto sources, choose the correct real article category, link relevant real "
            "brands/models when available, create a rich structured body with headings, points, tables and source notes, "
            "and stage drafts in codex_articles plus relation staging tables when applicable. "
            "Use any suitable categories from launches, price updates, variants, EV news, facelifts, industry news, upcoming cars, or sales/production updates."
        ),
    ),
)

_last_run_dates: dict[str, date] = {}
_last_failed_at: dict[str, datetime] = {}


def _load_state(state_file: Path) -> None:
    if _last_run_dates or not state_file.exists():
        return
    try:
        raw_state = json.loads(state_file.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return

    for name, value in raw_state.get("last_run_dates", {}).items():
        try:
            _last_run_dates[name] = date.fromisoformat(value)
        except (TypeError, ValueError):
            continue

    for name, value in raw_state.get("last_failed_at", {}).items():
        try:
            _last_failed_at[name] = datetime.fromisoformat(value)
        except (TypeError, ValueError):
            continue


def _save_state(state_file: Path) -> None:
    state = {
        "last_failed_at": {name: failed_at.isoformat() for name, failed_at in _last_failed_at.items()},
        "last_run_dates": {name: run_date.isoformat() for name, run_date in _last_run_dates.items()},
    }
    state_file.write_text(json.dumps(state, indent=2, sort_keys=True), encoding="utf-8")


def due_tasks(now: datetime | None = None, state_file: Path = DEFAULT_STATE_FILE) -> list[ScheduledTask]:
    current = now or datetime.now()
    due: list[ScheduledTask] = []
    _load_state(state_file)

    for task in DEFAULT_TASKS:
        if current.time() < task.run_at:
            continue
        if _last_run_dates.get(task.name) == current.date():
            continue
        failed_at = _last_failed_at.get(task.name)
        if failed_at and current - failed_at < RETRY_AFTER:
            continue
        due.append(task)

    return due


def mark_task_complete(task_name: str, run_date: date | None = None, state_file: Path = DEFAULT_STATE_FILE) -> None:
    _load_state(state_file)
    _last_run_dates[task_name] = run_date or datetime.now().date()
    _last_failed_at.pop(task_name, None)
    _save_state(state_file)


def mark_task_failed(task_name: str, failed_at: datetime | None = None, state_file: Path = DEFAULT_STATE_FILE) -> None:
    _load_state(state_file)
    _last_failed_at[task_name] = failed_at or datetime.now()
    _save_state(state_file)
