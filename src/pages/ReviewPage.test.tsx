import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import ReviewPage from '@/pages/ReviewPage';
import { mcqSingle, pbqBank, DOMAIN_LABELS } from '@/data/questions';

describe('failed-question review workflow', () => {
  beforeEach(() => {
    localStorage.clear();

    const mcq = mcqSingle[0];
    const pbq = pbqBank[0];
    localStorage.setItem('secplus-question-stats', JSON.stringify({
      [mcq.id]: {
        questionId: mcq.id,
        questionText: mcq.question,
        domain: DOMAIN_LABELS[mcq.domain],
        type: 'mcq',
        timesAttempted: 2,
        timesCorrect: 1,
        timesFailed: 1,
        avgTimeSeconds: 55,
        lastAttempt: Date.now(),
        streak: -1,
        explanation: mcq.explanation,
        userAnswer: '0',
        correctAnswer: JSON.stringify(mcq.answer),
      },
      [pbq.id]: {
        questionId: pbq.id,
        questionText: pbq.title,
        domain: DOMAIN_LABELS[pbq.domain],
        type: 'pbq',
        timesAttempted: 1,
        timesCorrect: 0,
        timesFailed: 1,
        avgTimeSeconds: 140,
        lastAttempt: Date.now(),
        streak: -1,
        explanation: pbq.explanation,
        userAnswer: '{}',
        correctAnswer: '',
      },
    }));
  });

  it('shows unresolved MCQ and PBQ failures and launches a mixed retry session', () => {
    render(
      <MemoryRouter>
        <ReviewPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Turn misses into closed loops.')).toBeInTheDocument();
    expect(screen.getByText('Needs Review (2)')).toBeInTheDocument();
    expect(screen.getByText(/PBQs missed/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /retry needs review/i }));
    expect(screen.getByTitle('Question navigator')).toBeInTheDocument();
  });
});
