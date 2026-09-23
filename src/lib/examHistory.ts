/**
 * Exam History & Review System
 * Persists attempt logs in localStorage for review mode and readiness tracking.
 */

export interface QuestionAttempt {
  questionId: string;
  questionText: string;
  domain: string;
  type: 'pbq' | 'mcq';
  isCorrect: boolean;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  timeSpentSeconds: number;
  timestamp: number;
}

export interface ExamAttempt {
  id: string;
  mode: 'practice' | 'exam';
  examId?: string;
  startTime: number;
  endTime: number;
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  passed: boolean;
  questions: QuestionAttempt[];
  domainScores: Record<string, { correct: number; total: number }>;
}

export interface QuestionStats {
  questionId: string;
  questionText: string;
  domain: string;
  type: 'pbq' | 'mcq';
  timesAttempted: number;
  timesCorrect: number;
  timesFailed: number;
  avgTimeSeconds: number;
  lastAttempt: number;
  streak: number; // positive = consecutive correct, negative = consecutive wrong
  explanation: string;       // ← added: latest explanation for review dialog
  userAnswer: string;        // ← added: last user answer for review dialog
  correctAnswer: string;     // ← added: correct answer for review dialog
}

const HISTORY_KEY = 'secplus-exam-history';
const STATS_KEY = 'secplus-question-stats';
export const PROGRESS_EVENT = 'secplus-progress-changed';

function notifyProgressChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(PROGRESS_EVENT));
  }
}

export function loadHistory(): ExamAttempt[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch { return []; }
}

export function saveAttempt(attempt: ExamAttempt): void {
  const history = loadHistory();
  history.unshift(attempt);
  // Keep last 100 attempts
  if (history.length > 100) history.length = 100;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  const updatedStats = updateQuestionStats(attempt.questions);
  notifyProgressChanged();
  // Fire-and-forget cloud sync (dynamic import keeps tests / SSR-safe paths clean)
  import('./cloudSync').then(({ pushExamAttempt, upsertQuestionStat }) => {
    pushExamAttempt(attempt);
    updatedStats.forEach(upsertQuestionStat);
  }).catch(() => {/* offline – local copy already saved */});
}

export function loadQuestionStats(): Record<string, QuestionStats> {
  try {
    return JSON.parse(localStorage.getItem(STATS_KEY) || '{}');
  } catch { return {}; }
}

function updateQuestionStats(questions: QuestionAttempt[]): QuestionStats[] {
  const stats = loadQuestionStats();
  const touched: QuestionStats[] = [];
  questions.forEach(q => {
    const existing = stats[q.questionId] || {
      questionId: q.questionId,
      questionText: q.questionText,
      domain: q.domain,
      type: q.type,
      timesAttempted: 0,
      timesCorrect: 0,
      timesFailed: 0,
      avgTimeSeconds: 0,
      lastAttempt: 0,
      streak: 0,
      explanation: '',
      userAnswer: '',
      correctAnswer: '',
    };
    existing.timesAttempted++;
    if (q.isCorrect) {
      existing.timesCorrect++;
      existing.streak = existing.streak >= 0 ? existing.streak + 1 : 1;
    } else {
      existing.timesFailed++;
      existing.streak = existing.streak <= 0 ? existing.streak - 1 : -1;
    }
    existing.avgTimeSeconds = (
      (existing.avgTimeSeconds * (existing.timesAttempted - 1) + q.timeSpentSeconds) /
      existing.timesAttempted
    );
    existing.lastAttempt = q.timestamp;
    existing.questionText = q.questionText;
    existing.domain = q.domain;
    existing.explanation = q.explanation;
    existing.userAnswer = q.userAnswer;
    existing.correctAnswer = q.correctAnswer;
    stats[q.questionId] = existing;
    touched.push(existing);
  });
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  return touched;
}

export function getWeakDomains(): { domain: string; percentage: number }[] {
  const stats = loadQuestionStats();
  const domainMap: Record<string, { correct: number; total: number }> = {};
  Object.values(stats).forEach(s => {
    if (!domainMap[s.domain]) domainMap[s.domain] = { correct: 0, total: 0 };
    domainMap[s.domain].correct += s.timesCorrect;
    domainMap[s.domain].total += s.timesAttempted;
  });
  return Object.entries(domainMap)
    .map(([domain, { correct, total }]) => ({
      domain,
      percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
    }))
    .sort((a, b) => a.percentage - b.percentage);
}

export function getMissedQuestions(filter?: {
  minFails?: number;
  maxPasses?: number;
  domain?: string;
  type?: 'pbq' | 'mcq';
}): QuestionStats[] {
  const stats = loadQuestionStats();
  let results = Object.values(stats).filter(s => s.timesFailed > 0);
  if (filter?.minFails) results = results.filter(s => s.timesFailed >= filter.minFails!);
  if (filter?.maxPasses !== undefined) results = results.filter(s => s.timesCorrect <= filter.maxPasses!);
  if (filter?.domain) results = results.filter(s => s.domain === filter.domain);
  if (filter?.type) results = results.filter(s => s.type === filter.type);
  return results.sort((a, b) => b.timesFailed - a.timesFailed);
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
  localStorage.removeItem(STATS_KEY);
  notifyProgressChanged();
}
