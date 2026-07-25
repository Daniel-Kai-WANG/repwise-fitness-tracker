import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate, useParams } from 'react-router-dom';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingState } from '../components/common/LoadingState';
import { TemplateForm } from '../components/templates/TemplateForm';
import { PageHeader } from '../components/layout/PageHeader';
import { db } from '../db/database';
import { saveTemplate } from '../db/repositories/templateRepository';
import { useI18n } from '../i18n/useI18n';

export function TemplateEditorPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { templateId } = useParams();
  const data = useLiveQuery(
    async () => ({
      template: templateId ? await db.templates.get(templateId) : undefined,
      exercises: await db.exercises.orderBy('name').toArray()
    }),
    [templateId]
  );
  if (!data) return <LoadingState label={t('Loading template editor')} />;
  if (templateId && !data.template)
    return (
      <EmptyState
        title={t('Template not found')}
        description={t('This template may have been deleted.')}
      />
    );
  return (
    <section className="page-stack">
      <PageHeader
        eyebrow={t('Template')}
        title={
          data.template
            ? t('Edit {{name}}', { name: data.template.name })
            : t('New workout template')
        }
        description={t(
          'Choose the exercise order and useful starting targets.'
        )}
      />
      <TemplateForm
        template={data.template}
        exercises={data.exercises}
        onCancel={() => navigate('/templates')}
        onSave={async (draft) => {
          await saveTemplate(draft, templateId);
          navigate('/templates');
        }}
      />
    </section>
  );
}
