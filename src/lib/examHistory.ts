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
}

/**
 * Returns the current study streak in calendar days.
 * A streak counts consecutive days (today included) on which at least one
 * exam or practice attempt was recorded.
 */
export function getStudyStreak(): number {
  const history = loadHistory();
  if (history.length === 0) return 0;

  // Collect unique calendar dates (YYYY-MM-DD) of all attempts
  const daySet = new Set<string>();
  history.forEach(a => {
    daySet.add(new Date(a.endTime).toISOString().slice(0, 10));
  });

  // Walk backwards from today, counting consecutive days that have activity
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (daySet.has(key)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Returns an array of { date: 'YYYY-MM-DD', count: number } for the past
 * `weeks` weeks (most recent last), suitable for a GitHub-style heatmap.
 */
export function getActivityHeatmap(weeks = 12): { date: string; count: number }[] {
  const history = loadHistory();
  const dayMap: Record<string, number> = {};
  history.forEach(a => {
    const key = new Date(a.endTime).toISOString().slice(0, 10);
    dayMap[key] = (dayMap[key] || 0) + 1;
  });

  const cells: { date: string; count: number }[] = [];
  const today = new Date();
  const totalDays = weeks * 7;
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    cells.push({ date: key, count: dayMap[key] || 0 });
  }
  return cells;
}
