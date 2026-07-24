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
import { useWorkoutTimer } from '../hooks/useWorkoutTimer';
import { useRestTimer } from '../hooks/useRestTimer';
import { findRecordLabels } from '../services/personalRecords';
import { formatDuration } from '../utils/date';
import { createRestTimerEnd } from '../services/restTimer';

export function ActiveWorkoutPage() {
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

  useEffect(() => {
    if (!data?.workout?.restTimerEndsAt || restRemaining > 0) return;
    setWorkoutRestTimer(workoutId, undefined).catch(() => {
      setMessage('The rest timer could not be cleared. Your workout is safe.');
    });
  }, [data?.workout?.restTimerEndsAt, restRemaining, workoutId]);

  if (!data) return <LoadingState label="Restoring active workout" />;
  if (!data.workout)
    return (
      <EmptyState
        title="Workout not found"
        description="The requested workout is not available on this device."
        action={<Link to="/">Return home</Link>}
      />
    );
  if (data.workout.status !== 'active')
    return (
      <EmptyState
        title="Workout is already closed"
        description="Completed workouts are available in history."
        action={<Link to={`/history/${workoutId}`}>View workout</Link>}
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
    if (!settings?.defaultRestSeconds) return;
    const restTimerEndsAt = createRestTimerEnd(settings.defaultRestSeconds);
    setWorkoutRestTimer(workoutId, restTimerEndsAt).catch(() => {
      setMessage('The rest timer could not start. Your set is still saved.');
    });
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
              'Cancel this workout? It will not appear in completed history.'
            )
          ) {
            await cancelWorkout(workoutId);
            navigate('/');
          }
        }}
      />
      {restRemaining > 0 && (
        <div className="rest-banner" role="timer">
          <span>Rest</span>
          <strong>{formatDuration(restRemaining)}</strong>
          <button
            type="button"
            onClick={() =>
              setWorkoutRestTimer(workoutId, undefined).catch(() =>
                setMessage('The rest timer could not be cleared.')
              )
            }
          >
            Skip
          </button>
        </div>
      )}
      {workoutExercises.map((workoutExercise, index) => {
        const exercise = exerciseMap.get(workoutExercise.exerciseId);
        if (!exercise)
          return (
            <EmptyState
              key={workoutExercise.id}
              title="Missing exercise"
              description="This workout references an exercise that is no longer available."
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
                  ? `Personal record: ${records.join(', ')}`
                  : 'Set saved'
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
        <Plus size={18} /> Add exercise
      </Button>
      <div className="toast-region" aria-live="polite">
        {message && <div className="toast">{message}</div>}
      </div>
      {(showExercisePicker || replaceId) && (
        <AddExerciseSheet
          title={replaceId ? 'Replace exercise' : 'Add exercise'}
          exercises={exercises}
          excludedIds={workoutExercises.map((item) => item.exerciseId)}
          onClose={() => {
            setShowExercisePicker(false);
            setReplaceId(undefined);
          }}
          onSelect={async (exercise) => {
            if (replaceId)
              await updateWorkoutExercise(replaceId, {
                exerciseId: exercise.id
              });
            else {
              const added = await addExerciseToWorkout(workoutId, exercise.id);
              await addSet(added);
            }
            setShowExercisePicker(false);
            setReplaceId(undefined);
          }}
        />
      )}
      {showFinish && (
        <Modal title="Finish workout?" onClose={() => setShowFinish(false)}>
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
              <span>Exercises</span>
            </div>
            <div>
              <strong>{completedCount}</strong>
              <span>Completed sets</span>
            </div>
            <div>
              <strong>{incompleteCount}</strong>
              <span>Incomplete sets</span>
            </div>
            <div>
              <strong>{formatDuration(elapsedSeconds)}</strong>
              <span>Duration</span>
            </div>
          </div>
          {incompleteCount > 0 && (
            <p className="notice">
              Incomplete sets will be discarded. Completed data is already
              saved.
            </p>
          )}
          <div className="form-actions">
            <Button variant="secondary" onClick={() => setShowFinish(false)}>
              Continue workout
            </Button>
            <Button
              onClick={async () => {
                await finishWorkout(workoutId, elapsedSeconds);
                navigate(`/workout/summary/${workoutId}`);
              }}
            >
              Finish workout
            </Button>
          </div>
        </Modal>
      )}
    </section>
  );
}
