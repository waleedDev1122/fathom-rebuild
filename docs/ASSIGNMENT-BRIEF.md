# Fathom Rebuild — Kickoff Brief for Claude Code

Paste this whole file as your first message in this repo's Claude Code session,
then paste the official 8x assignment brief right after it in the same message.
This file covers the capture-setup requirement and hands you everything learned
from a live walkthrough of fathom.video, so you don't have to re-discover it.

---

## 0. Capture setup (do this before anything else)

This assignment requires every prompt/response turn to be logged automatically to
`.agent-logs/` in this repo, committed as we go, not in one lump at the end. Before
writing any product code:

1. State your tool (Claude Code), the model, and confirm you have a hook mechanism
   available (Claude Code supports project-level hooks via `.claude/settings.json`,
   wiring `UserPromptSubmit` and the end-of-turn `Stop` event to a logging script).
2. Install it for real in this repo's `.claude/settings.json`, writing to
   `.agent-logs/` in the exact log format the assignment spec requires (frontmatter
   + `[LOG_ENTRY type=PROMPT/RESPONSE ...]` blocks, one file per session).
3. Verify it: send a canary prompt (`CAPTURE TEST — 8x assignment, Waleed`), confirm
   it lands in `.agent-logs/`, then start a second session and confirm a second
   canary lands too.
4. Write `CAPTURE-TEST.md` at the repo root documenting all of that, including
   anything that didn't work on the first try.
5. Only then start building. Commit `.agent-logs/` interleaved with code commits,
   never gitignored, never edited after the fact.

> **STATUS AS OF HANDOFF (see /CAPTURE-TEST.md for the full story):** Hooks are
> installed in `.claude/settings.json` and the scripts are in `.claude/hooks/`.
> A genuinely brand-new `claude` process (not `--continue`/`--resume` — that was
> confirmed NOT to re-register hooks) picked them up and a canary from that
> session captured correctly end-to-end (prompt + response, after fixing a
> transcript-flush race condition with a retry loop). **This current session is
> that same kind of fresh session — verify hooks are active here too** (check
> `/hooks`, send a canary, confirm it lands in `.agent-logs/`) before writing any
> product code, and do the required *second* independent-session canary check if
> it hasn't been done yet.

---

## 1. What Fathom actually is (from a real signed-in walkthrough, not the marketing site)

Product: AI meeting notetaker. Records/transcribes calls (bot or bot-free), summarizes
them, extracts action items, and makes the whole meeting history searchable.

### Top-level nav (5 sections)
- **My Calls** — personal call library. Empty state on a fresh account shows: a
  self-guided tutorial video, a "Start Test Call" option, and a tips/tricks webinar
  link, plus a "meeting preferences" summary (auto-record all meetings, auto-share
  summary+recording with attendees) with an edit-settings shortcut.
- **Team Calls** — gated behind a separate "Fathom Team Edition" 14-day trial on a
  free/individual account. Pitch: shared team call library, automated CRM data entry
  for the whole team, conversational analytics for coaching. Not reachable on the
  free plan without starting that trial.
- **Playlists** — shareable collections of highlighted moments pulled from multiple
  calls. Explicit use cases shown in-product: organizing feedback across meetings,
  building training libraries of key customer/prospect moments, and collecting
  customer testimonials.
- **Alerts** — keyword/topic monitoring across meetings (ties to the marketing claim
  "automatically monitor key topics so you never miss critical moments"). Didn't
  fully render for a brand-new account with zero calls, likely needs at least one
  recorded meeting to configure against.
- **Deals** — CRM-pipeline-style view tying meetings to deals, corresponds to the
  Salesforce/HubSpot sync settings (see below). Same as Alerts, likely needs real
  call/CRM data to populate.

### Global "Ask Fathom" panel
Pinned on the right side of every screen (not just per-recording). A chat interface
over your entire meeting history with suggested prompts like "Summarize my meetings
from last week," "Things I promised I'd do by this week," "List my action items from
last week," "Where could I improve?," "Surprise me with an insight." Account-level,
scoped by a dropdown (defaults to "My Calls").

### Settings (`/customize`) — the deepest screen
- **Auto-record / auto-share rule builder**: "Auto-record [All meetings ▾] and
  auto-share [Summary & recording ▾] with attendees" — dropdown-driven, not a single
  toggle.
- **Video conferencing connections**, each with its own state and controls:
  - Zoom: Partially Enabled — "Connect" button for more reliable recording, a
    separate toggle for auto-capturing *unscheduled* Zoom meetings, and a link to
    disable Zoom's own "recording in progress" audio notice.
  - Google Meet: Partially Enabled — usage limited to scheduled calls joined via the
    desktop app unless you install the Chrome extension, which unlocks any meeting.
  - Microsoft Teams: Fully Enabled out of the box.
  - Slack Huddles: Fully Enabled out of the box.
  - Each has its own "auto-capture unscheduled meetings" toggle.
- **Bot naming** — customize what the notetaker calls itself when it joins a meeting
  (default was "Waleed's Fathom Notetaker").
- **Auto-Generate Action Items** — on by default, explicitly labeled "Recommended."
- **Default Meeting Summary Template** — a template picker (default: "Enhanced").
  Important nuance: attendees always see the Enhanced template when you share,
  regardless of what your personal default is set to — the default only applies to
  external meetings for your own view.
- **Recording Notification Banner** — a toggle with an explicit legal warning: if you
  disable it, you're responsible for collecting recording consent yourself per your
  and your attendees' jurisdiction.
- **Auto Request Recording Consent** — separate toggle (Recommended), Fathom
  proactively collects consent from external attendees in advance.
- **Default Share Link Access** — "Anyone with the link can view" is the default for
  new recordings.
- **In-meeting Chat Interface** — lets attendees request a summary from inside a live
  call, and surfaces your referral link so others get free premium features by
  joining through it.
- **Integrations**: Claude, ChatGPT, Zapier, Slack (real-time highlight push),
  Salesforce, HubSpot, a generic Task Manager connector, plus native API key/OAuth
  app generation and an MCP server for external tool access.
- **Apps**: a recommended desktop app (works on any platform/meeting tool), a Chrome
  extension (companion for Google Meet), and a Zoom App (host-only).
- **Account**: delete-account option, clearly marked permanent/irreversible.
- Currently on a 10-day premium free-preview window before dropping to free-tier
  limits; "Ask Fathom" is temporarily gifted unlimited use until Oct 1.

### Account status indicators
Header shows a referral CTA ("Refer"), Settings, Help & Feedback, and a small
star/points counter (20, tied to referrals/engagement, gamified onboarding).

### Sign-up mechanics
No email/password option at all — Google or Microsoft OAuth only. Calendar access
appears to ride on that same OAuth grant rather than requiring a separate "connect
calendar" step.

### Role-based framing (from the marketing site, useful for what "product judgement"
might reward — Fathom pitches itself differently per team)
Sales (AI scorecards, CRM auto-updates, deal tracking), Customer Success (risk/
opportunity surfacing across calls), Marketing (sentiment/trend spotting), Operations
(turning "we should do that" into tracked action), HR/Talent (candidate evaluation via
Ask Fathom, onboarding highlight playlists), Product/Engineering (synthesizing feature
requests across calls).

### What the brief explicitly permits you to skip
Real bot-based live call capture (joining an actual Zoom/Meet/Teams call and
recording it) is explicitly okay to stub or fake — say so in the walkthrough video and
explain what you spent that time on instead.

---

## 2. Suggested build priority (given a ~1-day window and what's actually judged:
speed, product judgement, UX/UI)

**Core loop to get real, end to end:**
1. A meeting list (seeded with real, plausible sample meetings, never an empty
   state).
2. A meeting detail view: transcript (with speaker labels — needs to hold up on an
   8-person, hour-long call, not just a 1:1), an AI-generated summary, a switchable
   summary template, and extracted action items.
3. Real AI behind the summary/action-item generation (upload or seed a transcript,
   run it through Claude for real) — this is the single highest-signal thing to make
   genuinely work rather than mock.
4. Highlight-a-moment on the transcript/playback.
5. Cross-meeting search (simple version of "Ask Fathom").
6. Share a clip / share link that works for someone not signed in as you.

**Explicitly stub or skip, and say so in the walkthrough:**
- Actually joining a live Zoom/Meet/Teams call with a bot.
- Team Edition, CRM sync (Salesforce/HubSpot), Zapier, Slack push, MCP server, public
  API — real Fathom features, but not core to proving the product loop in a day.
- Alerts/Deals as fully separate built-out sections, unless time allows after the
  core loop is solid.

---

## 3. What still needs Waleed live (can't be done by an agent alone)
- Getting the notetaker into an actual short (2-minute) real call with himself, if he
  decides the recording-bot part is worth demonstrating at all instead of stubbing.
- An 8-person, hour-long call, for evaluating what that case actually looks like in
  the real product (per the brief) — needs real other people.
- Sharing a clip with someone who wasn't on the call, to see the real recipient
  experience.

A note on this assignment
You're competing with exceptional talent from around the world, including San Francisco and top universities. This is your opportunity to stand out—bring your best thinking, care, and effort to the assignment.

Brief
Rebuild a live product in 24 hours. Better than the original if you want.
That window is deliberately generous and we do not expect you to use all of it. The clock is tracked, never enforced.

The product
fathom.video — the AI meeting notetaker.

Start by using it. Sign up on the free plan and go through the flows properly, every one of them, end to end. Take screenshots as you go. Understand the product fully before you write any code.

At minimum that means: connect a calendar, get the notetaker into a real meeting (a two-minute call with yourself on Zoom, Meet or Teams is enough), let it record, then live with what comes out the other side. Watch the playback against the transcript. Read the AI summary, switch templates, pull the action items. Highlight a moment mid-call and see where it lands. Search across meetings. Share a clip with someone who was not on the call. Then look at what happens on an eight-person call that runs an hour, because that is the case that actually matters.

You do not have to make the recording bot work. Faking or stubbing the capture layer is a legitimate call — say so in the walkthrough and spend the time on what you decided matters more.

Before you write anything
Run through this so your agent captures its prompts and responses into the repository: 8x agent capture setup

It takes about ten minutes. Do not start building until the capture test passes. Commit the `.agent-logs/` directory as you go rather than in one lump at the end.

What you hand in
A live link. Deployed and open, not a localhost recording.
A public repository. With `.agent-logs/` committed in it.
A walkthrough. Loom or anything similar, five minutes at most, camera on. Put it in the walkthrough field.
Paste the live link and the repository into the links field, and label each one.

Seed it with real data. An empty meetings list tells us nothing about what you built.

How it is judged
Speed. How much working product you got to in the time.
Product judgement. What you chose to build first, and what you left out.
UX and UI. Whether the thing you shipped is good to use.
Before you send it
The live link opens for somebody who is not signed in as you.
The repository is public, and `.agent-logs/` is in it.
Your camera is on in the walkthrough, and it is under five minutes.

---

## 4. Meta-requirement for this build (from the user, not the assignment issuer)

Run this as a real SDLC: act as a senior engineer, use test-driven development, and
produce an implementation plan before writing product code. The implementation plan
should be presented for sign-off (e.g. via plan mode) before the actual build starts.
