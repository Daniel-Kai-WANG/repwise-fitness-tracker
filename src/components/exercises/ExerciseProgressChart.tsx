import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import type {
  ExerciseProgressPoint,
  ProgressMetric
} from '../../services/exerciseProgress';
import type { WeightUnit } from '../../types/settings';
import { formatShortDate } from '../../utils/date';
import { kilogramsToDisplay } from '../../utils/number';
import { useI18n } from '../../i18n/useI18n';

interface ExerciseProgressChartProps {
  points: ExerciseProgressPoint[];
  metric: ProgressMetric;
  unit: WeightUnit;
}

export function ExerciseProgressChart({
  points,
  metric,
  unit
}: ExerciseProgressChartProps) {
  const { t } = useI18n();
  const weightMetric = metric !== 'totalRepetitions';
  const chartData = points.map((point) => ({
    ...point,
    label: formatShortDate(point.date),
    displayValue: weightMetric
      ? kilogramsToDisplay(point[metric], unit)
      : point[metric]
  }));
  if (!chartData.length)
    return (
      <div className="chart-empty">
        <strong>{t('No progress data yet')}</strong>
        <span>{t('Complete a working set to add the first point.')}</span>
      </div>
    );
  return (
    <div
      className="progress-chart"
      aria-label={t('Exercise {{metric}} chart', { metric: t(metric) })}
    >
      <ResponsiveContainer width="100%" height={250}>
        <LineChart
          data={chartData}
          margin={{ top: 12, right: 12, bottom: 8, left: -16 }}
        >
          <CartesianGrid stroke="var(--color-chart-grid)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
          />
          <YAxis
            domain={['auto', 'auto']}
            tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              border: '1px solid var(--color-border)',
              borderRadius: 10,
              background: 'var(--color-surface)',
              color: 'var(--color-text-primary)'
            }}
            formatter={(value) => [
              `${value}${weightMetric ? ` ${unit}` : ` ${t('reps')}`}`,
              t('Result')
            ]}
          />
          <Line
            type="monotone"
            dataKey="displayValue"
            connectNulls={false}
            stroke="var(--color-primary)"
            strokeWidth={3}
            dot={{
              r: chartData.length === 1 ? 5 : 3,
              fill: 'var(--color-primary)'
            }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
