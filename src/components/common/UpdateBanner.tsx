import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from './Button';

export function UpdateBanner() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    immediate: true,
    onRegisterError(error) {
      if (import.meta.env.DEV)
        console.error('Service worker registration failed', error);
    }
  });
  if (!needRefresh) return null;
  return (
    <div className="update-banner" role="status">
      <span>A new version is available.</span>
      <Button onClick={() => updateServiceWorker(true)}>Update</Button>
      <button
        type="button"
        onClick={() => setNeedRefresh(false)}
        aria-label="Dismiss update"
      >
        Later
      </button>
    </div>
  );
}
