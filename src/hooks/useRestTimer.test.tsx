import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useRestTimer } from './useRestTimer';

afterEach(() => {
  vi.useRealTimers();
});

describe('useRestTimer', () => {
  it('restores remaining time after focus and page-show events', () => {
    vi.useFakeTimers();
    const start = Date.parse('2026-07-21T00:00:00.000Z');
    vi.setSystemTime(start);
    const { result } = renderHook(() =>
      useRestTimer('2026-07-21T00:01:30.000Z')
    );
    expect(result.current).toBe(90);

    act(() => {
      vi.setSystemTime(start + 45_000);
      window.dispatchEvent(new Event('focus'));
    });
    expect(result.current).toBe(45);

    act(() => {
      vi.setSystemTime(start + 95_000);
      window.dispatchEvent(new Event('pageshow'));
    });
    expect(result.current).toBe(0);
  });
});
