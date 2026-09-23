import { useState, useCallback, useMemo, useEffect } from 'react';
import { Flag, ChevronLeft, ChevronRight, ListChecks, CheckCircle2, XCircle, AlertTriangle, Clock, Pause, Play, Shuffle, LogOut } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { MCQuestion, PBQuestion } from '@/data/questions';
import { isMCQCorrect, isPBQCorrect, calculateScore, type ScoreResult } from '@/lib/examEngine';
import { ExamResults } from '@/components/ExamResults';
import { PBQRenderer } from '@/components/PBQRenderer';
import { EvidenceBlocks } from '@/components/EvidenceBlocks';
import { saveAttempt, type QuestionAttempt, type ExamAttempt } from '@/lib/examHistory';
import { DOMAIN_LABELS } from '@/data/questions';
import { objectiveLabel } from '@/lib/sy0701Objectives';

type UnifiedQ = { kind: 'pbq'; data: PBQuestion } | { kind: 'mcq'; data: MCQuestion };

/**
 * Study/retest sessions deliberately mix PBQs and MCQs so learners practice
 * switching between formats. Full exam delivery uses StrictExamEngine and its
 * deterministic form-ordering rules instead.
 */
function arrangeQuestions(pbqs: PBQuestion[], mcqs: MCQuestion[]): UnifiedQ[] {
  return [
    ...pbqs.map(data => ({ kind: 'pbq' as const, data })),
    ...mcqs.map(data => ({ kind: 'mcq' as const, data })),
  ].sort(() => Math.random() - 0.5);
}

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

  const questions = useMemo<UnifiedQ[]>(
    () => arrangeQuestions(pbqs, mcqs),
    // shuffleNonce intentionally requests a fresh mixed order.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pbqs, mcqs, shuffleNonce],
  );

  const pbqCount = pbqs.length;

  const [idx, setIdx] = useState(0);
  const [pbqAnswers, setPbqAnswers] = useState<Record<string, any>>({});
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, number | number[]>>({});
  const [flags, setFlags] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
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

  // Timer logic with Pause
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
    if (newIdx === idx) return;
    setIdx(newIdx);
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
    return <ExamResults score={scoreResult} pbqs={pbqs} mcqs={mcqs} pbqAnswers={pbqAnswers} mcqAnswers={mcqAnswers} flags={flags} questionOrder={questions.map(q => q.data.id)} onRestart={() => window.location.reload()} onBackToMenu={onFinish} />;
  }

  const timerMins = Math.floor(remaining / 60);
  const timerSecs = remaining % 60;
  const timerDisplay = `${String(timerMins).padStart(2,'0')}:${String(timerSecs).padStart(2,'0')}`;
  const isWarning10 = remaining <= 600;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20">
      
      {/* Pause Overlay */}
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
      <div className="flex-1 overflow-auto bg-background">
        <div className="mx-auto grid max-w-7xl gap-6 p-4 sm:p-8 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="min-w-0">
          
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
                        answered ? (isPBQ ? 'bg-accent/20 text-accent border-2 border-accent/40' : 'bg-primary/10 text-primary border-2 border-primary/20') :
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

          <div className="bg-card rounded-2xl border border-border shadow-sm min-h-[500px] flex flex-col">
            <div className="p-6 sm:p-10 flex-1">
              <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-muted px-3 py-1 text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
                    {DOMAIN_LABELS[cur.data.domain]}
                  </span>
                  <span
                    className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[10px] font-bold text-primary"
                    title={objectiveLabel(cur.data.objective)}
                  >
                    Objective {cur.data.objective || '—'}
                  </span>
                  <span className="rounded-full border border-border bg-background/50 px-3 py-1 text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
                    Difficulty {cur.data.difficulty}/3
                  </span>
                </div>
                <button 
                  onClick={toggleFlag} 
                  className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold transition-all ${
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

          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="mb-3 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Exam controls</div>
                {!isStudyMode ? (
                  <div className={`mb-4 flex items-center justify-between rounded-xl border px-3 py-3 ${
                    isWarning10 ? 'border-destructive/40 bg-destructive/10 text-destructive' : 'border-border bg-muted/30'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Time left</span>
                    </div>
                    <span className="font-mono text-lg font-black">{timerDisplay}</span>
                  </div>
                ) : (
                  <div className="mb-4 rounded-xl border border-border bg-muted/30 px-3 py-3 text-xs font-bold text-muted-foreground">
                    Untimed study session
                  </div>
                )}

                <div className="mb-4 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-muted/30 p-3">
                    <div className="font-mono text-xl font-black">{answeredCount}</div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Answered</div>
                  </div>
                  <div className="rounded-xl bg-muted/30 p-3">
                    <div className="font-mono text-xl font-black">{flags.size}</div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Flagged</div>
                  </div>
                </div>

                <button
                  onClick={toggleFlag}
                  className={`mb-4 flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-black ${
                    flags.has(qId) ? 'border-accent/40 bg-accent/10 text-accent' : 'border-border bg-background/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Flag className={`h-3.5 w-3.5 ${flags.has(qId) ? 'fill-current' : ''}`} />
                  {flags.has(qId) ? 'Remove flag' : 'Flag question'}
                </button>

                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">Question palette</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{idx + 1}/{questions.length}</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {questions.map((q, i) => {
                    const id = q.data.id;
                    const answered = q.kind === 'pbq'
                      ? Boolean(pbqAnswers[id] && (Array.isArray(pbqAnswers[id]) ? pbqAnswers[id].some((a: any) => a !== '') : typeof pbqAnswers[id] === 'object' && Object.keys(pbqAnswers[id]).length > 0))
                      : mcqAnswers[id] !== undefined;
                    const flagged = flags.has(id);
                    return (
                      <button
                        key={id}
                        onClick={() => goTo(i)}
                        title={q.kind === 'pbq' ? `Q${i + 1} — PBQ` : `Q${i + 1}`}
                        className={`relative aspect-square rounded-md border text-[10px] font-mono font-black transition-all hover:scale-105 ${
                          i === idx
                            ? 'border-primary bg-primary text-primary-foreground'
                            : answered
                              ? 'border-primary/30 bg-primary/10 text-primary'
                              : q.kind === 'pbq'
                                ? 'border-accent/40 bg-accent/5 text-accent'
                                : 'border-border bg-background/50 text-muted-foreground'
                        }`}
                      >
                        {i + 1}
                        {flagged && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-warning ring-2 ring-card" />}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 flex flex-wrap gap-x-3 gap-y-2 text-[9px] font-semibold text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-primary" /> Current</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm border border-primary/40 bg-primary/10" /> Answered</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm border border-accent/50 bg-accent/10" /> PBQ</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-warning" /> Flagged</span>
                </div>
              </div>
            </div>
          </aside>
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
      // Select-two: cap at 2 selections. Without this cap a candidate could pick
      // 3+ options, which can never match the 2-item answer key and always scores
      // wrong — that read as "multi-select is broken" even though the intent was
      // just missing enforcement of "select exactly two".
      const prev = (ans as number[] | undefined) || [];
      if (prev.includes(i)) {
        onAns(prev.filter(x => x !== i));
      } else if (prev.length < 2) {
        onAns([...prev, i]);
      }
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <h3 className="text-xl font-bold leading-relaxed mb-5">{q.question}</h3>
      {q.type === 'select-two' && <div className="mb-4 px-3 py-1 rounded bg-accent/10 border border-accent/20 text-accent text-[10px] font-black inline-block tracking-widest">SELECT EXACTLY TWO</div>}
      <EvidenceBlocks evidence={q.evidence} />
      
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
