/**
 * Active exam session persistence + navigation guard.
 *
 * The strict exam engine keeps its state in React, which means any accidental
 * exit (a hard refresh, closing the tab, or a crash) used to destroy an
 * in-progress attempt. This module fixes that:
 *
 *  - The engine snapshots the ENTIRE attempt (question order, shuffled option
 *    lists, answers, flags, position, phase, start time, duration) to
 *    localStorage continuously, so an exam can be resumed exactly where it
 *    was left.
 *  - The exam clock is WALL-CLOCK based (`startedAt` + duration): there is no
 *    pause and the timer cannot be stopped, exactly like the real exam. Time
 *    away after an accidental exit keeps burning; on resume you get whatever
 *    is left (and an expired session auto-submits on resume).
 *  - Deliberately leaving mid-exam (navigating to Settings or anywhere else)
 *    ENDS the exam: `confirmLeaveExam()` asks once, then `requestExamEnd()`
 *    submits the attempt as-is before navigation proceeds.
 *  - Accidental exits (refresh / closed tab) are covered by the snapshot and
 *    the native beforeunload prompt.
 *
 * Only strict exam sessions are persisted. Study / PBQ practice sessions stay
 * ephemeral but are still guarded against accidental navigation.
 */
import type { StrictUnifiedQuestion } from '@/lib/strictExamOrder';

export interface ExamSessionSnapshot {
  version: 3;
  examNumber: 1 | 2 | 3 | 4 | 5;
  savedAt: number;
  /** Wall-clock start of the attempt. The clock never stops. */
  startedAt: number;
  /** Total exam duration in seconds (e.g. 90 min = 5400). */
  durationSeconds: number;
  /** Remaining seconds when the session was last saved (display fallback). */
  remainingSeconds: number;
  phase: 'item' | 'review';
  idx: number;
  flags: string[];
  mcqAnswers: Record<string, number | number[]>;
  pbqAnswers: Record<string, unknown>;
  /** The exact question list (with shuffled option orders) for a 1:1 resume. */
  questions: StrictUnifiedQuestion[];
}

const KEY = 'secplus-active-exam-session';

/** Window event dispatched to end a live exam (see requestExamEnd). */
export const EXAM_END_EVENT = 'secplus-end-exam';

export function saveExamSession(s: ExamSessionSnapshot): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Storage full / private mode — resume is a nicety, never crash the exam.
  }
}

export function loadExamSession(): ExamSessionSnapshot | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as ExamSessionSnapshot;
    if (!s || s.version !== 3 || !Array.isArray(s.questions) || s.questions.length === 0) return null;
    return s;
  } catch {
    return null;
  }
}

export function hasExamSession(): boolean {
  return loadExamSession() !== null;
}

export function clearExamSession(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}

/**
 * Live remaining seconds for a session. The exam clock is anchored to
 * `startedAt` and runs continuously — there is no pause, and time away after
 * an accidental exit keeps burning (like the real exam). Clamped at 0.
 */
export function sessionRemaining(s: ExamSessionSnapshot, nowMs: number = Date.now()): number {
  const elapsed = Math.floor((nowMs - s.startedAt) / 1000);
  return Math.max(0, s.durationSeconds - elapsed);
}

/** Rough "X of Y answered" summary for resume prompts. */
export function examSessionProgress(s: ExamSessionSnapshot): { answered: number; total: number; flags: number } {
  let answered = 0;
  s.questions.forEach(q => {
    if (q.kind === 'pbq') {
      const a = s.pbqAnswers[q.data.id];
      if (a && (Array.isArray(a) ? a.some(v => v !== '' && v !== undefined && v !== null) : typeof a === 'object' && Object.keys(a).length > 0)) answered++;
    } else {
      const a = s.mcqAnswers[q.data.id];
      if (a !== undefined && (!Array.isArray(a) || a.length > 0)) answered++;
    }
  });
  return { answered, total: s.questions.length, flags: s.flags.length };
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/* =================================================================
   Navigation guard
   ================================================================= */

let activeExamCount = 0;
let activeStudyCount = 0;

export function setExamActive(active: boolean): void {
  activeExamCount = Math.max(0, activeExamCount + (active ? 1 : -1));
}

export function setStudyActive(active: boolean): void {
  activeStudyCount = Math.max(0, activeStudyCount + (active ? 1 : -1));
}

export function isSessionActive(): boolean {
  return activeExamCount > 0 || activeStudyCount > 0;
}

/**
 * Ask the mounted exam engine to finish (submit as-is) right now. Used when
 * the user deliberately leaves mid-exam: the attempt is scored and saved to
 * history before navigation proceeds.
 */
export function requestExamEnd(): void {
  window.dispatchEvent(new CustomEvent(EXAM_END_EVENT));
}

/**
 * Returns true when navigation may proceed.
 *
 *  - Exam in progress: leaving ENDS the exam. The user is told the attempt
 *    will be submitted with the answers so far (exactly like walking out of
 *    the testing room). On confirm, the exam is ended via requestExamEnd().
 *  - Study / PBQ practice in progress: the user is warned the unsaved session
 *    is lost.
 *  - Nothing active: navigation proceeds silently.
 */
export function confirmLeaveExam(): boolean {
  if (activeExamCount > 0) {
    const ok = window.confirm(
      'An exam is in progress.\n\nLeaving will END the exam — it is submitted with the answers you have given so far, like walking out of the testing room.\n\nLeave and end the exam?',
    );
    if (ok) requestExamEnd();
    return ok;
  }
  if (activeStudyCount > 0) {
    return window.confirm(
      'A practice session is in progress.\n\nLeave anyway? This session is not saved and your progress will be lost.',
    );
  }
  return true;
}
