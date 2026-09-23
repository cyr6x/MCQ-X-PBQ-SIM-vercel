import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ListChecks, LogOut, Filter, RotateCcw, CheckCircle2, XCircle, Trophy, Eye, EyeOff } from 'lucide-react';
import { pbqBank, DOMAIN_LABELS, type PBQuestion, type Domain } from '@/data/questions';
import { getPBQCredit, isPBQCorrect } from '@/lib/examEngine';
import { saveAttempt, type QuestionAttempt } from '@/lib/examHistory';
import { useSettings } from '@/lib/SettingsContext';
import { PBQRenderer } from '@/components/PBQRenderer';

type PBQType = PBQuestion['type'];

const TYPE_LABELS: Record<PBQType, string> = {
  firewall: 'Firewall / ACL',
  ordering: 'Ordering / IR Steps',
  'log-analysis': 'Log Analysis',
  matching: 'Matching / Drag-Drop',
  placement: 'Network Placement',
  terminal: 'Terminal / CLI',
  'packet-analysis': 'Packet Analysis',
  topology: 'Network Topology',
};

const TYPE_DESCRIPTIONS: Record<PBQType, string> = {
  firewall: 'Configure ALLOW/DENY actions on firewall rule sets and reason about traffic policy.',
  ordering: 'Reorder steps in incident response, change management, or kill-chain workflows.',
  'log-analysis': 'Read SIEM/audit logs, identify the attack, the threat source, and the correct mitigation.',
  matching: 'Drag concepts (algorithms, controls, attack types) into the correct categories.',
  placement: 'Place network components (firewalls, IDS, jump hosts) into the correct zones (DMZ, Internal, Cloud).',
  terminal: 'Interpret command-line evidence and choose safe investigation or containment commands.',
  'packet-analysis': 'Inspect Wireshark-style packet rows, identify suspicious traffic, and select the best response.',
  topology: 'Build segmented architectures by placing components into security zones while preserving required flows.',
};

interface Props {
  onFinish: () => void;
}

export function PBQPractice({ onFinish }: Props) {
  const { settings } = useSettings();
  const [view, setView] = useState<'menu' | 'practice' | 'summary'>('menu');
  const [filterType, setFilterType] = useState<PBQType | 'all'>('all');
  const [filterDomain, setFilterDomain] = useState<Domain | 'all'>('all');
  const [questions, setQuestions] = useState<PBQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  const pool = useMemo(() => {
    return pbqBank.filter(p =>
      (filterType === 'all' || p.type === filterType) &&
      (filterDomain === 'all' || p.domain === filterDomain)
    );
  }, [filterType, filterDomain]);

  const typeCounts = useMemo(() => {
    const c: Record<string, number> = { all: pbqBank.length };
    pbqBank.forEach(p => { c[p.type] = (c[p.type] || 0) + 1; });
    return c;
  }, []);

  const startPractice = () => {
    if (pool.length === 0) return;
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, settings.pbq_set_size);
    setQuestions(shuffled);
    setIdx(0);
    setAnswers({});
    setRevealed(new Set());
    setView('practice');
  };

  const finishPractice = () => {
    if (questions.length === 0) return;
    const now = Date.now();
    const attempts: QuestionAttempt[] = questions.map((q) => ({
      questionId: q.id,
      questionText: q.title,
      domain: DOMAIN_LABELS[q.domain],
      type: 'pbq' as const,
      isCorrect: isPBQCorrect(q, answers[q.id]),
      userAnswer: JSON.stringify(answers[q.id] ?? {}),
      correctAnswer: '',
      explanation: q.explanation,
      timeSpentSeconds: 0,
      timestamp: now,
    }));
    const credits = questions.map((q) => getPBQCredit(q, answers[q.id]).ratio);
    const practicePoints = credits.reduce((sum, value) => sum + value, 0);
    const domainScores: Record<string, { correct: number; total: number }> = {};
    questions.forEach((q, i) => {
      const label = DOMAIN_LABELS[q.domain];
      if (!domainScores[label]) domainScores[label] = { correct: 0, total: 0 };
      domainScores[label].correct += credits[i];
      domainScores[label].total += 1;
    });
    saveAttempt({
      id: `pbq-lab-${now}`,
      mode: 'practice',
      startTime: now,
      endTime: now,
      totalQuestions: questions.length,
      correctAnswers: practicePoints,
      percentage: Math.round((practicePoints / questions.length) * 100),
      passed: practicePoints / questions.length >= 0.75,
      questions: attempts,
      domainScores,
    });
    setView('summary');
  };

  const cur = questions[idx];

  // ─── MENU ──────────────────────────────────────────────────────
  if (view === 'menu') {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-4xl mx-auto p-6 sm:p-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-1">APPLIED PRACTICE • SY0-701</p>
              <h1 className="text-3xl font-black">PBQ Practice Lab</h1>
              <p className="text-sm text-muted-foreground mt-1">Eight simulator interaction formats for SY0-701 practice — drilled, untimed, with full explanations and subtask feedback.</p>
            </div>
            <button onClick={onFinish} className="p-2.5 rounded-xl border border-border hover:bg-muted text-muted-foreground" aria-label="Back to menu">
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          {/* Type filter cards */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Filter by PBQ Type</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <button
                onClick={() => setFilterType('all')}
                className={`text-left p-4 rounded-xl border-2 transition-all ${filterType === 'all' ? 'border-accent bg-accent/10' : 'border-border bg-card hover:border-accent/50'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-black">All Types</span>
                  <span className="text-xs font-mono text-muted-foreground">{typeCounts.all}</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">Full mix across the simulator's current task families.</p>
              </button>
              {(Object.keys(TYPE_LABELS) as PBQType[]).map(t => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`text-left p-4 rounded-xl border-2 transition-all ${filterType === t ? 'border-accent bg-accent/10' : 'border-border bg-card hover:border-accent/50'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-black">{TYPE_LABELS[t]}</span>
                    <span className="text-xs font-mono text-muted-foreground">{typeCounts[t] || 0}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">{TYPE_DESCRIPTIONS[t]}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Domain filter */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Filter by Domain</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setFilterDomain('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${filterDomain === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:border-primary/40'}`}>
                All Domains
              </button>
              {(Object.entries(DOMAIN_LABELS) as [Domain, string][]).map(([k, v]) => (
                <button key={k} onClick={() => setFilterDomain(k)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${filterDomain === k ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:border-primary/40'}`}>
                  {v.split(' ').slice(0, 2).join(' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Start CTA */}
          <div className="rounded-2xl border border-border bg-card p-6 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-1">Practice Set</p>
              <p className="text-2xl font-black">{Math.min(pool.length, settings.pbq_set_size)} question{Math.min(pool.length, settings.pbq_set_size) !== 1 ? 's' : ''}</p>
              <p className="text-xs text-muted-foreground mt-1">Untimed • Instant feedback • Configurable set size</p>
            </div>
            <button
              onClick={startPractice}
              disabled={pool.length === 0}
              className="px-8 py-4 rounded-xl bg-accent text-accent-foreground font-black text-sm uppercase tracking-widest hover:opacity-90 transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Begin Practice <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── SUMMARY ───────────────────────────────────────────────────
  if (view === 'summary') {
    const results = questions.map(q => ({
      q,
      correct: isPBQCorrect(q, answers[q.id]),
      attempted: !!answers[q.id],
      credit: getPBQCredit(q, answers[q.id]),
    }));
    const passed = results.filter(r => r.correct).length;
    const failed = results.length - passed;
    const earned = results.reduce((sum, r) => sum + r.credit.ratio, 0);
    const pct = Math.round((earned / results.length) * 100);

    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-3xl mx-auto p-6 sm:p-10">
          <div className={`rounded-2xl p-8 mb-6 text-center border ${pct >= 75 ? 'bg-success/5 border-success/30' : 'bg-destructive/5 border-destructive/30'}`}>
            <Trophy className={`h-12 w-12 mx-auto mb-3 ${pct >= 75 ? 'text-success' : 'text-destructive'}`} />
            <div className={`text-6xl font-black font-mono mb-1 ${pct >= 75 ? 'text-success' : 'text-destructive'}`}>{pct}%</div>
            <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground">PBQ Practice Set Complete</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="rounded-xl p-4 border border-success/30 bg-success/5 text-center">
              <CheckCircle2 className="h-5 w-5 text-success mx-auto mb-1" />
              <div className="text-3xl font-black font-mono text-success">{passed}</div>
              <div className="text-[10px] uppercase tracking-widest text-success/80 font-bold">Passed</div>
            </div>
            <div className="rounded-xl p-4 border border-destructive/30 bg-destructive/5 text-center">
              <XCircle className="h-5 w-5 text-destructive mx-auto mb-1" />
              <div className="text-3xl font-black font-mono text-destructive">{failed}</div>
              <div className="text-[10px] uppercase tracking-widest text-destructive/80 font-bold">Failed</div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">PBQ Breakdown</h3>
            <div className="space-y-2">
              {results.map((r, i) => (
                <div key={r.q.id} className={`flex items-center gap-3 p-3 rounded-xl border ${r.correct ? 'border-success/30 bg-success/5' : 'border-destructive/30 bg-destructive/5'}`}>
                  {r.correct ? <CheckCircle2 className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-destructive" />}
                  <span className="text-xs font-mono text-muted-foreground">#{i + 1}</span>
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-accent/20 text-accent uppercase">{r.q.type.replace('-', ' ')}</span>
                  <span className="flex-1 text-sm truncate">{r.q.title}</span>
                  <span className="hidden sm:inline text-[10px] text-muted-foreground font-mono">{DOMAIN_LABELS[r.q.domain].split(' ').slice(0, 2).join(' ')}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button onClick={() => { setView('practice'); setIdx(0); setAnswers({}); setRevealed(new Set()); setQuestions([...questions].sort(() => Math.random() - 0.5)); }}
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-black text-sm uppercase tracking-widest hover:opacity-90 flex items-center gap-2">
              <RotateCcw className="h-4 w-4" /> Retry Set
            </button>
            <button onClick={() => setView('menu')}
              className="px-6 py-3 rounded-xl border border-border font-bold text-sm hover:bg-muted">
              New Set
            </button>
            <button onClick={onFinish}
              className="px-6 py-3 rounded-xl border border-border font-bold text-sm hover:bg-muted">
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── PRACTICE (Pearson-style chrome) ────────────────────────────
  const isRevealed = revealed.has(cur.id);
  const correct = isPBQCorrect(cur, answers[cur.id]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card/90 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">PBQ</span>
            <span className="text-xl font-black font-mono leading-none">{idx + 1}<span className="text-muted-foreground/30 mx-1">/</span>{questions.length}</span>
          </div>
          <div className="h-8 w-[1px] bg-border mx-2 hidden sm:block" />
          <span className="hidden sm:inline px-2 py-1 rounded text-[10px] font-black tracking-tighter bg-accent text-accent-foreground uppercase">
            {TYPE_LABELS[cur.type]}
          </span>
          <span className="hidden md:inline text-[10px] font-mono text-muted-foreground">{DOMAIN_LABELS[cur.domain]}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRevealed(prev => {
              const n = new Set(prev);
              if (n.has(cur.id)) n.delete(cur.id);
              else n.add(cur.id);
              return n;
            })}
            className={`p-2.5 rounded-xl border transition-all ${isRevealed ? 'bg-accent text-accent-foreground border-accent' : 'border-border bg-card text-muted-foreground hover:bg-muted'}`}
            title={isRevealed ? 'Hide answer' : 'Reveal answer'}
          >
            {isRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <button
            onClick={() => { if (confirm('Exit PBQ practice? Progress won\'t be saved.')) onFinish(); }}
            className="p-2.5 rounded-xl border border-border bg-card hover:bg-destructive/10 hover:text-destructive hover:border-destructive/40 transition-all text-muted-foreground"
            aria-label="Exit"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto bg-background">
        <div className="max-w-4xl mx-auto p-4 sm:p-8">
          <div className="bg-card rounded-3xl border border-border shadow-sm min-h-[500px] p-6 sm:p-10">
            <PBQRenderer
              q={cur}
              ans={answers[cur.id]}
              onAns={a => setAnswers(p => ({ ...p, [cur.id]: a }))}
              submitted={false}
              studyRevealed={isRevealed}
            />
            {isRevealed && (
              <div className={`mt-6 p-4 rounded-xl text-sm font-black uppercase tracking-widest text-center ${correct ? 'bg-success/10 text-success border border-success/30' : 'bg-destructive/10 text-destructive border border-destructive/30'}`}>
                {correct ? '✓ All sub-tasks correct' : '✗ Review highlighted items above'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer nav */}
      <div className="bg-card border-t border-border px-4 py-4 sm:px-10 flex items-center justify-between">
        <button
          onClick={() => setIdx(Math.max(0, idx - 1))}
          disabled={idx === 0}
          className="flex items-center gap-2 px-6 py-3 rounded-xl border border-border font-bold text-sm hover:bg-muted disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </button>

        <div className="hidden md:flex items-center gap-2 text-xs">
          <ListChecks className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono text-muted-foreground">{Object.keys(answers).length} / {questions.length} attempted</span>
        </div>

        {idx < questions.length - 1 ? (
          <button
            onClick={() => setIdx(idx + 1)}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 shadow-lg"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={finishPractice}
            className="px-8 py-3 rounded-xl bg-accent text-accent-foreground font-black text-sm uppercase tracking-widest hover:opacity-90 shadow-xl"
          >
            See Results
          </button>
        )}
      </div>
    </div>
  );
}
