# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A from-scratch rebuild of fathom.video (AI meeting notetaker) for a timed take-home
assignment. Full product spec, feature priorities, and what to stub vs. build for
real live in `docs/ASSIGNMENT-BRIEF.md` — read it before planning any product work.
No application code exists yet; only the assignment's mandatory capture
infrastructure has been built so far.

## Mandatory prompt/response capture

Every Claude Code turn in this repo must be logged automatically to `.agent-logs/`
(one Markdown file per session, frontmatter + `[LOG_ENTRY type=PROMPT/RESPONSE ...]`
blocks). This is done via project hooks, not manual logging — see `CAPTURE-TEST.md`
for the full verification history including dead ends.

- **Do not gitignore `.agent-logs/`, and never edit or delete a logged entry after
  the fact** — a wrong or empty entry stays as-is; fix the bug and let future
  entries be correct. Commit `.agent-logs/` interleaved with code commits, not in
  one lump at the end.
- Hook wiring lives in `.claude/settings.json` (`UserPromptSubmit` + `Stop` →
  scripts in `.claude/hooks/`). `capture_prompt.py` logs the verbatim prompt
  (handed directly on stdin by the `UserPromptSubmit` event — no parsing needed).
  `capture_response.py` recovers the final response text from the session's
  transcript JSONL, because the `Stop` event only provides a `transcript_path`.
- **Non-obvious transcript structure**: the transcript logs one JSONL line *per
  content block* (thinking / text / tool_use), not one line per model turn. Blocks
  belonging to the same turn share `message.id`; the final answer is the *last*
  `message.id` group's `text`-type blocks, concatenated. Logic lives in
  `capture_common.final_response_from_transcript`. Sidechain entries
  (`isSidechain: true`, i.e. subagent transcripts) are excluded.
- **Known race condition**: the transcript's final text block can lag slightly
  behind the `Stop` event firing. `capture_response.py` retries (15 × 200ms) before
  giving up on an empty response — don't remove this without understanding why it's
  there.
- **Hook registration requires a genuinely fresh `claude` process start.** Editing
  `.claude/settings.json` does *not* hot-reload into an already-running session, a
  `/new` session inside the same process does *not* pick it up, and — critically —
  **`claude --continue` / `--resume` also do not re-register hooks**, even though
  they're a fresh process. Only a plain `claude` invocation (no continue/resume
  flag) in the project directory loads hook config fresh. If you change hook
  config, verify with `/hooks` in a truly new (non-continued) session before
  trusting it's live.

## Commands

No build, lint, or test tooling exists yet — no application code has been written.
This section should be filled in once a stack is chosen and scaffolded.
