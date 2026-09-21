# SY0-701 Question & Simulator Calibration Audit

## Bottom line

The bank is structurally strong enough to remain the content baseline, but it is not yet uniformly exam-calibrated. The strongest items already use contextual stems, plausible distractors, objective tags, and explicit distractor rationale. A meaningful portion of the bank is still short recall-style material that is useful for study drills but easier and less ambiguous than the scenario-heavy decision making expected from a rigorous Security+ simulator.

This overhaul therefore preserves the bank, fixes metadata defects, improves the delivery/review experience, and identifies the next content-calibration pass rather than rewriting hundreds of questions without evidence.

## Current bank profile

| Measure | Current state | Calibration implication |
| --- | ---: | --- |
| Single-answer MCQs | 200 | Strong volume |
| Select-two MCQs | 50 | Good coverage of multi-select decisions |
| PBQs | ~50 | Strong training pool |
| Explicit per-distractor `whyWrong` maps | 50 / 250 MCQs | Only 20% currently support bespoke rationale for every distractor |
| Stems containing BEST | 38 | Useful exam-style decision wording |
| Stems containing MOST | 10 | Underrepresented |
| Stems containing FIRST | 3 | Underrepresented |
| Stems containing NEXT | 1 | Underrepresented |
| Stems containing LEAST | 0 | Missing |
| Objective/domain mismatches found | 1 | `s20` corrected from D1 to D5 / objective 5.6 |

Keyword counts are only a signal, not a quality score. A strong question does not need an uppercase qualifier; it does need enough context for the candidate to discriminate among plausible choices.

## What already works

- The exam builder targets the current SY0-701 domain weights: D1 12%, D2 22%, D3 18%, D4 28%, D5 20%.
- Questions are tagged to an objective and difficulty level.
- The bank contains original scenario items with real operational context across IAM, IR, cloud, network defense, cryptography, governance, and threat analysis.
- PBQs already cover five interaction families: firewall rules, ordering, log analysis, matching, and placement.
- The simulator now supports PBQ partial-credit feedback at explicit subtask level for learning purposes.
- Post-exam review now exposes the objective, correct reasoning, distractor reasoning, PBQ model solution, and immediate retest.

## What needs further question-authoring improvement

1. **Expand bespoke distractor rationale.** Replace the generic fallback on the remaining MCQs with option-specific reasoning. Every distractor should be plausible for a specific misconception, not merely obviously wrong.
2. **Increase decision-heavy scenarios.** Add two-to-four sentence stems with role, environment, constraint, evidence, and decision point. Prioritize FIRST, NEXT, MOST likely, LEAST effective, and BEST approach where naturally appropriate.
3. **Add evidence-bearing MCQs.** The data model should grow optional context blocks for log excerpts, CLI output, packet summaries, diagrams, tickets, policy fragments, and mini tables.
4. **Add higher-fidelity PBQ families.** The current bank lacks true terminal command-response, network-topology wiring, packet-capture interpretation, and multi-row SIEM investigation workflows.
5. **Calibrate ambiguity deliberately.** Difficulty 3 should generally require choosing between multiple technically valid controls based on sequence, scope, risk, or business constraint—not obscure trivia.
6. **Maintain objective integrity.** New content should be validated against the SY0-701 objective number before merge.

## Pearson / CompTIA fidelity decisions used in this overhaul

- PBQs are presented first in the full practice exam, matching common current candidate reports and training guidance.
- PBQs remain flaggable and reviewable; the previous one-way PBQ lock has been removed.
- The review experience follows the same usability principle as Pearson's item review controls: review all, incomplete/incorrect work, and flagged work with direct question navigation.
- The simulator labels its computed score as a **practice scale**. CompTIA does not publish its exact item weighting or scaled-score formula.
- PBQ subtask partial credit is an equal-weight learning estimate. It is intentionally not presented as CompTIA's proprietary scoring model.

## Content-source position

Dion, Messer, and Pearson-style practice material are useful references for pacing, stem style, distractor plausibility, and interface expectations. They should not be treated as exact replicas of the live exam or copied into the bank. The target is original content mapped to the official objectives and delivered with Pearson-like exam ergonomics.
