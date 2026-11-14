import React, { useEffect } from "react";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  position?: "right" | "left" | "bottom";
  width?: "sm" | "md" | "lg" | "xl";
  closeOnBackdrop?: boolean;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  position = "right",
  width = "md",
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

  const widthStyles: Record<string, string> = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  const positionStyles: Record<string, string> = {
    right: `top-0 right-0 bottom-0 w-full ${widthStyles[width]} border-l border-spectr-hairline`,
    left: `top-0 left-0 bottom-0 w-full ${widthStyles[width]} border-r border-spectr-hairline`,
    bottom: "bottom-0 left-0 right-0 w-full max-h-[80vh] border-t border-spectr-hairline",
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={() => closeOnBackdrop && onClose()}
      />

      {/* Drawer Panel */}
      <div
        className={`fixed ${positionStyles[position]} bg-spectr-surface rounded-none shadow-2xl z-10 font-sans flex flex-col`}
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
            aria-label="Close drawer"
          >
            <span className="font-mono text-sm leading-none">✕</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-sm text-spectr-body leading-relaxed">
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
