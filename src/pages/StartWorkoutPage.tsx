import { useLiveQuery } from 'dexie-react-hooks';
import { Dumbbell, LayoutTemplate, Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingState } from '../components/common/LoadingState';
import { PageHeader } from '../components/layout/PageHeader';
import { db } from '../db/database';
import { createWorkout } from '../db/repositories/workoutRepository';
import { validateName } from '../services/validation';

export function StartWorkoutPage() {
  const navigate = useNavigate();
  const data = useLiveQuery(async () => ({
    active: await db.workouts
      .where('status')
      .equals('active')
      .sortBy('startedAt'),
    templates: await db.templates.orderBy('name').toArray(),
    exercises: await db.exercises.toArray()
  }));
  const [name, setName] = useState('Workout');
  const [error, setError] = useState<string>();
  if (!data) return <LoadingState label="Preparing workouts" />;
  const exerciseMap = new Map(
    data.exercises.map((exercise) => [exercise.id, exercise.name])
  );

  const startEmpty = async (event: FormEvent) => {
    event.preventDefault();
    const validationError = validateName(name);
    if (validationError) return setError(validationError);
    try {
      const workout = await createWorkout(name);
      navigate(`/workout/active/${workout.id}`);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to start workout.'
      );
    }
  };

  if (data.active.length) {
    return (
      <section className="page-stack">
        <PageHeader
          eyebrow="Recovery"
          title={
            data.active.length === 1
              ? 'Workout in progress'
              : 'Multiple active workouts found'
          }
          description={
            data.active.length === 1
              ? 'Your workout is stored safely on this device.'
              : 'This is unexpected. Resume one workout, then finish or cancel it before starting another.'
          }
        />
        {data.active.map((workout) => (
          <Card className="resume-card" key={workout.id}>
            <div>
              <Dumbbell size={25} />
              <h2>{workout.name}</h2>
              <p>Started {new Date(workout.startedAt).toLocaleString()}</p>
            </div>
            <Button onClick={() => navigate(`/workout/active/${workout.id}`)}>
              Resume workout
            </Button>
          </Card>
        ))}
      </section>
    );
  }

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Train"
        title="Start workout"
        description="Choose a plan or begin with an empty session."
      />
      <div className="section-heading">
        <div>
          <h2>From a template</h2>
          <p>Targets remain editable during training.</p>
        </div>
        <Link className="text-link" to="/templates">
          <LayoutTemplate size={17} /> Manage
        </Link>
      </div>
      {data.templates.length ? (
        <div className="card-list">
          {data.templates.map((template) => (
            <Card className="start-template-card" key={template.id}>
              <div>
                <h3>{template.name}</h3>
                <p>
                  {template.exercises
                    .slice(0, 3)
                    .map((item) => exerciseMap.get(item.exerciseId))
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
              <Button
                onClick={async () => {
                  const workout = await createWorkout(
                    template.name,
                    template.id,
                    template.exercises
                  );
                  navigate(`/workout/active/${workout.id}`);
                }}
              >
                Start
              </Button>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No templates yet"
          description="You can start empty now or create a reusable training plan."
          action={
            <Link className="button button--secondary" to="/templates/new">
              Create template
            </Link>
          }
        />
      )}
      <Card className="empty-workout-card">
        <div>
          <Plus size={22} />
          <div>
            <h2>Start empty workout</h2>
            <p>Add exercises after the timer begins.</p>
          </div>
        </div>
        <form onSubmit={startEmpty}>
          <label className="field">
            <span>Workout name</span>
            <input
              value={name}
              maxLength={80}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" fullWidth>
            Start empty workout
          </Button>
        </form>
      </Card>
    </section>
  );
}
