import type { ExerciseProgressPoint } from '../../services/exerciseProgress';
import { comparePerformance } from '../../services/progressionAnalysis';
import { calculateExercisePerformance } from '../../services/workoutCalculations';
import type { TrackingType } from '../../types/exercise';
import type { WeightUnit } from '../../types/settings';
import { formatShortDate } from '../../utils/date';
import { formatVolume, kilogramsToDisplay } from '../../utils/number';
import { useI18n } from '../../i18n/useI18n';

export function ExerciseHistoryList({
  points,
  trackingType,
  unit
}: {
  points: ExerciseProgressPoint[];
  trackingType: TrackingType;
  unit: WeightUnit;
}) {
  const { t } = useI18n();
  return (
    <div className="session-list">
      {[...points].reverse().map((point, reverseIndex) => {
        const chronologicalIndex = points.length - 1 - reverseIndex;
        const previous = points[chronologicalIndex - 1];
        const comparison = comparePerformance(
          calculateExercisePerformance(point.sets),
          previous ? calculateExercisePerformance(previous.sets) : undefined
        );
        const change = comparison.isFirstSession
          ? t('First recorded session')
          : comparison.volumePercentChange === null ||
              comparison.volumePercentChange === 0
            ? t('No volume change')
            : comparison.volumePercentChange > 0
              ? t('+{{percent}}% volume', {
                  percent: comparison.volumePercentChange
                })
              : t('{{percent}}% below previous session', {
                  percent: Math.abs(comparison.volumePercentChange)
                });
        return (
          <article className="session-item" key={point.workoutId}>
            <div>
              <strong>{formatShortDate(point.date)}</strong>
              <span>{change}</span>
            </div>
            <div className="set-breakdown">
              {point.sets.map((set) => (
                <span key={set.id}>
                  {trackingType === 'duration'
                    ? `${set.durationSeconds ?? 0}s`
                    : trackingType === 'reps-only'
                      ? t('{{count}} reps', { count: set.reps ?? 0 })
                      : `${kilogramsToDisplay(set.weight ?? 0, unit)} × ${set.reps ?? 0}`}
                </span>
              ))}
            </div>
            <p>
              {formatVolume(point.volume, unit)} {t('volume')} · {t('best')}{' '}
              {kilogramsToDisplay(point.bestWeight, unit)} {unit}
            </p>
          </article>
        );
      })}
    </div>
  );
}
