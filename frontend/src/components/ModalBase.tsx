import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

interface ModalBaseProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  labelledBy?: string;
}

// Base reutilizável para modais.
// Estilo: backdrop blur, centralização, scroll interno, animação simples fade/scale.
export function ModalBase({ open, onClose, children, maxWidth = 'lg', labelledBy }: ModalBaseProps) {
  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  }[maxWidth];
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    if (open) {
      document.addEventListener('keydown', onKey);
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
    }
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-start justify-center px-4 py-10 overflow-y-auto">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={`relative w-full ${maxWidthClass} rounded-2xl border border-amber-400/25 bg-[#0f1115]/95 dark:bg-slate-900/90 shadow-2xl ring-1 ring-slate-100/5 max-h-[90vh] overflow-y-auto animate-fade-in`}
      >
        {/* Glow background */}
        <div className="pointer-events-none absolute inset-0 opacity-40" style={{
          background: 'radial-gradient(circle at 20% 25%,rgba(251,191,36,0.18),transparent 60%), radial-gradient(circle at 80% 70%,rgba(249,115,22,0.16),transparent 65%)'
        }} />
        {children}
      </div>
    </div>,
    document.body
  );
}

export default ModalBase;
