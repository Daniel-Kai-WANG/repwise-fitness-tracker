import {
  Download,
  Dumbbell,
  LayoutTemplate,
  LineChart,
  Settings,
  ShieldCheck,
  type LucideIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { PageHeader } from '../components/layout/PageHeader';
import { useI18n } from '../i18n/useI18n';

interface GuideSection {
  icon: LucideIcon;
  title: string;
  description: string;
  steps: string[];
}

const guideSections: GuideSection[] = [
  {
    icon: Download,
    title: 'Install Repwise on your phone',
    description: 'Install it once, then open it like a normal app.',
    steps: [
      'iPhone: open Repwise in Safari, tap Share, then Add to Home Screen.',
      'Android: open Repwise in Chrome, open the menu, then tap Install app or Add to Home screen.',
      'Open Repwise from the new icon and keep using the same browser profile.'
    ]
  },
  {
    icon: Settings,
    title: 'Set your preferences',
    description: 'Choose the display options that match your training.',
    steps: [
      'Open Settings and choose English, 中文, or your device language.',
      'Choose kilograms or pounds and set your default rest timer.',
      'Keep warm-up sets visible if you want to record them separately.'
    ]
  },
  {
    icon: Dumbbell,
    title: 'Record a workout',
    description: 'This is the main flow you will use in the gym.',
    steps: [
      'Tap Start and choose a template or start an empty workout.',
      'Add exercises, then enter weight, repetitions, or duration for each set.',
      'Tap the check button after each completed set and use the rest timer.',
      'Tap Finish when the workout is complete, then review the summary.'
    ]
  },
  {
    icon: LayoutTemplate,
    title: 'Reuse your training plan',
    description: 'Templates make repeated sessions faster to start.',
    steps: [
      'Open Templates and create a plan for a workout you repeat.',
      'Choose the exercise order, target sets, repetitions, and rest time.',
      'Start from that template and adjust any target during the workout.'
    ]
  },
  {
    icon: LineChart,
    title: 'Review progress',
    description: 'Use completed workouts to understand your training.',
    steps: [
      'Open History to review, edit, repeat, or delete completed workouts.',
      'Open Exercises and select an exercise to see weight, volume, repetitions, and estimated 1RM trends.',
      'Use recent progress and personal-record messages as guidance, not as medical advice.'
    ]
  }
];

export function GuidePage() {
  const { t } = useI18n();

  return (
    <section className="page-stack guide-page">
      <PageHeader
        eyebrow={t('Help')}
        title={t('How to use Repwise')}
        description={t(
          'A practical guide from installation to your regular training routine.'
        )}
      />

      <div className="guide-callout">
        <ShieldCheck size={24} />
        <div>
          <strong>{t('Your workout data stays on this device')}</strong>
          <p>
            {t(
              'Repwise has no account or cloud sync. Export a JSON backup regularly and before clearing browser data or changing phones.'
            )}
          </p>
        </div>
      </div>

      <div className="guide-grid">
        {guideSections.map(
          ({ icon: Icon, title, description, steps }, index) => (
            <Card className="guide-card" key={title}>
              <div className="guide-card__header">
                <span>{index + 1}</span>
                <Icon size={22} />
                <div>
                  <h2>{t(title)}</h2>
                  <p>{t(description)}</p>
                </div>
              </div>
              <ol className="guide-steps">
                {steps.map((step) => (
                  <li key={step}>{t(step)}</li>
                ))}
              </ol>
            </Card>
          )
        )}
      </div>

      <Card className="guide-card">
        <div className="guide-card__header">
          <span>6</span>
          <Download size={22} />
          <div>
            <h2>{t('Back up and restore')}</h2>
            <p>{t('Protect your records before browser or device changes.')}</p>
          </div>
        </div>
        <ol className="guide-steps">
          <li>{t('Open Settings and tap Export JSON.')}</li>
          <li>{t('Save the downloaded file somewhere you can find later.')}</li>
          <li>
            {t(
              'To restore, tap Import JSON, review the preview, then merge or replace the local data.'
            )}
          </li>
        </ol>
      </Card>

      <div className="guide-actions">
        <Link className="button button--primary" to="/workout/start">
          {t('Start a workout')}
        </Link>
        <Link className="button button--secondary" to="/settings">
          {t('Open settings')}
        </Link>
      </div>
    </section>
  );
}
