# PRD — Fathom Rebuild

Status: Draft, for sign-off before implementation planning begins.
Source material: `docs/ASSIGNMENT-BRIEF.md` (product walkthrough notes + official
8x assignment brief). Read that first — this document turns it into scoped,
buildable requirements.

## 1. Problem & context

Fathom is an AI meeting notetaker: it joins calls, transcribes them, summarizes
them, extracts action items, and makes meeting history searchable. This is a
timed (≤24h) take-home rebuild, judged on three axes: **speed** (how much
working product got built), **product judgement** (what got built first and
what got deliberately left out), and **UX/UI** (whether the shipped thing is
good to use). It is not judged on feature completeness or fidelity to every
corner of the real product.

The deliverable is a deployed, publicly-reachable app that works for a signed-out
visitor, seeded with realistic data (never an empty state), plus a public repo
and a ≤5-minute walkthrough video.

## 2. Goals

- Prove a real, end-to-end product loop: a meeting exists → its transcript and
  AI-generated summary/action items are real (not hardcoded) → a user can
  highlight a moment, search across meetings, and share a clip with someone
  who wasn't on the call and isn't signed in.
- Make the single highest-signal piece — AI summarization/action-item
  extraction — genuinely work against a real LLM call, not a canned response.
- Ship something that reads as considered product design (sensible defaults,
  no dead-end empty states, clear information hierarchy on the meeting detail
  view) over something that has many shallow, half-working sections.

## 3. Non-goals (explicitly stubbed or skipped, per the brief)

- **Live bot-based call capture** (actually joining a Zoom/Meet/Teams call and
  recording it). Stubbing/faking this is explicitly sanctioned by the brief —
  state clearly in the walkthrough that it's stubbed and what the saved time
  went toward instead.
- **Team Edition** (separate trial-gated product surface).
- **CRM sync** (Salesforce/HubSpot), **Zapier**, **Slack push**, **MCP server**,
  **public API** — real Fathom features, not core to proving the loop in a day.
- **Alerts** and **Deals** as fully built-out sections — only revisit if the
  core loop (Section 4) is solid with time remaining.
- Auth breadth: the real product is Google/Microsoft OAuth only with no
  email/password option. Match that constraint conceptually, but the actual
  auth implementation is an implementation-plan decision, not a PRD-level one
  — a lightweight/stubbed auth is acceptable given the time box, as long as
  the signed-out visitor experience (the thing actually judged) works.

## 4. Core user flow (P0 — must work end to end, real, not mocked)

This is the golden path from the brief's own product walkthrough (section 1
of the brief), reduced to what's buildable in the time available:

1. **Meeting list** ("My Calls" equivalent) — seeded with several real,
   plausible sample meetings (mixed lengths, mixed attendee counts, at least
   one large one — see Section 6). Never an empty state.
2. **Meeting detail view**:
   - Transcript with speaker labels. Must hold up on an 8-person, hour-long
     call, not just a 1:1 — this is called out explicitly in the brief as
     "the case that actually matters."
   - AI-generated summary, produced for real by sending the transcript to
     Claude.
   - A switchable summary template (at least two templates, e.g. "Enhanced"
     vs. a shorter "Brief" style), re-generating or re-rendering per template.
   - Extracted action items, also real model output, not string-matched
     heuristics.
3. **Highlight a moment** on the transcript/playback (playback can be a stub —
   e.g. a scrubbable timeline synced to transcript timestamps — since real
   recording capture is out of scope; the highlight *interaction* itself
   should be real).
4. **Cross-meeting search** — a simple version of "Ask Fathom": query across
   seeded meetings' transcripts/summaries and get relevant results back.
5. **Share** — a clip or share link that renders correctly for someone who is
   not signed in and not the meeting owner. This is one of the three items
   the brief explicitly lists as a pre-send checklist item ("the live link
   opens for somebody who is not signed in as you"), so the share flow must
   satisfy the same bar.

## 5. Secondary scope (P1 — build if the core loop lands early)

- Global "Ask Fathom" panel as a persistent chat surface (rather than a
  one-off search box), scoped by a "My Calls" style dropdown.
- Settings screen covering the auto-record/auto-share rule builder, bot
  naming, default summary template, and default share-link access — these
  are the settings that visibly affect the P0 flow's defaults, so are worth
  surfacing even in stub form.
- Meeting preferences summary shown on the meeting-list empty/header state
  (auto-record all meetings, auto-share summary+recording).

## 6. Explicitly out of scope for now (P2 — only with significant time left)

- Playlists, Alerts, Deals as full sections.
- Video-conferencing connection management UI (Zoom/Meet/Teams/Slack Huddles
  states) beyond a static settings mock.
- Gamification (referral points/star counter), role-based landing pages,
  in-meeting chat interface, native app / Chrome extension / Zoom App pages.
- Account deletion and other account-management chrome.

## 7. Seed data requirements

Per the brief ("seed it with real data — an empty meetings list tells us
nothing"):

- At least one small call (1:1 or small group, short).
- At least one large call: 8 attendees, ~1 hour, to exercise transcript
  speaker-label density and summary length — this is the case the brief
  singles out as the one that "actually matters."
- Transcripts should be realistic enough (natural dialogue, interruptions,
  topic changes) that the real AI summarization step produces a genuinely
  useful summary and non-trivial action items, not a demo of an obviously
  synthetic transcript.

## 8. Success criteria / definition of done

Mirrors the brief's own pre-send checklist:

- Live, deployed link (not localhost) that opens correctly for a signed-out
  visitor.
- Public repository with `.agent-logs/` committed and never edited after the
  fact.
- The P0 loop (Section 4) works against real seeded data end to end, with
  real (non-mocked) AI summarization and action-item extraction.
- A ≤5-minute, camera-on walkthrough that demonstrates the golden path and
  explicitly states what was stubbed (bot capture) and why, and what the
  saved time was spent on instead.

## 9. Open questions for the implementation plan

These are deliberately left unresolved here and belong in the implementation
plan (per `CLAUDE.md`'s meta-requirement, to be presented for sign-off before
build starts):

- Tech stack (framework, hosting/deploy target, LLM API wiring for the
  summarization step).
- Auth approach for the stubbed signed-in owner vs. the required signed-out
  visitor experience.
- Data model for meetings/transcripts/speakers/highlights, and how seed data
  is authored and loaded.
- Test strategy (the meta-requirement calls for TDD) — what's worth covering
  given the time box: likely the summarization/action-item pipeline and the
  share-link signed-out-access path, since those are the two flows explicitly
  checked against real judging criteria.
