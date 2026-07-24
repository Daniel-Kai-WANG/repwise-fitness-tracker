import { useCallback, useSyncExternalStore } from 'react';
import { calculateRestSecondsRemaining } from '../services/restTimer';

export function useRestTimer(restTimerEndsAt?: string) {
  const getSnapshot = useCallback(
    () => calculateRestSecondsRemaining(restTimerEndsAt),
    [restTimerEndsAt]
  );

  const subscribe = useCallback((notify: () => void) => {
    const handleVisibilityChange = () => notify();
    const refreshInterval = window.setInterval(notify, 1000);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', notify);
    window.addEventListener('pageshow', notify);
    return () => {
      window.clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', notify);
      window.removeEventListener('pageshow', notify);
    };
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
