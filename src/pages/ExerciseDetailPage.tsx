import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, Award, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingState } from '../components/common/LoadingState';
import { ExerciseHistoryList } from '../components/exercises/ExerciseHistoryList';
import { ExerciseProgressChart } from '../components/exercises/ExerciseProgressChart';
import { PageHeader } from '../components/layout/PageHeader';
import { db } from '../db/database';
import { getSettings } from '../db/repositories/settingsRepository';
import {
  buildExerciseProgress,
  getAllTimeBest,
  getLatestWorkingWeight,
  type ProgressMetric
} from '../services/exerciseProgress';
import { kilogramsToDisplay } from '../utils/number';
import { useI18n } from '../i18n/useI18n';
import { translateExerciseName } from '../i18n/translations';

const metricLabels: Record<ProgressMetric, string> = {
  estimatedOneRepMax: 'Estimated 1RM',
  bestWeight: 'Best weight',
  volume: 'Volume',
  totalRepetitions: 'Repetitions'
};

export function ExerciseDetailPage() {
  const { language, t } = useI18n();
  const { exerciseId = '' } = useParams();
  const data = useLiveQuery(async () => {
    const exercise = await db.exercises.get(exerciseId);
    if (!exercise) return null;
    const [workouts, sets, settings] = await Promise.all([
      db.workouts.where('status').equals('completed').toArray(),
      db.workoutSets.where('exerciseId').equals(exerciseId).toArray(),
      getSettings()
    ]);
    return {
      exercise,
      settings,
      points: buildExerciseProgress(workouts, sets, exerciseId)
    };
  }, [exerciseId]);
  const [metric, setMetric] = useState<ProgressMetric>('estimatedOneRepMax');
  if (data === undefined)
    return <LoadingState label={t('Loading exercise progress')} />;
  if (data === null)
    return (
      <EmptyState
        title={t('Exercise not found')}
        description={t(
          'This exercise may have been removed from the local database.'
        )}
        action={<Link to="/exercises">{t('Back to exercises')}</Link>}
      />
    );
  const { exercise, settings, points } = data;
  const effectiveMetric =
    exercise.trackingType === 'weight-reps' ? metric : 'totalRepetitions';
  const unit = settings.weightUnit;
  return (
    <section className="page-stack">
      <Link className="back-link" to="/exercises">
        <ArrowLeft size={18} /> {t('Exercises')}
      </Link>
      <PageHeader
        eyebrow={t(exercise.category)}
        title={translateExerciseName(language, exercise.name)}
        description={exercise.notes}
      />
      {points.length ? (
        <>
          <div className="exercise-metrics">
            <div>
              <span>{t('Latest weight')}</span>
              <strong>
                {kilogramsToDisplay(getLatestWorkingWeight(points), unit)}{' '}
                {unit}
              </strong>
            </div>
            <div>
              <span>{t('Best weight')}</span>
              <strong>
                {kilogramsToDisplay(getAllTimeBest(points, 'bestWeight'), unit)}{' '}
                {unit}
              </strong>
            </div>
            <div>
              <span>{t('Best est. 1RM')}</span>
              <strong>
                {kilogramsToDisplay(
                  getAllTimeBest(points, 'estimatedOneRepMax'),
                  unit
                )}{' '}
                {unit}
              </strong>
            </div>
            <div>
              <span>{t('Latest volume')}</span>
              <strong>
                {kilogramsToDisplay(points.at(-1)?.volume ?? 0, unit)} {unit}
              </strong>
            </div>
          </div>
          <div className="chart-card">
            <div className="section-heading">
              <div>
                <h2>
                  <TrendingUp size={19} /> {t('Progress')}
                </h2>
                <p>{t('Completed working sets only.')}</p>
              </div>
            </div>
            {exercise.trackingType === 'weight-reps' && (
              <div
                className="segmented-control"
                role="group"
                aria-label={t('Progress metric')}
              >
                {(Object.keys(metricLabels) as ProgressMetric[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={metric === item ? 'is-active' : ''}
                    onClick={() => setMetric(item)}
                    aria-pressed={metric === item}
                  >
                    {t(metricLabels[item])}
                  </button>
                ))}
              </div>
            )}
            <ExerciseProgressChart
              points={points}
              metric={effectiveMetric}
              unit={unit}
            />
          </div>
          <div className="section-heading">
            <div>
              <h2>
                <Award size={19} /> {t('Session history')}
              </h2>
              <p>
                {t('{{count}} completed sessions', { count: points.length })}
              </p>
            </div>
          </div>
          <ExerciseHistoryList
            points={points}
            trackingType={exercise.trackingType}
            unit={unit}
          />
        </>
      ) : (
        <EmptyState
          title={t('No completed sessions yet')}
          description={t(
            'Record this exercise in a workout to build progress trends and personal records.'
          )}
        />
      )}
    </section>
  );
}
