/**
 * Local-first cloud backup layer.
 *
 * localStorage is the runtime source of truth for the trainer. Completed
 * attempts and aggregate question stats are backed up to device-scoped
 * Supabase rows when the network is available. Remote rows are not hydrated
 * into the active browser state, so this module deliberately does not claim
 * cross-device synchronization.
 */
import { cloud, deviceId } from '@/integrations/supabase/deviceClient';
import type { ExamAttempt, QuestionStats } from '@/lib/examHistory';
import { toast } from 'sonner';

function activeDurationSeconds(attempt: ExamAttempt): number {
  const measured = attempt.questions.reduce(
    (sum, question) => sum + Math.max(0, question.timeSpentSeconds || 0),
    0,
  );
  if (measured > 0) return Math.round(measured);
  return Math.max(0, Math.round((attempt.endTime - attempt.startTime) / 1000));
}

export async function pushExamAttempt(attempt: ExamAttempt): Promise<void> {
  try {
    const scaled = Math.round(100 + (attempt.percentage / 100) * 800);
    const { error } = await cloud.from('exam_attempts').insert({
      device_id: deviceId,
      mode: attempt.mode,
      exam_number: attempt.examId ? Number(attempt.examId) || null : null,
      score_total: attempt.totalQuestions,
      score_raw: attempt.correctAnswers,
      score_scaled: scaled,
      passed: attempt.passed,
      duration_seconds: activeDurationSeconds(attempt),
      domain_breakdown: attempt.domainScores as never,
      question_results: attempt.questions as never,
      confidence_summary: {} as never,
    });
    if (error) throw error;
    toast.success('Attempt backed up', { duration: 1800 });
  } catch (error) {
    console.warn('[cloudBackup] pushExamAttempt failed', error);
    toast.error('Saved locally — cloud backup unavailable', { duration: 3000 });
  }
}

export async function upsertQuestionStat(stat: QuestionStats): Promise<void> {
  try {
    const { error } = await cloud.from('question_stats').upsert(
      {
        device_id: deviceId,
        question_id: stat.questionId,
        question_type: stat.type,
        domain: stat.domain,
        times_attempted: stat.timesAttempted,
        times_correct: stat.timesCorrect,
        times_failed: stat.timesFailed,
        last_result: stat.streak > 0 ? 'correct' : stat.streak < 0 ? 'wrong' : null,
        last_attempted_at: new Date(stat.lastAttempt).toISOString(),
      },
      { onConflict: 'device_id,question_id' },
    );
    if (error) throw error;
  } catch (error) {
    console.warn('[cloudBackup] upsertQuestionStat failed', error);
  }
}

export async function fetchAttempts() {
  const { data, error } = await cloud
    .from('exam_attempts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
}
