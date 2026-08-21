from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import tempfile
import time
from pathlib import Path

import requests
from dotenv import load_dotenv

from scheduler import due_tasks, record_task_run

PROJECT_ROOT = Path(__file__).resolve().parents[1]
BACKEND_ENV = PROJECT_ROOT / "admin-backend" / ".env"
OFFSET_FILE = PROJECT_ROOT / "scripts" / "telegram-offset.json"
SESSION_STATE_FILE = PROJECT_ROOT / "scripts" / "codex-session-state.json"

CODEX_TIMEOUT_SECONDS = 30 * 60
MAX_TELEGRAM_CHARS = 3900
TELEGRAM_SESSION_KEY = "main"
SESSION_ROTATE_AFTER_PROMPTS = 25
SESSION_NAME_RE = re.compile(r"^[A-Za-z][A-Za-z0-9_-]{1,39}$")
RESERVED_COMMANDS = {"sessions", "newsession"}
SECRET_ENV_KEYS = (
    "TELEGRAM_BOT_TOKEN",
    "TELEGRAM_ALLOWED_CHAT_ID",
    "DATABASE_URL",
    "JWT_SECRET",
    "GMAIL_APP_PASSWORD",
    "GMAIL_USER",
)

load_dotenv(BACKEND_ENV)

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
ALLOWED_CHAT_ID_VALUE = os.getenv("TELEGRAM_ALLOWED_CHAT_ID", "").strip()

if not BOT_TOKEN:
    raise RuntimeError("TELEGRAM_BOT_TOKEN is missing from admin-backend/.env")
if not ALLOWED_CHAT_ID_VALUE:
    raise RuntimeError("TELEGRAM_ALLOWED_CHAT_ID is missing from admin-backend/.env")

try:
    ALLOWED_CHAT_ID = int(ALLOWED_CHAT_ID_VALUE)
except ValueError as exc:
    raise RuntimeError("TELEGRAM_ALLOWED_CHAT_ID must be numeric") from exc


def load_json(path: Path, fallback: dict) -> dict:
    if not path.exists():
        return fallback
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return fallback
    return data if isinstance(data, dict) else fallback


def save_json(path: Path, data: dict) -> None:
    path.write_text(json.dumps(data, indent=2, sort_keys=True), encoding="utf-8")


def redact(text: str) -> str:
    output = text
    for key in SECRET_ENV_KEYS:
        value = os.getenv(key, "").strip()
        if value:
            output = output.replace(value, "[REDACTED]")
    return output


def load_offset() -> int:
    try:
        return int(load_json(OFFSET_FILE, {"offset": 0}).get("offset", 0))
    except (TypeError, ValueError):
        return 0


def save_offset(offset: int) -> None:
    save_json(OFFSET_FILE, {"offset": offset})


def load_session_state() -> dict:
    state = load_json(SESSION_STATE_FILE, {"sessions": {}, "prompt_counts": {}})
    if "sessions" not in state:
        legacy_sessions = {key: value for key, value in state.items() if isinstance(value, str)}
        state = {"sessions": legacy_sessions, "prompt_counts": {}}
    if not isinstance(state.get("sessions"), dict):
        state["sessions"] = {}
    if not isinstance(state.get("prompt_counts"), dict):
        state["prompt_counts"] = {}
    return state


def save_session_state(state: dict) -> None:
    save_json(
        SESSION_STATE_FILE,
        {
            "prompt_counts": state.get("prompt_counts", {}),
            "sessions": state.get("sessions", {}),
        },
    )


def load_session_id(session_key: str) -> str | None:
    value = load_session_state()["sessions"].get(session_key)
    return str(value) if value else None


def save_session_id(session_key: str, session_id: str) -> None:
    state = load_session_state()
    state["sessions"][session_key] = session_id
    save_session_state(state)


def count_prompt_and_rotate_if_needed(session_key: str) -> None:
    state = load_session_state()
    try:
        count = int(state["prompt_counts"].get(session_key, 0)) + 1
    except (TypeError, ValueError):
        count = 1

    if count >= SESSION_ROTATE_AFTER_PROMPTS:
        state["sessions"].pop(session_key, None)
        state["prompt_counts"][session_key] = 0
    else:
        state["prompt_counts"][session_key] = count

    save_session_state(state)


def is_valid_session_name(name: str) -> bool:
    return bool(SESSION_NAME_RE.fullmatch(name)) and name.lower() not in RESERVED_COMMANDS


def create_fresh_session(session_key: str) -> str:
    state = load_session_state()
    state["sessions"].pop(session_key, None)
    state["prompt_counts"][session_key] = 0
    save_session_state(state)
    return (
        f"Fresh session key ready: {session_key}\n"
        f"Use it like this:\n/{session_key} your prompt"
    )


def sessions_summary() -> str:
    state = load_session_state()
    sessions = state.get("sessions", {})
    prompt_counts = state.get("prompt_counts", {})
    keys = sorted(set(sessions) | set(prompt_counts))
    lines = [
        "Saved Codex sessions:",
        "New session: /newsession akash",
        "Use session: /akash your prompt",
        "",
    ]
    if not keys:
        lines.append("No Codex sessions are saved yet.")
        return "\n".join(lines)

    for key in keys:
        try:
            count = int(prompt_counts.get(key, 0))
        except (TypeError, ValueError):
            count = 0
        status = "active" if key in sessions else "not created/rotated"
        lines.append(f"- {key}: {count}/{SESSION_ROTATE_AFTER_PROMPTS} prompts, {status}")
    return "\n".join(lines)


def parse_session_command(text: str) -> tuple[str, str] | None:
    if not text.startswith("/") or text.startswith("//"):
        return None
    first, _, rest = text.partition(" ")
    session_key = first[1:].strip()
    if not rest.strip() or not is_valid_session_name(session_key):
        return None
    return session_key, rest.strip()


def workspace_dir() -> Path:
    workspace = Path(os.getenv("CODEX_WORKSPACE_DIR", str(PROJECT_ROOT))).resolve()
    if workspace != PROJECT_ROOT and PROJECT_ROOT not in workspace.parents:
        raise RuntimeError("CODEX_WORKSPACE_DIR must stay inside this project.")
    return workspace


def codex_env() -> dict[str, str]:
    env = os.environ.copy()
    default_codex_home = Path.home() / ".codex"
    if "CODEX_HOME" not in env and (default_codex_home / "config.toml").exists():
        env["CODEX_HOME"] = str(default_codex_home)
    return env


def codex_command() -> list[str]:
    configured = os.getenv("CODEX_CLI_PATH", "").strip()
    if configured:
        configured_path = Path(configured)
        if configured.lower().endswith(".js"):
            return ["node", configured]
        if configured.lower().endswith(".cmd"):
            npm_entry = configured_path.parent / "node_modules" / "@openai" / "codex" / "bin" / "codex.js"
            if npm_entry.exists():
                return ["node", str(npm_entry)]
        return [configured]

    appdata = os.getenv("APPDATA")
    if appdata:
        npm_entry = Path(appdata) / "npm" / "node_modules" / "@openai" / "codex" / "bin" / "codex.js"
        if npm_entry.exists():
            return ["node", str(npm_entry)]

    return [shutil.which("codex") or "codex"]


def codex_prompt(owner_prompt: str) -> str:
    return (
        "You are Codex working in the TimesAuto project from Telegram. "
        "Follow the project AGENTS.md rules. Never expose secrets, tokens, .env values, or credentials.\n\n"
        f"{owner_prompt.strip()}"
    )


def thread_id_from_jsonl(output: str) -> str | None:
    candidate: str | None = None
    for line in output.splitlines():
        try:
            event = json.loads(line)
        except json.JSONDecodeError:
            continue
        if not isinstance(event, dict):
            continue
        for key in ("thread_id", "threadId", "session_id", "sessionId"):
            value = event.get(key)
            if isinstance(value, str) and value:
                candidate = value
        nested = event.get("thread") or event.get("session")
        if isinstance(nested, dict) and isinstance(nested.get("id"), str):
            candidate = nested["id"]
    return candidate


def run_codex(prompt: str, session_key: str = TELEGRAM_SESSION_KEY) -> str:
    clean_prompt = prompt.strip()
    if not clean_prompt:
        return "Prompt is empty."

    output_path = Path(tempfile.gettempdir()) / f"telegram-codex-{os.getpid()}-{time.time_ns()}.txt"
    base = [*codex_command(), "exec", "--json", "--sandbox", "workspace-write"]
    session_id = load_session_id(session_key)
    command = [*base, "resume", session_id, codex_prompt(clean_prompt)] if session_id else [*base, codex_prompt(clean_prompt)]

    try:
        if session_id:
            resume_index = command.index("resume")
            command = [*command[: resume_index + 1], "-o", str(output_path), *command[resume_index + 1 :]]
        else:
            command = [*command[:-1], "-o", str(output_path), command[-1]]

        result = subprocess.run(
            command,
            cwd=str(workspace_dir()),
            env=codex_env(),
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=CODEX_TIMEOUT_SECONDS,
        )
    except FileNotFoundError:
        return "Codex CLI was not found. Check `codex --version` or set CODEX_CLI_PATH."
    except subprocess.TimeoutExpired:
        return "Codex task timed out after 30 minutes."
    except Exception as error:  # noqa: BLE001
        return redact(f"Codex run failed: {error}")

    thread_id = thread_id_from_jsonl(result.stdout)
    if thread_id:
        save_session_id(session_key, thread_id)
    count_prompt_and_rotate_if_needed(session_key)

    try:
        reply = output_path.read_text(encoding="utf-8").strip() if output_path.exists() else ""
    except OSError:
        reply = ""
    finally:
        try:
            output_path.unlink(missing_ok=True)
        except OSError:
            pass

    if result.returncode != 0:
        error = (result.stderr or result.stdout or f"Codex failed with exit code {result.returncode}.").strip()
        return redact(error)[-MAX_TELEGRAM_CHARS:]

    return redact(reply or result.stdout.strip() or "Done.")[-MAX_TELEGRAM_CHARS:]


def send_message(text: str) -> None:
    message = redact(text.strip() or "Done.")
    chunks = [message[i : i + MAX_TELEGRAM_CHARS] for i in range(0, len(message), MAX_TELEGRAM_CHARS)]
    for chunk in chunks:
        response = requests.post(
            f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage",
            json={"chat_id": ALLOWED_CHAT_ID, "text": chunk},
            timeout=30,
        )
        response.raise_for_status()


def get_updates(offset: int) -> list[dict]:
    response = requests.get(
        f"https://api.telegram.org/bot{BOT_TOKEN}/getUpdates",
        params={"offset": offset, "timeout": 30, "allowed_updates": ["message"]},
        timeout=40,
    )
    response.raise_for_status()
    data = response.json()
    return data.get("result", []) if data.get("ok") else []


def process_telegram_updates(offset: int) -> int:
    for update in get_updates(offset):
        offset = update["update_id"] + 1
        message = update.get("message") or {}
        chat_id = (message.get("chat") or {}).get("id")
        text = (message.get("text") or "").strip()

        if chat_id != ALLOWED_CHAT_ID or not text:
            save_offset(offset)
            continue

        if text == "/sessions":
            send_message(sessions_summary())
            save_offset(offset)
            continue

        if text.startswith("/newsession"):
            _command, _sep, raw_name = text.partition(" ")
            session_key = raw_name.strip()
            if not is_valid_session_name(session_key):
                send_message("Invalid session name. Example: /newsession akash\nUse letters, numbers, _ or -. Spaces are not allowed.")
            else:
                send_message(create_fresh_session(session_key))
            save_offset(offset)
            continue

        session_prompt = parse_session_command(text)
        if session_prompt:
            session_key, prompt = session_prompt
            send_message(f"Codex received. Session: {session_key}. Starting work...")
            send_message(run_codex(prompt, session_key))
            save_offset(offset)
            continue

        send_message("Codex received. Starting work...")
        send_message(run_codex(text))
        save_offset(offset)

    return offset


def process_scheduled_tasks() -> None:
    for task in due_tasks():
        send_message(f"Scheduled task started: {task.name}")
        send_message(run_codex(task.prompt, task.session_key))
        record_task_run(task.name)


def main() -> None:
    offset = load_offset()
    print("Simple Telegram -> Codex bot started")
    print(f"Workspace: {workspace_dir()}")

    while True:
        try:
            offset = process_telegram_updates(offset)
            process_scheduled_tasks()
        except requests.RequestException as error:
            print(redact(f"Telegram connection error: {error}"))
            time.sleep(5)
        except KeyboardInterrupt:
            print("Bot stopped by user")
            break
        except Exception as error:  # noqa: BLE001
            print(redact(f"Bot error: {error}"))
            time.sleep(3)


if __name__ == "__main__":
    main()
