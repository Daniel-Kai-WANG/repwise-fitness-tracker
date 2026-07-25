import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { useI18n } from '../../i18n/useI18n';

interface ModalProps {
  title: string;
  children: ReactNode;
  onClose: () => void;
}

export function Modal({ title, children, onClose }: ModalProps) {
  const { t } = useI18n();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) =>
      event.key === 'Escape' && onClose();
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        ref={panelRef}
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
      >
        <div className="modal-panel__header">
          <h2 id="modal-title">{title}</h2>
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label={t('Close dialog')}
          >
            <X size={22} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
