import { useEffect, useMemo, useState } from 'react';
import { calculateReadiness } from '@/lib/readiness';
import {
  loadHistory,
  loadQuestionStats,
  PROGRESS_EVENT,
  type ExamAttempt,
  type QuestionStats,
} from '@/lib/examHistory';
import { DOMAIN_LABELS, type Domain } from '@/data/questions';
import type { UserSettings } from '@/lib/userSettings';

function startOfLocalDay(timestamp = Date.now()) {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function startOfLocalWeek(timestamp = Date.now()) {
  const date = new Date(timestamp);
  const day = date.getDay();
  const diff = day === 0 ? 6 : day - 1;
  date.setDate(date.getDate() - diff);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function activeSeconds(attempt: ExamAttempt) {
  const measured = attempt.questions.reduce((sum, question) => sum + Math.max(0, question.timeSpentSeconds || 0), 0);
  if (measured > 0) return measured;
  return Math.max(0, Math.round((attempt.endTime - attempt.startTime) / 1000));
}

export interface ProgressSnapshot {
  history: ExamAttempt[];
  stats: Record<string, QuestionStats>;
  readiness: ReturnType<typeof calculateReadiness> | null;
  totalAnswered: number;
  overallAccuracy: number;
  unresolved: QuestionStats[];
  pbqReps: number;
  fullExamHistory: ExamAttempt[];
  fullExamAverage: number | null;
  weeklyQuestions: number;
  todayMinutes: number;
  daysToExam: number | null;
  weakestDomain: { domain: Domain; label: string; accuracy: number; attempts: number } | null;
}

export function useProgressSnapshot(settings?: UserSettings): ProgressSnapshot {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const refresh = () => setVersion((current) => current + 1);
    window.addEventListener(PROGRESS_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(PROGRESS_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  return useMemo(() => {
    const history = loadHistory();
    const stats = loadQuestionStats();
    const statValues = Object.values(stats);
    const totalAnswered = statValues.reduce((sum, item) => sum + item.timesAttempted, 0);
    const totalCorrect = statValues.reduce((sum, item) => sum + item.timesCorrect, 0);
    const unresolved = statValues
      .filter((item) => item.streak < 0)
      .sort((a, b) => b.lastAttempt - a.lastAttempt);
    const pbqReps = statValues
      .filter((item) => item.type === 'pbq')
      .reduce((sum, item) => sum + item.timesAttempted, 0);
    const fullExamHistory = history.filter((attempt) => attempt.mode === 'exam' && attempt.totalQuestions >= 80);
    const fullExamAverage = fullExamHistory.length
      ? Math.round(fullExamHistory.reduce((sum, attempt) => sum + attempt.percentage, 0) / fullExamHistory.length)
      : null;

    const weekStart = startOfLocalWeek();
    const dayStart = startOfLocalDay();
    const weeklyQuestions = history
      .filter((attempt) => attempt.endTime >= weekStart)
      .reduce((sum, attempt) => sum + attempt.totalQuestions, 0);
    const todayMinutes = Math.round(
      history
        .filter((attempt) => attempt.endTime >= dayStart)
        .reduce((sum, attempt) => sum + activeSeconds(attempt), 0) / 60,
    );

    const byDomain = (Object.keys(DOMAIN_LABELS) as Domain[]).map((domain) => {
      const values = statValues.filter(
        (item) => item.domain === domain || item.domain === DOMAIN_LABELS[domain],
      );
      const attempts = values.reduce((sum, item) => sum + item.timesAttempted, 0);
      const correct = values.reduce((sum, item) => sum + item.timesCorrect, 0);
      return {
        domain,
        label: DOMAIN_LABELS[domain],
        attempts,
        accuracy: attempts ? Math.round((correct / attempts) * 100) : 0,
      };
    });
    const attemptedDomains = byDomain.filter((item) => item.attempts > 0);
    const weakestDomain = attemptedDomains.length
      ? [...attemptedDomains].sort((a, b) => a.accuracy - b.accuracy)[0]
      : null;

    let daysToExam: number | null = null;
    if (settings?.target_exam_date) {
      const target = new Date(`${settings.target_exam_date}T00:00:00`).getTime();
      daysToExam = Math.ceil((target - startOfLocalDay()) / 86_400_000);
    }

    return {
      history,
      stats,
      readiness: history.length ? calculateReadiness() : null,
      totalAnswered,
      overallAccuracy: totalAnswered ? Math.round((totalCorrect / totalAnswered) * 100) : 0,
      unresolved,
      pbqReps,
      fullExamHistory,
      fullExamAverage,
      weeklyQuestions,
      todayMinutes,
      daysToExam,
      weakestDomain,
    };
  }, [settings?.target_exam_date, version]);
}
