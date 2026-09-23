import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StrictExamEngine } from '@/components/StrictExamEngine';
import type { PBQuestion } from '@/data/questions';

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

describe('StrictExamEngine training controls', () => {
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
