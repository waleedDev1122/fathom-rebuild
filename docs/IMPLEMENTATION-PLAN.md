# Implementation Plan — Fathom Rebuild

## Context

`docs/PRD.md` scoped what to build and what to skip; this plan turns that into
a concrete build order for a greenfield repo. Per `CLAUDE.md`'s meta-requirement,
this plan got sign-off before any product code was written, and the build
follows TDD.

## Current status

Phases 0–5 are built, tested, and pushed to `main`/Vercel. Phase 6 (share
links) is next and has not been started. See each phase below for its
individual status and exit-criteria results; `CLAUDE.md` carries a short
summary for quick orientation.

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
- **UI: curated, not advanced.** A deliberate Tailwind palette, type scale,
  and spacing/component-state conventions (hover/focus/empty/loading) set up
  in Phase 0 and applied consistently through every phase — so the app reads
  as considered (the PRD's UX/UI judging axis) without building a formal
  design-system deliverable, brand identity, or component library. No
  separate design-tokens doc; the Tailwind config is the source of truth.
- **No PWA.** No manifest, service worker, or offline/installable support —
  standard responsive Next.js pages only. Consistent with demo-not-production
  scope.

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

Each phase is gated: its **Exit criteria** line must be fully green — tests
passing, `npm run build` clean, and any noted manual check actually done on a
running instance — before the next phase starts. No phase begins on top of an
unverified one.

**Phase 0 — Scaffold & get a live link up first**
`create-next-app` (TS/Tailwind/App Router), Prisma init against the user's
Neon DB, push to a public GitHub repo, connect to Vercel, confirm a
placeholder page is live at a real URL before any feature work — so the
"live link" requirement is never at risk. Wire `OPENAI_API_KEY` and
`DATABASE_URL` locally and in Vercel. Set the Tailwind theme (palette, type
scale, spacing) and base component states (button/link/card hover, focus
rings, empty, loading, error) once here so every later phase builds on a
consistent look rather than improvising per-page. Continue committing
`.agent-logs/` interleaved as normal (hooks already handle capture).
**Exit criteria:** placeholder page loads at the real Vercel URL in an
incognito window; `npm run build` passes; repo is pushed and public.
**Status:** ✅ Done.

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
**Exit criteria:** `prisma migrate dev` and `prisma/seed.ts` both run clean
against the real DB; `/` on a running dev server lists all three seeded
meetings with no empty state; `npm run build` passes.
**Status:** ✅ Done. Fixtures: `prisma/fixtures/one-on-one.ts`,
`team-sync.ts`, `quarterly-planning.ts` (8 participants, 113 segments,
~60min — the flagship fixture), with deliberate cross-meeting continuity
(shared topics like "billing migration", "timezone bug") to make Phase 5
search meaningful.

**Phase 2 — Real AI summarization pipeline (highest-signal piece)**
`lib/ai/summarize.ts`: given transcript segments + a template mode, calls
OpenAI chat completions with JSON-mode output `{ summary, actionItems[] }`,
validated with Zod before persisting. Two prompt variants: `ENHANCED`
(sectioned: overview, key points, decisions, action items) and `BRIEF`
(short tl;dr + action items). Unit tests mock the OpenAI client and assert
prompt construction + response parsing/validation, including malformed-JSON
handling. Run once against the real API manually to sanity-check quality
before baking results into seed data.
**Exit criteria:** all summarization unit tests pass (prompt construction,
parsing, malformed-JSON handling); the one manual real-API run has been
eyeballed for quality; `npm run build` passes.
**Status:** ✅ Done. Model: `gpt-4o-mini` (chosen over unverified/possibly
hallucinated model names surfaced during research). `src/lib/ai/summarize.ts`
exports `summarizeMeeting`, `parseSummaryResponse`, `SummarizationError`.

**Phase 3 — Meeting detail view**
`/meetings/[id]`: speaker-labeled, scrollable transcript pane (must hold up
on the 8-person/hour-long fixture), summary + action items panel, template
switcher (Enhanced/Brief tabs) swapping precomputed summaries. Component
tests for the speaker-label grouping logic (pure function) and the template
switcher.
**Exit criteria:** component/unit tests pass; manually loaded the 8-person/
hour-long fixture on a running dev server and confirmed the transcript pane
scrolls smoothly with no layout breakage; template switch visibly swaps
content; `npm run build` passes.
**Status:** ✅ Done. `src/lib/transcript.ts` (`groupSegmentsBySpeaker`) +
`src/components/meeting/{TranscriptPane,TemplateSwitcher}.tsx`.

**Phase 4 — Highlight a moment**
Click a transcript segment → `POST /api/meetings/[id]/highlights` → persisted
`Highlight` row → marker shown on the transcript/highlight rail. Test: the
route persists and returns highlights correctly scoped per meeting.
**Exit criteria:** route test passes; manually created a highlight on a
running dev server, reloaded the page, and confirmed the marker persisted;
`npm run build` passes.
**Status:** ✅ Done. `POST /api/meetings/[id]/highlights`, star-toggle in
`TranscriptPane` calling `router.refresh()`.

**Phase 5 — Cross-meeting search**
Simple version of "Ask Fathom": `GET /api/search?q=` does an ILIKE search
across transcript text + summary content, returns matching meetings with
snippets; a search bar surfaces results. Test against known queries on the
seeded fixtures.
**Exit criteria:** known-query tests pass; manually ran a query in the UI on
a running dev server and confirmed the expected meetings/snippets appear;
`npm run build` passes.
**Status:** ✅ Done. `src/lib/search.ts` (`searchMeetings`, `excerpt`),
`GET /api/search`, `src/components/search/SearchBar.tsx`.

**Phase 5 addendum — search → transcript UX refinements**
Built after Phase 5 landed, in response to direct feedback that finding a
result should also *take you to the moment*: each global search snippet now
carries the matched `TranscriptSegment.id`; clicking it navigates to
`/meetings/[id]?q=<query>&highlight=<segmentId>`, which scrolls to and
briefly flashes that exact segment. The meeting detail view also gained its
own in-transcript search (prefilled from the global query on arrival) that
highlights every occurrence of the term throughout the transcript via
`src/lib/highlight.ts` (`highlightMatches`, `buildMatchRefs`), with
next/previous navigation (buttons + Enter/Shift+Enter) to step through all
matches, wrapping at both ends.
**Status:** ✅ Done. Tests pass (`highlight.test.ts`,
`TranscriptPane.test.tsx`, `SearchBar.test.tsx`, `search.test.ts`); manually
verified in Chrome (global search → segment jump/flash; in-transcript search
highlighting and next/prev stepping with wraparound on the 8-person fixture);
`npm run build` passes.

**Phase 6 — Share link (signed-out access)**
`shareSlug` generated per meeting at seed time; `/share/[slug]` is a public
route reusing the meeting-detail components in read-only mode, with zero
session/cookie dependency. Tests: works with no auth, unknown slug 404s,
one meeting's share link never exposes another meeting's data.
**Exit criteria:** all three share-route tests pass; manually opened a share
link in a fresh incognito window (no cookies) on the deployed Vercel URL and
confirmed it renders; `npm run build` passes.
**Status:** Not started.

**Phase 7 — Polish pass**
Empty-state audit (should be none anywhere), responsive check, loading/error
states, consistency pass against the Phase 0 theme on list + detail views
(UX/UI is a judged axis) — not a redesign, just catching drift. Manually
walk the full golden path on the deployed Vercel URL in an incognito window:
list → detail → template switch → highlight → search → open the share link
in a second incognito context. This directly re-checks the brief's own
pre-send checklist.
**Exit criteria:** the full golden-path walkthrough completes on the deployed
Vercel URL with no empty states, console errors, or layout breaks found;
`npm run build` passes.
**Status:** Not started.

**Phase 8 — P1 stretch, only if time remains**
Settings stub page (auto-record/share rule builder, default template, bot
naming — the settings that visibly affect defaults from Phase 0-6). Turn the
search bar into a persistent "Ask Fathom" panel.
**Exit criteria (only if attempted):** each added piece manually verified
working on a running instance before being called done; `npm run build`
passes.
**Status:** Not started.

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

- Each phase's own **Exit criteria** (see Build phases above) is the actual
  gate: tests green, `npm run build` clean, and any noted manual check done
  on a running instance. A phase is not "done" until its exit criteria are
  met — do not start the next phase's code on top of one that hasn't cleared
  its gate.
- Final manual pass (Phase 7's exit criteria): open the deployed link in an
  incognito window and walk the full golden path end to end, confirming it
  matches the brief's pre-send checklist (live link works signed-out, repo is
  public with `.agent-logs/` committed).
