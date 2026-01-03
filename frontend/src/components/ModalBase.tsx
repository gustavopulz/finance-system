import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { X } from "lucide-react";

interface ModalBaseProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
  labelledBy?: string;
  showClose?: boolean;
}

export function ModalBase({
  open,
  onClose,
  children,
  maxWidth = "lg",
  labelledBy,
  showClose = true,
}: ModalBaseProps) {
  const maxWidthClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  }[maxWidth];
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.addEventListener("keydown", onKey);
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", onKey);
        document.body.style.overflow = prev;
      };
    }
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={`w-full ${maxWidthClass} p-5 rounded shadow-lg bg-white dark:bg-slate-900 relative animate-fade-in`}
        style={{ maxHeight: "90vh", overflowY: "auto" }}
      >
        {showClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 text-slate-500 hover:text-red-500 text-xl font-bold rounded-full w-8 h-8 flex items-center justify-center focus:outline-none"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
}

export default ModalBase;
