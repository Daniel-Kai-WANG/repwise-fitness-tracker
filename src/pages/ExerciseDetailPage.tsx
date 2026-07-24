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

const metricLabels: Record<ProgressMetric, string> = {
  estimatedOneRepMax: 'Estimated 1RM',
  bestWeight: 'Best weight',
  volume: 'Volume',
  totalRepetitions: 'Repetitions'
};

export function ExerciseDetailPage() {
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
    return <LoadingState label="Loading exercise progress" />;
  if (data === null)
    return (
      <EmptyState
        title="Exercise not found"
        description="This exercise may have been removed from the local database."
        action={<Link to="/exercises">Back to exercises</Link>}
      />
    );
  const { exercise, settings, points } = data;
  const effectiveMetric =
    exercise.trackingType === 'weight-reps' ? metric : 'totalRepetitions';
  const unit = settings.weightUnit;
  return (
    <section className="page-stack">
      <Link className="back-link" to="/exercises">
        <ArrowLeft size={18} /> Exercises
      </Link>
      <PageHeader
        eyebrow={exercise.category}
        title={exercise.name}
        description={exercise.notes}
      />
      {points.length ? (
        <>
          <div className="exercise-metrics">
            <div>
              <span>Latest weight</span>
              <strong>
                {kilogramsToDisplay(getLatestWorkingWeight(points), unit)}{' '}
                {unit}
              </strong>
            </div>
            <div>
              <span>Best weight</span>
              <strong>
                {kilogramsToDisplay(getAllTimeBest(points, 'bestWeight'), unit)}{' '}
                {unit}
              </strong>
            </div>
            <div>
              <span>Best est. 1RM</span>
              <strong>
                {kilogramsToDisplay(
                  getAllTimeBest(points, 'estimatedOneRepMax'),
                  unit
                )}{' '}
                {unit}
              </strong>
            </div>
            <div>
              <span>Latest volume</span>
              <strong>
                {kilogramsToDisplay(points.at(-1)?.volume ?? 0, unit)} {unit}
              </strong>
            </div>
          </div>
          <div className="chart-card">
            <div className="section-heading">
              <div>
                <h2>
                  <TrendingUp size={19} /> Progress
                </h2>
                <p>Completed working sets only.</p>
              </div>
            </div>
            {exercise.trackingType === 'weight-reps' && (
              <div
                className="segmented-control"
                role="group"
                aria-label="Progress metric"
              >
                {(Object.keys(metricLabels) as ProgressMetric[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={metric === item ? 'is-active' : ''}
                    onClick={() => setMetric(item)}
                    aria-pressed={metric === item}
                  >
                    {metricLabels[item]}
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
                <Award size={19} /> Session history
              </h2>
              <p>
                {points.length} completed{' '}
                {points.length === 1 ? 'session' : 'sessions'}
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
          title="No completed sessions yet"
          description="Record this exercise in a workout to build progress trends and personal records."
        />
      )}
    </section>
  );
}
