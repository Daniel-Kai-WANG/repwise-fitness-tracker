import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate, useParams } from 'react-router-dom';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingState } from '../components/common/LoadingState';
import { TemplateForm } from '../components/templates/TemplateForm';
import { PageHeader } from '../components/layout/PageHeader';
import { db } from '../db/database';
import { saveTemplate } from '../db/repositories/templateRepository';

export function TemplateEditorPage() {
  const navigate = useNavigate();
  const { templateId } = useParams();
  const data = useLiveQuery(
    async () => ({
      template: templateId ? await db.templates.get(templateId) : undefined,
      exercises: await db.exercises.orderBy('name').toArray()
    }),
    [templateId]
  );
  if (!data) return <LoadingState label="Loading template editor" />;
  if (templateId && !data.template)
    return (
      <EmptyState
        title="Template not found"
        description="This template may have been deleted."
      />
    );
  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Template"
        title={
          data.template ? `Edit ${data.template.name}` : 'New workout template'
        }
        description="Choose the exercise order and useful starting targets."
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
