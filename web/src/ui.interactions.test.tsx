/**
 * Guidance-primitive interaction tests (P6): InfoTip contract (R8/P5 §3.10),
 * HelpPanel preservation-friendly overlay, ConfirmDialog trap/safe-action
 * (R18). jsdom per-file; the rest of the suite stays on node.
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ConfirmDialog, EmptyMessage, GuideLink, HelpPanel, InfoTip } from './ui';
import { unit } from './content/guides';

afterEach(cleanup);

describe('InfoTip', () => {
  it('body-only tip: opens on click, aria-describedby wired, Esc returns focus, Tab closes without focus steal', async () => {
    const user = userEvent.setup();
    render(<InfoTip label="About the window" unit={unit('rev.tip.expiry')} />);
    const trigger = screen.getByRole('button', { name: 'About the window' });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    await user.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(trigger.hasAttribute('aria-describedby')).toBe(true);
    expect(screen.getByText(/about 30 minutes/)).toBeTruthy();

    await user.keyboard('{Escape}');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger);

    await user.click(trigger);
    await user.keyboard('{Tab}');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    // Focus moved on quietly — not yanked back to the trigger (R8).
    expect(document.activeElement).not.toBe(trigger);
  });

  it('tip with links renders a labelled dialog and keeps focus usable inside', async () => {
    const user = userEvent.setup();
    render(<InfoTip label="Corrections help" unit={unit('rev.tip.correction')} newTabLinks />);
    await user.click(screen.getByRole('button', { name: 'Corrections help' }));
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-label')).toBe('What corrections do');
    const link = screen.getByRole('link', { name: /Read the correction guide/ });
    expect(link.getAttribute('target')).toBe('_blank');
    // Focus can move into the dialog without it closing (outside-blur only).
    link.focus();
    expect(screen.getByRole('dialog')).toBeTruthy();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('outside click closes', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <InfoTip label="Expiry" unit={unit('rev.tip.expiry')} />
        <button type="button">Elsewhere</button>
      </div>,
    );
    await user.click(screen.getByRole('button', { name: 'Expiry' }));
    expect(screen.getByText(/about 30 minutes/)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Elsewhere' }));
    expect(screen.queryByText(/about 30 minutes/)).toBeNull();
  });
});

describe('HelpPanel', () => {
  it('renders a non-modal dialog that does not unmount page content (R17)', () => {
    render(
      <div>
        <div id="workspace">field cards stay mounted</div>
        <HelpPanel open title="Help" onClose={() => {}}>
          <p>Checking terms…</p>
        </HelpPanel>
      </div>,
    );
    expect(screen.getByText('field cards stay mounted')).toBeTruthy();
    expect(screen.getByRole('dialog').getAttribute('aria-modal')).toBe('false');
  });

  it('hidden when closed', () => {
    render(
      <HelpPanel open={false} title="Help" onClose={() => {}}>
        <p>Nothing</p>
      </HelpPanel>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('ConfirmDialog', () => {
  it('focus starts on the safe action, Esc chooses it, focus traps', async () => {
    const user = userEvent.setup();
    const leave = vi.fn();
    const stay = vi.fn();
    render(
      <ConfirmDialog
        title="Leave this review?"
        body="Leaving ends the review."
        actions={[
          { label: 'Stay', kind: 'primary', onChoose: stay },
          { label: 'Leave', kind: 'danger', onChoose: leave },
        ]}
        safeIndex={0}
      />,
    );
    expect(document.activeElement?.textContent).toBe('Stay');
    await user.tab();
    expect(document.activeElement?.textContent).toBe('Leave');
    await user.tab(); // wraps
    expect(document.activeElement?.textContent).toBe('Stay');
    await user.keyboard('{Escape}');
    expect(stay).toHaveBeenCalledTimes(1);
    expect(leave).not.toHaveBeenCalled();
  });

  it('three-choice dialog exposes each consequence (R18)', async () => {
    const user = userEvent.setup();
    const save = vi.fn();
    const discard = vi.fn();
    const keep = vi.fn();
    render(
      <ConfirmDialog
        title="You have an unsaved correction"
        body="Save it and your value is used in the analysis."
        actions={[
          { label: 'Keep editing', kind: 'primary', onChoose: keep },
          { label: 'Save correction and continue', kind: 'secondary', onChoose: save },
          { label: 'Continue without saving', kind: 'danger', onChoose: discard },
        ]}
        safeIndex={0}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Save correction and continue' }));
    expect(save).toHaveBeenCalledTimes(1);
    expect(discard).not.toHaveBeenCalled();
    expect(keep).not.toHaveBeenCalled();
  });
});

describe('GuideLink', () => {
  it('labels new-tab links during a review (P4 §8.3)', () => {
    render(<GuideLink label="Read the correction guide" href="/help/checking-terms#corrections" newTab />);
    const link = screen.getByRole('link');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.textContent).toContain('opens in a new tab');
  });
});

describe('EmptyMessage', () => {
  it('renders message and optional action', () => {
    render(<EmptyMessage message="Nothing was located for this group." action={<button type="button">Retry</button>} />);
    expect(screen.getByText('Nothing was located for this group.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy();
  });
});

describe('fireEvent sanity', () => {
  it('environment works', () => {
    render(<button type="button">x</button>);
    fireEvent.click(screen.getByRole('button'));
  });
});
