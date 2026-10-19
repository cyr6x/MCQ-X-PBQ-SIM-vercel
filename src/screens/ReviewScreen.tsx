import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle2, XCircle, Flag } from 'lucide-react';
import { loadSimResult, type SimReviewItem } from '@/lib/simExam';

type Filter = 'all' | 'incorrect' | 'flagged' | 'correct';

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'incorrect', label: 'Incorrect' },
  { value: 'flagged', label: 'Flagged' },
  { value: 'correct', label: 'Correct' },
];

export default function ReviewScreen() {
  const navigate = useNavigate();
  const result = useMemo(() => loadSimResult(), []);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    if (!result) navigate('/sim', { replace: true });
  }, [result, navigate]);

  if (!result) return null;

  const matches = (r: SimReviewItem) => {
    switch (filter) {
      case 'incorrect': return !r.isCorrect;
      case 'correct': return r.isCorrect;
      case 'flagged': return r.flagged;
      default: return true;
    }
  };

  const filtered = result.review.filter(matches);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl space-y-5 px-5 py-10">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/sim/results')}
              className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" /> Results
            </button>
            <h2 className="text-lg font-bold">Answer Review</h2>
            <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {filtered.length} of {result.review.length}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                  filter === f.value
                    ? 'bg-primary text-white'
                    : 'border border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Review list */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card px-6 py-14 text-center text-sm text-muted-foreground">
            No questions match this filter.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(r => (
              <article
                key={r.id}
                className={`rounded-2xl border bg-card p-5 ${r.isCorrect ? 'border-emerald-600/30' : 'border-red-500/30'}`}
              >
                <header className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground">Question {r.index + 1}</span>
                  {r.kind === 'pbq' && (
                    <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary">PBQ</span>
                  )}
                  <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{r.typeLabel}</span>
                  <span className="text-[10px] text-muted-foreground">{r.domainLabel}</span>
                  {r.flagged && (
                    <span className="flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-500">
                      <Flag className="h-3 w-3" /> Flagged
                    </span>
                  )}
                  <span className="ml-auto flex items-center gap-1 text-xs font-bold">
                    {r.isCorrect ? (
                      <><CheckCircle2 className="h-4 w-4 text-emerald-500" /> <span className="text-emerald-500">Correct</span></>
                    ) : (
                      <><XCircle className="h-4 w-4 text-red-500" /> <span className="text-red-500">Incorrect</span></>
                    )}
                  </span>
                </header>

                <h3 className="mb-4 text-sm font-bold leading-relaxed">{r.questionText}</h3>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className={`rounded-xl border p-3 text-xs ${r.isCorrect ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                    <div className="mb-1 font-bold">Your Answer</div>
                    <div className="leading-relaxed text-muted-foreground">{r.userAnswerText}</div>
                    {r.kind === 'pbq' && r.pbqTotal !== undefined && (
                      <div className="mt-1 font-semibold">
                        {r.pbqEarned}/{r.pbqTotal} subtasks
                      </div>
                    )}
                  </div>
                  {!r.isCorrect && (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs">
                      <div className="mb-1 font-bold">Correct Answer</div>
                      <div className="leading-relaxed text-muted-foreground">{r.correctAnswerText}</div>
                    </div>
                  )}
                </div>

                <div className="mt-3 rounded-xl border border-border p-3 text-xs leading-relaxed text-muted-foreground">
                  <span className="font-bold text-foreground">Explanation: </span>{r.explanation}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
