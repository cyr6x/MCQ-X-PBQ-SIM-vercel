/**
 * LeaveGuard: a single router-level guard that intercepts navigation while a
 * session is live. Leaving an exam mid-way ENDS it (submitted as-is); leaving
 * a study session warns that progress is lost.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Link, Outlet, createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LeaveGuard } from './App';
import { setExamActive, setStudyActive, EXAM_END_EVENT } from '@/lib/examSession';

function renderHarness() {
  const router = createMemoryRouter(
    [
      {
        element: (
          <>
            <LeaveGuard />
            <Outlet />
          </>
        ),
        children: [
          {
            path: '/exam',
            element: (
              <div>
                EXAM SURFACE
                <Link to="/settings">go to settings</Link>
              </div>
            ),
          },
          { path: '/settings', element: <div>SETTINGS SURFACE</div> },
        ],
      },
    ],
    { initialEntries: ['/exam'] },
  );
  render(<RouterProvider router={router} />);
}

describe('LeaveGuard (settings ends exam)', () => {
  beforeEach(() => {
    setExamActive(false);
    setStudyActive(false);
    vi.restoreAllMocks();
  });

  it('lets navigation through when nothing is active', () => {
    const confirm = vi.spyOn(window, 'confirm');
    renderHarness();
    fireEvent.click(screen.getByText('go to settings'));
    expect(screen.getByText('SETTINGS SURFACE')).toBeInTheDocument();
    expect(confirm).not.toHaveBeenCalled();
  });

  it('asks, then ENDS the exam and navigates when confirmed', async () => {
    const endListener = vi.fn();
    window.addEventListener(EXAM_END_EVENT, endListener);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    setExamActive(true);

    renderHarness();
    fireEvent.click(screen.getByText('go to settings'));

    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('END the exam'));
    expect(endListener).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.getByText('SETTINGS SURFACE')).toBeInTheDocument());
    window.removeEventListener(EXAM_END_EVENT, endListener);
  });

  it('keeps the exam running when the user backs out of leaving', async () => {
    const endListener = vi.fn();
    window.addEventListener(EXAM_END_EVENT, endListener);
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    setExamActive(true);

    renderHarness();
    fireEvent.click(screen.getByText('go to settings'));

    expect(endListener).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByText('EXAM SURFACE')).toBeInTheDocument());
    expect(screen.queryByText('SETTINGS SURFACE')).not.toBeInTheDocument();
    window.removeEventListener(EXAM_END_EVENT, endListener);
  });

  it('warns (without ending anything) for a study session', async () => {
    const endListener = vi.fn();
    window.addEventListener(EXAM_END_EVENT, endListener);
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    setStudyActive(true);

    renderHarness();
    fireEvent.click(screen.getByText('go to settings'));

    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('practice session'));
    expect(endListener).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByText('EXAM SURFACE')).toBeInTheDocument());
    window.removeEventListener(EXAM_END_EVENT, endListener);
  });
});
