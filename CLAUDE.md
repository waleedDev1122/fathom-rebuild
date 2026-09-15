# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A from-scratch rebuild of fathom.video (AI meeting notetaker) for a timed take-home
assignment. Full product spec, feature priorities, and what to stub vs. build for
real live in `docs/ASSIGNMENT-BRIEF.md` — read it before planning any product work.
`docs/PRD.md` scopes what to build/skip; `docs/IMPLEMENTATION-PLAN.md` is the
phase-by-phase build order and the current source of truth for what's done vs.
still pending — check it before starting new work so phase gating (see below)
stays honest.

Phases 0–5 are built and pushed: scaffold + live Vercel deploy, Prisma data
model + seed data (three realistic fixtures, incl. an 8-person/~1hr meeting),
real OpenAI summarization pipeline, meeting detail view (transcript + template
switcher), transcript highlighting, and cross-meeting search — including a
post-Phase-5 refinement where a global search result jumps to and flashes the
matched transcript segment, and the meeting detail view gained an in-transcript
search with next/previous match navigation. Phase 6 (public share links) is
next; see `docs/IMPLEMENTATION-PLAN.md` for exact status and exit criteria.

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack) deployed on **Vercel**,
  **Tailwind CSS v4** for styling (theme tokens + component classes in
  `src/app/globals.css`, no separate design-system doc — see
  `docs/IMPLEMENTATION-PLAN.md`'s UI scope note).
- **Prisma 7** against Postgres (Neon), via `@prisma/adapter-pg`. Prisma 7 has
  several breaking changes from earlier versions that aren't obvious from old
  docs/examples — see the gotchas below before touching schema/client code.
- **OpenAI API** (`gpt-4o-mini`, JSON-mode chat completions) for real
  summarization/action-item extraction, validated with Zod
  (`src/lib/ai/summarize.ts`). Never mocked in production code paths — only in
  tests (`vi.mock`).
- **Vitest 5 + Testing Library** for unit/component tests; external
  dependencies (Prisma, OpenAI) are always mocked in the automated suite —
  real-service calls are one-off manual checks baked into seed data or a
  phase's exit criteria, not part of `npm test`.

### Prisma 7 gotchas
- Config lives in `prisma7.config.ts` at the repo root (not `package.json`
  or a `datasource.url` in `schema.prisma` — the latter is now a hard error).
- `PrismaClient` requires an explicit driver adapter; there's no more implicit
  env-var reading. See `src/lib/db.ts` for the singleton pattern.
- The generated client's real entry point is `src/generated/prisma/client`,
  not the bare `src/generated/prisma` directory (which has no
  `index`/`package.json`). It's gitignored, so **`postinstall: "prisma
  generate"` in `package.json` is required** for it to exist on any fresh
  install/clone/Vercel build — don't remove it.
- Seed command config is `migrations.seed` in `prisma7.config.ts`, not a
  `package.json` `"prisma"` block.

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

- `npm run dev` — start the dev server (Turbopack)
- `npm run build` — production build; must pass clean as part of every phase's
  exit criteria (see `docs/IMPLEMENTATION-PLAN.md`)
- `npm run lint` — ESLint (`eslint-config-next`)
- `npm test` — Vitest, run once (`vitest run`); all external services mocked
- `npm run seed` — `prisma db seed`, loads `prisma/fixtures/*` and generates
  real summaries via the OpenAI pipeline (requires `DATABASE_URL` and
  `OPENAI_API_KEY` in `.env`; see `.env.example`)

`DATABASE_URL` and `OPENAI_API_KEY` must be set in `.env` (gitignored) for
local dev and in Vercel's project env vars for deploys — never print/echo
their actual values in this repo or in chat.
