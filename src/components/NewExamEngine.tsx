import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Flag, ChevronLeft, ChevronRight, ListChecks, CheckCircle2, XCircle, GripVertical, AlertTriangle, Clock, Timer, Pause, Play, Shuffle, LogOut } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { MCQuestion, PBQuestion } from '@/data/questions';
import { isMCQCorrect, isPBQCorrect, calculateScore, type ScoreResult } from '@/lib/examEngine';
import { ExamResults } from '@/components/ExamResults';
import { saveAttempt, type QuestionAttempt, type ExamAttempt } from '@/lib/examHistory';
import { DOMAIN_LABELS } from '@/data/questions';

type UnifiedQ = { kind: 'pbq'; data: PBQuestion } | { kind: 'mcq'; data: MCQuestion };

interface NewExamEngineProps {
  pbqs: PBQuestion[];
  mcqs: MCQuestion[];
  durationMinutes: number;
  examNumber?: 1 | 2 | 3 | 4 | 5;
  isStudyMode?: boolean;
  onFinish: () => void;
}

export function NewExamEngine({ pbqs, mcqs, durationMinutes, isStudyMode = false, examNumber = 1, onFinish }: NewExamEngineProps) {
  // Bumped by the Shuffle button to re-randomize question order + MCQ option order.
  const [shuffleNonce, setShuffleNonce] = useState(0);

  // Real-exam ordering: ALL PBQs first, then MCQs. PBQs cannot be revisited
  // once the candidate moves past the PBQ section (CompTIA behavior).
  const questions = useMemo<UnifiedQ[]>(() => {
    const shuffledMcqs = [...mcqs].sort(() => Math.random() - 0.5);
    const shuffledPbqs = [...pbqs].sort(() => Math.random() - 0.5);
    return [
      ...shuffledPbqs.map(q => ({ kind: 'pbq' as const, data: q })),
      ...shuffledMcqs.map(q => ({ kind: 'mcq' as const, data: q })),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pbqs, mcqs, shuffleNonce]);

  const pbqCount = pbqs.length;

  const [idx, setIdx] = useState(0);
  const [pbqAnswers, setPbqAnswers] = useState<Record<string, any>>({});
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, number | number[]>>({});
  const [flags, setFlags] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showPbqLock, setShowPbqLock] = useState(false);
  const [pbqSectionLocked, setPbqSectionLocked] = useState(false);
  const [warned30, setWarned30] = useState(false);
  const [warned10, setWarned10] = useState(false);
  const [warningBanner, setWarningBanner] = useState<null | '30' | '10'>(null);
  
  const [isPaused, setIsPaused] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [totalPausedTime, setTotalPausedTime] = useState(0);
  const [pauseStartTime, setPauseStartTime] = useState<number | null>(null);
  
  const [remaining, setRemaining] = useState(durationMinutes * 60);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [studyRevealed, setStudyRevealed] = useState<Set<string>>(new Set());
  const [qStartTime, setQStartTime] = useState(Date.now());
  const [questionTimes, setQuestionTimes] = useState<Record<string, number>>({});

  const cur = questions[idx];
  const qId = cur.kind === 'pbq' ? cur.data.id : cur.data.id;
  // (PBQs are interleaved throughout `questions` — no section concept.)

  // ── Keyboard shortcuts: A/B/C/D to select MCQ answers, ← → to navigate ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore when focus is inside an input/select/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      if (submitted || isPaused) return;

      if (cur.kind === 'mcq') {
        const keyMap: Record<string, number> = { a: 0, b: 1, c: 2, d: 3 };
        const optIdx = keyMap[e.key.toLowerCase()];
        if (optIdx !== undefined && optIdx < cur.data.options.length) {
          const q = cur.data;
          if (q.type === 'single') {
            setMcqAnswers(p => ({ ...p, [q.id]: optIdx }));
          } else {
            setMcqAnswers(p => {
              const prev = (p[q.id] as number[] | undefined) || [];
              const next = prev.includes(optIdx) ? prev.filter(x => x !== optIdx) : [...prev, optIdx];
              return { ...p, [q.id]: next };
            });
          }
          return;
        }
      }

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        goTo(idx + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        goTo(Math.max(0, idx - 1));
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFlag();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // goTo and toggleFlag are redefined each render but that's fine here
  }, [cur, idx, submitted, isPaused, mcqAnswers]);

  // Soft pace warning in study mode: fires if more than 1 question/min behind ideal pace
  const [showPaceWarning, setShowPaceWarning] = useState(false);
  useEffect(() => {
    if (!isStudyMode) return;
    const totalMinutes = durationMinutes || 90;
    const elapsed = (Date.now() - startTime) / 60000;
    const idealQ = (idx / questions.length) * totalMinutes;
    if (elapsed > 0 && elapsed > idealQ + 1) {
      setShowPaceWarning(true);
      const t = setTimeout(() => setShowPaceWarning(false), 5000);
      return () => clearTimeout(t);
    }
  }, [idx]);
  useEffect(() => {
    if (isStudyMode || submitted || isPaused) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedTotal = Math.floor((now - startTime - totalPausedTime) / 1000);
      const r = Math.max(0, durationMinutes * 60 - elapsedTotal);
      
      setRemaining(r);

      // 30-min and 10-min warning banners (real-exam style)
      if (!warned30 && r <= 30 * 60 && r > 10 * 60) {
        setWarned30(true);
        setWarningBanner('30');
        setTimeout(() => setWarningBanner(b => (b === '30' ? null : b)), 8000);
      }
      if (!warned10 && r <= 10 * 60 && r > 0) {
        setWarned10(true);
        setWarningBanner('10');
        setTimeout(() => setWarningBanner(b => (b === '10' ? null : b)), 10000);
      }

      if (r <= 0) {
        clearInterval(interval);
        handleSubmit();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, durationMinutes, submitted, isStudyMode, isPaused, totalPausedTime]);

  const togglePause = () => {
    if (isPaused) {
      // Resume
      if (pauseStartTime) {
        setTotalPausedTime(prev => prev + (Date.now() - pauseStartTime));
      }
      setPauseStartTime(null);
      setIsPaused(false);
    } else {
      // Pause
      setPauseStartTime(Date.now());
      setIsPaused(true);
    }
  };

  // Track time per question
  useEffect(() => {
    setQStartTime(Date.now());
    return () => {
      if (!isPaused) {
        const elapsed = Math.floor((Date.now() - qStartTime) / 1000);
        setQuestionTimes(prev => ({
          ...prev,
          [qId]: (prev[qId] || 0) + elapsed
        }));
      }
    };
  }, [idx, isPaused]);

  const answeredCount = useMemo(() => {
    let c = 0;
    questions.forEach(q => {
      const id = q.kind === 'pbq' ? q.data.id : q.data.id;
      if (q.kind === 'pbq') {
        const a = pbqAnswers[id];
        if (a && (Array.isArray(a) ? a.some(v => v !== '') : typeof a === 'object' && Object.keys(a).length > 0)) c++;
      } else {
        if (mcqAnswers[id] !== undefined) c++;
      }
    });
    return c;
  }, [questions, pbqAnswers, mcqAnswers]);

  const unansweredCount = questions.length - answeredCount;

  const handleSubmit = useCallback(() => {
    const result = calculateScore(pbqs, mcqs, pbqAnswers, mcqAnswers, startTime);
    setScoreResult(result);
    setSubmitted(true);
    setShowConfirmSubmit(false);
    setIsPaused(false);

    // Save to history
    const attemptQs: QuestionAttempt[] = [
      ...pbqs.map(q => ({
        questionId: q.id,
        questionText: q.title,
        domain: DOMAIN_LABELS[q.domain],
        type: 'pbq' as const,
        isCorrect: isPBQCorrect(q, pbqAnswers[q.id]),
        userAnswer: JSON.stringify(pbqAnswers[q.id] || {}),
        correctAnswer: '',
        explanation: q.explanation,
        timeSpentSeconds: questionTimes[q.id] || 0,
        timestamp: Date.now(),
      })),
      ...mcqs.map(q => ({
        questionId: q.id,
        questionText: q.question,
        domain: DOMAIN_LABELS[q.domain],
        type: 'mcq' as const,
        isCorrect: isMCQCorrect(q, mcqAnswers[q.id]),
        userAnswer: mcqAnswers[q.id] !== undefined ? String(mcqAnswers[q.id]) : 'Not answered',
        correctAnswer: String(q.answer),
        explanation: q.explanation,
        timeSpentSeconds: questionTimes[q.id] || 0,
        timestamp: Date.now(),
      })),
    ];

    const domainScores: Record<string, { correct: number; total: number }> = {};
    Object.entries(result.domainScores).forEach(([k, v]) => {
      domainScores[k] = { correct: v.correct, total: v.total };
    });

    saveAttempt({
      id: `exam-${Date.now()}`,
      mode: isStudyMode ? 'practice' : 'exam',
      startTime,
      endTime: Date.now(),
      totalQuestions: questions.length,
      correctAnswers: result.rawCorrect,
      percentage: Math.round((result.rawCorrect / result.rawTotal) * 100),
      passed: result.passed,
      questions: attemptQs,
      domainScores,
    });
  }, [pbqs, mcqs, pbqAnswers, mcqAnswers, startTime, questionTimes, isStudyMode]);

  const goTo = (newIdx: number) => {
    if (isPaused) return;
    if (newIdx < 0 || newIdx >= questions.length) return;
    // PBQ-first lock: once the candidate leaves the PBQ section, they cannot return.
    if (!isStudyMode && pbqCount > 0) {
      const leavingPbq = idx < pbqCount && newIdx >= pbqCount;
      const enteringPbq = idx >= pbqCount && newIdx < pbqCount;
      if (enteringPbq && pbqSectionLocked) return; // hard block
      if (leavingPbq && !pbqSectionLocked) {
        setShowPbqLock(true);
        (window as any).__pendingIdx = newIdx;
        return;
      }
    }
    setIdx(newIdx);
  };

  const confirmLeavePbqs = () => {
    setPbqSectionLocked(true);
    setShowPbqLock(false);
    const pending = (window as any).__pendingIdx;
    if (typeof pending === 'number') setIdx(pending);
  };

  const handleShuffle = () => {
    // Reshuffle question order + reset progress so the new order isn't mixed with
    // partially-answered state from the previous order.
    if (!confirm('Shuffle questions? This will clear your current answers and flags.')) return;
    setShuffleNonce(n => n + 1);
    setIdx(0);
    setPbqAnswers({});
    setMcqAnswers({});
    setFlags(new Set());
    setQuestionTimes({});
    setQStartTime(Date.now());
  };

  const toggleFlag = () => {
    setFlags(prev => {
      const n = new Set(prev);
      if (n.has(qId)) n.delete(qId);
      else n.add(qId);
      return n;
    });
  };

  if (submitted && scoreResult && !isStudyMode) {
    return <ExamResults score={scoreResult} pbqs={pbqs} mcqs={mcqs} pbqAnswers={pbqAnswers} mcqAnswers={mcqAnswers} flags={flags} onRestart={() => window.location.reload()} onBackToMenu={onFinish} />;
  }

  const timerMins = Math.floor(remaining / 60);
  const timerSecs = remaining % 60;
  const timerDisplay = `${String(timerMins).padStart(2,'0')}:${String(timerSecs).padStart(2,'0')}`;
  const isWarning10 = remaining <= 600;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20">
      
      {/* Sticky progress bar — always visible at very top */}
      <div className="fixed top-0 left-0 right-0 z-[200] h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${(answeredCount / questions.length) * 100}%` }}
        />
      </div>

      {/* Pace warning (study mode only) */}
      {showPaceWarning && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[90] px-5 py-2.5 rounded-xl shadow-xl border border-warning bg-warning/10 text-warning font-bold text-xs flex items-center gap-2 animate-in slide-in-from-top-4">
          <Timer className="h-4 w-4" />
          Pace tip: try ~90 sec per question to finish on time
          <button onClick={() => setShowPaceWarning(false)} className="ml-2 opacity-60 hover:opacity-100">✕</button>
        </div>
      )}
      {isPaused && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex flex-col items-center justify-center">
          <div className="p-8 rounded-2xl bg-card border border-border shadow-2xl text-center max-w-sm mx-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Pause className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Exam Paused</h2>
            <p className="text-muted-foreground mb-8 text-sm">Your progress and timer are saved. Take a breath and resume when ready.</p>
            <button 
              onClick={togglePause}
              className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-3"
            >
              <Play className="w-5 h-5 fill-current" />
              Resume Exam
            </button>
          </div>
        </div>
      )}

      {/* Confirm Submit Dialog */}
      <Dialog open={showConfirmSubmit} onOpenChange={setShowConfirmSubmit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Exam?</DialogTitle>
            <DialogDescription>
              {unansweredCount > 0 
                ? `You have ${unansweredCount} unanswered question${unansweredCount > 1 ? 's' : ''}. Submit anyway?`
                : 'Are you sure you want to submit your exam?'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setShowConfirmSubmit(false)} className="px-4 py-2 rounded-md border border-border text-sm">Continue Exam</button>
            <button onClick={handleSubmit} className="px-4 py-2 rounded-md bg-accent text-accent-foreground font-bold text-sm">Submit</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* PBQ-first lock confirmation */}
      <Dialog open={showPbqLock} onOpenChange={setShowPbqLock}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-warning" /> Leave Performance-Based Section?</DialogTitle>
            <DialogDescription>
              Once you leave the PBQ section to begin the multiple-choice questions, you will <strong>not be able to return</strong> to the PBQs. This mirrors the real CompTIA exam.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setShowPbqLock(false)} className="px-4 py-2 rounded-md border border-border text-sm">Stay on PBQs</button>
            <button onClick={confirmLeavePbqs} className="px-4 py-2 rounded-md bg-warning text-warning-foreground font-bold text-sm">Continue to MCQs</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 30 / 10 minute warning banner */}
      {warningBanner && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[90] px-6 py-3 rounded-xl shadow-2xl border-2 font-bold text-sm flex items-center gap-3 animate-in slide-in-from-top-4 ${
          warningBanner === '10' ? 'bg-destructive text-destructive-foreground border-destructive' : 'bg-warning text-warning-foreground border-warning'
        }`}>
          <AlertTriangle className="h-5 w-5" />
          {warningBanner === '30' ? '30 minutes remaining' : '10 minutes remaining — final stretch'}
          <button onClick={() => setWarningBanner(null)} className="ml-3 opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Header Bar */}
      <div className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Question</span>
            <span className="text-xl font-black font-mono leading-none">{idx + 1}<span className="text-muted-foreground/30 mx-1">/</span>{questions.length}</span>
          </div>
          <div className="h-8 w-[1px] bg-border mx-2 hidden sm:block" />
          <div className="hidden sm:flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-[10px] font-black tracking-tighter ${cur.kind === 'pbq' ? 'bg-accent text-accent-foreground' : 'bg-primary/10 text-primary'}`}>
              {cur.kind === 'pbq' ? 'PERFORMANCE-BASED' : cur.data.type === 'select-two' ? 'SELECT TWO' : 'MULTIPLE CHOICE'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={handleShuffle}
            className="p-2.5 rounded-xl border border-border bg-card hover:bg-muted transition-all text-muted-foreground hover:text-foreground group"
            title="Shuffle questions"
          >
            <Shuffle className="h-4 w-4 group-hover:rotate-12 transition-transform" />
          </button>
          {!isStudyMode && !submitted && (
            <div className="flex items-center gap-2">
              <button
                onClick={togglePause}
                className="p-2.5 rounded-xl border border-border bg-card hover:bg-muted transition-all text-muted-foreground hover:text-foreground group"
                title="Pause Exam"
              >
                <Pause className="h-4 w-4 fill-current group-hover:scale-110 transition-transform" />
              </button>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono font-bold text-lg shadow-inner transition-colors ${
                isWarning10 ? 'bg-destructive/10 border-destructive text-destructive animate-pulse' : 'bg-muted/50 border-border text-foreground'
              }`}>
                <Clock className={`h-4 w-4 ${isWarning10 ? 'text-destructive' : 'text-muted-foreground'}`} />
                {timerDisplay}
              </div>
            </div>
          )}
          <button 
            onClick={() => setShowNav(!showNav)} 
            className={`p-2.5 rounded-xl border transition-all ${showNav ? 'bg-primary text-primary-foreground border-primary shadow-lg' : 'bg-card border-border text-muted-foreground hover:bg-muted'}`}
            title="Question navigator"
          >
            <ListChecks className="h-5 w-5" />
          </button>
          <button
            onClick={() => {
              if (isStudyMode || submitted) { onFinish(); return; }
              if (confirm('Exit this exam? Your progress will be lost and the attempt will NOT be saved.')) {
                onFinish();
              }
            }}
            className="p-2.5 rounded-xl border border-border bg-card hover:bg-destructive/10 hover:text-destructive hover:border-destructive/40 transition-all text-muted-foreground"
            title={isStudyMode ? 'Exit study session' : 'Exit exam (progress lost)'}
            aria-label="Exit"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto bg-[#fafafa] dark:bg-background">
        <div className="max-w-4xl mx-auto p-4 sm:p-8">
          
          {/* Progress Grid */}
          {showNav && (
            <div className="mb-8 p-6 rounded-2xl bg-card border border-border shadow-xl animate-in slide-in-from-top-4 duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-primary" />
                  Exam Navigator
                </h3>
                <span className="text-xs font-medium text-muted-foreground">{answeredCount} of {questions.length} answered</span>
              </div>
              <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-12 gap-2">
                {questions.map((q, i) => {
                  const id = q.kind === 'pbq' ? q.data.id : q.data.id;
                  const answered = q.kind === 'pbq'
                    ? (pbqAnswers[id] && (Array.isArray(pbqAnswers[id]) ? pbqAnswers[id].some((a: any) => a !== '') : typeof pbqAnswers[id] === 'object' && Object.keys(pbqAnswers[id]).length > 0))
                    : mcqAnswers[id] !== undefined;
                  const flagged = flags.has(id);
                  const isPBQ = q.kind === 'pbq';

                  return (
                    <button
                      key={i}
                      onClick={() => goTo(i)}
                      title={isPBQ ? `Q${i + 1} — Performance-Based` : `Q${i + 1}`}
                      className={`relative aspect-square rounded-lg text-xs font-mono font-black transition-all ${
                        i === idx ? 'bg-primary text-primary-foreground scale-110 shadow-lg z-10' :
                        answered ? (isPBQ ? 'bg-accent/15 text-accent border-2 border-accent/40' : 'bg-primary/10 text-primary border-2 border-primary/20') :
                        isPBQ ? 'bg-card text-foreground border-2 border-accent/40 hover:border-accent' :
                        'bg-card text-muted-foreground border border-border hover:border-primary/50'
                      }`}
                    >
                      {i + 1}
                      {isPBQ && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-accent" />}
                      {flagged && <div className="absolute -top-1 -right-1 w-3 h-3 bg-warning rounded-full border-2 border-card" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-card rounded-3xl border border-border shadow-sm min-h-[500px] flex flex-col">
            <div className="p-6 sm:p-10 flex-1">
              <div className="flex items-center justify-between mb-8">
                <span className="px-3 py-1 rounded-full bg-muted text-[10px] font-bold text-muted-foreground tracking-tight uppercase">
                  {DOMAIN_LABELS[cur.kind === 'pbq' ? cur.data.domain : cur.data.domain]}
                </span>
                <button 
                  onClick={toggleFlag} 
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                    flags.has(qId) ? 'bg-accent/10 border-accent text-accent' : 'bg-muted border-transparent text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  <Flag className={`h-3 w-3 ${flags.has(qId) ? 'fill-current' : ''}`} />
                  {flags.has(qId) ? 'FLAGGED' : 'FLAG FOR REVIEW'}
                </button>
              </div>

              {cur.kind === 'pbq' ? (
                <PBQRenderer q={cur.data} ans={pbqAnswers[cur.data.id]} onAns={a => setPbqAnswers(p => ({...p,[cur.data.id]:a}))} submitted={submitted} studyRevealed={isStudyMode && studyRevealed.has(cur.data.id)} />
              ) : (
                <MCQRenderer q={cur.data} ans={mcqAnswers[cur.data.id]} onAns={a => setMcqAnswers(p => ({...p,[cur.data.id]:a}))} submitted={submitted} studyRevealed={isStudyMode && studyRevealed.has(cur.data.id)} />
              )}
            </div>

            {isStudyMode && !studyRevealed.has(qId) && (
              <div className="p-6 border-t border-border bg-accent/5">
                <button 
                  onClick={() => setStudyRevealed(prev => new Set(prev).add(qId))}
                  className="w-full py-4 rounded-xl bg-accent text-accent-foreground font-black text-sm hover:opacity-90 transition-all shadow-md uppercase tracking-widest"
                >
                  Show Answer & Explanation
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="bg-card border-t border-border px-4 py-4 sm:px-10 flex items-center justify-between">
        <button 
          onClick={() => goTo(Math.max(0, idx - 1))} 
          disabled={idx === 0}
          className="flex items-center gap-2 px-6 py-3 rounded-xl border border-border font-bold text-sm text-foreground hover:bg-muted disabled:opacity-30 transition-all group"
        >
          <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Previous
        </button>

        <div className="hidden md:flex flex-col items-center">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Overall Progress</div>
          <div className="flex items-center gap-2">
            <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-500" style={{ width: `${(answeredCount/questions.length)*100}%` }} />
            </div>
            <span className="text-xs font-mono font-bold text-primary">{Math.round((answeredCount/questions.length)*100)}%</span>
          </div>
        </div>

        {idx < questions.length - 1 ? (
          <button 
            onClick={() => goTo(idx + 1)}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-all shadow-lg group"
          >
            Next
            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </button>
        ) : (
          <button 
            onClick={() => !isStudyMode ? setShowConfirmSubmit(true) : onFinish()}
            className="px-8 py-3 rounded-xl bg-accent text-accent-foreground font-black text-sm hover:opacity-90 shadow-xl animate-pulse transition-all uppercase tracking-widest"
          >
            {isStudyMode ? 'Finish Session' : 'Submit Exam'}
          </button>
        )}
      </div>
    </div>
  );
}

/* Rest of the file (MCQRenderer, PBQRenderer, etc.) remains unchanged */

function MCQRenderer({ q, ans, onAns, submitted, studyRevealed }: { q: MCQuestion; ans?: number | number[]; onAns: (a: number | number[]) => void; submitted: boolean; studyRevealed: boolean }) {
  const showFeedback = submitted || studyRevealed;
  const isSelected = (i: number) => {
    if (ans === undefined) return false;
    return q.type === 'single' ? ans === i : (ans as number[]).includes(i);
  };
  const isCorrectOpt = (i: number) => q.type === 'single' ? q.answer === i : (q.answer as number[]).includes(i);

  const handleSelect = (i: number) => {
    if (showFeedback) return;
    if (q.type === 'single') {
      onAns(i);
    } else {
      const prev = (ans as number[] | undefined) || [];
      onAns(prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <h3 className="text-xl font-bold leading-relaxed mb-8">{q.question}</h3>
      {q.type === 'select-two' && <div className="mb-4 px-3 py-1 rounded bg-accent/10 border border-accent/20 text-accent text-[10px] font-black inline-block tracking-widest">SELECT EXACTLY TWO</div>}
      
      <div className="grid gap-3">
        {q.options.map((opt, i) => {
          const sel = isSelected(i);
          const correct = isCorrectOpt(i);
          let cls = 'bg-card border-border text-foreground hover:border-primary/40 hover:bg-muted/30';

          if (showFeedback && sel && correct) cls = 'bg-success/10 border-success text-success';
          else if (showFeedback && sel && !correct) cls = 'bg-destructive/10 border-destructive text-destructive';
          else if (showFeedback && !sel && correct) cls = 'bg-success/5 border-success/50 text-success';
          else if (sel) cls = 'bg-primary/5 border-primary shadow-[0_0_0_1px_rgba(var(--primary),0.1)]';

          // Per-option explanation: show why this distractor is wrong, or confirm correct.
          const perOptionNote = showFeedback
            ? (correct
                ? 'Correct answer — see full explanation below.'
                : (q.whyWrong?.[i] ?? 'Incorrect — this option does not match the scenario described.'))
            : null;

          return (
            <div key={i}>
              <button
                onClick={() => handleSelect(i)}
                disabled={showFeedback}
                className={`w-full flex items-start gap-4 px-5 py-4 rounded-2xl border text-sm text-left transition-all duration-200 group ${cls}`}
              >
                <div className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center font-mono font-bold text-xs transition-colors ${
                  sel ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/20 text-muted-foreground group-hover:border-primary/40'
                }`}>
                  {String.fromCharCode(65+i)}
                </div>
                <span className="flex-1 leading-relaxed">{opt}</span>
                {showFeedback && correct && <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />}
                {showFeedback && sel && !correct && <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />}
              </button>
              {perOptionNote && (
                <div className={`mt-1.5 ml-4 px-4 py-2 text-xs leading-relaxed rounded-lg border-l-2 ${
                  correct
                    ? 'border-success/60 bg-success/5 text-success'
                    : 'border-destructive/40 bg-muted/40 text-muted-foreground'
                }`}>
                  <span className="font-bold uppercase tracking-wider text-[9px] mr-2">
                    {correct ? 'Why correct' : 'Why wrong'}
                  </span>
                  {perOptionNote}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showFeedback && (
        <div className="mt-10 p-6 rounded-2xl bg-muted/30 border border-border animate-in zoom-in-95 duration-500">
          <div className="flex items-center gap-2 mb-3 text-primary uppercase tracking-widest font-black text-[10px]">
            <ListChecks className="h-4 w-4" />
            Explanation
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{q.explanation}</p>
        </div>
      )}
    </div>
  );
}

export function PBQRenderer({ q, ans, onAns, submitted, studyRevealed }: { q: PBQuestion; ans: any; onAns: (a: any) => void; submitted: boolean; studyRevealed: boolean }) {
  const showFeedback = submitted || studyRevealed;
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <h3 className="text-xl font-bold mb-2">{q.title}</h3>
      <p className="text-muted-foreground text-sm mb-8 leading-relaxed italic">{q.scenario}</p>
      
      <div className="p-1">
        {q.type === 'firewall' && <FirewallPBQ q={q} ans={ans} onAns={onAns} show={showFeedback} />}
        {q.type === 'ordering' && <OrderingPBQ q={q} ans={ans} onAns={onAns} show={showFeedback} />}
        {q.type === 'log-analysis' && <LogAnalysisPBQ q={q} ans={ans} onAns={onAns} show={showFeedback} />}
        {q.type === 'matching' && <MatchingPBQ q={q} ans={ans} onAns={onAns} show={showFeedback} />}
        {q.type === 'placement' && <PlacementPBQ q={q} ans={ans} onAns={onAns} show={showFeedback} />}
      </div>

      {showFeedback && (
        <div className="mt-10 p-6 rounded-2xl bg-muted/30 border border-border animate-in zoom-in-95 duration-500">
          <div className="flex items-center gap-2 mb-3 text-primary uppercase tracking-widest font-black text-[10px]">
            <ListChecks className="h-4 w-4" />
            Explanation
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{q.explanation}</p>
        </div>
      )}
    </div>
  );
}

function FirewallPBQ({ q, ans, onAns, show }: { q: PBQFirewall; ans: string[]; onAns: (a: string[]) => void; show: boolean }) {
  const curr = ans?.length ? ans : q.rules.map(() => '');
  const set = (i: number, v: string) => {
    const n = [...curr];
    n[i] = v;
    onAns(n);
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead className="bg-muted/50 border-b border-border">
          <tr>
            {['Rule','Source','Dest','Port','Proto','Action'].map(h => (
              <th key={h} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {q.rules.map((r, i) => {
            const ok = show && curr[i] === q.correctActions[i];
            const bad = show && curr[i] && curr[i] !== q.correctActions[i];
            return (
              <tr key={i} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-mono text-xs">{r.ruleId}</td>
                <td className="px-4 py-3 font-mono text-xs">{r.sourceIP}</td>
                <td className="px-4 py-3 font-mono text-xs">{r.destIP}</td>
                <td className="px-4 py-3 font-mono text-xs">{r.port}</td>
                <td className="px-4 py-3 font-mono text-xs">{r.protocol}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {['ALLOW','DENY'].map(a => (
                      <button
                        key={a}
                        onClick={() => !show && set(i, a)}
                        className={`px-3 py-1 rounded-md text-[10px] font-black transition-all ${
                          curr[i] === a 
                            ? (a === 'ALLOW' ? 'bg-success text-success-foreground shadow-md' : 'bg-destructive text-destructive-foreground shadow-md') 
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                    {ok && <CheckCircle2 className="ml-2 h-4 w-4 text-success" />}
                    {bad && <div className="ml-2 flex flex-col">
                      <XCircle className="h-4 w-4 text-destructive" />
                      <span className="text-[8px] font-bold text-success uppercase">{q.correctActions[i]}</span>
                    </div>}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function OrderingPBQ({ q, ans, onAns, show }: { q: PBQOrdering; ans: string[]; onAns: (a: string[]) => void; show: boolean }) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
    const [dropTargetIdx, setDropTargetIdx] = useState<number | null>(null);
    const initialOrder = useMemo(() => q.steps.map(s => s.label).sort(() => Math.random() - 0.5), [q.id]);

    const currentOrder: string[] = ans?.length > 0 ? ans : initialOrder;
  if (!ans?.length && q.steps.length > 0) {
    setTimeout(() => onAns(currentOrder), 0);
  }

  const handleDrop = (targetIdx: number) => {
    if (dragIdx === null || show) return;
    const next = [...currentOrder];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(targetIdx, 0, moved);
    onAns(next);
    setDragIdx(null);
        setDropTargetIdx(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Drag to reorder steps</span>
      </div>
      {currentOrder.map((step, i) => {
        const ci = q.steps.find(s => s.label === step);
        const ok = show && ci && ci.correctPosition === i;
        const bad = show && ci && ci.correctPosition !== i;
        
        return (
          <div
            key={step}
            draggable={!show}
            onDragStart={() => setDragIdx(i)}
                        onDragEnd={() => { setDragIdx(null); setDropTargetIdx(null); }}
                        onDragOver={e => { e.preventDefault(); setDropTargetIdx(i); }}
                        onDragLeave={() => setDropTargetIdx(null)}
            onDrop={e => { e.preventDefault(); handleDrop(i); }}
            className={`flex items-center gap-4 px-5 py-4 rounded-2xl border text-sm transition-all shadow-sm ${
              ok ? 'bg-success/10 border-success text-success' :
              bad ? 'bg-destructive/10 border-destructive text-destructive' :
                              dropTargetIdx === i && dragIdx !== i ? 'border-accent bg-accent/20 scale-[1.02]' :
              dragIdx === i ? 'border-primary bg-primary/5 opacity-50 scale-95' :
              'border-border bg-card text-foreground hover:border-primary/40'
            } ${!show ? 'cursor-grab active:cursor-grabbing hover:shadow-md' : ''}`}
          >
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono font-black text-xs ${
              ok ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              {i+1}
            </div>
            <span className="flex-1 font-medium">{step}</span>
            <GripVertical className="h-4 w-4 text-muted-foreground opacity-30" />
            {ok && <CheckCircle2 className="h-4 w-4 text-success" />}
            {bad && ci && <div className="text-right flex flex-col">
              <XCircle className="h-4 w-4 text-destructive ml-auto" />
              <span className="text-[10px] font-black text-success uppercase">Correct: #{ci.correctPosition+1}</span>
            </div>}
          </div>
        );
      })}
    </div>
  );
}

function LogAnalysisPBQ({ q, ans, onAns, show }: { q: PBQLogAnalysis; ans: any; onAns: (a: any) => void; show: boolean }) {
  const current = ans || {};
  const update = (key: string, value: any) => onAns({ ...current, [key]: value });

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-border bg-[#1e1e1e] p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-2">
          <div className="w-3 h-3 rounded-full bg-destructive" />
          <div className="w-3 h-3 rounded-full bg-warning" />
          <div className="w-3 h-3 rounded-full bg-success" />
          <span className="ml-2 text-[10px] font-mono text-white/40 font-bold uppercase tracking-widest">system_audit.log</span>
        </div>
        <div className="font-mono text-xs space-y-1 max-h-[250px] overflow-auto custom-scrollbar">
          {q.logEntries.map((entry, i) => (
            <div key={i} className="flex gap-4 hover:bg-white/5 py-0.5 group px-2 rounded">
              <span className="text-white/20 select-none w-6 text-right group-hover:text-white/40">{i+1}</span>
              <span className={`${entry.type === 'error' ? 'text-destructive' : entry.type === 'warning' ? 'text-warning' : 'text-white/70'}`}>
                {entry.line}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 block">1. Attack Identification</label>
          <select 
            value={current.attackType || ''} 
            onChange={e => update('attackType', e.target.value)}
            disabled={show}
            className="w-full px-4 py-3 text-sm bg-muted border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
          >
            <option value="">Select attack type...</option>
            {q.attackTypeOptions.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          {show && (
            <div className={`mt-3 text-xs font-black uppercase tracking-tighter ${current.attackType === q.correctAttackType ? 'text-success' : 'text-destructive'}`}>
              {current.attackType === q.correctAttackType ? '✓ Correct Identification' : `✗ Correct: ${q.correctAttackType}`}
            </div>
          )}
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 block">2. Source of Threat</label>
          <select 
            value={current.sourceIP || ''} 
            onChange={e => update('sourceIP', e.target.value)}
            disabled={show}
            className="w-full px-4 py-3 text-sm bg-muted border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
          >
            <option value="">Select source IP...</option>
            {q.sourceIPOptions.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          {show && (
            <div className={`mt-3 text-xs font-black uppercase tracking-tighter ${current.sourceIP === q.correctSourceIP ? 'text-success' : 'text-destructive'}`}>
              {current.sourceIP === q.correctSourceIP ? '✓ Correct IP' : `✗ Correct: ${q.correctSourceIP}`}
            </div>
          )}
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 block">3. Immediate Mitigation Action</label>
        <div className="grid gap-3">
          {q.responseOptions.map((opt, i) => {
            const sel = current.response === i;
            const correct = i === q.correctResponse;
            let cls = 'bg-muted/50 border-border text-foreground hover:border-primary/40';
            
            if (show && sel && correct) cls = 'bg-success/10 border-success text-success';
            else if (show && sel && !correct) cls = 'bg-destructive/10 border-destructive text-destructive';
            else if (show && !sel && correct) cls = 'bg-success/5 border-success/50 text-success';
            else if (sel) cls = 'bg-primary/10 border-primary text-foreground';

            return (
              <button
                key={i}
                onClick={() => !show && update('response', i)}
                disabled={show}
                className={`flex items-center gap-4 px-5 py-4 rounded-xl border text-sm text-left transition-all font-medium ${cls}`}
              >
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center font-mono font-black text-xs ${sel ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/20 text-muted-foreground'}`}>
                  {String.fromCharCode(65+i)}
                </div>
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MatchingPBQ({ q, ans, onAns, show }: { q: PBQMatching; ans: Record<string, string>; onAns: (a: Record<string, string>) => void; show: boolean }) {
  const [dragItem, setDragItem] = useState<string | null>(null);
  const handleDrop = (right: string) => {
    if (!dragItem || show) return;
    onAns({...ans, [dragItem]: right});
    setDragItem(null);
  };

  const unassigned = q.items.filter(it => !Object.keys(ans || {}).includes(it.left));

  return (
    <div className="space-y-10">
      <div>
        <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
          <GripVertical className="h-3 w-3" />
          Available Items
        </h4>
        <div className="flex flex-wrap gap-3 p-6 rounded-2xl bg-muted/30 border-2 border-dashed border-border min-h-[80px]">
          {unassigned.map(it => (
            <div
              key={it.left}
              draggable={!show}
              onDragStart={() => setDragItem(it.left)}
              onDragEnd={() => setDragItem(null)}
              className={`px-4 py-2 rounded-xl border border-border bg-card text-xs font-bold text-foreground shadow-sm transition-all ${
                !show ? 'cursor-grab active:cursor-grabbing hover:border-primary/50 hover:shadow-md' : ''
              } ${dragItem === it.left ? 'opacity-50 scale-95' : ''}`}
            >
              {it.left}
            </div>
          ))}
          {unassigned.length === 0 && !show && <div className="text-xs font-bold text-success uppercase tracking-widest m-auto">All items assigned ✓</div>}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {q.rightOptions.map(right => {
          const assigned = q.items.filter(it => ans?.[it.left] === right);
          return (
            <div 
              key={right}
              onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('bg-primary/5', 'border-primary/50'); }}
              onDragLeave={e => { e.currentTarget.classList.remove('bg-primary/5', 'border-primary/50'); }}
              onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('bg-primary/5', 'border-primary/50'); handleDrop(right); }}
              className="group border-2 border-border rounded-2xl p-5 min-h-[120px] transition-all bg-card hover:shadow-lg"
            >
              <h5 className="text-xs font-black uppercase tracking-widest text-primary mb-4 border-b border-primary/10 pb-2">{right}</h5>
              <div className="space-y-2">
                {assigned.map(it => {
                  const ok = show && it.correctRight === right;
                  const bad = show && it.correctRight !== right;
                  return (
                    <div key={it.left} className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                      ok ? 'bg-success/10 border-success/50 text-success' : 
                      bad ? 'bg-destructive/10 border-destructive/50 text-destructive' : 
                      'bg-muted/50 border-border'
                    }`}>
                      {it.left}
                      {!show && (
                        <button 
                          onClick={() => {
                            const n = {...ans};
                            delete n[it.left];
                            onAns(n);
                          }}
                          className="p-1 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {ok && <CheckCircle2 className="h-3.5 w-3.5" />}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PlacementPBQ({ q, ans, onAns, show }: { q: PBQPlacement; ans: Record<string, string>; onAns: (a: Record<string, string>) => void; show: boolean }) {
  const [dragItem, setDragItem] = useState<string | null>(null);
  const handleDrop = (zone: string) => {
    if (!dragItem || show) return;
    onAns({...ans, [dragItem]: zone});
    setDragItem(null);
  };

  const unassigned = q.items.filter(it => !Object.keys(ans || {}).includes(it.label));

  return (
    <div className="space-y-10">
      <div>
        <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
          <GripVertical className="h-3 w-3" />
          Components to Place
        </h4>
        <div className="flex flex-wrap gap-2 p-6 rounded-2xl bg-muted/30 border-2 border-dashed border-border min-h-[80px]">
          {unassigned.map(it => (
            <div
              key={it.label}
              draggable={!show}
              onDragStart={() => setDragItem(it.label)}
              onDragEnd={() => setDragItem(null)}
              className={`px-3 py-1.5 rounded-lg border border-border bg-card text-[10px] font-black text-foreground shadow-sm transition-all ${
                !show ? 'cursor-grab active:cursor-grabbing hover:border-primary/50' : ''
              } ${dragItem === it.label ? 'opacity-50 scale-95' : ''}`}
            >
              {it.label}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
        {q.zones.map(zone => {
          const here = q.items.filter(it => ans?.[it.label] === zone);
          return (
            <div 
              key={zone}
              onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('bg-primary/5', 'border-primary/50'); }}
              onDragLeave={e => { e.currentTarget.classList.remove('bg-primary/5', 'border-primary/50'); }}
              onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('bg-primary/5', 'border-primary/50'); handleDrop(zone); }}
              className="border-2 border-border border-dashed rounded-2xl p-5 min-h-[140px] transition-all bg-card/50 flex flex-col"
            >
              <h5 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 border-b border-border pb-2 text-center">{zone}</h5>
              <div className="flex-1 flex flex-col gap-2">
                {here.map(it => {
                  const ok = show && it.correctZone === zone;
                  const bad = show && it.correctZone !== zone;
                  return (
                    <div key={it.label} className={`flex items-center justify-between px-3 py-2 rounded-xl text-[10px] font-black border transition-all ${
                      ok ? 'bg-success/10 border-success/50 text-success' : 
                      bad ? 'bg-destructive/10 border-destructive/50 text-destructive' : 
                      'bg-card border-border shadow-sm'
                    }`}>
                      {it.label}
                      {!show && (
                        <button onClick={() => {
                          const n = {...ans};
                          delete n[it.label];
                          onAns(n);
                        }} className="text-muted-foreground hover:text-destructive">
                          <XCircle className="h-3 w-3" />
                        </button>
                      )}
                      {ok && <CheckCircle2 className="h-3 w-3" />}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import type { PBQFirewall, PBQOrdering, PBQLogAnalysis, PBQMatching, PBQPlacement } from '@/data/questions';
