# Whitebox Training System Audit — 2026-09-23

## Goal
Turn the SY0-701 simulator into one coherent training system optimized for exam readiness: realistic full simulations, targeted remediation, strong PBQ practice, useful analytics, and enough flexibility for real-world interruptions.

## Findings and fixes

| ID | Whitebox finding | Impact | Fix |
|---|---|---|---|
| T-01 | The strict exam route had become visually separate from the dashboard/trainer. | Product felt bolted together and controls were inconsistent. | Exam setup and Review returned to the shared app shell; the running exam alone uses a focused full-screen overlay. |
| T-02 | Full exam had no interruption-safe pause even though the user may need to step away. | Training sessions could be abandoned for ordinary interruptions. | Added configurable pause/resume. Pause stops countdown and per-question timing and covers the active question. |
| T-03 | Pause/fullscreen/focus behavior and drill sizes were not configurable. | One-size-fits-all training. | Added settings for pause, fullscreen, focus notices, timer thresholds, sprint size, random-drill size and PBQ set size. |
| T-04 | Hard-coded light surfaces remained in NewExamEngine and PBQPractice. | White flashes/panels broke dark UI consistency. | Removed hard-coded #fafafa surfaces and use shared theme tokens. |
| T-05 | Study Mode separated MCQ and PBQ practice too strongly. | Poor preparation for switching formats during a real exam. | Added a Mixed Exam Drill with MCQs plus PBQs and added PBQs to weakest-domain practice. |
| T-06 | Retry Failed used every historically missed MCQ, even after recovery. | Remediation queues stayed noisy. | Changed focused retry to unresolved misses where streak < 0. |
| T-07 | Study sessions returned to Dashboard instead of maintaining the training loop. | Extra navigation friction. | Active drills now return to Study Mode. |
| T-08 | PBQ Lab did not write practice results into history/stats. | Analytics and readiness ignored PBQ work. | PBQ Lab now saves attempts, partial-credit practice percentages and per-domain stats. |
| T-09 | PBQ Lab contained unsupported claims about exact Pearson/live PBQ prevalence. | Could teach false expectations. | Reworded as applied SY0-701 practice and removed unsupported “most common” claims. |
| T-10 | Readiness treated tutor drills like full exam evidence. | Easy study sets could inflate exam readiness. | Full 80+ item exam simulations now drive recent accuracy/trend/consistency when available. |
| T-11 | Readiness used the same 60-second pace expectation for MCQs and PBQs. | PBQ work was unfairly penalized. | Separate training pace targets: about 60s MCQ and 180s PBQ. |
| T-12 | Analytics displayed a simplistic ~75% “pass” reference. | Suggested equivalence to CompTIA proprietary scoring. | Replaced with an explicit 80% training target and full-exam trend. |
| T-13 | Dashboard did not surface unresolved misses or PBQ repetitions. | The next best training action was not obvious. | Added Review Misses and PBQ repetition context. |
| T-14 | Review used a separate hard-coded slate palette. | Review did not look like the same product. | Converted Review to shared semantic design tokens. |
| T-15 | Objective coverage was complete but thin in 2.1, 4.2, 5.5 and 5.6. | Repeated forms could undertrain those objectives. | Added five original difficulty-2 scenarios. Every official objective now has at least three tagged bank items. |
| T-16 | Browser-level remote automation of the Vercel preview was attempted from the execution sandbox but outbound Chromium navigation was blocked by the environment. | Could not use an external headless browser against the protected preview from that sandbox. | Compensated with component-level jsdom interaction tests, a full programmatic 90-item journey, Vercel preview fetch, deployment checks and runtime-error inspection. |

## Full-form whitebox journey

The deployment gate programmatically sits a 90-item form and checks the same engine used by the UI:

1. Build a full 90-question Form 3.
2. Confirm multiple PBQ families are present and PBQs occur in early, middle and late portions.
3. Intentionally answer six MCQs incorrectly.
4. Intentionally leave one PBQ without credit.
5. Answer the remaining MCQs and PBQs with their keyed/model solutions.
6. Confirm the six MCQ misses and one weak PBQ are detected.
7. Confirm the otherwise strong attempt passes the practice model with a score of at least 800.
8. Confirm domain score breakdown is produced.
9. Confirm a 20-minute wall-clock session with a 10-minute interruption pause reports 10 minutes of active exam time.

## Bank-wide validation

The same gate verifies:
- every single-answer MCQ answer index is valid;
- every select-two item has exactly two unique valid answer indices;
- every PBQ in the bank reaches full practice credit from its model solution;
- shuffled distractor rationales remain attached to the correct option;
- all five full forms contain exactly 90 unique items;
- official domain weighting is preserved;
- PBQs remain distributed through the form;
- difficulty 3 remains a minority (<=25%);
- difficulty 2 remains the majority (>=50%);
- every official SY0-701 objective has at least three tagged bank items.

## Training-system flow

Recommended built-in loop:

**Tutor / targeted drill -> Mixed Exam Drill -> Review unresolved misses -> PBQ Lab where needed -> Full 90-question Exam Simulation -> post-exam review -> targeted remediation**

The simulator deliberately uses strict metadata hiding and delayed feedback only inside a full exam. Study, PBQ Lab, Review and Analytics are remediation tools and therefore expose the explanatory context needed to improve.

## Current validation state

Latest branch validation:
- expanded Vitest whitebox gate: passing;
- Vite production build: passing;
- Vercel preview: READY;
- GitHub/Vercel deployment status: success;
- preview HTTP fetch: 200;
- Vercel runtime error clusters during validation window: none.

The content strategy remains application-oriented rather than artificially difficult. Realism comes from scenario framing, format switching, time pressure, evidence interpretation and remediation, not trick wording.
