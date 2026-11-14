import React, { useEffect } from "react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
  closeOnBackdrop?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = "md",
  closeOnBackdrop = true,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthStyles: Record<string, string> = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={() => closeOnBackdrop && onClose()}
      />

      {/* Modal Dialog */}
      <div
        className={`relative w-full ${maxWidthStyles[maxWidth]} bg-spectr-surface border border-spectr-hairline rounded-none shadow-2xl z-10 font-sans flex flex-col max-h-[90vh] overflow-hidden`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-6 border-b border-spectr-hairline flex items-start justify-between">
          <div className="space-y-1 pr-6">
            {title && (
              <h2 className="text-lg font-bold text-spectr-ink tracking-tight font-sans">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-xs text-spectr-body font-sans leading-relaxed">
                {description}
              </p>
            )}
          </div>
          {/* Sharp Close Button */}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-none border border-spectr-hairline bg-spectr-surface-raised hover:bg-neutral-800 text-spectr-body hover:text-spectr-ink flex items-center justify-center transition-colors shrink-0"
            aria-label="Close dialog"
          >
            <span className="font-mono text-sm leading-none">✕</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm text-spectr-body leading-relaxed">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-6 border-t border-spectr-hairline bg-spectr-surface-raised flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
