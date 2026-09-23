# SY0-701 Exam Fidelity Whitebox — 2026-09-23

## Goal
Simulate realistic Security+ SY0-701 exam conditions without turning the question bank into an artificial hard-mode test.

## External benchmark
- CompTIA publishes a **maximum of 90 questions**, **90 minutes**, and a mix of **multiple-choice and performance-based questions**.
- Published domain weighting remains 12% / 22% / 18% / 28% / 20%.
- Pearson VUE review guidance exposes **Review All**, **Review Incomplete**, **Review Flagged**, and **End Review**.
- Neither CompTIA nor Pearson publishes a guaranteed Security+ PBQ position sequence. The simulator therefore must not train candidates to rely on a fixed "PBQs first" rule.
- Professor Messer and Dion Training remain useful preparation references for objective coverage, scenario framing, PBQ-style application, log analysis, configuration, and incident-response practice. They are used as calibration references only; the simulator should keep its own original wording rather than reproduce third-party copyrighted questions.

## Whitebox findings

| ID | Finding | Severity | Fix |
|---|---|---:|---|
| F-01 | Strict exam concatenated all PBQs before all MCQs, teaching a fixed placement pattern that is not guaranteed by the public exam specification. | High | Added reproducible distributed PBQ ordering across the full 90-item form. |
| F-02 | `PBQRenderer` leaked **Difficulty** and **Objective** metadata during strict exam mode. | High | Added `examMode`; hides type/difficulty/objective metadata during the live exam. |
| F-03 | Strict exam and review surfaces were theme-dependent and could render large white/light panels. | Medium | Strict exam, setup, results wrapper, and remediation review now force a dark workspace. |
| F-04 | `/review` was functionally broken: `ReviewPage` passed obsolete props to `ReviewMode`, whose runtime expected `questions`, `score`, and `totalQuestions`; it could fail on `questions.filter`. | Critical | Rebuilt the Review page around persisted question stats. |
| F-05 | Failed-question retry only rebuilt failed MCQs; failed PBQs were silently excluded. | High | Review now includes MCQs and PBQs and supports retry-all or retry-one. |
| F-06 | Historical failures never distinguished an old miss from a currently unresolved weakness. | Medium | Added **Needs Review** (`streak < 0`) and **Ever Missed** views. |
| F-07 | Full forms could drift toward excessive difficulty if future content growth over-favored difficulty 3. | Medium | Added unit guard: difficulty-3 items <=25%; difficulty-2 items >=50% of every 90-item form. |
| F-08 | The current bank does not need a blanket difficulty increase. Raw source tags are predominantly difficulty 2, with comparatively few difficulty 3 items. | Informational | Preserve moderate scenario/application level; improve realism through context and interaction rather than obscure trivia. |

## Question-bank judgment
The current bank is suitable as the core simulation bank. The main fidelity gain comes from exam delivery and scenario quality, not from making every question harder.

Use these calibration principles for future additions:
1. Prefer short operational scenarios over definition-only recall.
2. Keep one clearly best answer based on the facts supplied.
3. Use BEST / MOST / FIRST only when the distinction is meaningful, not to manufacture ambiguity.
4. Include logs, CLI, packet summaries, tickets, and configuration evidence where the objective naturally calls for it.
5. Keep difficulty-3 questions as a minority.
6. Maintain bespoke distractor rationale where practical.
7. Do not copy Messer, Dion, or live-exam questions verbatim.

## Test additions
The focused exam-engine gate now also verifies:
- PBQs are distributed across the first, middle, and final thirds of every strict form.
- PBQs are not front-loaded into positions 1..N.
- Every full form remains 90 items.
- Difficulty 3 stays <=25%.
- Difficulty 2 remains >=50%.

## Result
The strict exam should now be difficult because of **time pressure, application, mixed item types, and realistic context**, not because of unnecessary obscurity or trick wording.
