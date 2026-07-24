import { describe, expect, it } from 'vitest';
import { calculateRestSecondsRemaining, createRestTimerEnd } from './restTimer';

describe('rest timer calculations', () => {
  it('calculates remaining seconds from an absolute end time', () => {
    const now = Date.parse('2026-07-21T00:00:00.000Z');
    expect(calculateRestSecondsRemaining('2026-07-21T00:01:30.000Z', now)).toBe(
      90
    );
    expect(calculateRestSecondsRemaining('2026-07-21T00:00:00.250Z', now)).toBe(
      1
    );
  });

  it('returns zero for expired, missing, and invalid timers', () => {
    const now = Date.parse('2026-07-21T00:01:00.000Z');
    expect(calculateRestSecondsRemaining('2026-07-21T00:00:00.000Z', now)).toBe(
      0
    );
    expect(calculateRestSecondsRemaining(undefined, now)).toBe(0);
    expect(calculateRestSecondsRemaining('invalid', now)).toBe(0);
  });

  it('creates a normalised absolute end time', () => {
    const now = Date.parse('2026-07-21T00:00:00.000Z');
    expect(createRestTimerEnd(90.8, now)).toBe('2026-07-21T00:01:30.000Z');
    expect(createRestTimerEnd(0, now)).toBeUndefined();
  });
});
