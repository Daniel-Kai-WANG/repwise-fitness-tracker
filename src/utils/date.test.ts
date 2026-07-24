import { describe, expect, it } from 'vitest';
import { groupByLocalDate } from './date';

describe('date grouping', () => {
  it('groups records by local calendar date while preserving order', () => {
    const localDate = (day: number, hour: number) =>
      new Date(2026, 6, day, hour).toISOString();

    const groups = groupByLocalDate(
      [
        { id: 'a', date: localDate(20, 8) },
        { id: 'b', date: localDate(20, 18) },
        { id: 'c', date: localDate(19, 8) }
      ],
      (item) => item.date
    );
    expect(groups.map((group) => group.items.map((item) => item.id))).toEqual([
      ['a', 'b'],
      ['c']
    ]);
  });
});
