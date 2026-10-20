import { CheckCircle2, XCircle, Trophy, Clock, ChevronDown, ChevronUp, ListFilter, Flag, BookOpen, Target } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ScoreResult } from '@/lib/examEngine';
import type { MCQuestion, PBQuestion } from '@/data/questions';
import { DOMAIN_LABELS, DOMAIN_WEIGHTS, type Domain } from '@/data/questions';
import { isMCQCorrect, isPBQCorrect, getPBQModelRows, getPBQUserRows } from '@/lib/examEngine';
import { primaryButtonClass, secondaryButtonClass } from '@/components/product/ProductUI';

interface ExamResultsProps {
  score: ScoreResult;
  pbqs: PBQuestion[];
  mcqs: MCQuestion[];
  pbqAnswers: Record<string, any>;
  mcqAnswers: Record<string, number | number[]>;
  flags?: Set<string>;
  /** original exam order of question ids — keeps numbering faithful to the run */
  questionOrder?: string[];
  onRestart: () => void;
  onBackToMenu: () => void;
}

const DIFF_LABEL: Record<number, string> = { 1: 'Recall', 2: 'Applied', 3: 'Analysis' };
const DIFF_COLOR: Record<number, string> = {
  1: 'bg-muted text-muted-foreground',
  2: 'bg-primary/10 text-primary',
  3: 'bg-warning/15 text-warning',
};

export function ExamResults({
  score, pbqs, mcqs, pbqAnswers, mcqAnswers,
  flags = new Set(), questionOrder, onRestart, onBackToMenu,
}: ExamResultsProps) {
  const navigate = useNavigate();
  const [expandedQ, setExpandedQ] = useState<string | null>(null);
  const [tab, setTab] = useState<'all' | 'failed' | 'flagged'>('failed');

  const reviewItems = useMemo(() => {
    const pbqItems = pbqs.map((q, i) => ({
      id: q.id,
      num: i + 1,
      type: 'pbq' as const,
      difficulty: (q as any).difficulty as 1 | 2 | 3 | undefined,
      correct: isPBQCorrect(q, pbqAnswers[q.id]),
      title: q.title,
      domain: DOMAIN_LABELS[q.domain],
      domainKey: q.domain as Domain,
      objective: (q as any).objective as string | undefined,
      explanation: q.explanation,
      whyWrong: '',
      userAns: '',
      correctAns: '',
      flagged: flags.has(q.id),
      modelRows: getPBQModelRows(q),
      userRows: getPBQUserRows(q, pbqAnswers[q.id]),
    }));
    const mcqItems = mcqs.map((q, i) => {
      const a = mcqAnswers[q.id];
      const correct = isMCQCorrect(q, a);
      let userAns = 'Not answered';
      let correctAns = '';
      let whyWrongText = '';
      if (q.type === 'single') {
        if (a !== undefined) {
          userAns = q.options[a as number] ?? '-';
          if (!correct) whyWrongText = q.whyWrong?.[a as number] ?? 'This option does not match the scenario constraints.';
        }
        correctAns = q.options[q.answer as number] ?? '-';
      } else {
        if (a !== undefined) userAns = (a as number[]).map(idx => q.options[idx]).join(', ');
        correctAns = (q.answer as number[]).map(idx => q.options[idx]).join(', ');
        if (!correct && Array.isArray(a)) {
          const wrongPick = (a as number[]).find(idx => !(q.answer as number[]).includes(idx));
          if (wrongPick !== undefined) whyWrongText = q.whyWrong?.[wrongPick] ?? 'At least one selection does not fit the scenario.';
        }
      }
      return {
        id: q.id, num: pbqs.length + i + 1, type: 'mcq' as const,
        difficulty: q.difficulty, correct,
        title: q.question, domain: DOMAIN_LABELS[q.domain], domainKey: q.domain as Domain,
        objective: q.objective, explanation: q.explanation,
        whyWrong: whyWrongText, userAns, correctAns, flagged: flags.has(q.id),
      };
    });
    const items = [...pbqItems, ...mcqItems];
    if (!questionOrder?.length) {
      items.forEach((item, index) => { item.num = index + 1; });
      return items;
    }
    const positions = new Map(questionOrder.map((id, index) => [id, index] as const));
    return items
      .sort((a, b) => (positions.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (positions.get(b.id) ?? Number.MAX_SAFE_INTEGER))
      .map((item, index) => ({ ...item, num: index + 1 }));
  }, [pbqs, mcqs, pbqAnswers, mcqAnswers, flags, questionOrder]);

  const failedCount  = reviewItems.filter(i => !i.correct).length;
  const flaggedCount = reviewItems.filter(i => i.flagged).length;
  const filtered = reviewItems.filter(i => {
    if (tab === 'failed')  return !i.correct;
    if (tab === 'flagged') return i.flagged;
    return true;
  });

  const pointsFromPass    = score.passed ? 0 : 750 - score.scaledScore;
  const missedByQuestions = score.passed ? 0 : Math.ceil((pointsFromPass / 800) * score.rawTotal);

  const domainGapData = useMemo(() => {
    return (Object.keys(DOMAIN_LABELS) as Domain[])
      .map(key => {
        const label  = DOMAIN_LABELS[key];
        const weight = Math.round((DOMAIN_WEIGHTS[key] ?? 0) * 100);
        const di = reviewItems.filter(i => i.domainKey === key);
        if (di.length === 0) return { key, label, weight, accuracy: null as number|null, gap: null as number|null };
        const accuracy = Math.round((di.filter(i => i.correct).length / di.length) * 100);
        const gap      = Math.round((1 - accuracy / 100) * weight);
        return { key, label, weight, accuracy, gap };
      })
      .sort((a, b) => (b.gap ?? 0) - (a.gap ?? 0));
  }, [reviewItems]);

  // Weakest-3 objectives from THIS run only: single-exam sample sizes are too
  // small to rank globally, but they reliably name what just hurt the score.
  const weakestObjectives = useMemo(() => {
    const byObjective = new Map<string, { objective: string; domain: string; domainLabel: string; correct: number; total: number }>();
    reviewItems.forEach(item => {
      if (!item.objective) return;
      const entry = byObjective.get(item.objective)
        ?? { objective: item.objective, domain: item.domainKey, domainLabel: item.domain, correct: 0, total: 0 };
      entry.correct += item.correct ? 1 : 0;
      entry.total += 1;
      byObjective.set(item.objective, entry);
    });
    return [...byObjective.values()]
      .filter(o => o.total >= 2 || o.correct === 0)
      .sort((a, b) => (a.correct / a.total) - (b.correct / b.total) || b.total - a.total)
      .slice(0, 3);
  }, [reviewItems]);



  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-3xl">

        {/* Score Banner */}
        <div className={`rounded-xl p-8 mb-6 text-center border ${score.passed ? 'bg-success/5 border-success/30' : 'bg-destructive/5 border-destructive/30'}`}>
          <Trophy className={`h-12 w-12 mx-auto mb-3 ${score.passed ? 'text-success' : 'text-destructive'}`} />
          <div className={`text-6xl font-bold font-mono mb-2 ${score.passed ? 'text-success' : 'text-destructive'}`}>
            {score.scaledScore}
          </div>
          <p className="text-sm text-muted-foreground font-mono">out of 900 &middot; passing score 750</p>
          <div className={`inline-block mt-3 px-6 py-2 rounded-full text-sm font-bold ${score.passed ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
            {score.passed ? '✓ PASS' : '✗ DID NOT PASS'}
          </div>
          {!score.passed && (
            <p className="mt-4 text-xs text-muted-foreground">
              You were <span className="font-bold text-destructive">{pointsFromPass} scaled points</span> away.
              Roughly <span className="font-bold text-foreground">{missedByQuestions} more correct answer{missedByQuestions !== 1 ? 's' : ''}</span> would push you over.
            </p>
          )}
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
            <span className="font-mono">{score.rawCorrect}/{score.rawTotal} correct ({Math.round((score.rawCorrect / score.rawTotal) * 100)}%)</span>
            <span className="flex items-center gap-1 font-mono"><Clock className="h-3 w-3" /> {score.timeUsedMinutes} min</span>
          </div>
        </div>

        {/* Domain weighted-gap table */}
        <div className="bg-card border border-border rounded-xl p-5 mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
            <BookOpen className="h-3.5 w-3.5" /> Domain Performance &amp; Weighted Gap
          </h2>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border">
                <th className="text-left pb-2 pr-3">Domain</th>
                <th className="text-center pb-2 px-2">Wt%</th>
                <th className="text-center pb-2 px-2">Accuracy</th>
                <th className="text-left pb-2 pl-2">Gap</th>
              </tr>
            </thead>
            <tbody>
              {domainGapData.map(d => (
                <tr key={d.key} className="border-b border-border/40 last:border-0">
                  <td className="py-2 pr-3 font-medium max-w-[160px] truncate" title={d.label}>{d.label}</td>
                  <td className="text-center px-2 font-mono text-muted-foreground">{d.weight}%</td>
                  <td className="text-center px-2">
                    {d.accuracy !== null
                      ? <span className={`font-mono font-bold ${d.accuracy >= 75 ? 'text-success' : d.accuracy >= 60 ? 'text-warning' : 'text-destructive'}`}>{d.accuracy}%</span>
                      : <span className="text-muted-foreground">&mdash;</span>}
                  </td>
                  <td className="pl-2">
                    {d.gap !== null ? (
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${d.gap > 8 ? 'bg-destructive' : d.gap > 4 ? 'bg-warning' : 'bg-success'}`}
                            style={{ width: `${Math.min(100, d.gap * 5)}%` }} />
                        </div>
                        <span className={`font-mono text-[10px] font-bold ${d.gap > 8 ? 'text-destructive' : d.gap > 4 ? 'text-warning' : 'text-success'}`}>-{d.gap}</span>
                      </div>
                    ) : <span className="text-muted-foreground text-[10px]">&mdash;</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[10px] text-muted-foreground mt-3">Gap = (1 &minus; accuracy) &times; domain weight. Higher gap = more scaled-score recovery per hour of study.</p>
        </div>

        {/* Weakest objectives from this run */}
        {weakestObjectives.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Target className="h-3.5 w-3.5" /> Weakest objectives in this exam
              </h2>
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">from this run only</span>
            </div>
            <div className="space-y-3">
              {weakestObjectives.map(o => {
                const accuracy = Math.round((o.correct / o.total) * 100);
                return (
                  <div key={o.objective}>
                    <div className="flex items-baseline justify-between mb-1 text-xs">
                      <span className="text-foreground truncate pr-3">{o.objective}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                        {o.correct}/{o.total} &middot; {accuracy}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-12 shrink-0 truncate text-[10px] font-mono uppercase tracking-wider text-muted-foreground" title={o.domainLabel}>
                        {o.domain}
                      </div>
                      <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${accuracy >= 75 ? 'bg-success' : accuracy >= 50 ? 'bg-warning' : 'bg-destructive'}`}
                          style={{ width: `${Math.max(2, accuracy)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={() => navigate('/study')} className="mt-4 text-xs font-semibold text-primary hover:underline">
              Drill these in Study Mode &rarr;
            </button>
          </div>
        )}


        {/* Question Review */}
        <div className="bg-card border border-border rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <ListFilter className="h-3.5 w-3.5" /> Question Review
            </h2>
            <div className="flex gap-1">
              {(['failed', 'all', 'flagged'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${tab === t ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                  {t === 'failed' ? `Failed (${failedCount})` : t === 'flagged' ? `Flagged (${flaggedCount})` : 'All'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {reviewItems.map(item => {
              const dim = (tab === 'failed' && item.correct) || (tab === 'flagged' && !item.flagged);
              return (
                <button key={item.id}
                  onClick={() => { setTab('all'); setExpandedQ(expandedQ === item.id ? null : item.id); }}
                  className={`relative w-8 h-8 rounded text-[10px] font-mono font-bold transition-all ${item.correct ? 'bg-success/20 text-success border border-success/30' : 'bg-destructive/20 text-destructive border border-destructive/30'} ${expandedQ === item.id ? 'ring-2 ring-primary' : ''} ${dim ? 'opacity-25' : ''}`}>
                  {item.num}
                  {item.flagged && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-warning border border-card" />}
                </button>
              );
            })}
          </div>
          <div className="space-y-2">
            {filtered.length === 0 && (
              <p className="text-center py-8 text-xs text-muted-foreground">
                {tab === 'failed' ? 'No failed questions — clean sweep!' : tab === 'flagged' ? 'No flagged questions.' : 'Nothing to show.'}
              </p>
            )}
            {filtered.map(item => {
              const expanded = expandedQ === item.id;
              return (
                <div key={item.id} className={`border rounded-lg overflow-hidden ${item.correct ? 'border-success/20' : 'border-destructive/20'}`}>
                  <button onClick={() => setExpandedQ(expanded ? null : item.id)}
                    className={`w-full flex items-center gap-2 p-3 text-left transition-colors ${item.correct ? 'bg-success/5 hover:bg-success/10' : 'bg-destructive/5 hover:bg-destructive/10'}`}>
                    {item.correct ? <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" /> : <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />}
                    <span className="text-xs font-mono text-muted-foreground">Q{item.num}</span>
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded shrink-0 ${item.type === 'pbq' ? 'bg-accent/20 text-accent' : 'bg-primary/10 text-primary'}`}>{item.type === 'pbq' ? 'PBQ' : 'MCQ'}</span>
                    {item.difficulty !== undefined && (
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded shrink-0 ${DIFF_COLOR[item.difficulty]}`}>{DIFF_LABEL[item.difficulty]}</span>
                    )}
                    {item.flagged && <Flag className="h-3 w-3 text-warning flex-shrink-0" />}
                    <span className="flex-1 truncate text-foreground text-xs">{item.title.length > 70 ? item.title.substring(0, 70) + '…' : item.title}</span>
                    <span className="hidden sm:inline text-[10px] text-muted-foreground shrink-0">{item.domain.split(' ').slice(0, 3).join(' ')}</span>
                    {expanded ? <ChevronUp className="h-3 w-3 shrink-0" /> : <ChevronDown className="h-3 w-3 shrink-0" />}
                  </button>

                  {expanded && (
                    <div className="p-4 border-t border-border bg-card text-xs space-y-2">
                      {item.type === 'mcq' && !item.correct && (
                        <p className="text-destructive"><strong>Your answer:</strong> {item.userAns}</p>
                      )}
                      {item.type === 'mcq' && !item.correct && (
                        <p className="text-success"><strong>Correct answer:</strong> {item.correctAns}</p>
                      )}
                      {item.type === 'pbq' && item.modelRows && item.userRows && (
                        <div className="grid gap-x-6 gap-y-1 rounded-lg border border-border bg-muted/30 p-3 sm:grid-cols-1">
                          <div className="flex flex-wrap gap-x-5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            <span>Model solution vs your answer</span>
                          </div>
                          {item.modelRows.map((row, index) => {
                            const userRow = item.userRows?.[index] ?? '—';
                            const match = row === userRow;
                            return (
                              <div key={row} className="grid gap-0.5 border-b border-border/40 pb-1 last:border-0 sm:grid-cols-[1fr_1fr]">
                                <span className="text-success/90"><CheckCircle2 className="mr-1 inline h-3 w-3" />{row}</span>
                                <span className={match ? 'text-success/90' : 'text-destructive'}>
                                  {match ? <CheckCircle2 className="mr-1 inline h-3 w-3" /> : <XCircle className="mr-1 inline h-3 w-3" />}
                                  {userRow}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {!item.correct && item.whyWrong && (
                        <div className="flex gap-1.5 bg-destructive/5 rounded-lg p-2.5 text-destructive/90">
                          <XCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                          <span><strong className="uppercase text-[10px] tracking-wider mr-1">Why incorrect:</strong>{item.whyWrong}</span>
                        </div>
                      )}
                      <div className="flex gap-1.5 bg-success/5 rounded-lg p-2.5 text-success/90">
                        <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        <span><strong className="uppercase text-[10px] tracking-wider mr-1">Explanation:</strong>{item.explanation}</span>
                      </div>
                      {item.objective && (
                        <div className="flex gap-1.5 bg-muted/40 rounded-lg p-2.5 text-muted-foreground">
                          <BookOpen className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                          <span><strong className="uppercase text-[10px] tracking-wider mr-1">Objective:</strong>{item.objective} &middot; {item.domain}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <button onClick={onRestart}
            className={primaryButtonClass}>
            Take Another Exam
          </button>
          <button onClick={onBackToMenu}
            className={secondaryButtonClass}>
            Back to Menu
          </button>
        </div>

      </div>
    </div>
  );
}

