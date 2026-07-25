import { useLiveQuery } from 'dexie-react-hooks';
import { Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingState } from '../components/common/LoadingState';
import { TemplateCard } from '../components/templates/TemplateCard';
import { PageHeader } from '../components/layout/PageHeader';
import { db } from '../db/database';
import { deleteTemplate } from '../db/repositories/templateRepository';
import { createWorkout } from '../db/repositories/workoutRepository';
import { useI18n } from '../i18n/useI18n';
import { translateExerciseName } from '../i18n/translations';

export function TemplatesPage() {
  const { language, t } = useI18n();
  const navigate = useNavigate();
  const data = useLiveQuery(async () => ({
    templates: await db.templates.orderBy('name').toArray(),
    exercises: await db.exercises.toArray()
  }));
  if (!data) return <LoadingState label={t('Loading templates')} />;
  const exerciseMap = new Map(
    data.exercises.map((exercise) => [exercise.id, exercise.name])
  );
  return (
    <section className="page-stack">
      <PageHeader
        eyebrow={t('Plans')}
        title={t('Templates')}
        description={t(
          'Save repeatable workouts without locking historical data.'
        )}
        action={
          <Link className="button button--primary" to="/templates/new">
            <Plus size={18} /> {t('New')}
          </Link>
        }
      />
      {data.templates.length ? (
        <div className="card-list">
          {data.templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              exerciseNames={template.exercises.map((item) =>
                translateExerciseName(
                  language,
                  exerciseMap.get(item.exerciseId) ?? t('Missing exercise')
                )
              )}
              onDelete={() =>
                window.confirm(
                  t('Delete {{name}}? Completed workouts will remain.', {
                    name: template.name
                  })
                ) && deleteTemplate(template.id)
              }
              onStart={async () => {
                try {
                  const workout = await createWorkout(
                    template.name,
                    template.id,
                    template.exercises
                  );
                  navigate(`/workout/active/${workout.id}`);
                } catch (error) {
                  window.alert(
                    error instanceof Error
                      ? t(error.message)
                      : t('Unable to start workout.')
                  );
                }
              }}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title={t('No templates yet')}
          description={t('Create a template for a workout you repeat often.')}
          action={
            <Link className="button button--primary" to="/templates/new">
              {t('Create template')}
            </Link>
          }
        />
      )}
    </section>
  );
}
