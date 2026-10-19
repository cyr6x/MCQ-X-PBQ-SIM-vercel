import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Home, RotateCcw } from 'lucide-react';
import { loadSimResult } from '@/lib/simExam';

export default function ResultsScreen() {
  const navigate = useNavigate();
  const result = useMemo(() => loadSimResult(), []);

  useEffect(() => {
    if (!result) navigate('/sim', { replace: true });
  }, [result, navigate]);

  if (!result) return null;

  const { score, review, mode, candidate } = result;
  const pct = score.rawTotal > 0 ? Math.round((score.rawCorrect / score.rawTotal) * 100) : 0;
  const correct = score.rawCorrect;
  const incorrect = review.filter(r => !r.isCorrect).length;
  const unanswered = review.filter(r => r.userAnswerText === 'No answer').length;
  const flagged = review.filter(r => r.flagged).length;
  const pbqs = review.filter(r => r.kind === 'pbq');

  const headline = score.passed
    ? mode === 'exam' ? 'Congratulations — you would be on track to pass' : 'Session complete'
    : mode === 'exam' ? 'Keep pushing — not quite passing range yet' : 'Session complete';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl space-y-6 px-5 py-10">
        {/* Score hero */}
        <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-border bg-card p-6">
          <div className="flex flex-col items-center gap-2">
            <div className={`text-6xl font-black tabular-nums ${score.passed ? 'text-emerald-500' : 'text-red-500'}`}>
              {score.scaledScore}
            </div>
            <div className={`rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-wider ${
              score.passed ? 'bg-emerald-500/15 text-emerald-500' : 'bg-red-500/15 text-red-500'
            }`}>
              {score.passed ? 'PASSED' : 'FAILED'}
            </div>
            <div className="text-xs text-muted-foreground">Raw: {correct}/{score.rawTotal} · {pct}%</div>
          </div>
          <div className="min-w-[220px] flex-1">
            <div className="mb-1 text-2xl font-bold">{headline}</div>
            <div className="text-sm text-muted-foreground">SY0-701 CompTIA Security+{candidate ? ` · ${candidate}` : ''}</div>
            <div className="mt-1 text-xs text-muted-foreground">Passing score: 750 / 900</div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard n={correct} label="Correct" tone="text-emerald-500" />
          <StatCard n={incorrect} label="Incorrect" tone="text-red-500" />
          <StatCard n={unanswered} label="Unanswered" tone="text-muted-foreground" />
          <StatCard n={flagged} label="Flagged" tone="text-amber-500" />
        </div>

        {/* Domain performance */}
        <section className="rounded-2xl border border-border bg-card p-6">
          <h3 className="mb-4 text-sm font-bold">Domain Performance</h3>
          <div className="space-y-4">
            {Object.entries(score.domainScores).map(([label, ds]) => {
              const domainScore = ds as { correct: number; total: number; percentage: number };
              return (
                <div key={label}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-semibold">{label}</span>
                    <span className="text-muted-foreground">
                      {domainScore.total > 0 ? `${domainScore.correct}/${domainScore.total} · ${domainScore.percentage}%` : 'no items'}
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all ${domainScore.percentage >= 75 ? 'bg-emerald-500' : domainScore.percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${domainScore.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* PBQ performance */}
        {pbqs.length > 0 && (
          <section className="rounded-2xl border border-border bg-card p-6">
            <h3 className="mb-4 text-sm font-bold">PBQ Performance</h3>
            <div className="space-y-2">
              {pbqs.map(r => {
                const ratio = r.pbqTotal ? Math.round(((r.pbqEarned ?? 0) / r.pbqTotal) * 100) : 0;
                return (
                  <div key={r.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-2.5 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">PBQ</span>
                      <span className="text-xs font-medium">{r.typeLabel}</span>
                    </div>
                    <span className={`text-xs font-bold ${ratio === 100 ? 'text-emerald-500' : ratio === 0 ? 'text-red-500' : 'text-amber-500'}`}>
                      {r.pbqEarned}/{r.pbqTotal} · {ratio}%
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/sim/review')}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
          >
            <ClipboardList className="h-4 w-4" /> Review All Answers
          </button>
          <button
            onClick={() => navigate('/sim')}
            className="flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-semibold transition hover:bg-muted"
          >
            <RotateCcw className="h-4 w-4" /> Retake Exam
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <Home className="h-4 w-4" /> Command Center
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ n, label, tone }: { n: number; label: string; tone: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-center">
      <div className={`text-2xl font-black ${tone}`}>{n}</div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
