import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  ClipboardList,
  FileText,
  History,
  RotateCcw,
  Shield,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { DOMAIN_LABELS, type Domain } from '@/data/questions';
import {
  clearSimState,
  DEFAULT_SIM_CONFIG,
  distributePbqs,
  buildPool,
  loadSimOptions,
  loadSimState,
  saveSimOptions,
  saveSimState,
  type SimConfig,
  type SimItem,
  type SimMode,
  type SimState,
} from '@/lib/simExam';
import { loadHistory, PROGRESS_EVENT } from '@/lib/examHistory';

const STUDY_COUNTS: number[] = [10, 20, 30, 60, 90];
const DOMAIN_CHIPS: Array<{ value: 'all' | Domain; label: string }> = [
  { value: 'all', label: 'All Domains' },
  { value: 'D1', label: '1.0 General Security' },
  { value: 'D2', label: '2.0 Threats & Vulns' },
  { value: 'D3', label: '3.0 Architecture' },
  { value: 'D4', label: '4.0 Operations' },
  { value: 'D5', label: '5.0 Program Mgmt' },
];

export default function WelcomeScreen() {
  const navigate = useNavigate();
  const [cfg, setCfg] = useState<SimConfig>({ ...DEFAULT_SIM_CONFIG, ...loadSimOptions() });
  const [resumed, setResumed] = useState<SimState | null>(null);
  const [past, setPast] = useState(loadHistory());

  useEffect(() => {
    setResumed(loadSimState());
    const refresh = () => setPast(loadHistory());
    window.addEventListener(PROGRESS_EVENT, refresh);
    return () => window.removeEventListener(PROGRESS_EVENT, refresh);
  }, []);

  const update = (patch: Partial<SimConfig>) => setCfg(prev => ({ ...prev, ...patch }));

  const begin = () => {
    const pool: SimItem[] = distributePbqs(buildPool(cfg));
    const state: SimState = {
      cfg,
      order: pool.map(i => i.id),
      answers: {},
      flags: [],
      idx: 0,
      startedAt: Date.now(),
    };
    saveSimOptions(cfg);
    saveSimState(state);
    navigate('/sim/exam');
  };

  const resume = () => navigate('/sim/exam');

  const discard = () => {
    clearSimState();
    setResumed(null);
  };

  const mode = cfg.mode;
  const formTitle = mode === 'exam'
    ? `90 questions · 90 min · ${6} PBQs · Test form ${cfg.examNumber}`
    : `${cfg.studyCount} questions${cfg.domain !== 'all' ? ` · ${DOMAIN_LABELS[cfg.domain as Domain]}` : ''} · instant feedback`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-5 px-5 py-10">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/25">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight">SY0-701 Exam Simulator</div>
            <div className="text-xs text-muted-foreground">CompTIA Security+ · 90-question Pearson VUE-format simulation</div>
          </div>
        </div>

        {/* Status pill */}
        <div className="flex items-center gap-2 self-start rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
          </span>
          Question bank grounded in the official SY0-701 objectives (D1–D5)
        </div>

        {/* Resume banner */}
        {resumed && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
            <div>
              <div className="font-semibold text-amber-500">Resume in-progress {resumed.cfg.mode === 'study' ? 'study session' : 'exam'}?</div>
              <div className="text-xs text-muted-foreground">
                Question {resumed.idx + 1} of {resumed.order.length} · started {new Date(resumed.startedAt).toLocaleString()}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={resume}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white transition hover:opacity-90"
              >
                Resume
              </button>
              <button
                onClick={discard}
                className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-muted"
              >
                <X className="h-3.5 w-3.5" /> Discard
              </button>
            </div>
          </div>
        )}

        {/* Mode select */}
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold">
            Select Mode <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">Required</span>
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <ModeCard
              icon={<ClipboardList className="h-6 w-6" />}
              title="Exam Mode"
              desc="6 PBQs · 90 min · no hints · mirrors real exam conditions"
              selected={mode === 'exam'}
              onClick={() => update({ mode: 'exam' })}
            />
            <ModeCard
              icon={<BookOpen className="h-6 w-6" />}
              title="Study Mode"
              desc="instant feedback · hints available · domain filter"
              selected={mode === 'study'}
              onClick={() => update({ mode: 'study' })}
            />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{formTitle}</p>
        </section>

        {/* Exam options */}
        {mode === 'exam' && (
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 text-sm font-bold">Test Form</h2>
            <div className="flex flex-wrap gap-2">
              {([1, 2, 3, 4, 5] as const).map(n => (
                <button
                  key={n}
                  onClick={() => update({ examNumber: n as SimConfig['examNumber'] })}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    cfg.examNumber === n
                      ? 'bg-primary text-white'
                      : 'border border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  Form {n}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Each form is a seeded, reproducible 90-question pool weighted to the official SY0-701 domain blueprint.
            </p>
          </section>
        )}

        {/* Study options */}
        {mode === 'study' && (
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 text-sm font-bold">Study Options</h2>
            <div className="mb-5">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Question Count</label>
              <div className="flex flex-wrap gap-2">
                {STUDY_COUNTS.map(c => (
                  <button
                    key={c}
                    onClick={() => update({ studyCount: c as SimConfig['studyCount'] })}
                    className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition ${
                      cfg.studyCount === c
                        ? 'bg-primary text-white'
                        : 'border border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-5">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Domain Focus</label>
              <div className="flex flex-wrap gap-2">
                {DOMAIN_CHIPS.map(chip => (
                  <button
                    key={chip.value}
                    onClick={() => update({ domain: chip.value as SimConfig['domain'] })}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                      cfg.domain === chip.value
                        ? 'bg-primary text-white'
                        : 'border border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Question Types</label>
              <div className="flex gap-6">
                <ToggleRow label="MCQ" checked={cfg.includeMcq} onChange={v => update({ includeMcq: v })} />
                <ToggleRow label="PBQ (Interactive)" checked={cfg.includePbq} onChange={v => update({ includePbq: v })} />
              </div>
            </div>
          </section>
        )}

        {/* Study materials (coming soon) */}
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold">
            Study Materials
            <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-500">Coming Soon</span>
          </h2>
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div className="text-sm font-medium">Drop Messer / Seidl PDF files here or click to browse</div>
            <div className="text-xs text-muted-foreground">Questions grounded in your uploaded materials</div>
          </div>
        </section>

        {/* Candidate name */}
        <section className="rounded-2xl border border-border bg-card p-6">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Candidate Name (optional)</label>
          <input
            value={cfg.candidate}
            onChange={e => update({ candidate: e.target.value })}
            placeholder="Your name"
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition focus:border-primary/60 focus:ring-1 focus:ring-primary/40"
          />
        </section>

        <button
          onClick={begin}
          disabled={!cfg.includeMcq && !cfg.includePbq}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-base font-bold text-white shadow-lg shadow-primary/25 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {mode === 'exam' ? 'Begin Exam' : 'Start Study Session'} →
        </button>

        {/* Past results */}
        {past.length > 0 && (
          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-bold">
                <History className="h-4 w-4 text-muted-foreground" /> Past Results
              </h2>
              <button
                onClick={() => setPast([])}
                className="flex items-center gap-1 text-xs text-muted-foreground transition hover:text-foreground"
                title="Hide past results"
              >
                <Trash2 className="h-3.5 w-3.5" /> Hide
              </button>
            </div>
            <div className="space-y-2">
              {past.slice(-5).reverse().map(a => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-2.5 text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${a.passed ? 'bg-emerald-500/15 text-emerald-500' : 'bg-red-500/15 text-red-500'}`}>
                      {a.passed ? '✓' : '✕'}
                    </span>
                    <span className="text-xs text-muted-foreground">{new Date(a.endTime).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-semibold">{a.correctAnswers}/{a.totalQuestions}</span>
                    <span className={a.passed ? 'text-emerald-500' : 'text-red-500'}>{a.passed ? 'PASS' : 'FAIL'}</span>
                    {a.mode === 'exam' ? (
                      <span className="rounded border border-border px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">Exam</span>
                    ) : (
                      <span className="rounded border border-border px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">Practice</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <button
          onClick={() => navigate('/')}
          className="mx-auto flex items-center gap-2 pb-4 text-xs text-muted-foreground transition hover:text-foreground"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Back to Training Command Center
        </button>
      </div>
    </div>
  );
}

function ModeCard({
  icon,
  title,
  desc,
  selected,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-start gap-2 rounded-xl border p-5 text-left transition ${
        selected
          ? 'border-primary bg-primary/10 ring-1 ring-primary/40'
          : 'border-border hover:border-border/80 hover:bg-muted/40'
      }`}
    >
      <span className={selected ? 'text-primary' : 'text-muted-foreground'}>{icon}</span>
      <span className="font-bold">{title}</span>
      <span className="text-xs leading-relaxed text-muted-foreground">{desc}</span>
    </button>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="h-4 w-4 accent-[hsl(0_100%_50%)]"
      />
      {label}
    </label>
  );
}
