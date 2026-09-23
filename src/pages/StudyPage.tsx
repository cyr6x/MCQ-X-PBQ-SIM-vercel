import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, Layers3, RotateCcw, Shuffle, Target, Zap } from 'lucide-react';
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
import { useSettings } from '@/lib/SettingsContext';
import { useProgressSnapshot } from '@/hooks/useProgressSnapshot';
import { PageHeader, Panel, StatusChip } from '@/components/product/ProductUI';

type Mode = 'tutor' | 'sprint' | 'mixed' | 'failed' | 'weakest' | 'random';

interface StudySession {
  title: string;
  mcqs: MCQuestion[];
  pbqs: PBQuestion[];
}

const MODE_META: Record<Mode, { title: string; description: string; icon: React.ReactNode }> = {
  tutor: { title: 'Tutor Mode', description: 'Untimed bank with instant feedback and explanations.', icon: <BookOpen className="h-5 w-5" /> },
  sprint: { title: 'Sprint', description: 'Fast repetition using your configured sprint size.', icon: <Zap className="h-5 w-5" /> },
  mixed: { title: 'Mixed Exam Drill', description: 'MCQs plus PBQs for format switching without a full 90-minute form.', icon: <Layers3 className="h-5 w-5" /> },
  random: { title: 'Random Drill', description: 'Randomized coverage across domains and difficulty levels.', icon: <Shuffle className="h-5 w-5" /> },
  weakest: { title: 'Weakest Domain', description: 'Focused practice against your lowest-accuracy attempted domain.', icon: <Target className="h-5 w-5" /> },
  failed: { title: 'Needs Review', description: 'Retest unresolved MCQ and PBQ misses together.', icon: <RotateCcw className="h-5 w-5" /> },
};

export default function StudyPage() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const progress = useProgressSnapshot(settings);
  const [searchParams] = useSearchParams();
  const requestedDomain = searchParams.get('domain');
  const requestedMode = searchParams.get('mode') as Mode | null;
  const [selectedDomain, setSelectedDomain] = useState<Domain | ''>(
    requestedDomain && requestedDomain in DOMAIN_LABELS ? requestedDomain as Domain : '',
  );
  const [session, setSession] = useState<StudySession | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (requestedDomain && requestedDomain in DOMAIN_LABELS) setSelectedDomain(requestedDomain as Domain);
  }, [requestedDomain]);

  const allMcqs = useMemo(() => [...mcqSingle, ...mcqSelectTwo], []);
  const mcqById = useMemo(() => new Map(allMcqs.map((question) => [question.id, question])), [allMcqs]);
  const pbqById = useMemo(() => new Map(pbqBank.map((question) => [question.id, question])), []);

  const start = (mode: Mode) => {
    setNotice(null);
    let mcqs: MCQuestion[] = [];
    let pbqs: PBQuestion[] = [];
    const domain = selectedDomain || undefined;

    switch (mode) {
      case 'tutor':
        mcqs = buildStudyQuestions(domain);
        break;
      case 'sprint':
        mcqs = buildStudyQuestions(domain).slice(0, settings.sprint_question_count);
        break;
      case 'random':
        mcqs = [...allMcqs]
          .filter((question) => !domain || question.domain === domain)
          .sort(() => Math.random() - 0.5)
          .slice(0, settings.random_question_count)
          .map(shuffleOptions);
        break;
      case 'mixed': {
        const filteredMcqs = domain ? allMcqs.filter((question) => question.domain === domain) : allMcqs;
        const filteredPbqs = domain ? pbqBank.filter((question) => question.domain === domain) : pbqBank;
        mcqs = [...filteredMcqs].sort(() => Math.random() - 0.5).slice(0, 20).map(shuffleOptions);
        pbqs = [...filteredPbqs].sort(() => Math.random() - 0.5).slice(0, Math.min(3, filteredPbqs.length));
        break;
      }
      case 'failed':
        mcqs = progress.unresolved
          .map((item) => mcqById.get(item.questionId))
          .filter((question): question is MCQuestion => Boolean(question))
          .map(shuffleOptions);
        pbqs = progress.unresolved
          .map((item) => pbqById.get(item.questionId))
          .filter((question): question is PBQuestion => Boolean(question));
        break;
      case 'weakest': {
        const weakest = domain || progress.weakestDomain?.domain;
        if (weakest) {
          mcqs = allMcqs.filter((question) => question.domain === weakest).map(shuffleOptions).slice(0, 25);
          pbqs = pbqBank.filter((question) => question.domain === weakest).sort(() => Math.random() - 0.5).slice(0, 2);
        }
        break;
      }
    }

    if (!mcqs.length && !pbqs.length) {
      setNotice(mode === 'failed' ? 'No unresolved questions remain.' : 'No questions match this training selection yet.');
      return;
    }

    setSession({ title: MODE_META[mode].title, mcqs, pbqs });
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

  const defaultMode: Mode = settings.default_mode === 'exam' ? 'mixed' : settings.default_mode;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Adaptive practice"
        title="Study with a purpose."
        description="Choose the kind of repetition you need: learn with feedback, isolate a weak domain, mix MCQs with PBQs, or close unresolved misses."
        icon={<BookOpen className="h-4 w-4" />}
        actions={
          <button
            onClick={() => start(defaultMode)}
            className="rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
          >
            Start default: {defaultMode}
          </button>
        }
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Panel title="Focus domain" eyebrow="Scope">
            <select
              value={selectedDomain}
              onChange={(event) => setSelectedDomain(event.target.value as Domain | '')}
              className="w-full rounded-lg border border-border bg-muted/60 px-3 py-2.5 text-sm text-foreground"
            >
              <option value="">All domains</option>
              {(Object.entries(DOMAIN_LABELS) as [Domain, string][]).map(([key, label]) => (
                <option key={key} value={key}>{key} · {label}</option>
              ))}
            </select>
            <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
              Domain focus applies to Tutor, Sprint, Random and Mixed Drill. Weakest Domain uses your selected domain if one is chosen.
            </p>
          </Panel>

          <Panel title="Live training state" eyebrow="Signal">
            <div className="space-y-2">
              <StateRow label="Unresolved misses" value={String(progress.unresolved.length)} tone={progress.unresolved.length ? 'warning' : 'success'} />
              <StateRow label="PBQ repetitions" value={String(progress.pbqReps)} tone="primary" />
              <StateRow label="Weakest attempted" value={progress.weakestDomain ? `${progress.weakestDomain.domain} · ${progress.weakestDomain.accuracy}%` : 'No data'} tone="muted" />
              <StateRow label="Practice accuracy" value={progress.totalAnswered ? `${progress.overallAccuracy}%` : '—'} tone="muted" />
            </div>
          </Panel>

          <button
            onClick={() => navigate('/pbq')}
            className="flex w-full items-center justify-between rounded-2xl border border-accent/30 bg-accent/8 px-4 py-4 text-left hover:bg-accent/12"
          >
            <div>
              <div className="text-sm font-semibold">Go deeper on PBQs</div>
              <div className="mt-1 text-xs text-muted-foreground">Filter by task family and drill with subtask feedback.</div>
            </div>
            <Layers3 className="h-5 w-5 text-accent" />
          </button>
        </div>

        <div>
          {notice && (
            <div className="mb-4 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-xs text-warning">
              {notice}
            </div>
          )}

          {requestedMode && MODE_META[requestedMode] && (
            <button
              onClick={() => start(requestedMode)}
              className="mb-4 flex w-full items-center justify-between rounded-2xl border border-primary/30 bg-primary/8 p-4 text-left hover:bg-primary/12"
            >
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Requested session</div>
                <div className="mt-1 text-base font-semibold">{MODE_META[requestedMode].title}</div>
              </div>
              <StatusChip tone="primary">Start now</StatusChip>
            </button>
          )}

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {(Object.keys(MODE_META) as Mode[]).map((mode) => {
              const disabled =
                (mode === 'failed' && progress.unresolved.length === 0) ||
                (mode === 'weakest' && !selectedDomain && !progress.weakestDomain);
              const count =
                mode === 'sprint' ? `${settings.sprint_question_count} Q` :
                mode === 'random' ? `${settings.random_question_count} Q` :
                mode === 'mixed' ? '20 MCQ + PBQ' :
                mode === 'failed' ? `${progress.unresolved.length} items` :
                null;

              return (
                <button
                  key={mode}
                  onClick={() => start(mode)}
                  disabled={disabled}
                  className="group min-h-40 rounded-2xl border border-border bg-card/85 p-4 text-left transition-colors hover:border-primary/40 hover:bg-muted/20 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                      {MODE_META[mode].icon}
                    </div>
                    {count && <StatusChip>{count}</StatusChip>}
                  </div>
                  <div className="mt-5 text-sm font-semibold">{MODE_META[mode].title}</div>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {disabled && mode === 'failed'
                      ? 'No unresolved misses remain.'
                      : disabled && mode === 'weakest'
                        ? 'Complete some practice first or select a domain.'
                        : MODE_META[mode].description}
                  </p>
                </button>
              );
            })}
          </div>

          <Panel className="mt-4" title="Training sequence" eyebrow="Method">
            <div className="grid gap-2 sm:grid-cols-4">
              {[
                ['1', 'Learn', 'Tutor / focused study'],
                ['2', 'Apply', 'Mixed drill / PBQ Lab'],
                ['3', 'Repair', 'Needs Review queue'],
                ['4', 'Prove', '90-question simulation'],
              ].map(([step, title, body]) => (
                <div key={step} className="rounded-xl bg-muted/25 p-3">
                  <div className="font-mono text-[10px] text-primary">0{step}</div>
                  <div className="mt-2 text-xs font-semibold">{title}</div>
                  <div className="mt-1 text-[10px] leading-4 text-muted-foreground">{body}</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function StateRow({ label, value, tone }: { label: string; value: string; tone: 'primary' | 'success' | 'warning' | 'muted' }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/25 px-3 py-2.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <StatusChip tone={tone}>{value}</StatusChip>
    </div>
  );
}
