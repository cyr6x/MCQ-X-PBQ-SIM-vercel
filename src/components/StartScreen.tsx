import { Shield, BookOpen, Layers, ListChecks, Zap, Target, ArrowRight, HelpCircle, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StartScreenProps {
  onStartExam: (examNumber?: 1 | 2 | 3 | 4 | 5) => void;
  onStartStudy: (domain?: string) => void;
  onOpenReview: () => void;
  onOpenReadiness: () => void;
  onPracticeFailed: () => void;
  onOpenPBQPractice: () => void;
}

export function StartScreen({
  onStartExam,
  onStartStudy,
  onOpenReview,
  onOpenReadiness,
  onPracticeFailed,
  onOpenPBQPractice,
}: StartScreenProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Hero Section */}
        <section className="mb-16 text-center">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-8">
            <Shield className="h-4 w-4" />
            <span>SY0-701 Security+ Exam Simulator</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
            Practical Security+ Preparation
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Master the SY0-701 exam with realistic practice tests, interactive PBQ labs, 
            and adaptive study tools. Built for the way security professionals actually learn.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              onClick={() => onStartExam(1)}
              className="w-full sm:w-auto gap-2"
            >
              <Target className="h-5 w-5" />
              Start Practice Exam
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={onStartStudy}
              className="w-full sm:w-auto gap-2"
            >
              <BookOpen className="h-5 w-5" />
              Start Study Session
            </Button>
          </div>
        </section>

        {/* Feature Cards */}
        <section className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4">
                  <Shield className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">Full Exam Simulation</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  90 questions, 90 minutes, scaled scoring. PBQs distributed throughout the exam 
                  just like the real Security+ test.
                </p>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => onStartExam(1)} 
                  className="w-full"
                >
                  Start Exam <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 text-accent mb-4">
                  <BookOpen className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">Adaptive Study Mode</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Filter by domain, get instant feedback with explanations, and focus on weak areas. 
                  Retest missed questions until mastered.
                </p>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  onClick={onStartStudy} 
                  className="w-full"
                >
                  Start Studying <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-warning/10 text-warning mb-4">
                  <Layers className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">PBQ Lab</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Hands-on practice with all 8 PBQ types: firewall ACLs, log analysis, 
                  drag-and-drop sequencing, matching, and more.
                </p>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="secondary" 
                  onClick={onOpenPBQPractice} 
                  className="w-full"
                >
                  Open PBQ Lab <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Secondary Actions */}
        <section className="mb-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border/50 hover:border-primary/50 transition-colors cursor-pointer" 
                  onClick={onOpenReview}>
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 text-primary mb-4 mx-auto">
                  <ListChecks className="h-7 w-7" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Review & Remediation</h3>
                <p className="text-sm text-muted-foreground">
                  Review every attempt, retest missed questions, and track unresolved misses
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:border-primary/50 transition-colors cursor-pointer" 
                  onClick={onOpenReadiness}>
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-accent/10 text-accent mb-4 mx-auto">
                  <Zap className="h-7 w-7" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Readiness Dashboard</h3>
                <p className="text-sm text-muted-foreground">
                  Track your progress, domain accuracy, study streak, and exam readiness score
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:border-warning/50 transition-colors cursor-pointer" 
                  onClick={onPracticeFailed}>
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-warning/10 text-warning mb-4 mx-auto">
                  <AlertCircle className="h-7 w-7" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Practice Failed Questions</h3>
                <p className="text-sm text-muted-foreground">
                  Drill only the questions you've missed before to close knowledge gaps
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:border-success/50 transition-colors cursor-pointer" 
                  onClick={() => onStartStudy('D1')}>
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-success/10 text-success mb-4 mx-auto">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Quick Start: Domain 1</h3>
                <p className="text-sm text-muted-foreground">
                  Jump straight into General Security Concepts practice
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Exam Info */}
        <section className="mb-12">
          <div className="rounded-2xl border border-border/50 bg-card p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <HelpCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Exam Format</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    90 questions • 90 minutes • Mixed MCQ & PBQ • Scaled score 100-900
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  <Target className="h-3 w-3" /> 5 Exam Forms
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-accent/10 text-accent">
                  <Layers className="h-3 w-3" /> 8 PBQ Types
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-success/10 text-success">
                  <Zap className="h-3 w-3" /> Instant Feedback
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-sm text-muted-foreground border-t border-border pt-8">
          <p className="mb-2">
            Built for <strong className="text-foreground">CompTIA Security+ SY0-701</strong> preparation
          </p>
          <p>
            This simulator uses practice scoring and is not affiliated with CompTIA.
            All questions are original training material.
          </p>
        </footer>
      </div>
    </div>
  );
}