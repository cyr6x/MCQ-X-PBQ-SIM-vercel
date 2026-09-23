import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  Gauge,
  Maximize2,
  Pause,
  Settings2,
  ShieldCheck,
  Target,
  TriangleAlert,
} from 'lucide-react';
import { StrictExamEngine } from '@/components/StrictExamEngine';
import { buildExam, type ExamNumber } from '@/data/questions';
import { useSettings } from '@/lib/SettingsContext';
import { useProgressSnapshot } from '@/hooks/useProgressSnapshot';
import { MetricCard, PageHeader, Panel, StatusChip } from '@/components/product/ProductUI';

const FORMS: ExamNumber[] = [1, 2, 3, 4, 5];

export default function ExamPage() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const progress = useProgressSnapshot(settings);
  const [selected, setSelected] = useState<ExamNumber>(1);
  const [examData, setExamData] = useState<ReturnType<typeof buildExam> | null>(null);

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
    setExamData(buildExam(selected));
  };

  if (examData) {
    return (
      <div className="fixed inset-0 z-[80] overflow-auto bg-background">
        <StrictExamEngine
          pbqs={examData.pbqs}
          mcqs={examData.mcqs}
          examNumber={examData.examNumber}
          durationMinutes={90}
          onFinish={() => {
            setExamData(null);
            navigate('/');
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Full-length rehearsal"
        title="90 questions. 90 minutes. One clean signal."
        description="No explanations or objective metadata during the attempt. PBQs and MCQs are mixed through the form, with final review before submission and detailed remediation afterwards."
        icon={<ShieldCheck className="h-4 w-4" />}
        actions={
          <button
            onClick={() => navigate('/settings')}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground hover:border-primary/40 hover:text-foreground"
          >
            <Settings2 className="h-4 w-4" />
            Exam settings
          </button>
        }
      />

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Questions" value="90" note="weighted full form" icon={<Target className="h-4 w-4" />} tone="primary" />
        <MetricCard label="Timer" value="90:00" note="countdown" icon={<Clock className="h-4 w-4" />} />
        <MetricCard label="Pause" value={settings.exam_pause_enabled ? 'On' : 'Off'} note="interruption control" icon={<Pause className="h-4 w-4" />} tone={settings.exam_pause_enabled ? 'success' : 'default'} />
        <MetricCard label="Fullscreen" value={settings.exam_auto_fullscreen ? 'Auto' : 'Manual'} note="focus preference" icon={<Maximize2 className="h-4 w-4" />} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel
          title="Choose a form"
          eyebrow="Exam set"
          description="All five forms preserve the target domain mix. Different forms reduce memorization while keeping the same training standard."
        >
          <div className="grid grid-cols-5 gap-2">
            {FORMS.map((form) => (
              <button
                key={form}
                onClick={() => setSelected(form)}
                className={`rounded-xl border px-3 py-4 text-center transition-colors ${
                  selected === form
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background/50 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                }`}
              >
                <div className="text-[9px] font-bold uppercase tracking-wider opacity-70">Form</div>
                <div className="mt-1 font-mono text-xl font-semibold">{form}</div>
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
          <Panel title={`Form ${selected}`} eyebrow="Launch">
            <div className="space-y-3 text-xs">
              <ExamSetting label="Pause" value={settings.exam_pause_enabled ? 'Available' : 'Disabled'} />
              <ExamSetting label="Fullscreen" value={settings.exam_auto_fullscreen ? 'Auto-start' : 'Manual'} />
              <ExamSetting label="Focus notice" value={settings.exam_focus_notice ? 'Enabled' : 'Disabled'} />
              <ExamSetting label="Warnings" value={`${Math.round(settings.amber_threshold_seconds / 60)}m / ${Math.round(settings.red_threshold_seconds / 60)}m`} />
            </div>

            <button
              onClick={startExam}
              className="mt-5 w-full rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground hover:opacity-90"
            >
              Start Form {selected}
            </button>
            <p className="mt-2 text-center text-[10px] leading-4 text-muted-foreground">
              {settings.exam_pause_enabled
                ? 'Pause is for genuine interruptions; otherwise keep the clock honest.'
                : 'Pause is disabled. The timer will run continuously.'}
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
                <span>You still have {progress.unresolved.length} unresolved misses. The form will still launch, but remediation first may give you a cleaner readiness signal.</span>
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
