import { describe, expect, it } from 'vitest';
import { translate, translateExerciseName } from './translations';

describe('translations', () => {
  it('translates interface text and interpolates values', () => {
    expect(translate('zh', 'Start workout')).toBe('开始训练');
    expect(translate('zh', 'Rest finished. Start your next set.')).toBe(
      '休息结束，可以开始下一组。'
    );
    expect(
      translate('zh', '{{count}} sets', {
        count: 3
      })
    ).toBe('3 组');
  });

  it('keeps English and custom exercise names unchanged', () => {
    expect(translate('en', 'Start workout')).toBe('Start workout');
    expect(translateExerciseName('zh', 'My custom lift')).toBe(
      'My custom lift'
    );
  });

  it('translates default exercise names and dynamic validation messages', () => {
    expect(translateExerciseName('zh', 'Barbell Bench Press')).toBe('杠铃卧推');
    expect(translate('zh', 'Use 80 characters or fewer.')).toBe(
      '请使用不超过 80 个字符。'
    );
  });
});
