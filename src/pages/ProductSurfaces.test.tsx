import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardPage from '@/pages/DashboardPage';
import StudyPage from '@/pages/StudyPage';
import PBQPage from '@/pages/PBQPage';
import ExamPage from '@/pages/ExamPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import SettingsPage from '@/pages/SettingsPage';

vi.mock('@/lib/cloudSync', () => ({
  fetchAttempts: vi.fn(async () => []),
  pushExamAttempt: vi.fn(),
  upsertQuestionStat: vi.fn(),
}));

function renderPage(node: React.ReactNode, entry = '/') {
  return render(<MemoryRouter initialEntries={[entry]}>{node}</MemoryRouter>);
}

describe('live product surfaces', () => {
  beforeEach(() => localStorage.clear());

  it('renders the training command center without stale no-pause copy', async () => {
    renderPage(<DashboardPage />);
    expect(screen.getByText('Train the weak points. Prove the result.')).toBeInTheDocument();
    expect(screen.getByText('Training goals')).toBeInTheDocument();
    expect(screen.queryByText(/no pause/i)).not.toBeInTheDocument();
  });

  it('renders adaptive Study with the mixed-format drill', () => {
    renderPage(<StudyPage />, '/study');
    expect(screen.getByText('Study with a purpose.')).toBeInTheDocument();
    expect(screen.getByText('Mixed Exam Drill')).toBeInTheDocument();
  });

  it('renders PBQ Lab with configurable set launch', () => {
    renderPage(<PBQPage />, '/pbq');
    expect(screen.getByText('PBQ Lab')).toBeInTheDocument();
    expect(screen.getByText('Next PBQ set')).toBeInTheDocument();
  });

  it('renders full exam setup with interruption controls', () => {
    renderPage(<ExamPage />, '/exam');
    expect(screen.getByText('90 questions. 90 minutes. One clean signal.')).toBeInTheDocument();
    expect(screen.queryByText(/Exam ergonomics/i)).not.toBeInTheDocument();
    expect(screen.getAllByText('Pause').length).toBeGreaterThan(0);
  });

  it('renders analytics and its readiness breakdown surface', () => {
    renderPage(<AnalyticsPage />, '/analytics');
    expect(screen.getByText('See what transfers under pressure.')).toBeInTheDocument();
    expect(screen.getByText('Readiness breakdown')).toBeInTheDocument();
  });

  it('renders settings without exposing the anonymous device identifier', () => {
    renderPage(<SettingsPage />, '/settings');
    expect(screen.getByText('Tune the trainer, not the exam standard.')).toBeInTheDocument();
    expect(screen.queryByText(/device id/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/confidence rating/i)).not.toBeInTheDocument();
  });
});
