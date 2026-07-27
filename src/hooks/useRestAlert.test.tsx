import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useRestAlert } from './useRestAlert';

describe('useRestAlert', () => {
  it('alerts once when an active rest countdown reaches zero', () => {
    const onAlert = vi.fn();
    const { rerender } = renderHook(
      ({ remaining }) =>
        useRestAlert(true, '2026-07-25T05:00:00.000Z', remaining, onAlert),
      { initialProps: { remaining: 2 } }
    );

    rerender({ remaining: 0 });
    rerender({ remaining: 0 });

    expect(onAlert).toHaveBeenCalledOnce();
  });

  it('does not alert when automatic rest is disabled', () => {
    const onAlert = vi.fn();
    const { rerender } = renderHook(
      ({ remaining }) =>
        useRestAlert(false, '2026-07-25T05:00:00.000Z', remaining, onAlert),
      { initialProps: { remaining: 1 } }
    );

    rerender({ remaining: 0 });

    expect(onAlert).not.toHaveBeenCalled();
  });
});
