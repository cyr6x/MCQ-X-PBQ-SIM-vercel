import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ShieldCheck, Terminal, Target, Zap } from 'lucide-react';
import { PageHeader, Panel, MetricCard } from '@/components/product/ProductUI';

export default function LandingPage() {
  const navigate = useNavigate();

  const startTraining = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">SecPlus Trainer</span>
          </div>
          <Link
            to="/dashboard"
            className="hidden sm:inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <ArrowRight className="h-4 w-4" />
            Start Training
          </Link>
        </div>
      </header>

       <main>
         <section className="mx-auto max-w-7xl px-4 py-4 sm:py-6 lg:py-10 sm:px-6 lg:px-8">
           <div className="text-center max-w-3xl mx-auto">
             <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4 sm:mb-6">
               <Shield className="h-4 w-4" />
               Security+ SY0-701 Trainer
             </div>

             <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-[1.1] mb-4 sm:mb-6">
               Practical Security+ Preparation
             </h1>

             <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto mb-4 sm:mb-6 leading-relaxed">
               Realistic MCQ and PBQ practice for the SY0-701 exam. Focus on what matters most.
               No fluff. No pressure. Just effective training.
             </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <button
                onClick={startTraining}
                className="w-full sm:w-auto inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <ArrowRight className="h-5 w-5" />
                Start Training Free
              </button>
              <Link
                to="https://github.com/cyr6x/MCQ-X-PBQ-SIM-vercel"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-8 py-4 text-lg font-semibold hover:bg-muted/50 transition-all"
              >
                <Terminal className="h-5 w-5" />
                View Source
              </Link>
            </div>

             <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-success" />
                No account required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-success" />
                Works offline
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-success" />
                Data stays local
              </span>
            </div>
          </div>
        </section>

         <section className="border-t border-border bg-muted/30">
           <div className="mx-auto max-w-7xl px-4 py-6 sm:py-10 lg:py-16 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">Train Like You'll Test</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">Every mode mirrors the real exam experience — so nothing surprises you on test day.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  icon: Target,
                  title: 'Full Exam Simulation',
                  desc: '90 questions. 90 minutes. 5 forms. Mixed PBQs. Hidden metadata until submission.',
                },
                {
                  icon: ShieldCheck,
                  title: 'Smart Study Modes',
                  desc: 'Tutor, Sprint, Weakest Domain, Needs Review, Mixed Drill, PBQ Lab — 6 ways to train.',
                },
                {
                  icon: Zap,
                  title: 'Interactive PBQs',
                  desc: '8 task families: Firewall, Ordering, Log Analysis, Matching, Placement, Terminal, Packet, Topology.',
                },
                {
                  icon: Terminal,
                  title: 'Actionable Analytics',
                  desc: 'Domain heatmaps. Objective-level breakdown. Readiness scoring. Weak spot detection.',
                },
              ].map((item, i) => (
                <Panel key={i} className="bg-card/50 border-border/50 hover:border-primary/30 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 rounded-xl bg-primary/10 p-3 text-primary">
                      <item.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                </Panel>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">Built for Focus</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Design decisions that respect your time and attention.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                title: 'Local-First',
                desc: 'All data lives in your browser. Supabase is optional backup — not a dependency. Works on a plane.',
                icon: ShieldCheck,
              },
              {
                title: 'Exam-Accurate',
                desc: 'PBQs distributed across the form. No front-loading. Partial credit on performance tasks. Real timer behavior.',
                icon: Target,
              },
              {
                title: 'Respectful UX',
                desc: 'Pause when life interrupts. Resume exactly where you left off. No dark patterns. No notifications.',
                icon: Zap,
              },
            ].map((item, i) => (
              <Panel key={i} className="bg-card/50 border-border/50 text-center p-6">
                <div className="rounded-xl bg-primary/10 p-3 w-fit mx-auto mb-4 text-primary">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </Panel>
            ))}
          </div>
        </section>

        <section className="border-t border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">Ready When You Are</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">No signup. No credit card. Just open and start training.</p>
            <button
              onClick={startTraining}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <ArrowRight className="h-5 w-5" />
              Open Trainer
            </button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-background px-4 py-8">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>Built for Security+ candidates who want a better way to practice.</p>
          <div className="flex items-center gap-4">
            <Link
              to="https://github.com/cyr6x/MCQ-X-PBQ-SIM-vercel"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              <Terminal className="h-4 w-4" />
              Source on GitHub
            </Link>
            <span className="hidden sm:inline">·</span>
            <span>v0.1.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}