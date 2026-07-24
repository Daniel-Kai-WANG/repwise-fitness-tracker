import { Dumbbell, Edit3, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { WorkoutTemplate } from '../../types/template';
import { Button } from '../common/Button';
import { Card } from '../common/Card';

interface TemplateCardProps {
  template: WorkoutTemplate;
  exerciseNames: string[];
  onStart: () => void;
  onDelete: () => void;
}

export function TemplateCard({
  template,
  exerciseNames,
  onStart,
  onDelete
}: TemplateCardProps) {
  return (
    <Card className="template-card">
      <div className="template-card__content">
        <div>
          <p className="eyebrow">{template.exercises.length} exercises</p>
          <h2>{template.name}</h2>
          <p>{exerciseNames.slice(0, 3).join(' · ') || 'No exercises yet'}</p>
        </div>
        <Dumbbell size={24} aria-hidden="true" />
      </div>
      <div className="template-card__actions">
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${template.name}`}
        >
          <Trash2 size={17} /> Delete
        </button>
        <Link
          className="button button--secondary"
          to={`/templates/${template.id}/edit`}
        >
          <Edit3 size={17} /> Edit
        </Link>
        <Button type="button" onClick={onStart}>
          Start
        </Button>
      </div>
    </Card>
  );
}
