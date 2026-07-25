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
import { useI18n } from '../i18n/useI18n';
import { translateExerciseName } from '../i18n/translations';

export function StartWorkoutPage() {
  const { language, t } = useI18n();
  const navigate = useNavigate();
  const data = useLiveQuery(async () => ({
    active: await db.workouts
      .where('status')
      .equals('active')
      .sortBy('startedAt'),
    templates: await db.templates.orderBy('name').toArray(),
    exercises: await db.exercises.toArray()
  }));
  const [name, setName] = useState(t('Workout'));
  const [error, setError] = useState<string>();
  if (!data) return <LoadingState label={t('Preparing workouts')} />;
  const exerciseMap = new Map(
    data.exercises.map((exercise) => [exercise.id, exercise.name])
  );

  const startEmpty = async (event: FormEvent) => {
    event.preventDefault();
    const validationError = validateName(name);
    if (validationError) return setError(t(validationError));
    try {
      const workout = await createWorkout(name);
      navigate(`/workout/active/${workout.id}`);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? t(caughtError.message)
          : t('Unable to start workout.')
      );
    }
  };

  if (data.active.length) {
    return (
      <section className="page-stack">
        <PageHeader
          eyebrow={t('Recovery')}
          title={
            data.active.length === 1
              ? t('Workout in progress')
              : t('Multiple active workouts found')
          }
          description={
            data.active.length === 1
              ? t('Your workout is stored safely on this device.')
              : t(
                  'This is unexpected. Resume one workout, then finish or cancel it before starting another.'
                )
          }
        />
        {data.active.map((workout) => (
          <Card className="resume-card" key={workout.id}>
            <div>
              <Dumbbell size={25} />
              <h2>{workout.name}</h2>
              <p>
                {t('Started')}{' '}
                {new Date(workout.startedAt).toLocaleString(
                  language === 'zh' ? 'zh-CN' : 'en'
                )}
              </p>
            </div>
            <Button onClick={() => navigate(`/workout/active/${workout.id}`)}>
              {t('Resume workout')}
            </Button>
          </Card>
        ))}
      </section>
    );
  }

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow={t('Train')}
        title={t('Start workout')}
        description={t('Choose a plan or begin with an empty session.')}
      />
      <div className="section-heading">
        <div>
          <h2>{t('From a template')}</h2>
          <p>{t('Targets remain editable during training.')}</p>
        </div>
        <Link className="text-link" to="/templates">
          <LayoutTemplate size={17} /> {t('Manage')}
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
                    .map((item) => {
                      const exerciseName = exerciseMap.get(item.exerciseId);
                      return exerciseName
                        ? translateExerciseName(language, exerciseName)
                        : undefined;
                    })
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
                {t('Start')}
              </Button>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title={t('No templates yet')}
          description={t(
            'You can start empty now or create a reusable training plan.'
          )}
          action={
            <Link className="button button--secondary" to="/templates/new">
              {t('Create template')}
            </Link>
          }
        />
      )}
      <Card className="empty-workout-card">
        <div>
          <Plus size={22} />
          <div>
            <h2>{t('Start empty workout')}</h2>
            <p>{t('Add exercises after the timer begins.')}</p>
          </div>
        </div>
        <form onSubmit={startEmpty}>
          <label className="field">
            <span>{t('Workout name')}</span>
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
            {t('Start empty workout')}
          </Button>
        </form>
      </Card>
    </section>
  );
}
