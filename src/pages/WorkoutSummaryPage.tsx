import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingState } from '../components/common/LoadingState';
import { WorkoutSummary } from '../components/workout/WorkoutSummary';
import { db } from '../db/database';
import { getSettings } from '../db/repositories/settingsRepository';
import { saveTemplate } from '../db/repositories/templateRepository';
import {
  getPreviousExerciseSets,
  getWorkoutBundle,
  repeatWorkout
} from '../db/repositories/workoutRepository';
import { findRecordLabels } from '../services/personalRecords';
import { comparePerformance } from '../services/progressionAnalysis';
import { calculateExercisePerformance } from '../services/workoutCalculations';

export function WorkoutSummaryPage() {
  const { workoutId = '' } = useParams();
  const navigate = useNavigate();
  const data = useLiveQuery(async () => {
    const bundle = await getWorkoutBundle(workoutId);
    if (!bundle) return null;
    const [exercises, settings, recordEntries] = await Promise.all([
      db.exercises.toArray(),
      getSettings(),
      Promise.all(
        bundle.exercises.map(async (item) => {
          const current = bundle.sets.filter(
            (set) => set.exerciseId === item.exerciseId
          );
          const previous = await getPreviousExerciseSets(
            item.exerciseId,
            bundle.workout.startedAt
          );
          const comparison = comparePerformance(
            calculateExercisePerformance(current),
            previous.length ? calculateExercisePerformance(previous) : undefined
          );
          const comparisonLabel = comparison.isFirstSession
            ? 'First recorded session'
            : comparison.volumePercentChange === null ||
                comparison.volumePercentChange === 0
              ? 'No volume change from previous session'
              : comparison.volumePercentChange > 0
                ? `+${comparison.volumePercentChange}% volume from previous session`
                : `${Math.abs(comparison.volumePercentChange)}% below previous session`;
          return [
            item.exerciseId,
            {
              records: findRecordLabels(current, previous),
              comparison: comparisonLabel
            }
          ] as const;
        })
      )
    ]);
    return {
      bundle,
      exercises,
      settings,
      records: new Map(recordEntries.map(([id, value]) => [id, value.records])),
      comparisons: new Map(
        recordEntries.map(([id, value]) => [id, value.comparison])
      )
    };
  }, [workoutId]);
  if (data === undefined)
    return <LoadingState label="Loading workout summary" />;
  if (data === null)
    return (
      <EmptyState
        title="Workout not found"
        description="This summary is not available on this device."
      />
    );
  return (
    <section className="page-stack">
      <WorkoutSummary
        bundle={data.bundle}
        exercises={data.exercises}
        unit={data.settings.weightUnit}
        records={data.records}
        comparisons={data.comparisons}
      />
      <div className="summary-actions">
        <Button onClick={() => navigate('/')}>Done</Button>
        <Button
          variant="secondary"
          onClick={() => navigate(`/history/${workoutId}`)}
        >
          View history
        </Button>
        <Button
          variant="secondary"
          onClick={async () => {
            try {
              const workout = await repeatWorkout(workoutId);
              navigate(`/workout/active/${workout.id}`);
            } catch (error) {
              window.alert(
                error instanceof Error
                  ? error.message
                  : 'Unable to repeat workout.'
              );
            }
          }}
        >
          Repeat workout
        </Button>
        {!data.bundle.workout.templateId && (
          <Button
            variant="ghost"
            onClick={async () => {
              await saveTemplate({
                name: data.bundle.workout.name,
                exercises: data.bundle.exercises.map((item) => ({
                  exerciseId: item.exerciseId,
                  order: item.order,
                  targetSets: data.bundle.sets.filter(
                    (set) => set.workoutExerciseId === item.id
                  ).length
                }))
              });
              window.alert('Template saved.');
            }}
          >
            Save as template
          </Button>
        )}
      </div>
    </section>
  );
}
