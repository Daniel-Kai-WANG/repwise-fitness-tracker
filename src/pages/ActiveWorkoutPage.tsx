import { useLiveQuery } from 'dexie-react-hooks';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingState } from '../components/common/LoadingState';
import { Modal } from '../components/common/Modal';
import { ActiveWorkoutHeader } from '../components/workout/ActiveWorkoutHeader';
import { AddExerciseSheet } from '../components/workout/AddExerciseSheet';
import { ExerciseWorkoutCard } from '../components/workout/ExerciseWorkoutCard';
import { db } from '../db/database';
import {
  addExerciseToWorkout,
  addSet,
  cancelWorkout,
  finishWorkout,
  getPreviousExerciseSets,
  setWorkoutRestTimer,
  updateWorkoutExercise
} from '../db/repositories/workoutRepository';
import { getSettings } from '../db/repositories/settingsRepository';
import { createExercise } from '../db/repositories/exerciseRepository';
import { useRestAlert } from '../hooks/useRestAlert';
import { useWorkoutTimer } from '../hooks/useWorkoutTimer';
import { useRestTimer } from '../hooks/useRestTimer';
import { findRecordLabels } from '../services/personalRecords';
import { formatDuration } from '../utils/date';
import { createRestTimerEnd } from '../services/restTimer';
import { useI18n } from '../i18n/useI18n';
import type { Exercise } from '../types/exercise';

export function ActiveWorkoutPage() {
  const { t } = useI18n();
  const { workoutId = '' } = useParams();
  const navigate = useNavigate();
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [replaceId, setReplaceId] = useState<string>();
  const [showFinish, setShowFinish] = useState(false);
  const [message, setMessage] = useState<string>();
  const data = useLiveQuery(async () => {
    const workout = await db.workouts.get(workoutId);
    if (!workout) return { workout: undefined };
    const [workoutExercises, sets, exercises, settings] = await Promise.all([
      db.workoutExercises.where('workoutId').equals(workoutId).sortBy('order'),
      db.workoutSets.where('workoutId').equals(workoutId).toArray(),
      db.exercises.toArray(),
      getSettings()
    ]);
    const previousEntries = await Promise.all(
      workoutExercises.map(
        async (item) =>
          [
            item.exerciseId,
            await getPreviousExerciseSets(item.exerciseId, workout.startedAt)
          ] as const
      )
    );
    return {
      workout,
      workoutExercises,
      sets,
      exercises,
      settings,
      previous: new Map(previousEntries)
    };
  }, [workoutId]);
  const elapsedSeconds = useWorkoutTimer(data?.workout?.startedAt);
  const restRemaining = useRestTimer(data?.workout?.restTimerEndsAt);
  useRestAlert(
    data?.settings?.autoRestEnabled !== false,
    data?.workout?.restTimerEndsAt,
    restRemaining,
    () => {
      setMessage(t('Rest finished. Start your next set.'));
      window.setTimeout(() => setMessage(undefined), 4000);
    }
  );

  useEffect(() => {
    if (!data?.workout?.restTimerEndsAt || restRemaining > 0) return;
    setWorkoutRestTimer(workoutId, undefined).catch(() => {
      setMessage(
        t('The rest timer could not be cleared. Your workout is safe.')
      );
    });
  }, [data?.workout?.restTimerEndsAt, restRemaining, t, workoutId]);

  if (!data) return <LoadingState label={t('Restoring active workout')} />;
  if (!data.workout)
    return (
      <EmptyState
        title={t('Workout not found')}
        description={t(
          'The requested workout is not available on this device.'
        )}
        action={<Link to="/">{t('Return home')}</Link>}
      />
    );
  if (data.workout.status !== 'active')
    return (
      <EmptyState
        title={t('Workout is already closed')}
        description={t('Completed workouts are available in history.')}
        action={<Link to={`/history/${workoutId}`}>{t('View workout')}</Link>}
      />
    );
  const {
    workoutExercises = [],
    sets = [],
    exercises = [],
    settings,
    previous = new Map()
  } = data;
  const exerciseMap = new Map(
    exercises.map((exercise) => [exercise.id, exercise])
  );
  const completedCount = sets.filter((set) => set.isCompleted).length;
  const incompleteCount = sets.length - completedCount;

  const beginRestTimer = () => {
    if (settings?.autoRestEnabled === false || !settings?.defaultRestSeconds)
      return;
    const restTimerEndsAt = createRestTimerEnd(settings.defaultRestSeconds);
    setWorkoutRestTimer(workoutId, restTimerEndsAt).catch(() => {
      setMessage(t('The rest timer could not start. Your set is still saved.'));
    });
  };

  const handleExerciseSelected = async (exercise: Exercise) => {
    if (replaceId) {
      await updateWorkoutExercise(replaceId, {
        exerciseId: exercise.id
      });
    } else {
      const added = await addExerciseToWorkout(workoutId, exercise.id);
      await addSet(added);
    }
    setShowExercisePicker(false);
    setReplaceId(undefined);
  };

  return (
    <section className="active-workout page-stack">
      <ActiveWorkoutHeader
        name={data.workout.name}
        elapsedSeconds={elapsedSeconds}
        onFinish={() => setShowFinish(true)}
        onCancel={async () => {
          if (
            window.confirm(
              t('Cancel this workout? It will not appear in completed history.')
            )
          ) {
            await cancelWorkout(workoutId);
            navigate('/');
          }
        }}
      />
      {restRemaining > 0 && (
        <div className="rest-banner" role="timer">
          <span>{t('Rest')}</span>
          <strong>{formatDuration(restRemaining)}</strong>
          <button
            type="button"
            onClick={() =>
              setWorkoutRestTimer(workoutId, undefined).catch(() =>
                setMessage(t('The rest timer could not be cleared.'))
              )
            }
          >
            {t('Skip')}
          </button>
        </div>
      )}
      {workoutExercises.map((workoutExercise, index) => {
        const exercise = exerciseMap.get(workoutExercise.exerciseId);
        if (!exercise)
          return (
            <EmptyState
              key={workoutExercise.id}
              title={t('Missing exercise')}
              description={t(
                'This workout references an exercise that is no longer available.'
              )}
            />
          );
        const exerciseSets = sets
          .filter((set) => set.workoutExerciseId === workoutExercise.id)
          .sort((a, b) => a.setNumber - b.setNumber);
        const previousSets = previous.get(exercise.id) ?? [];
        return (
          <ExerciseWorkoutCard
            key={workoutExercise.id}
            workoutExercise={workoutExercise}
            exercise={exercise}
            sets={exerciseSets}
            previousSets={previousSets}
            unit={settings?.weightUnit ?? 'kg'}
            canMoveUp={index > 0}
            canMoveDown={index < workoutExercises.length - 1}
            showWarmupSets={settings?.showWarmupSets ?? true}
            onReplace={() => setReplaceId(workoutExercise.id)}
            onSetCompleted={(completedSet) => {
              const records = findRecordLabels(
                [
                  ...exerciseSets.filter((set) => set.id !== completedSet.id),
                  completedSet
                ],
                previousSets
              );
              setMessage(
                records.length
                  ? t('Personal record: {{records}}', {
                      records: records.map((record) => t(record)).join(', ')
                    })
                  : t('Set saved')
              );
              window.setTimeout(() => setMessage(undefined), 2800);
              beginRestTimer();
            }}
          />
        );
      })}
      <Button
        type="button"
        variant="secondary"
        fullWidth
        onClick={() => setShowExercisePicker(true)}
      >
        <Plus size={18} /> {t('Add exercise')}
      </Button>
      <div className="toast-region" aria-live="polite">
        {message && <div className="toast">{message}</div>}
      </div>
      {(showExercisePicker || replaceId) && (
        <AddExerciseSheet
          title={t(replaceId ? 'Replace exercise' : 'Add exercise')}
          exercises={exercises}
          excludedIds={workoutExercises.map((item) => item.exerciseId)}
          onClose={() => {
            setShowExercisePicker(false);
            setReplaceId(undefined);
          }}
          onSelect={handleExerciseSelected}
          onCreate={async (draft) => {
            const exercise = await createExercise(draft);
            await handleExerciseSelected(exercise);
          }}
        />
      )}
      {showFinish && (
        <Modal
          title={t('Finish workout?')}
          onClose={() => setShowFinish(false)}
        >
          <div className="finish-summary">
            <div>
              <strong>
                {
                  workoutExercises.filter((item) =>
                    sets.some(
                      (set) =>
                        set.workoutExerciseId === item.id && set.isCompleted
                    )
                  ).length
                }
              </strong>
              <span>{t('Exercises')}</span>
            </div>
            <div>
              <strong>{completedCount}</strong>
              <span>{t('Completed sets')}</span>
            </div>
            <div>
              <strong>{incompleteCount}</strong>
              <span>{t('Incomplete sets')}</span>
            </div>
            <div>
              <strong>{formatDuration(elapsedSeconds)}</strong>
              <span>{t('Duration')}</span>
            </div>
          </div>
          {incompleteCount > 0 && (
            <p className="notice">
              {t(
                'Incomplete sets will be discarded. Completed data is already saved.'
              )}
            </p>
          )}
          <div className="form-actions">
            <Button variant="secondary" onClick={() => setShowFinish(false)}>
              {t('Continue workout')}
            </Button>
            <Button
              onClick={async () => {
                await finishWorkout(workoutId, elapsedSeconds);
                navigate(`/workout/summary/${workoutId}`);
              }}
            >
              {t('Finish workout')}
            </Button>
          </div>
        </Modal>
      )}
    </section>
  );
}
