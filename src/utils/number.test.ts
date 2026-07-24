import { describe, expect, it } from 'vitest';
import { displayToKilograms, kilogramsToDisplay } from './number';

describe('weight conversion', () => {
  it('converts at the display boundary without changing canonical kilograms', () => {
    expect(kilogramsToDisplay(100, 'lb')).toBe(220.5);
    expect(displayToKilograms(220.462, 'lb')).toBeCloseTo(100, 2);
    expect(displayToKilograms(100, 'kg')).toBe(100);
  });
});
