import { Activity, Dumbbell, History, Home, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useI18n } from '../../i18n/useI18n';

const items = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/history', label: 'History', icon: History },
  { to: '/workout/start', label: 'Start', icon: Dumbbell, primary: true },
  { to: '/exercises', label: 'Exercises', icon: Activity },
  { to: '/settings', label: 'Settings', icon: Settings }
];

export function BottomNavigation() {
  const { t } = useI18n();
  return (
    <nav className="bottom-nav" aria-label={t('Primary navigation')}>
      {items.map(({ to, label, icon: Icon, primary, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            [
              'bottom-nav__item',
              primary && 'bottom-nav__item--primary',
              isActive && 'is-active'
            ]
              .filter(Boolean)
              .join(' ')
          }
        >
          <Icon aria-hidden="true" size={21} strokeWidth={2.2} />
          <span>{t(label)}</span>
        </NavLink>
      ))}
    </nav>
  );
}
