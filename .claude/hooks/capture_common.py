"""Shared helpers for the .agent-logs capture hooks (UserPromptSubmit + Stop).

Design notes (verified against a live transcript on 2026-09-14, not guessed):
- UserPromptSubmit hook stdin JSON includes the prompt text directly, so no
  transcript parsing is needed to capture the prompt.
- The Stop hook stdin JSON only gives session_id / transcript_path / cwd, so
  the final response text has to be recovered from the transcript file.
- Transcript JSONL logs one entry PER CONTENT BLOCK (thinking / text /
  tool_use), not one entry per API turn. All blocks belonging to the same
  model turn share `message.id` and `message.stop_reason`. The true final
  answer for a Stop event is the *last* message.id group in the file, with
  its `text`-type blocks concatenated in order.
- Sidechain entries (isSidechain: true) belong to subagents, not the main
  conversation, and are excluded.
"""

import json
import os
import re
from datetime import datetime, timezone

LOG_DIR_NAME = ".agent-logs"
ERROR_LOG_NAME = ".hook-errors.log"
DEFAULT_MODEL = "claude-sonnet-5"
AUTHOR = "Waleed Ahmed"
TOOL_NAME = "claude-code"
PROJECT_NAME = "fathom-rebuild"


def utc_now_iso():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.") + \
        f"{datetime.now(timezone.utc).microsecond // 1000:03d}Z"


def read_stdin_json():
    raw = __import__("sys").stdin.read()
    return json.loads(raw) if raw.strip() else {}


def project_root_from(data):
    cwd = data.get("cwd")
    if cwd and os.path.isdir(cwd):
        return cwd
    return os.getcwd()


def log_dir_for(project_root):
    d = os.path.join(project_root, LOG_DIR_NAME)
    os.makedirs(d, exist_ok=True)
    return d


def log_error(project_root, message):
    try:
        d = log_dir_for(project_root)
        with open(os.path.join(d, ERROR_LOG_NAME), "a") as f:
            f.write(f"[{utc_now_iso()}] {message}\n")
    except Exception:
        pass


def find_session_log_path(log_dir, session_id):
    if not os.path.isdir(log_dir):
        return None
    suffix = f"_{session_id}.md"
    for name in os.listdir(log_dir):
        if name.endswith(suffix):
            return os.path.join(log_dir, name)
    return None


def short_id(session_id):
    return session_id.split("-")[0]


def model_from_transcript(transcript_path):
    """Best-effort: last model name seen in the transcript's assistant entries."""
    model = None
    try:
        with open(transcript_path) as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    d = json.loads(line)
                except json.JSONDecodeError:
                    continue
                if d.get("type") == "assistant" and not d.get("isSidechain", False):
                    m = d.get("message", {}).get("model")
                    if m:
                        model = m
    except (FileNotFoundError, OSError):
        pass
    return model or DEFAULT_MODEL


def final_response_from_transcript(transcript_path):
    """Return (text, model) for the last assistant message.id group in the
    transcript, excluding sidechain (subagent) entries and non-text blocks."""
    entries = []
    with open(transcript_path) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                d = json.loads(line)
            except json.JSONDecodeError:
                continue
            if d.get("type") == "assistant" and not d.get("isSidechain", False):
                entries.append(d)

    if not entries:
        return "", DEFAULT_MODEL

    last_msg_id = entries[-1]["message"].get("id")
    group = [e for e in entries if e["message"].get("id") == last_msg_id]

    texts = []
    model = DEFAULT_MODEL
    for e in group:
        msg = e["message"]
        if msg.get("model"):
            model = msg["model"]
        for block in msg.get("content", []):
            if block.get("type") == "text" and block.get("text"):
                texts.append(block["text"])

    return "\n\n".join(texts).strip(), model


def frontmatter_block(session_id, date, model, total_exchanges, first_ts, last_ts):
    return (
        "---\n"
        f"session_id: {session_id}\n"
        f"date: {date}\n"
        f"author: {AUTHOR}\n"
        f"model: {model}\n"
        f"tool: {TOOL_NAME}\n"
        f"project: {PROJECT_NAME}\n"
        f"total_exchanges: {total_exchanges}\n"
        f"first_prompt_time: {first_ts}\n"
        f"last_prompt_time: {last_ts}\n"
        "---\n"
    )


def create_new_session_log(log_dir, session_id, model, timestamp):
    date = timestamp.split("T")[0]
    sid = short_id(session_id)
    filename = f"{timestamp[:19].replace(':', '-').replace('T', '_')}_{session_id}.md"
    path = os.path.join(log_dir, filename)
    content = (
        frontmatter_block(session_id, date, model, 0, timestamp, timestamp)
        + "\n"
        + f"# Session Log - {date}\n\n"
        + f"Session: `{sid}` | Project: `{PROJECT_NAME}` | Author: `{AUTHOR}`\n\n"
        + "---\n"
    )
    with open(path, "w") as f:
        f.write(content)
    return path


def read_file(path):
    with open(path) as f:
        return f.read()


def write_file(path, content):
    with open(path, "w") as f:
        f.write(content)


def max_entry_num(content, entry_type):
    nums = [int(n) for n in re.findall(
        rf"\[LOG_ENTRY type={entry_type} num=(\d+)", content)]
    return max(nums) if nums else 0


def update_frontmatter_field(content, field, value):
    pattern = rf"^{field}: .*$"
    replacement = f"{field}: {value}"
    new_content, n = re.subn(pattern, replacement, content, count=1, flags=re.MULTILINE)
    return new_content if n else content


def append_entry(path, entry_type, num, session_id, timestamp, model, text):
    sid = short_id(session_id)
    entry = (
        f"\n[LOG_ENTRY type={entry_type} num={num} session={sid}]\n"
        f"timestamp: {timestamp}\n"
        f"model: {model}\n\n"
        f"{text}\n\n"
    )
    with open(path, "a") as f:
        f.write(entry)
