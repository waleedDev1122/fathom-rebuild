# Fathom Rebuild

A from-scratch rebuild of fathom.video (AI meeting notetaker), built for a
timed take-home assignment. See `docs/ASSIGNMENT-BRIEF.md`, `docs/PRD.md`,
and `docs/IMPLEMENTATION-PLAN.md` for scope and build order. See `CLAUDE.md`
for the mandatory prompt/response capture setup in `.agent-logs/`.

## Getting started

```bash
cp .env.example .env   # fill in DATABASE_URL and OPENAI_API_KEY
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

Next.js (App Router, TypeScript, Tailwind) · Prisma + Postgres · OpenAI API ·
deployed to Vercel.
