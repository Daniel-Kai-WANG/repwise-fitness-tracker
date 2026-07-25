import { useLiveQuery } from 'dexie-react-hooks';
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Dumbbell,
  Settings,
  Sparkles,
  Trophy
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingState } from '../components/common/LoadingState';
import { db } from '../db/database';
import { getSettings } from '../db/repositories/settingsRepository';
import { buildExerciseProgress } from '../services/exerciseProgress';
import { createWorkoutSummary } from '../services/workoutSummary';
import {
  formatDuration,
  formatShortDate,
  formatWeekdayDate,
  startOfLocalWeek
} from '../utils/date';
import { formatVolume, kilogramsToDisplay } from '../utils/number';
import { useI18n } from '../i18n/useI18n';
import { translateExerciseName } from '../i18n/translations';

export function DashboardPage() {
  const { language, t } = useI18n();
  const data = useLiveQuery(async () => {
    const [workouts, workoutExercises, sets, exercises, settings] =
      await Promise.all([
        db.workouts.toArray(),
        db.workoutExercises.toArray(),
        db.workoutSets.toArray(),
        db.exercises.toArray(),
        getSettings()
      ]);
    return { workouts, workoutExercises, sets, exercises, settings };
  });
  if (!data) return <LoadingState label={t('Loading training overview')} />;
  const completed = data.workouts
    .filter((workout) => workout.status === 'completed')
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  const active = data.workouts
    .filter((workout) => workout.status === 'active')
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  const weekStart = startOfLocalWeek().toISOString();
  const weeklyWorkouts = completed.filter(
    (workout) => workout.startedAt >= weekStart
  );
  const weeklyIds = new Set(weeklyWorkouts.map((workout) => workout.id));
  const weeklySets = data.sets.filter(
    (set) => weeklyIds.has(set.workoutId) && set.isCompleted
  );
  const weeklySummary = createWorkoutSummary(
    data.workoutExercises.filter((item) => weeklyIds.has(item.workoutId)),
    weeklySets
  );
  const weeklyDuration = weeklyWorkouts.reduce(
    (total, workout) => total + (workout.durationSeconds ?? 0),
    0
  );
  const recent = completed[0];
  const recentSummary = recent
    ? createWorkoutSummary(
        data.workoutExercises.filter((item) => item.workoutId === recent.id),
        data.sets.filter((set) => set.workoutId === recent.id)
      )
    : undefined;
  const progressItems = data.exercises
    .flatMap((exercise) => {
      const points = buildExerciseProgress(completed, data.sets, exercise.id);
      if (points.length < 2) return [];
      const previous = points.at(-2)!;
      const current = points.at(-1)!;
      if (current.estimatedOneRepMax > previous.estimatedOneRepMax)
        return [
          {
            exercise,
            label: t('Estimated 1RM +{{value}} {{unit}}', {
              value: kilogramsToDisplay(
                current.estimatedOneRepMax - previous.estimatedOneRepMax,
                data.settings.weightUnit
              ),
              unit: data.settings.weightUnit
            })
          }
        ];
      if (current.volume > previous.volume && previous.volume > 0)
        return [
          {
            exercise,
            label: t('Volume +{{percent}}%', {
              percent: Math.round(
                ((current.volume - previous.volume) / previous.volume) * 100
              )
            })
          }
        ];
      return [];
    })
    .slice(0, 3);

  return (
    <section className="page-stack dashboard">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">{formatWeekdayDate(new Date())}</p>
          <h1>{t('Training')}</h1>
        </div>
        <Link className="icon-button" to="/settings" aria-label={t('Settings')}>
          <Settings size={22} />
        </Link>
      </header>
      {active.length > 0 ? (
        <Card className="dashboard-resume">
          <div>
            <span className="status-dot" /> {t('Workout in progress')}
          </div>
          <h2>{active[0].name}</h2>
          <p>
            {t('Started')}{' '}
            {new Date(active[0].startedAt).toLocaleTimeString(
              language === 'zh' ? 'zh-CN' : 'en',
              {
                hour: 'numeric',
                minute: '2-digit'
              }
            )}
          </p>
          <Link
            className="button button--primary button--full"
            to={`/workout/active/${active[0].id}`}
          >
            {t('Resume workout')} <ArrowRight size={18} />
          </Link>
        </Card>
      ) : (
        <Link className="dashboard-start" to="/workout/start">
          <Dumbbell size={28} />
          <span>
            <strong>{t('Start workout')}</strong>
            <small>{t('Record your next working set')}</small>
          </span>
          <ArrowRight size={22} />
        </Link>
      )}
      <div className="section-heading">
        <div>
          <h2>{t('This week')}</h2>
          <p>{t('Since Monday')}</p>
        </div>
      </div>
      <div className="weekly-grid">
        <div>
          <CalendarDays size={18} />
          <strong>{weeklyWorkouts.length}</strong>
          <span>{t('Workouts')}</span>
        </div>
        <div>
          <Dumbbell size={18} />
          <strong>{weeklySummary.completedSets}</strong>
          <span>{t('Sets')}</span>
        </div>
        <div>
          <Trophy size={18} />
          <strong>
            {formatVolume(weeklySummary.volume, data.settings.weightUnit)}
          </strong>
          <span>{t('Volume')}</span>
        </div>
        <div>
          <Clock3 size={18} />
          <strong>{formatDuration(weeklyDuration)}</strong>
          <span>{t('Training')}</span>
        </div>
      </div>
      {recent && recentSummary ? (
        <>
          <div className="section-heading">
            <div>
              <h2>{t('Recent workout')}</h2>
              <p>{t('Your last completed session')}</p>
            </div>
            <Link className="text-link" to="/history">
              {t('All history')}
            </Link>
          </div>
          <Card className="recent-workout">
            <Link to={`/history/${recent.id}`}>
              <div>
                <p className="eyebrow">
                  {formatShortDate(recent.completedAt ?? recent.startedAt)}
                </p>
                <h2>{t(recent.name)}</h2>
                <p>
                  {t('{{count}} exercises', {
                    count: recentSummary.exerciseCount
                  })}{' '}
                  ·{' '}
                  {t('{{count}} sets', {
                    count: recentSummary.completedSets
                  })}{' '}
                  · {formatDuration(recent.durationSeconds)}
                </p>
              </div>
              <strong>
                {formatVolume(recentSummary.volume, data.settings.weightUnit)}
              </strong>
            </Link>
          </Card>
        </>
      ) : (
        <EmptyState
          title={t('Ready for your first workout')}
          description={t(
            'Start an empty session or build a reusable template. Your records stay on this device.'
          )}
          action={
            <div className="empty-actions">
              <Link className="button button--primary" to="/workout/start">
                {t('Start workout')}
              </Link>
              <Link className="button button--secondary" to="/templates/new">
                {t('Create template')}
              </Link>
            </div>
          }
        />
      )}
      {progressItems.length > 0 && (
        <>
          <div className="section-heading">
            <div>
              <h2>{t('Recent progress')}</h2>
              <p>{t('Changes from the prior session')}</p>
            </div>
          </div>
          <div className="progress-feed">
            {progressItems.map(({ exercise, label }) => (
              <Link key={exercise.id} to={`/exercises/${exercise.id}`}>
                <Sparkles size={18} />
                <span>
                  <strong>
                    {translateExerciseName(language, exercise.name)}
                  </strong>
                  <small>{label}</small>
                </span>
                <ArrowRight size={17} />
              </Link>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
