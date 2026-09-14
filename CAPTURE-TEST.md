# Capture Test — 8x Assignment

**Tool:** Claude Code
**Model:** `claude-sonnet-5` (planning and execution both done by the same model in this project)
**Mechanism:** Project-level hooks in `.claude/settings.json`, wiring `UserPromptSubmit` (fires with the verbatim prompt) and `Stop` (fires at end-of-turn with a transcript path) to two Python scripts under `.claude/hooks/`.

## Config file changed

`.claude/settings.json`:

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "",
        "hooks": [
          { "type": "command", "command": "python3 .claude/hooks/capture_prompt.py" }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          { "type": "command", "command": "python3 .claude/hooks/capture_response.py" }
        ]
      }
    ]
  }
}
```

Scripts: `.claude/hooks/capture_prompt.py`, `.claude/hooks/capture_response.py`, sharing helpers in `.claude/hooks/capture_common.py`.

- `UserPromptSubmit` hands the prompt text directly on stdin, so the prompt half needs no transcript parsing.
- `Stop` only gives `session_id`/`transcript_path`/`cwd`, so the response half is recovered by reading the session's transcript JSONL, filtering to non-sidechain `assistant` entries, grouping by `message.id` (the transcript logs one line **per content block** — thinking/text/tool_use — not one line per turn), taking the last group in the file, and concatenating its `text`-type blocks.

## What didn't work on the first try

1. **`"matcher": ""` on events that don't support matchers.** `UserPromptSubmit` and `Stop` don't take a `matcher` field at all — official docs say an unsupported matcher is silently ignored, so this wasn't fatal by itself, but it was based on a copied `PreToolUse`-style shape rather than verified schema.
2. **Assumed hot-reload.** Docs state settings-file hook edits are normally picked up by a file watcher without a restart. Empirically, that did **not** hold here: the hook was invisible in `/hooks` (`No hooks configured for this event`) in the session that created `settings.json`, and even in a brand-new session started with `/new`-style session creation inside the same running process. It only appeared under `/hooks` → Project Settings after **fully quitting the Claude Code process** and relaunching `claude` fresh in the repo directory. Lesson: a hot process, not just a hot session, is what's stale.
3. **Empty response capture due to a write/read race.** The first real canary (`CAPTURE TEST — 8x assignment, Waleed`, session `f5325e7c`) logged the `PROMPT` entry correctly but produced an **empty `RESPONSE` entry**. Root cause confirmed by re-running the parser against the same transcript file moments later: the final assistant `text` block simply hadn't been flushed to the transcript JSONL yet at the instant the `Stop` hook fired and read it — the hook logic itself was correct once the file was complete. Fix: `capture_response.py` now retries (up to 15 × 200ms) until it finds non-empty text before giving up. That empty `RESPONSE num=1` entry in `.agent-logs/2026-09-14_19-09-39_f5325e7c-f1d2-44cb-8e79-ec92f135792f.md` is left uncorrected, per the assignment's rule against editing logged entries after the fact — this file documents the fix instead.
4. **A follow-up canary attempt got confused between sessions.** A second canary intended for the same fresh session never produced a new log entry, and the "answer" that came back was actually a restatement of the *first* canary's already-logged response, not a live reply — indicating it was typed into the wrong window rather than the hooked session. Caught by checking the log file directly rather than trusting the reported outcome.
5. **`claude --continue` does not re-register hooks.** To keep the main working conversation's context while picking up the newly-created `.claude/settings.json`, the process was fully quit and relaunched with `claude --continue`. A canary sent in that resumed session produced **no log entry at all** — `.agent-logs/` was untouched. This confirms hook registration happens at a fresh session start specifically, not merely a fresh process, and not a resumed one. Practical consequence: the main build session had to be handed off to a genuinely new (non-continued) `claude` session, briefed via `docs/ASSIGNMENT-BRIEF.md` plus this file, rather than resumed — conversational context could not be preserved across that boundary and hooks both.

## Canary entries (raw, from session `f5325e7c`)

```
[LOG_ENTRY type=PROMPT num=1 session=f5325e7c]
timestamp: 2026-09-14T19:09:39.956Z
model: claude-sonnet-5

CAPTURE TEST — 8x assignment, Waleed


[LOG_ENTRY type=RESPONSE num=1 session=f5325e7c]
timestamp: 2026-09-14T19:09:43.018Z
model: claude-sonnet-5

```

(Response left blank above — see point 3. The retry fix landed after this run.)

## Status

Retry fix applied to `capture_response.py` and confirmed correct by re-running the parser directly against the completed transcript (extracted the real response text once the file had fully flushed). Not yet re-verified through a live end-to-end canary in a genuinely fresh session (see point 5 above — the attempted re-verification used `--continue`, which doesn't register hooks). **The next fresh session (briefed via `docs/ASSIGNMENT-BRIEF.md`) must send one clean canary, confirm a non-empty PROMPT+RESPONSE pair lands in `.agent-logs/`, and do the required *second*, independent-session canary check before any product code is written.**
