# PROJECT_STATE

Last updated: 2026-09-23  
Branch: `feat/product-overhaul-v2`  
Production baseline before this overhaul: `84cb45ab29e6dc52c1c8fcccb43268e58bc45063`

## Product

**SecPlus Trainer — SY0-701** is a local-first Security+ training system built around one loop:

**Learn → Apply → Repair → Prove**

The canonical router surfaces are:

- `/` — Command Center
- `/study` — adaptive study
- `/pbq` — PBQ Lab
- `/exam` — 90-question / 90-minute full simulation
- `/review` — remediation queue
- `/analytics` — performance intelligence
- `/settings` — training controls

## Canonical architecture

### Frontend

- React 18
- TypeScript
- Vite
- React Router
- Tailwind CSS
- shadcn/Radix primitives
- Recharts
- Vitest + Testing Library

### Data and persistence

Runtime source of truth:

- `localStorage`
- `src/lib/examHistory.ts`
- `src/hooks/useProgressSnapshot.ts`

Cloud:

- anonymous device-scoped Supabase backup
- RLS protects rows by anonymous device identity
- completed attempts and aggregate question stats are backed up when available
- cloud rows are **not** hydrated into runtime state, so the product must describe this as **backup**, not account/cross-device sync
- the device UUID is deliberately not displayed because it participates in row access control

## Active training engines

### Full exam

`src/components/StrictExamEngine.tsx`

- 90 questions
- 90 minutes
- fixed form weighting and bank validation
- PBQs distributed through the form
- delayed feedback
- flagging and final review
- configurable interruption pause
- optional auto-fullscreen
- configurable focus-change notice

### Study / remediation

`src/components/NewExamEngine.tsx`

- tutor and focused practice
- mixed MCQ + PBQ drills
- unresolved-miss retesting
- detailed study feedback
- format distribution owned by `src/lib/studyOrder.ts`

### PBQ Lab

`src/components/PBQPractice.tsx`

Eight current simulator interaction families:

1. firewall / ACL
2. ordering
3. log analysis
4. matching
5. network placement
6. terminal / CLI
7. packet analysis
8. network topology

PBQ practice captures real per-item active time and uses equal-weight subtask credit as a **training estimate only**.

## Question bank

Canonical bank: `src/data/questions.ts` + `src/data/advancedQuestions.ts`

Current inventory:

- 256 MCQs
- 56 PBQs
- 312 total items

The obsolete pre-router question/data stack was removed in this overhaul. Do not recreate or edit parallel `src/data/mcq.ts`, `src/data/pbq.ts`, old `Index.tsx`, old Dashboard, IntegratedExam, PBQSection, or MCQSection implementations.

## Shared product system

- `src/components/AppLayout.tsx`
- `src/components/AppSidebar.tsx`
- `src/components/product/ProductUI.tsx`
- `src/index.css`

Design direction:

- restrained dark technical interface
- cyan primary signal, violet secondary/accent signal
- no faux-hacker decoration
- no scanline/neon visual noise
- immersive full-screen task/exam surfaces only where focus benefits
- shared shell for setup, review, analytics and settings

## Live progress contract

`src/hooks/useProgressSnapshot.ts` derives:

- readiness
- all-practice accuracy
- unresolved misses
- PBQ repetitions
- full-exam average
- weekly question volume
- daily active minutes
- target-exam countdown
- weakest attempted domain

`src/lib/examHistory.ts` dispatches `secplus-progress-changed` after saves/clears so Dashboard, Study, Review and Analytics refresh in-session.

## Settings that are wired end to end

- target exam date
- daily active-minutes goal
- weekly question target
- default quick-start mode
- exam pause
- auto-fullscreen
- focus-change notice
- amber/red timer thresholds
- sprint question count
- random-drill count
- PBQ Lab set size
- font size
- reduce motion

The legacy confidence-rating control is not exposed because no end-to-end confidence capture/analytics workflow exists.

## Scoring and claims

Do not claim:

- CompTIA proprietary scoring equivalence
- exact live CompTIA PBQ UI
- a fixed official PBQ format inventory
- official equivalence of the trainer's 80% target to a CompTIA scaled score

Practice score, PBQ subtask credit and readiness are trainer-owned educational signals.

## Release gate

`npm run build` now executes:

1. `npm run test:exam`
2. Vite production build

Vercel `vercel.json` uses:

`npm run build -- --base /`

so previews and production cannot bypass the whitebox gate.

The explicit test gate includes:

- exam engine/scoring tests
- full training journey tests
- strict exam interaction tests
- remediation tests
- settings tests
- local progress persistence/event tests
- smoke-render tests for every live product surface

## Current overhaul scope completed

- rebuilt shared shell/navigation/theme
- Command Center driven by real goals and progress
- Study rebuilt around training intent and weak-area state
- Mixed Study now actually distributes PBQs through the set
- Exam launch rebuilt around real simulator settings
- Review rebuilt as live unresolved/historical remediation
- Analytics rebuilt around full-exam signal, readiness and domain performance
- Settings reduced to controls with real consumers
- PBQ Lab overhauled and real task timing captured
- cloud duration corrected to active per-question time
- cloud-sync language corrected to backup semantics
- obsolete duplicate app stack removed
- Vercel build now enforces tests
- README and product metadata updated

## Known intentional limitations

- no user accounts
- no cross-device state merge/hydration
- no claim of official CompTIA scoring
- no confidence-rating workflow
- browser-automation visual QA was not available in the implementation runtime; route smoke tests + enforced Vercel build are the automated UI gate
