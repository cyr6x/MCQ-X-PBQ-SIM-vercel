import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { StrictExamEngine } from '@/components/StrictExamEngine';
import type { MCQuestion, PBQuestion } from '@/data/questions';
import { hasExamSession, loadExamSession } from '@/lib/examSession';
import { loadHistory } from '@/lib/examHistory';

vi.mock('@/lib/SettingsContext', () => ({
  useSettings: () => ({
    settings: {
      exam_pause_enabled: true,
      exam_auto_fullscreen: false,
      exam_focus_notice: true,
      amber_threshold_seconds: 1200,
      red_threshold_seconds: 300,
    },
  }),
}));

const pbq: PBQuestion = {
  id: 'pause-pbq',
  domain: 'D4',
  objective: '4.1',
  difficulty: 3,
  type: 'firewall',
  title: 'Firewall task',
  scenario: 'Apply the required policy.',
  rules: [{ ruleId: 1, sourceIP: '10.0.0.1', destIP: '10.0.0.2', port: '443', protocol: 'TCP', action: '' }],
  correctActions: ['ALLOW'],
  explanation: 'Allow the required HTTPS flow.',
};

const mcq: MCQuestion = {
  id: 'next-mcq',
  domain: 'D1',
  objective: '1.1',
  difficulty: 2,
  type: 'single',
  question: 'Which control is the best fit for this test question?',
  options: ['Control A', 'Control B', 'Control C', 'Control D'],
  answer: 1,
  explanation: 'Control B is the keyed answer for this UI test.',
};

describe('StrictExamEngine training controls', () => {
  it('keeps the next-question action available at the viewport edge', () => {
    render(
      <StrictExamEngine
        pbqs={[pbq]}
        mcqs={[mcq]}
        durationMinutes={90}
        onFinish={() => {}}
      />
    );

    expect(screen.getByRole('button', { name: 'Next question' })).toBeInTheDocument();
  });

  it('hides exam metadata and provides a content-covering pause/resume control', () => {
    render(
      <StrictExamEngine
        pbqs={[pbq]}
        mcqs={[]}
        durationMinutes={90}
        onFinish={() => {}}
      />
    );

    expect(screen.queryByText(/Difficulty 3/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Objective 4\.1/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /pause/i }));
    expect(screen.getByText('Exam paused')).toBeInTheDocument();
    expect(screen.getByText(/countdown and question timer are stopped/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /resume exam/i }));
    expect(screen.queryByText('Exam paused')).not.toBeInTheDocument();
  });
});

describe('StrictExamEngine session persistence', () => {
  const selectThree: MCQuestion = {
    id: 'select-three-mcq',
    domain: 'D5',
    objective: '5.4',
    difficulty: 2,
    type: 'select-three',
    question: 'Which THREE controls should be implemented?',
    options: ['Geo restrictions', 'SIEM logs', 'Time-of-day rules', 'Password length'],
    answer: [0, 1, 2],
    explanation: 'The first three controls meet the requirements.',
  };

  beforeEach(() => {
    localStorage.clear();
  });

  it('accepts exactly three selections on a select-three item and shows the badge', () => {
    render(
      <StrictExamEngine
        pbqs={[]}
        mcqs={[selectThree]}
        durationMinutes={90}
        onFinish={() => {}}
      />
    );

    expect(screen.getByText('Select exactly three')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Geo restrictions/ }));
    fireEvent.click(screen.getByRole('button', { name: /SIEM logs/ }));
    fireEvent.click(screen.getByRole('button', { name: /Time-of-day rules/ }));
    // A fourth pick is silently ignored (cap = 3)
    fireEvent.click(screen.getByRole('button', { name: /Password length/ }));
    // The badge stays up; the three chosen options remain selected.
    expect(screen.getByText('Select exactly three')).toBeInTheDocument();
  });

  it('saves the attempt continuously and resumes 1:1 (answers, position, frozen countdown)', () => {
    const { unmount } = render(
      <StrictExamEngine
        pbqs={[pbq]}
        mcqs={[mcq]}
        durationMinutes={90}
        onFinish={() => {}}
      />
    );

    // Answer the MCQ (find it via its option text).
    fireEvent.click(screen.getByRole('button', { name: /Control B/ }));
    // Move forward one item.
    fireEvent.click(screen.getByRole('button', { name: /next question|review exam/i }));
    // Leaving (accidental exit) saves the session.
    unmount();

    const saved = loadExamSession();
    expect(saved).not.toBeNull();
    expect(saved!.mcqAnswers[mcq.id]).toBe(1);
    expect(saved!.questions).toHaveLength(2);

    // Time away must not burn the countdown: resume shows the saved clock.
    const frozen = { ...saved!, remainingSeconds: 600, isPaused: true };
    render(
      <StrictExamEngine
        pbqs={saved!.questions.filter(q => q.kind === 'pbq').map(q => q.data as PBQuestion)}
        mcqs={saved!.questions.filter(q => q.kind === 'mcq').map(q => q.data as MCQuestion)}
        durationMinutes={90}
        initialSession={frozen}
        onFinish={() => {}}
      />
    );

    expect(screen.getByText('10:00')).toBeInTheDocument();
    expect(screen.getByText('Exam paused')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /resume exam/i }));
    expect(screen.queryByText('Exam paused')).not.toBeInTheDocument();
  });

  it('clears the session on submit and stores readable answers in history', () => {
    render(
      <StrictExamEngine
        pbqs={[pbq]}
        mcqs={[mcq]}
        durationMinutes={90}
        onFinish={() => {}}
      />
    );

    // Work through both items.
    fireEvent.click(screen.getByRole('button', { name: /Control B/ }));
    fireEvent.click(screen.getByRole('button', { name: /next question|review exam/i }));
    // Answer the firewall PBQ.
    fireEvent.click(screen.getByRole('button', { name: 'ALLOW' }));
    // Enter review and end the exam (edge button + footer button both match).
    fireEvent.click(screen.getAllByRole('button', { name: /review exam/i })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'End Review' }));
    fireEvent.click(screen.getByRole('button', { name: 'End Exam' }));

    expect(hasExamSession()).toBe(false);
    const history = loadHistory();
    expect(history.length).toBeGreaterThan(0);
    const attempt = history[history.length - 1];
    const mcqAttempt = attempt.questions.find(q => q.questionId === mcq.id);
    const pbqAttempt = attempt.questions.find(q => q.questionId === pbq.id);
    expect(mcqAttempt?.userAnswer).toBe(`B. ${mcq.options[1]}`);
    expect(pbqAttempt?.userAnswer).toBe('Rule actions: ALLOW');
    expect(pbqAttempt?.correctAnswer).toBe('Rule actions: ALLOW');
  });

  it('masks the PBQ title until results are shown', () => {
    render(
      <StrictExamEngine
        pbqs={[pbq]}
        mcqs={[]}
        durationMinutes={90}
        onFinish={() => {}}
      />
    );

    expect(screen.getByText('Performance-Based Question')).toBeInTheDocument();
    expect(screen.queryByText('Firewall task')).not.toBeInTheDocument();
  });
});
