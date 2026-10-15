/**
 * Exam Checkpoint System
 * Saves exam state to localStorage so users can resume after accidental exit
 */

interface ExamCheckpoint {
  examNumber: number;
  startTime: number;
  pbqAnswers: Record<string, unknown>;
  mcqAnswers: Record<string, number | number[]>;
  flags: string[];
  currentIndex: number;
  remaining: number;
  totalPausedMs: number;
  timeByQuestion: Record<string, number>;
  created: number;
}

const CHECKPOINT_KEY = 'secplus-exam-checkpoint';
const CHECKPOINT_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export function saveExamCheckpoint(checkpoint: Omit<ExamCheckpoint, 'created'>): void {
  try {
    const data: ExamCheckpoint = { ...checkpoint, created: Date.now() };
    localStorage.setItem(CHECKPOINT_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('[checkpoint] save failed', error);
  }
}

export function loadExamCheckpoint(): ExamCheckpoint | null {
  try {
    const raw = localStorage.getItem(CHECKPOINT_KEY);
    if (!raw) return null;

    const checkpoint: ExamCheckpoint = JSON.parse(raw);
    const age = Date.now() - checkpoint.created;

    if (age > CHECKPOINT_EXPIRY_MS) {
      clearExamCheckpoint();
      return null;
    }

    return checkpoint;
  } catch (error) {
    console.warn('[checkpoint] load failed', error);
    return null;
  }
}

export function clearExamCheckpoint(): void {
  try {
    localStorage.removeItem(CHECKPOINT_KEY);
  } catch (error) {
    console.warn('[checkpoint] clear failed', error);
  }
}
