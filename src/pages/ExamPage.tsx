import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Check, Clock, Maximize2, ShieldCheck } from 'lucide-react';
import { StrictExamEngine } from '@/components/StrictExamEngine';
import { buildExam, type ExamNumber } from '@/data/questions';

const FORMS: ExamNumber[] = [1, 2, 3, 4, 5];

export default function ExamPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<ExamNumber>(1);
  const [examData, setExamData] = useState<ReturnType<typeof buildExam> | null>(null);

  const startExam = async () => {
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Fullscreen is a browser capability, not a scoring dependency.
    }
    setExamData(buildExam(selected));
  };

  if (examData) {
    return (
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
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f5f7] text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-300 bg-slate-900 text-white dark:border-slate-700">
        <div className="mx-auto flex h-14 max-w-6xl items-center px-4 sm:px-8">
          <ShieldCheck className="mr-2 h-4 w-4 text-sky-300" />
          <span className="text-sm font-semibold">Security+ SY0-701 Exam Simulation</span>
          <button onClick={() => navigate('/')} className="ml-auto text-xs text-slate-400 hover:text-white">Exit setup</button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <section>
            <div className="mb-6">
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-300">
                Full-length maximum-load simulation
              </div>
              <h1 className="text-3xl font-semibold tracking-tight">Sit it like the real exam.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                90 items, 90 minutes, multiple-choice and performance-based work, no pause, no answer feedback, and a dedicated final review screen.
              </p>
            </div>

            <div className="mb-6 grid grid-cols-3 gap-3">
              <Stat label="Questions" value="90" sub="maximum-load form" />
              <Stat label="Time" value="90:00" sub="hard countdown" />
              <Stat label="Benchmark" value="750" sub="practice scale / 900" />
            </div>

            <div className="rounded-sm border border-slate-300 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <h2 className="mb-4 text-sm font-semibold">Select an exam form</h2>
              <div className="grid grid-cols-5 gap-2">
                {FORMS.map(form => (
                  <button
                    key={form}
                    onClick={() => setSelected(form)}
                    className={`rounded-sm border px-3 py-3 text-sm font-semibold ${
                      selected === form
                        ? 'border-sky-700 bg-sky-700 text-white'
                        : 'border-slate-300 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800'
                    }`}
                  >
                    Form {form}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                Each form is domain-weighted. PBQ count and interaction mix vary so you do not train against a fixed six-PBQ pattern.
              </p>
            </div>

            <div className="mt-6 rounded-sm border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900">
              <div className="border-b border-slate-200 px-5 py-3 text-sm font-semibold dark:border-slate-800">Exam-condition rules</div>
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {[
                  'The 90-minute timer cannot be paused and continues if the tab loses focus.',
                  'No domain, objective, difficulty, correctness, explanation, analytics, or study hints appear during the attempt.',
                  'Use Flag for Review and the Item Review screen to revisit questions before ending the exam.',
                  'Unanswered items remain incomplete and receive no practice credit.',
                  'Ending review is final. Results and explanations appear only after submission.',
                ].map(rule => (
                  <div key={rule} className="flex gap-3 px-5 py-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-sky-700 dark:text-sky-300" />
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-start gap-3 rounded-sm border border-amber-300 bg-amber-50 p-4 text-xs leading-5 text-amber-950 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                CompTIA publishes a maximum of 90 questions and a 90-minute limit, but not a fixed PBQ count or proprietary scoring formula. This simulator uses the maximum question load and a modeled practice score.
              </span>
            </div>
          </section>

          <aside>
            <div className="sticky top-6 rounded-sm border border-slate-300 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <h2 className="text-base font-semibold">Ready to begin?</h2>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Starting requests browser fullscreen when supported and immediately starts the clock.
              </p>

              <div className="my-5 space-y-3 border-y border-slate-200 py-4 text-sm dark:border-slate-800">
                <div className="flex items-center justify-between"><span className="text-slate-500">Form</span><strong>{selected}</strong></div>
                <div className="flex items-center justify-between"><span className="text-slate-500">Timer</span><strong className="font-mono">90:00</strong></div>
                <div className="flex items-center justify-between"><span className="text-slate-500">Pause</span><strong>Disabled</strong></div>
                <div className="flex items-center justify-between"><span className="text-slate-500">Feedback</span><strong>After submission</strong></div>
              </div>

              <button
                onClick={startExam}
                className="flex w-full items-center justify-center gap-2 rounded-sm bg-sky-700 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-800"
              >
                <Maximize2 className="h-4 w-4" />
                Start Exam
              </button>

              <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                <Clock className="h-3.5 w-3.5" />
                Timer starts immediately
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-sm border border-slate-300 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-1 font-mono text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-[10px] text-slate-500">{sub}</div>
    </div>
  );
}
