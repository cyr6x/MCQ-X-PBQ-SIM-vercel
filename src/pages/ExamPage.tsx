import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Clock, Maximize2, Pause, Settings2, ShieldCheck, Target } from 'lucide-react';
import { StrictExamEngine } from '@/components/StrictExamEngine';
import { buildExam, type ExamNumber } from '@/data/questions';
import { useSettings } from '@/lib/SettingsContext';

const FORMS: ExamNumber[] = [1, 2, 3, 4, 5];

export default function ExamPage() {
  const navigate = useNavigate();
  const { settings } = useSettings();
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
    <div className="container mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">
            <ShieldCheck className="h-4 w-4" />
            Full exam simulation
          </div>
          <h1 className="text-2xl font-bold">Security+ SY0-701 Mock Exam</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            90 questions in 90 minutes with randomized MCQs and PBQs, no answer feedback during the attempt, flag/review controls, and detailed remediation after submission.
          </p>
        </div>
        <button
          onClick={() => navigate('/settings')}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Settings2 className="h-4 w-4" />
          Training settings
        </button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric icon={<Target className="h-4 w-4" />} label="Questions" value="90" note="full form" />
        <Metric icon={<Clock className="h-4 w-4" />} label="Time" value="90:00" note="countdown" />
        <Metric icon={<Pause className="h-4 w-4" />} label="Pause" value={settings.exam_pause_enabled ? 'On' : 'Off'} note="interruption control" />
        <Metric icon={<Maximize2 className="h-4 w-4" />} label="Fullscreen" value={settings.exam_auto_fullscreen ? 'Auto' : 'Manual'} note="your preference" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Choose a form</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            All forms follow the same domain weighting. PBQs are distributed across the exam rather than taught as a fixed block.
          </p>
          <div className="mt-4 grid grid-cols-5 gap-2">
            {FORMS.map(form => (
              <button
                key={form}
                onClick={() => setSelected(form)}
                className={`rounded-lg border px-3 py-3 text-sm font-semibold transition-all ${
                  selected === form
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background/40 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                }`}
              >
                {form}
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-2">
            {[
              'Domain, objective and difficulty metadata stay hidden until results.',
              'PBQs and MCQs are mixed through the form to avoid training a fixed placement pattern.',
              settings.exam_pause_enabled
                ? 'Pause covers the active question and stops both timers until you resume.'
                : 'Pause is disabled in Settings; the clock runs continuously.',
              'Your final review supports all, incomplete and flagged questions before submission.',
            ].map(item => (
              <div key={item} className="flex gap-3 rounded-lg bg-muted/25 px-3 py-2.5 text-xs leading-5 text-muted-foreground">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <aside className="rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-16 lg:self-start">
          <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Ready</div>
          <div className="mt-1 text-xl font-bold">Form {selected}</div>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Treat this as your exam rehearsal. Use pause only for genuine interruptions; otherwise keep the clock honest.
          </p>

          <div className="my-5 space-y-2 border-y border-border py-4 text-xs">
            <Row label="Pause" value={settings.exam_pause_enabled ? 'Available' : 'Disabled'} />
            <Row label="Fullscreen" value={settings.exam_auto_fullscreen ? 'Auto-start' : 'Off'} />
            <Row label="Focus notice" value={settings.exam_focus_notice ? 'On' : 'Off'} />
            <Row label="Timer warning" value={`${Math.round(settings.amber_threshold_seconds / 60)}m / ${Math.round(settings.red_threshold_seconds / 60)}m`} />
          </div>

          <button
            onClick={startExam}
            className="w-full rounded-lg bg-primary px-5 py-3 text-sm font-bold text-primary-foreground hover:opacity-90"
          >
            Start Exam
          </button>
        </aside>
      </div>
    </div>
  );
}

function Metric({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {icon}{label}
      </div>
      <div className="mt-2 font-mono text-xl font-bold">{value}</div>
      <div className="mt-1 text-[10px] text-muted-foreground">{note}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
