from __future__ import annotations

import os
import re
import shutil
import subprocess
import time
import json
from pathlib import Path

import requests
from dotenv import load_dotenv

from scheduler import due_tasks, mark_task_complete, mark_task_failed

PROJECT_ROOT = Path(__file__).resolve().parents[1]
BACKEND_ENV = PROJECT_ROOT / "admin-backend" / ".env"
RULES_FILE = PROJECT_ROOT / "scripts" / "automation-rules" / "CODEX_SAFETY_RULES.md"
OFFSET_FILE = PROJECT_ROOT / "scripts" / "telegram-offset.json"

CODEX_TIMEOUT_SECONDS = 30 * 60
MAX_TELEGRAM_CHARS = 3900
SEND_ATTEMPTS = 3

SECRET_KEYS = (
    "TELEGRAM_BOT_TOKEN",
    "TELEGRAM_ALLOWED_CHAT_ID",
    "DATABASE_URL",
    "JWT_SECRET",
    "GMAIL_APP_PASSWORD",
    "GMAIL_USER",
)

SECRET_PATTERNS = (
    re.compile(r"/bot\d{6,}:[A-Za-z0-9_-]{20,}", re.I),
    re.compile(r"\bbot\d{6,}:[A-Za-z0-9_-]{20,}\b", re.I),
    re.compile(r"\b\d{6,}:[A-Za-z0-9_-]{20,}\b", re.I),
)

BLOCKED_PATTERNS = (
    re.compile(r"\.env|secret|token|password|api key|credential|database url|jwt", re.I),
    re.compile(r"\b(drop\s+table|truncate\s+table|git\s+reset\s+--hard|git\s+push\s+--force|force\s+push)\b", re.I),
    re.compile(r"\b(delete|remove|weaken|disable|bypass|ignore|edit|modify)\b.*\b(security|rules?|policy|policies)\b", re.I),
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

def redact(value: str) -> str:
    output = value
    for key in SECRET_KEYS:
        output = re.sub(rf"({re.escape(key)}\s*=\s*)\S+", rf"\1[REDACTED]", output, flags=re.IGNORECASE)
    for pattern in SECRET_PATTERNS:
        output = pattern.sub("[REDACTED]", output)
    return output


def preview(value: str, limit: int = 240) -> str:
    return redact(" ".join(value.split()))[:limit]


def check_prompt(prompt: str) -> tuple[bool, str | None]:
    for pattern in BLOCKED_PATTERNS:
        if pattern.search(prompt):
            return False, "Security rules ne is request ko block kiya hai."
    return True, None


def load_offset() -> int:
    if not OFFSET_FILE.exists():
        return 0
    try:
        data = json.loads(OFFSET_FILE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return 0
    try:
        return int(data.get("offset", 0))
    except (TypeError, ValueError):
        return 0


def save_offset(offset: int) -> None:
    OFFSET_FILE.write_text(json.dumps({"offset": offset}, indent=2, sort_keys=True), encoding="utf-8")


def workspace_dir() -> Path:
    workspace = Path(os.getenv("CODEX_WORKSPACE_DIR", str(PROJECT_ROOT))).resolve()
    if workspace != PROJECT_ROOT and PROJECT_ROOT not in workspace.parents:
        raise RuntimeError("CODEX_WORKSPACE_DIR must stay inside this project.")
    return workspace


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


def security_rules() -> str:
    if not RULES_FILE.exists():
        return "Never reveal secrets, tokens, .env contents, passwords, credentials, or private config."
    return RULES_FILE.read_text(encoding="utf-8")


def codex_prompt(owner_prompt: str) -> str:
    return (
        "You are Codex working for the TimesAuto project through Telegram.\n"
        "Follow these security rules exactly:\n\n"
        f"{security_rules()}\n\n"
        "Reply naturally like a helpful human engineer. Do not expose secrets.\n\n"
        "Owner prompt:\n"
        f"{owner_prompt}"
    )


def run_codex(owner_prompt: str) -> tuple[bool, str]:
    clean_prompt = owner_prompt.strip()
    if not clean_prompt:
        return False, "Prompt empty hai."

    command = [*codex_command(), "exec", "--sandbox", "workspace-write", codex_prompt(clean_prompt)]
    try:
        result = subprocess.run(
            command,
            cwd=str(workspace_dir()),
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=CODEX_TIMEOUT_SECONDS,
        )
    except FileNotFoundError:
        return False, "Codex CLI nahi mila. Pehle `codex --version` check karo ya CODEX_CLI_PATH set karo."
    except subprocess.TimeoutExpired:
        return False, "Codex task 30 minutes ke baad timeout ho gaya."
    except Exception as error:  # noqa: BLE001
        return False, f"Codex run fail hua: {redact(str(error))}"

    stdout = redact(result.stdout.strip())
    stderr = redact(result.stderr.strip())
    if result.returncode != 0:
        return False, (stderr or f"Codex exit code {result.returncode} se fail hua.")[-MAX_TELEGRAM_CHARS:]
    return True, (stdout or "Done.")[-MAX_TELEGRAM_CHARS:]


def send_message(text: str) -> None:
    message = redact(text.strip() or "Done.")
    chunks = [message[i : i + MAX_TELEGRAM_CHARS] for i in range(0, len(message), MAX_TELEGRAM_CHARS)]
    for chunk in chunks:
        for attempt in range(1, SEND_ATTEMPTS + 1):
            try:
                response = requests.post(
                    f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage",
                    json={"chat_id": ALLOWED_CHAT_ID, "text": chunk},
                    timeout=30,
                )
                response.raise_for_status()
                break
            except requests.RequestException:
                if attempt == SEND_ATTEMPTS:
                    raise
                time.sleep(attempt * 2)


def get_updates() -> list[dict]:
    global _offset
    response = requests.get(
        f"https://api.telegram.org/bot{BOT_TOKEN}/getUpdates",
        params={"offset": _offset, "timeout": 30, "allowed_updates": ["message"]},
        timeout=40,
    )
    response.raise_for_status()
    data = response.json()
    return data.get("result", []) if data.get("ok") else []


def handle_prompt(prompt: str) -> str:
    allowed, reason = check_prompt(prompt)
    if not allowed:
        return reason or "Request blocked."

    ok, reply = run_codex(prompt)
    return reply if ok else f"Codex error: {reply}"


def handle_prompt_with_status(prompt: str) -> tuple[bool, str]:
    allowed, reason = check_prompt(prompt)
    if not allowed:
        return False, reason or "Request blocked."
    return run_codex(prompt)


def process_scheduled_tasks() -> None:
    for task in due_tasks():
        print(f"[scheduler] Running: {redact(task.name)}")
        send_message(f"Scheduled task started: {task.name}")
        ok, response = handle_prompt_with_status(task.prompt)
        send_message(response if ok else f"Scheduled task failed: {response}")
        if ok:
            mark_task_complete(task.name)
        else:
            mark_task_failed(task.name)


def main() -> None:
    global _offset
    _offset = load_offset()
    print("Telegram -> Codex bot started")
    print(f"Workspace: {workspace_dir()}")
    print("Allowed Telegram chat: configured")

    while True:
        try:
            updates = get_updates()
            if updates:
                print(f"[telegram] Received {len(updates)} update(s)")

            for update in updates:
                _offset = update["update_id"] + 1
                message = update.get("message") or {}
                chat_id = (message.get("chat") or {}).get("id")
                text = (message.get("text") or "").strip()

                if chat_id != ALLOWED_CHAT_ID:
                    print("[telegram] Ignored unauthorized message")
                    save_offset(_offset)
                    continue
                if not text:
                    print("[telegram] Ignored non-text message")
                    save_offset(_offset)
                    continue

                print(f"[telegram] Prompt received: {preview(text)}")
                if text.lower() == "/status":
                    send_message("Telegram Codex bot running hai.")
                    save_offset(_offset)
                    continue

                send_message("Codex ne task receive kar liya hai, kaam start kar raha hu...")
                response = handle_prompt(text)
                send_message(response)
                save_offset(_offset)
                print(f"[telegram] Reply sent: {preview(response, 300)}")

            process_scheduled_tasks()
        except requests.RequestException as error:
            print(f"[telegram] Connection error: {redact(str(error))}")
            time.sleep(5)
        except KeyboardInterrupt:
            print("Bot stopped by user")
            break
        except Exception as error:  # noqa: BLE001
            print(f"[bot] Unexpected error: {redact(str(error))}")
            time.sleep(3)


if __name__ == "__main__":
    main()
