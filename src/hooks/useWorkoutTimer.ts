import { useEffect, useState } from 'react';

export function useWorkoutTimer(startedAt?: string) {
  const calculateElapsed = () =>
    startedAt
      ? Math.max(
          0,
          Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
        )
      : 0;
  const [elapsedSeconds, setElapsedSeconds] = useState(calculateElapsed);
  useEffect(() => {
    const updateElapsed = () =>
      setElapsedSeconds(
        startedAt
          ? Math.max(
              0,
              Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
            )
          : 0
      );
    const interval = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(interval);
  }, [startedAt]);
  return elapsedSeconds;
}
