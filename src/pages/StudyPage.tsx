import { useMemo, useState } from 'react';
import { BookOpen, ChevronRight, Flame, Layers, RotateCcw, Shuffle, Target, Zap } from 'lucide-react';
import { NewExamEngine } from '@/components/NewExamEngine';
import {
  buildStudyQuestions,
  mcqSelectTwo,
  mcqSingle,
  pbqBank,
  shuffleOptions,
  DOMAIN_LABELS,
  type Domain,
  type MCQuestion,
  type PBQuestion,
} from '@/data/questions';
import { loadQuestionStats } from '@/lib/examHistory';
import { useSettings } from '@/lib/SettingsContext';

type Mode = 'tutor' | 'sprint' | 'mixed' | 'failed' | 'weakest' | 'random';

interface StudySession {
  title: string;
  mcqs: MCQuestion[];
  pbqs: PBQuestion[];
}

export default function StudyPage() {
  const { settings } = useSettings();
  const [selectedDomain, setSelectedDomain] = useState<Domain | ''>('');
  const [session, setSession] = useState<StudySession | null>(null);

  const stats = useMemo(() => loadQuestionStats(), []);
  const unresolvedIds = useMemo(
    () => new Set(
      Object.values(stats)
        .filter((s) => s.type === 'mcq' && s.streak < 0)
        .map((s) => s.questionId)
    ),
    [stats],
  );
  const allMcqs = useMemo(() => [...mcqSingle, ...mcqSelectTwo], []);

  const start = (mode: Mode) => {
    let mcqs: MCQuestion[] = [];
    let pbqs: PBQuestion[] = [];
    let title = '';

    switch (mode) {
      case 'tutor':
        title = 'Tutor Mode';
        mcqs = buildStudyQuestions(selectedDomain || undefined);
        break;
      case 'sprint':
        title = 'Sprint';
        mcqs = buildStudyQuestions(selectedDomain || undefined).slice(0, settings.sprint_question_count);
        break;
      case 'random':
        title = 'Random Drill';
        mcqs = [...allMcqs]
          .sort(() => Math.random() - 0.5)
          .slice(0, settings.random_question_count)
          .map(shuffleOptions);
        break;
      case 'mixed': {
        title = 'Mixed Exam Drill';
        const filteredMcqs = selectedDomain
          ? allMcqs.filter((q) => q.domain === selectedDomain)
          : allMcqs;
        const filteredPbqs = selectedDomain
          ? pbqBank.filter((q) => q.domain === selectedDomain)
          : pbqBank;
        mcqs = [...filteredMcqs]
          .sort(() => Math.random() - 0.5)
          .slice(0, 20)
          .map(shuffleOptions);
        pbqs = [...filteredPbqs].sort(() => Math.random() - 0.5).slice(0, Math.min(3, filteredPbqs.length));
        break;
      }
      case 'failed':
        title = 'Needs Review Drill';
        mcqs = allMcqs
          .filter((q) => unresolvedIds.has(q.id))
          .map(shuffleOptions)
          .sort(() => Math.random() - 0.5);
        break;
      case 'weakest': {
        title = 'Weakest Domain Drill';
        const byDomain = (Object.keys(DOMAIN_LABELS) as Domain[]).map(domain => {
          const matching = Object.values(stats).filter((s) => s.domain === DOMAIN_LABELS[domain] || s.domain === domain);
          const attempted = matching.reduce((sum, item) => sum + item.timesAttempted, 0);
          const correct = matching.reduce((sum, item) => sum + item.timesCorrect, 0);
          return { domain, attempted, accuracy: attempted ? correct / attempted : 1 };
        }).filter(item => item.attempted > 0);

        const weakest = byDomain.sort((a, b) => a.accuracy - b.accuracy)[0]?.domain;
        if (weakest) {
          mcqs = allMcqs.filter((q) => q.domain === weakest).map(shuffleOptions).slice(0, 25);
          pbqs = pbqBank.filter((q) => q.domain === weakest).sort(() => Math.random() - 0.5).slice(0, 2);
        }
        break;
      }
    }

    if (mcqs.length === 0 && pbqs.length === 0) return;
    setSession({ title, mcqs, pbqs });
  };

  if (session) {
    return (
      <div className="fixed inset-0 z-[80] overflow-auto bg-background">
        <NewExamEngine
          pbqs={session.pbqs}
          mcqs={session.mcqs}
          durationMinutes={0}
          isStudyMode
          onFinish={() => setSession(null)}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-accent">
          <BookOpen className="h-4 w-4" />
          Adaptive practice
        </div>
        <h1 className="text-2xl font-bold">Study Mode</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Build accuracy first, then mix formats and time pressure. Explanations stay available here; strict exam mode keeps them hidden until submission.
        </p>
      </div>

      <div className="mb-5 rounded-2xl border border-border bg-card p-5">
        <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Domain focus
        </label>
        <select
          value={selectedDomain}
          onChange={(e) => setSelectedDomain(e.target.value as Domain | '')}
          className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 text-sm text-foreground"
        >
          <option value="">All domains</option>
          {(Object.entries(DOMAIN_LABELS) as [Domain, string][]).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <ModeCard
          icon={<BookOpen className="h-5 w-5" />}
          title="Tutor Mode"
          desc="Untimed full bank with instant feedback and explanations."
          onStart={() => start('tutor')}
          tone="accent"
        />
        <ModeCard
          icon={<Zap className="h-5 w-5" />}
          title={`Sprint (${settings.sprint_question_count} Q)`}
          desc="Quick accuracy and recall warm-up using your configured set size."
          onStart={() => start('sprint')}
          tone="primary"
        />
        <ModeCard
          icon={<Layers className="h-5 w-5" />}
          title="Mixed Exam Drill"
          desc="20 MCQs plus up to 3 PBQs for exam-style context switching without the 90-minute commitment."
          onStart={() => start('mixed')}
          tone="primary"
        />
        <ModeCard
          icon={<Shuffle className="h-5 w-5" />}
          title={`Random Drill (${settings.random_question_count} Q)`}
          desc="Randomized coverage across all domains and difficulty levels."
          onStart={() => start('random')}
          tone="primary"
        />
        <ModeCard
          icon={<Target className="h-5 w-5" />}
          title="Weakest Domain"
          desc="25 MCQs plus PBQs from your lowest-accuracy domain."
          onStart={() => start('weakest')}
          tone="accent"
          disabled={Object.keys(stats).length === 0}
          disabledReason="Answer some questions first."
        />
        <ModeCard
          icon={<RotateCcw className="h-5 w-5" />}
          title={`Needs Review (${unresolvedIds.size})`}
          desc="Only MCQs where your latest performance streak is still negative."
          onStart={() => start('failed')}
          tone="destructive"
          disabled={unresolvedIds.size === 0}
          disabledReason="No unresolved MCQ misses."
        />
        <ModeCard
          icon={<Flame className="h-5 w-5" />}
          title="PBQ Lab"
          desc="Deep-drill interactive PBQs by task type or domain."
          onStart={() => { window.location.hash = '#/pbq'; }}
          tone="accent"
        />
      </div>

      <div className="mt-5 rounded-xl border border-border bg-card px-4 py-3 text-xs leading-5 text-muted-foreground">
        Training loop: Tutor → Mixed Drill → Review misses → Full Exam Simulation. Set sizes and interruption controls are adjustable in Settings.
      </div>
    </div>
  );
}

function ModeCard({
  icon,
  title,
  desc,
  tone,
  onStart,
  disabled,
  disabledReason,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  tone: 'primary' | 'accent' | 'destructive';
  onStart: () => void;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const iconClass =
    tone === 'destructive'
      ? 'bg-destructive/15 text-destructive'
      : tone === 'accent'
        ? 'bg-accent/15 text-accent'
        : 'bg-primary/15 text-primary';

  return (
    <button
      onClick={onStart}
      disabled={disabled}
      title={disabled ? disabledReason : undefined}
      className="group flex min-h-32 items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-all hover:border-primary/40 hover:bg-muted/20 disabled:cursor-not-allowed disabled:opacity-45"
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{title}</div>
        <div className="mt-1 text-xs leading-5 text-muted-foreground">
          {disabled && disabledReason ? disabledReason : desc}
        </div>
      </div>
      <ChevronRight className="mt-3 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}
