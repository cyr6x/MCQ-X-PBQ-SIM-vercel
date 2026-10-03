/**
 * Active exam session persistence + navigation guard.
 *
 * The strict exam engine keeps its state in React, which means any accidental
 * exit (a hard refresh, closing the tab, or navigating away) used to destroy
 * an in-progress attempt. This module fixes that:
 *
 *  - The engine snapshots the ENTIRE attempt (question order, shuffled option
 *    lists, answers, flags, position, phase, remaining time, pause state) to
 *    localStorage continuously, so an exam can be resumed exactly where it was
 *    left — including mid-pause with a frozen timer.
 *  - `confirmLeaveExam()` lets the trainer shell (sidebar links, keyboard
 *    shortcuts) ask before yanking the user out of a running attempt.
 *
 * Only strict exam sessions are persisted. Study / PBQ practice sessions stay
 * ephemeral but are still guarded against accidental navigation.
 */
import type { MCQuestion, PBQuestion } from '@/data/questions';
import type { StrictUnifiedQuestion } from '@/lib/strictExamOrder';

export interface ExamSessionSnapshot {
  version: 2;
  examNumber: 1 | 2 | 3 | 4 | 5;
  savedAt: number;
  startedAt: number;
  /** Countdown (seconds) when the session was last active. Frozen while away. */
  remainingSeconds: number;
  isPaused: boolean;
  phase: 'item' | 'review';
  idx: number;
  flags: string[];
  mcqAnswers: Record<string, number | number[]>;
  pbqAnswers: Record<string, unknown>;
  /** The exact question list (with shuffled option orders) for a 1:1 resume. */
  questions: StrictUnifiedQuestion[];
}

const KEY = 'secplus-active-exam-session';

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
    if (!s || s.version !== 2 || !Array.isArray(s.questions) || s.questions.length === 0) return null;
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
 * Returns true when navigation may proceed. While an exam is in progress the
 * user gets a confirm dialog (progress is saved and resumable); while a study
 * or PBQ practice session is running they are warned that progress is lost.
 */
export function confirmLeaveExam(): boolean {
  if (activeExamCount > 0) {
    return window.confirm(
      'An exam is in progress.\n\nLeave anyway? Your answers, flags and remaining time are saved automatically — you can resume it from the Practice Exams page.',
    );
  }
  if (activeStudyCount > 0) {
    return window.confirm(
      'A practice session is in progress.\n\nLeave anyway? This session is not saved and your progress will be lost.',
    );
  }
  return true;
}
