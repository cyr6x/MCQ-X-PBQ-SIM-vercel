import { useState, useEffect } from 'react';
import { StartScreen } from '@/components/StartScreen';
import { NewExamEngine } from '@/components/NewExamEngine';
import { ReviewMode } from '@/components/ReviewMode';
import { ReadinessDashboard } from '@/components/ReadinessDashboard';
import { PBQPractice } from '@/components/PBQPractice';
import { buildExam, buildStudyQuestions, mcqSingle, mcqSelectTwo, shuffleOptions, type Domain, type ExamNumber, type MCQuestion } from '@/data/questions';
import { loadQuestionStats, saveAttempt, type ExamAttempt } from '@/lib/examHistory';

const EXAM_STATE_KEY = 'secplus-in-progress-exam';

type AppView = 'start' | 'exam' | 'study' | 'review' | 'readiness' | 'pbq-practice';

const Index = () => {
  const [view, setView] = useState<AppView>('start');
  const [examData, setExamData] = useState<ReturnType<typeof buildExam> | null>(null);
  const [studyQuestions, setStudyQuestions] = useState<MCQuestion[]>([]);
  const [resumePrompt, setResumePrompt] = useState<{
    examData: ReturnType<typeof buildExam>;
    timestamp: number;
  } | null>(null);

  // Load any in-progress exam from localStorage on startup
  useEffect(() => {
    try {
      const saved = localStorage.getItem(EXAM_STATE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate it's a proper exam state
        if (parsed && parsed.examData && parsed.timestamp) {
          setResumePrompt({
            examData: parsed.examData,
            timestamp: parsed.timestamp
          });
        }
      }
    } catch (e) {
      console.warn('Failed to load in-progress exam:', e);
      // Clear invalid data
      localStorage.removeItem(EXAM_STATE_KEY);
    }
  }, []);

  const handleStartExam = (examNumber: ExamNumber = 1) => {
    // Starting a new exam invalidates any saved in-progress state
    localStorage.removeItem(EXAM_STATE_KEY);
    const exam = buildExam(examNumber);
    setExamData(exam);
    setView('exam');
  };

  const handleStartStudy = (domain?: Domain) => {
    setStudyQuestions(buildStudyQuestions(domain));
    setView('study');
  };

  const handlePracticeFailed = () => {
    const stats = loadQuestionStats();
    const failedIds = new Set(
      Object.values(stats)
        .filter(s => s.type === 'mcq' && s.timesFailed > 0)
        .map(s => s.questionId)
    );
    const all = [...mcqSingle, ...mcqSelectTwo];
    const failedQs = all.filter(q => failedIds.has(q.id)).map(shuffleOptions);
    if (failedQs.length === 0) return;
    setStudyQuestions(failedQs.sort(() => Math.random() - 0.5));
    setView('study');
  };

  const handleResumeExam = () => {
    if (resumePrompt) {
      setExamData(resumePrompt.examData);
      setView('exam');
      setResumePrompt(null);
      // Keep EXAM_STATE_KEY intact - NewExamEngine reads it on mount to restore answers/timer
    }
  };

  const handleStartFreshExam = () => {
    setResumePrompt(null);
    localStorage.removeItem(EXAM_STATE_KEY);
    setView('start'); // Go back to start screen to choose exam
  };

  if (view === 'exam' && examData) {
    return (
      <NewExamEngine
        pbqs={examData.pbqs}
        mcqs={examData.mcqs}
        examNumber={examData.examNumber}
        durationMinutes={90}
        onFinish={() => {
          setExamData(null);
          setView('start');
          // Clear in-progress exam when completed
          localStorage.removeItem(EXAM_STATE_KEY);
        }}
        // We'd need to pass a callback to save state periodically, but for now
        // we'll rely on the unload handler in NewExamEngine
      />
    );
  }

  if (view === 'study') {
    return (
      <NewExamEngine
        pbqs={[]}
        mcqs={studyQuestions}
        durationMinutes={0}
        isStudyMode
        onFinish={() => setView('start')}
      />
    );
  }

  if (view === 'review') {
    return <ReviewMode onBack={() => setView('start')} onPracticeFailed={handlePracticeFailed} />;
  }

  if (view === 'readiness') {
    return <ReadinessDashboard onBack={() => setView('start')} />;
  }

  if (view === 'pbq-practice') {
    return <PBQPractice onFinish={() => setView('start')} />;
  }

  // Show resume prompt if there's an in-progress exam
  if (resumePrompt && view === 'start') {
    const examDate = new Date(resumePrompt.timestamp).toLocaleString();
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-card rounded-xl p-8 max-w-md w-full mx-4">
          <h2 className="text-xl font-bold mb-4">Resume Exam?</h2>
          <p className="mb-4">
            You have an in-progress exam from <strong>{examDate}</strong>. Would you like to resume it or start a new exam?
          </p>
          <div className="flex gap-3">
            <button onClick={handleResumeExam}
                    className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:opacity-90">
              Resume Exam
            </button>
            <button onClick={handleStartFreshExam}
                    className="px-6 py-3 rounded-lg border border-border text-foreground font-medium text-sm hover:bg-muted">
              Start New Exam
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <StartScreen
      onStartExam={handleStartExam}
      onStartStudy={handleStartStudy}
      onOpenReview={() => setView('review')}
      onOpenReadiness={() => setView('readiness')}
      onPracticeFailed={handlePracticeFailed}
      onOpenPBQPractice={() => setView('pbq-practice')}
    />
  );
};

export default Index;
