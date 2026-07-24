import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, Edit3, Repeat2, Trash2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingState } from '../components/common/LoadingState';
import { WorkoutSummary } from '../components/workout/WorkoutSummary';
import { CompletedWorkoutEditor } from '../components/workout/CompletedWorkoutEditor';
import { db } from '../db/database';
import { getSettings } from '../db/repositories/settingsRepository';
import {
  deleteWorkout,
  getWorkoutBundle,
  repeatWorkout
} from '../db/repositories/workoutRepository';

export function WorkoutDetailPage() {
  const { workoutId = '' } = useParams();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const data = useLiveQuery(async () => {
    const bundle = await getWorkoutBundle(workoutId);
    return bundle
      ? {
          bundle,
          exercises: await db.exercises.toArray(),
          settings: await getSettings()
        }
      : null;
  }, [workoutId]);
  if (data === undefined)
    return <LoadingState label="Loading workout details" />;
  if (data === null)
    return (
      <EmptyState
        title="Workout not found"
        description="It may have been deleted from local history."
        action={<Link to="/history">Back to history</Link>}
      />
    );
  return (
    <section className="page-stack">
      <Link className="back-link" to="/history">
        <ArrowLeft size={18} /> History
      </Link>
      {isEditing ? (
        <CompletedWorkoutEditor
          bundle={data.bundle}
          exercises={data.exercises}
          unit={data.settings.weightUnit}
          onCancel={() => setIsEditing(false)}
          onSaved={() => setIsEditing(false)}
        />
      ) : (
        <>
          <WorkoutSummary
            bundle={data.bundle}
            exercises={data.exercises}
            unit={data.settings.weightUnit}
          />
          {data.bundle.workout.notes && (
            <div className="workout-notes">
              <h2>Notes</h2>
              <p>{data.bundle.workout.notes}</p>
            </div>
          )}
          <div className="detail-actions">
            <Button variant="secondary" onClick={() => setIsEditing(true)}>
              <Edit3 size={17} /> Edit workout
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
              <Repeat2 size={17} /> Repeat
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                if (
                  window.confirm(
                    `Delete ${data.bundle.workout.name}? This cannot be undone.`
                  )
                ) {
                  await deleteWorkout(workoutId);
                  navigate('/history');
                }
              }}
            >
              <Trash2 size={17} /> Delete
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
