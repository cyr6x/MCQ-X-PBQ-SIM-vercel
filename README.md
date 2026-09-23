# SecPlus Trainer — SY0-701

A focused CompTIA Security+ (SY0-701) training system built for scenario judgment, applied PBQ practice, remediation and full exam rehearsal rather than recall-only drilling.

## Training loop

**Learn → Apply → Repair → Prove**

- **Command Center** — live readiness, training goals, weak-domain signal and next-best-session guidance.
- **Study** — Tutor, Sprint, Random, Weakest Domain, Mixed MCQ + PBQ and unresolved-miss drills.
- **PBQ Lab** — eight interactive task families with on-demand feedback and partial-credit training estimates.
- **Exam Simulation** — 90 questions / 90 minutes, mixed PBQ placement, flag/review flow, optional interruption pause and delayed feedback.
- **Review** — unresolved and historical MCQ/PBQ misses with individual or bulk retest.
- **Analytics** — full-exam trend, readiness inputs, domain accuracy vs official weighting and applied-task repetitions.
- **Settings** — goals, target exam date, quick-start mode, pause/fullscreen/focus controls, timer warnings, drill sizes and accessibility preferences.

## Architecture

- React 18 + TypeScript + Vite
- React Router
- Tailwind CSS + shadcn/Radix primitives
- Recharts
- Supabase anonymous device-scoped backup with RLS
- localStorage as the runtime source of truth
- Vitest + Testing Library whitebox gate

The app deliberately does **not** claim to reproduce CompTIA's proprietary scoring or exact live PBQ interface. Practice scoring, PBQ subtask credit and the 80% dashboard target are training aids.

## Run locally

```bash
git clone https://github.com/cyr6x/MCQ-X-PBQ-SIM-vercel.git
cd MCQ-X-PBQ-SIM-vercel
npm install --legacy-peer-deps
npm run dev
```

Copy the required Supabase values from the project environment into your local environment if you want cloud backup. Without it, the trainer remains local-first.

## Verify

```bash
npm run test:exam
npm run build
```

Production Vercel builds execute the same whitebox gate before bundling.

## Data model

Training history and question stats are stored locally first. Completed attempts and aggregate stats are backed up to device-scoped Supabase rows when available. There is no user-account recovery or cross-device merge flow, so the product describes this honestly as **backup**, not account sync.

## Current status

The primary router-based training system is active. The obsolete pre-router dashboard/exam implementation has been removed so there is one canonical question bank, one exam architecture and one remediation pipeline.
