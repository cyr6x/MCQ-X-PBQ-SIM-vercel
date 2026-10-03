/**
 * ExamPage resume UX: an accidentally exited exam (refresh / closed tab) must
 * be discoverable and resumable — with the wall-clock timer honestly showing
 * the time that burned while away.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import ExamPage from '@/pages/ExamPage';
import { saveExamSession, loadExamSession, clearExamSession } from '@/lib/examSession';
import { mcqSingle } from '@/data/questions';

vi.mock('@/lib/cloudSync', () => ({
  fetchAttempts: vi.fn(async () => []),
  pushExamAttempt: vi.fn(),
  upsertQuestionStat: vi.fn(),
}));

function makeSession(overrides: Record<string, unknown> = {}) {
  return {
    version: 3 as const,
    examNumber: 3 as const,
    savedAt: Date.now() - 5 * 60 * 1000,
    startedAt: Date.now() - 10 * 60 * 1000,
    durationSeconds: 90 * 60,
    remainingSeconds: 80 * 60,
    phase: 'item' as const,
    idx: 0,
    flags: [],
    mcqAnswers: {},
    pbqAnswers: {},
    questions: [{ kind: 'mcq' as const, data: mcqSingle[0] }],
    ...overrides,
  };
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/exam']}>
      <ExamPage />
    </MemoryRouter>,
  );
}

describe('ExamPage resume', () => {
  beforeEach(() => {
    localStorage.clear();
    clearExamSession();
    vi.restoreAllMocks();
  });

  it('shows a resume card for an in-progress exam with the live wall clock', () => {
    saveExamSession(makeSession());
    renderPage();

    expect(screen.getByText('Form 3 in progress')).toBeInTheDocument();
    // 10 of 90 minutes burned while away — the card shows the honest number.
    expect(screen.getByText('80:00 left')).toBeInTheDocument();
    expect(screen.getByText(/clock keeps running/i)).toBeInTheDocument();
  });

  it('resumes into the saved exam', () => {
    saveExamSession(makeSession());
    renderPage();

    fireEvent.click(screen.getByText('Resume exam'));
    // Engine mounted with the restored countdown.
    expect(screen.getByText('80:00')).toBeInTheDocument();
  });

  it('discards an in-progress exam when asked', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    saveExamSession(makeSession({ examNumber: 1 as const }));
    renderPage();

    fireEvent.click(screen.getByText('Discard'));
    expect(loadExamSession()).toBeNull();
    expect(screen.queryByText('Form 1 in progress')).not.toBeInTheDocument();
  });

  it('shows no resume card when no session exists', () => {
    renderPage();
    expect(screen.queryByText(/in progress/i)).not.toBeInTheDocument();
  });

  it('auto-restores after a hard reload mid-exam', () => {
    const session = makeSession();
    saveExamSession(session);
    // A hard reload is detectable via the navigation timing entry.
    vi.spyOn(performance, 'getEntriesByType').mockReturnValue([
      { type: 'reload' } as unknown as PerformanceNavigationTiming,
    ]);

    renderPage();
    // Dropped straight back into the engine, not just the card.
    expect(screen.getByText('80:00')).toBeInTheDocument();
  });
});
