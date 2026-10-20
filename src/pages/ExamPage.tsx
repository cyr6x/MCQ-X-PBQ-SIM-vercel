import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  Gauge,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';
import {
  StrictExamEngine,
  loadExamSnapshot,
  clearExamSnapshot,
  type StrictExamSnapshot,
} from '@/components/StrictExamEngine';
import { buildExam, EXAM_SETS, type ExamNumber } from '@/data/questions';
import { useSettings } from '@/lib/SettingsContext';
import { useProgressSnapshot } from '@/hooks/useProgressSnapshot';
import { PageHeader, Panel, StatusChip } from '@/components/product/ProductUI';

function formatClock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const LAST_EXAM_KEY = 'secplus-last-exam';

function loadLastExamNumber(): ExamNumber {
  try {
    const value = Number(window.localStorage.getItem(LAST_EXAM_KEY));
    return EXAM_SETS.some((set) => set.number === value) ? (value as ExamNumber) : 1;
  } catch {
    return 1;
  }
}

export default function ExamPage() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const progress = useProgressSnapshot(settings);
  const [selected, setSelected] = useState<ExamNumber>(() => loadLastExamNumber());
  const [examData, setExamData] = useState<ReturnType<typeof buildExam> | null>(null);
  const [resume, setResume] = useState<StrictExamSnapshot | null>(() => loadExamSnapshot());
  const [activeResume, setActiveResume] = useState<StrictExamSnapshot | null>(null);

  const startExam = async () => {
    if (settings.exam_auto_fullscreen) {
      try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch {
        // Fullscreen is optional training ergonomics, never a scoring dependency.
      }
    }
    clearExamSnapshot();
    setResume(null);
    setActiveResume(null);
    setExamData(buildExam(selected));
  };

  const resumeExam = async () => {
    if (!resume) return;
    if (settings.exam_auto_fullscreen) {
      try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch {
        // Fullscreen is optional training ergonomics, never a scoring dependency.
      }
    }
    setActiveResume(resume);
    setExamData(buildExam(resume.examNumber));
  };

  if (examData) {
    return (
      <div className="fixed inset-0 z-[80] overflow-auto bg-background">
        <StrictExamEngine
          pbqs={examData.pbqs}
          mcqs={examData.mcqs}
          examNumber={examData.examNumber}
          durationMinutes={90}
          resumeState={activeResume}
          onFinish={() => {
            setExamData(null);
            navigate('/');
          }}
          onExit={() => {
            if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
            setExamData(null);
            navigate('/');
          }}
        />
      </div>
    );
  }

  const selectedDef = EXAM_SETS.find((set) => set.number === selected) ?? EXAM_SETS[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Full-length rehearsal"
        title="90 questions. 90 minutes. One clean signal."
        description="No explanations or objective metadata during the attempt. PBQs and MCQs are mixed through the exam, with final review before submission and detailed remediation afterwards."
        icon={<ShieldCheck className="h-4 w-4" />}
      />

      {resume && (
        <Panel
          title={`Exam ${resume.examNumber} in progress`}
          eyebrow="Resume"
          description="Your answers, flags and timer were saved when you left. Resuming restores the exact remaining time."
        >
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/25 px-3 py-2 font-mono text-sm font-bold">
              <Clock className="h-4 w-4 text-primary" />
              {formatClock(resume.remaining)} left
            </div>
            <button
              onClick={resumeExam}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90"
            >
              Resume Exam {resume.examNumber}
            </button>
            <button
              onClick={() => {
                clearExamSnapshot();
                setResume(null);
              }}
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Discard
            </button>
          </div>
        </Panel>
      )}

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel
          title="Choose an exam"
          eyebrow="Exam set"
          description="Exams 1–6 preserve the official domain mix. Exams 7–11 each weigh one domain heavily while keeping the rest present, so a weak area can be trained under full exam conditions."
        >
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {EXAM_SETS.map((set) => (
              <button
                key={set.number}
                onClick={() => {
                  setSelected(set.number);
                  try {
                    window.localStorage.setItem(LAST_EXAM_KEY, String(set.number));
                  } catch {
                    // Persistence is a convenience; exam selection still works without it.
                  }
                }}
                className={`rounded-xl border px-3 py-4 text-center transition-colors ${
                  selected === set.number
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background/50 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                }`}
              >
                <div className="text-[9px] font-bold uppercase tracking-wider opacity-70">
                  {set.kind === 'balanced' ? 'Exam' : 'Focus'}
                </div>
                <div className="mt-1 font-mono text-xl font-semibold">{set.number}</div>
                <div className="mt-0.5 text-[9px] font-medium opacity-80">{set.blurb}</div>
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {[
              ['Metadata hidden', 'Domain, objective and difficulty stay hidden until results.'],
              ['Mixed delivery', 'PBQs are distributed across early, middle and late exam positions.'],
              ['Review before submit', 'Review all, incomplete and flagged items before ending.'],
              ['Practice scoring only', 'The result is a training model, not CompTIA’s proprietary scoring formula.'],
            ].map(([title, body]) => (
              <div key={title} className="rounded-xl border border-border bg-muted/20 p-3">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  {title}
                </div>
                <p className="mt-1.5 text-[11px] leading-5 text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title={`Exam ${selectedDef.number}`} eyebrow={selectedDef.kind === 'focus' ? `Focus: domain ${selectedDef.focus?.slice(1)}` : 'Launch'}>
            <div className="space-y-3 text-xs">
              <ExamSetting label="Pause" value="Available / resumes anytime" />
              <ExamSetting label="Fullscreen" value={settings.exam_auto_fullscreen ? 'Auto-start' : 'Manual'} />
              <ExamSetting label="Focus notice" value={settings.exam_focus_notice ? 'Enabled' : 'Disabled'} />
              <ExamSetting label="Warnings" value={`${Math.round(settings.amber_threshold_seconds / 60)}m / ${Math.round(settings.red_threshold_seconds / 60)}m`} />
            </div>

            <button
              onClick={startExam}
              className="mt-5 w-full rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground hover:opacity-90"
            >
              Start Exam {selectedDef.number}
            </button>
            <p className="mt-2 text-center text-[10px] leading-4 text-muted-foreground">
              Pause keeps the clock frozen for genuine interruptions; you can also leave and resume later.
            </p>
          </Panel>

          <Panel title="Readiness context" eyebrow="Before you start">
            <div className="grid grid-cols-2 gap-2">
              <MiniMetric label="Readiness" value={progress.readiness ? `${progress.readiness.overall}/100` : '—'} />
              <MiniMetric label="Full exam avg" value={progress.fullExamAverage === null ? '—' : `${progress.fullExamAverage}%`} />
              <MiniMetric label="Unresolved" value={String(progress.unresolved.length)} />
              <MiniMetric label="PBQ reps" value={String(progress.pbqReps)} />
            </div>
            {progress.unresolved.length >= 5 && (
              <div className="mt-3 flex gap-2 rounded-xl border border-warning/30 bg-warning/10 p-3 text-[11px] leading-5 text-warning">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>You still have {progress.unresolved.length} unresolved misses. The exam will still launch, but remediation first may give you a cleaner readiness signal.</span>
              </div>
            )}
            {progress.readiness?.readyForExam && (
              <StatusChip tone="success"><Gauge className="h-3.5 w-3.5" />Readiness gate currently met</StatusChip>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

function ExamSetting({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/25 px-3 py-2.5">
      <span className="text-muted-foreground">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/25 p-3">
      <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-lg font-semibold">{value}</div>
    </div>
  );
}
