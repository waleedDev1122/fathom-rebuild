# Implementation Plan — Fathom Rebuild

## Context

`docs/PRD.md` scoped what to build and what to skip; this plan turns that into
a concrete build order for a greenfield repo (no application code exists yet
— only the capture-hook infra and docs). Per `CLAUDE.md`'s meta-requirement,
this plan gets sign-off before any product code is written, and the build
follows TDD.

Stack decisions, confirmed with the user:
- **Next.js + TypeScript** (App Router, Tailwind), deployed to **Vercel** —
  fastest path to a live, reachable link, which the brief lists as a
  pre-send checklist item.
- **Real Postgres via Prisma** (Neon or Vercel Postgres) — so a highlight
  created by a signed-out visitor actually persists and is visible to
  others, rather than living only in localStorage.
- **OpenAI API** (not Claude) for the real summarization/action-item
  pipeline — the user has an OpenAI key ready. (`docs/ASSIGNMENT-BRIEF.md`'s
  own kickoff notes suggested "run it through Claude," but that's this
  project's own planning note, not literal assignment text — the official
  brief just requires the AI step to be real, not mocked. Swapping providers
  doesn't change that requirement.)
- **No real auth.** Single-tenant seeded demo, nothing gated behind sign-in.
  This trivially satisfies "the live link opens for somebody who is not
  signed in as you," since nothing requires signing in at all.

Two things only the user can do before Phase 0 can finish: provision a
Postgres DB (Neon/Vercel Postgres) and hand over `DATABASE_URL`, and provide
the `OPENAI_API_KEY`. Both get set locally in a gitignored `.env` and in
Vercel's project env vars.

## Data model (Prisma)

- `Meeting`: id, title, startedAt, durationSec, attendeeCount, shareSlug (unique)
- `Participant`: id, meetingId, name
- `TranscriptSegment`: id, meetingId, speakerId, startSec, endSec, text, order
- `Summary`: id, meetingId, template (`ENHANCED` | `BRIEF`), content, generatedAt
- `ActionItem`: id, meetingId, text, owner?, order
- `Highlight`: id, meetingId, atSec, note?, createdAt

## Build phases

**Phase 0 — Scaffold & get a live link up first**
`create-next-app` (TS/Tailwind/App Router), Prisma init against the user's
Neon DB, push to a public GitHub repo, connect to Vercel, confirm a
placeholder page is live at a real URL before any feature work — so the
"live link" requirement is never at risk. Wire `OPENAI_API_KEY` and
`DATABASE_URL` locally and in Vercel. Continue committing `.agent-logs/`
interleaved as normal (hooks already handle capture).

**Phase 1 — Data model + seed data**
Prisma schema above, migration. Author three realistic transcript fixtures
under `prisma/fixtures/`: a short 1:1, a ~30min/4-5-person meeting, and an
**8-person, ~1-hour meeting** (the case the brief calls out as the one that
actually matters, for exercising transcript density and summary length).
`prisma/seed.ts` loads them, calls the summarization pipeline (built in
Phase 2) once per meeting per template, and stores real generated output —
so summaries are genuine AI output, just precomputed at seed time rather
than regenerated on every page view. Meeting list page (`/`) reads from the
DB; never an empty state.

**Phase 2 — Real AI summarization pipeline (highest-signal piece)**
`lib/ai/summarize.ts`: given transcript segments + a template mode, calls
OpenAI chat completions with JSON-mode output `{ summary, actionItems[] }`,
validated with Zod before persisting. Two prompt variants: `ENHANCED`
(sectioned: overview, key points, decisions, action items) and `BRIEF`
(short tl;dr + action items). Unit tests mock the OpenAI client and assert
prompt construction + response parsing/validation, including malformed-JSON
handling. Run once against the real API manually to sanity-check quality
before baking results into seed data.

**Phase 3 — Meeting detail view**
`/meetings/[id]`: speaker-labeled, scrollable transcript pane (must hold up
on the 8-person/hour-long fixture), summary + action items panel, template
switcher (Enhanced/Brief tabs) swapping precomputed summaries. Component
tests for the speaker-label grouping logic (pure function) and the template
switcher.

**Phase 4 — Highlight a moment**
Click a transcript segment → `POST /api/meetings/[id]/highlights` → persisted
`Highlight` row → marker shown on the transcript/highlight rail. Test: the
route persists and returns highlights correctly scoped per meeting.

**Phase 5 — Cross-meeting search**
Simple version of "Ask Fathom": `GET /api/search?q=` does an ILIKE search
across transcript text + summary content, returns matching meetings with
snippets; a search bar surfaces results. Test against known queries on the
seeded fixtures.

**Phase 6 — Share link (signed-out access)**
`shareSlug` generated per meeting at seed time; `/share/[slug]` is a public
route reusing the meeting-detail components in read-only mode, with zero
session/cookie dependency. Tests: works with no auth, unknown slug 404s,
one meeting's share link never exposes another meeting's data.

**Phase 7 — Polish pass**
Empty-state audit (should be none anywhere), responsive check, loading/error
states, visual pass on list + detail views (UX/UI is a judged axis). Manually
walk the full golden path on the deployed Vercel URL in an incognito window:
list → detail → template switch → highlight → search → open the share link
in a second incognito context. This directly re-checks the brief's own
pre-send checklist.

**Phase 8 — P1 stretch, only if time remains**
Settings stub page (auto-record/share rule builder, default template, bot
naming — the settings that visibly affect defaults from Phase 0-6). Turn the
search bar into a persistent "Ask Fathom" panel.

## Testing strategy (TDD)

Vitest for unit/integration tests, written alongside each phase rather than
after. Priority order, matching what's actually judged:
1. Summarization pipeline (prompt building, response parsing/validation, mocked API)
2. Share route (no-auth access, 404 on bad slug, no cross-meeting leakage)
3. Search (known-query assertions against seeded fixtures)
4. Transcript speaker-label grouping (pure function, exercised by the large fixture)
5. A couple of React Testing Library component tests (transcript rendering, template switcher)

Broad e2e (Playwright) is explicitly cut given the time box — noted as a
deliberate omission for the walkthrough, consistent with the "what did you
leave out" judging axis.

## Verification

- `npm run test` after each phase; `npm run build` before each deploy to
  catch type errors early.
- Final manual pass: open the deployed link in an incognito window and walk
  the full P0 golden path end to end, confirming it matches the brief's
  pre-send checklist (live link works signed-out, repo is public with
  `.agent-logs/` committed).
