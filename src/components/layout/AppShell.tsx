import { Outlet, useLocation } from 'react-router-dom';
import { BottomNavigation } from './BottomNavigation';
import { UpdateBanner } from '../common/UpdateBanner';

export function AppShell() {
  const { pathname } = useLocation();
  const isActiveWorkout = pathname.startsWith('/workout/active/');

  return (
    <div className="app-shell">
      <main
        className={
          isActiveWorkout ? 'app-content app-content--workout' : 'app-content'
        }
      >
        <Outlet />
      </main>
      {!isActiveWorkout && <BottomNavigation />}
      <UpdateBanner />
    </div>
  );
}
