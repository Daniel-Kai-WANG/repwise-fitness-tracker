import { describe, expect, it } from 'vitest';
import { groupByLocalDate } from './date';

describe('date grouping', () => {
  it('groups records by local calendar date while preserving order', () => {
    const groups = groupByLocalDate(
      [
        { id: 'a', date: '2026-07-20T08:00:00.000+10:00' },
        { id: 'b', date: '2026-07-20T18:00:00.000+10:00' },
        { id: 'c', date: '2026-07-19T08:00:00.000+10:00' }
      ],
      (item) => item.date
    );
    expect(groups.map((group) => group.items.map((item) => item.id))).toEqual([
      ['a', 'b'],
      ['c']
    ]);
  });
});
