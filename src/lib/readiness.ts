/**
 * Exam Readiness Algorithm
 * Uses full exam simulations for score trend/consistency when available, while
 * still using the full practice history for coverage, weak areas and volume.
 */

import { loadHistory, loadQuestionStats, getWeakDomains } from './examHistory';
import { DOMAIN_LABELS } from '@/data/questions';

export interface ReadinessBreakdown {
  overall: number;
  recentAccuracy: number;
  consistency: number;
  domainCoverage: number;
  weakDomainStrength: number;
  timeManagement: number;
  volumePracticed: number;
  trend: 'improving' | 'stable' | 'declining';
  readyForExam: boolean;
  recommendations: string[];
}

const ALL_DOMAINS = Object.values(DOMAIN_LABELS);

function paceScore(seconds: number, targetSeconds: number): number {
  if (seconds <= targetSeconds) return 100;
  if (seconds <= targetSeconds * 1.25) return 80;
  if (seconds <= targetSeconds * 1.5) return 60;
  if (seconds <= targetSeconds * 2) return 40;
  return 20;
}

export function calculateReadiness(): ReadinessBreakdown {
  const history = loadHistory();
  const stats = loadQuestionStats();
  const weakDomains = getWeakDomains();
  const recommendations: string[] = [];

  // Full simulations are the best signal for readiness. Tutor/PBQ drills remain
  // valuable for coverage and remediation but should not inflate exam trend.
  const examHistory = history.filter((attempt) => attempt.mode === 'exam' && attempt.totalQuestions >= 80);
  const scoredHistory = examHistory.length > 0 ? examHistory : history;

  const recent = scoredHistory.slice(0, 5);
  const recentAccuracy = recent.length > 0
    ? Math.round(recent.reduce((sum, attempt) => sum + attempt.percentage, 0) / recent.length)
    : 0;

  const last10 = scoredHistory.slice(0, 10).map((attempt) => attempt.percentage);
  let consistency = 0;
  if (last10.length >= 3) {
    const mean = last10.reduce((sum, value) => sum + value, 0) / last10.length;
    const variance = last10.reduce((sum, value) => sum + (value - mean) ** 2, 0) / last10.length;
    consistency = Math.max(0, Math.round(100 - Math.sqrt(variance) * 2));
  } else if (last10.length > 0) {
    consistency = 50;
  }

  const attemptedDomains = new Set(Object.values(stats).map((item) => item.domain));
  const domainCoverage = Math.min(100, Math.round((attemptedDomains.size / ALL_DOMAINS.length) * 100));
  const weakDomainStrength = weakDomains.length > 0 ? weakDomains[0].percentage : 0;

  // MCQs and PBQs have very different interaction cost. Penalizing a topology
  // PBQ for taking >60s made the old readiness score misleading.
  const timedStats = Object.values(stats).filter((item) => item.avgTimeSeconds > 0 && item.timesAttempted > 0);
  let timeManagement = 50;
  if (timedStats.length > 0) {
    const weighted = timedStats.reduce((sum, item) => {
      const target = item.type === 'pbq' ? 180 : 60;
      return sum + paceScore(item.avgTimeSeconds, target) * item.timesAttempted;
    }, 0);
    const weight = timedStats.reduce((sum, item) => sum + item.timesAttempted, 0);
    timeManagement = Math.round(weighted / weight);
  }

  const totalAttempted = Object.values(stats).reduce((sum, item) => sum + item.timesAttempted, 0);
  const volumePracticed = Math.min(100, Math.round((totalAttempted / 300) * 100));

  let trend: 'improving' | 'stable' | 'declining' = 'stable';
  if (scoredHistory.length >= 4) {
    const midpoint = Math.floor(scoredHistory.length / 2);
    const older = scoredHistory.slice(midpoint).map((attempt) => attempt.percentage);
    const newer = scoredHistory.slice(0, midpoint).map((attempt) => attempt.percentage);
    const olderAvg = older.reduce((sum, value) => sum + value, 0) / older.length;
    const newerAvg = newer.reduce((sum, value) => sum + value, 0) / newer.length;
    if (newerAvg - olderAvg > 5) trend = 'improving';
    else if (olderAvg - newerAvg > 5) trend = 'declining';
  }

  const overall = Math.round(
    recentAccuracy * 0.30 +
    consistency * 0.15 +
    domainCoverage * 0.15 +
    weakDomainStrength * 0.15 +
    timeManagement * 0.10 +
    volumePracticed * 0.15
  );

  if (examHistory.length === 0) {
    recommendations.push('Take a full 90-question simulation so readiness can use an exam-condition baseline.');
  } else if (recentAccuracy < 80) {
    recommendations.push('Push full-simulation accuracy toward 80%+ before exam day; use Review to close recurring misses.');
  }
  if (domainCoverage < 100) {
    recommendations.push(`Coverage is ${attemptedDomains.size}/${ALL_DOMAINS.length} domains. Touch every domain before relying on the readiness score.`);
  }
  if (weakDomains.length > 0 && weakDomains[0].percentage < 65) {
    recommendations.push(`Weakest area: "${weakDomains[0].domain}" at ${weakDomains[0].percentage}%. Run a focused drill there.`);
  }
  if (totalAttempted < 150) {
    recommendations.push('Build more repetition across MCQs and PBQs; 150+ tracked attempts gives the analytics a stronger sample.');
  }
  if (trend === 'declining') {
    recommendations.push('Full-simulation scores are trending down. Review misses before taking another full form.');
  }
  if (timeManagement < 60) {
    recommendations.push('Pacing needs work. Training targets are ~60s per MCQ and ~180s per PBQ, not one flat timer for both.');
  }
  if (recommendations.length === 0 && overall >= 80) {
    recommendations.push('Metrics are strong. Keep alternating full simulations with targeted remediation.');
  }

  return {
    overall,
    recentAccuracy,
    consistency,
    domainCoverage,
    weakDomainStrength,
    timeManagement,
    volumePracticed,
    trend,
    readyForExam: examHistory.length > 0 && overall >= 75 && recentAccuracy >= 75 && weakDomainStrength >= 55,
    recommendations,
  };
}
