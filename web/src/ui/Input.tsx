import React, { forwardRef } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  mono?: boolean;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      mono = false,
      leftAddon,
      rightAddon,
      disabled,
      className = "",
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5 font-sans">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-spectr-ink uppercase tracking-wide">
            {label}
          </label>
        )}

        <div className="relative flex items-center w-full">
          {leftAddon && (
            <div className="absolute left-0 pl-3.5 flex items-center pointer-events-none text-spectr-muted text-xs font-mono">
              {leftAddon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={`w-full bg-spectr-canvas border rounded-none text-spectr-ink placeholder-spectr-muted text-sm px-3.5 py-2.5 min-h-[44px] transition-colors focus:outline-none focus:ring-1 ${
              mono ? "font-mono text-xs" : "font-sans"
            } ${leftAddon ? "pl-10" : ""} ${rightAddon ? "pr-10" : ""} ${
              error
                ? "border-spectr-danger focus:border-spectr-danger focus:ring-spectr-danger"
                : "border-spectr-hairline focus:border-spectr-primary focus:ring-spectr-primary"
            } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
            {...props}
          />

          {rightAddon && (
            <div className="absolute right-0 pr-3.5 flex items-center pointer-events-none text-spectr-muted text-xs font-mono">
              {rightAddon}
            </div>
          )}
        </div>

        {error && <p className="text-xs text-spectr-danger font-mono mt-1">{error}</p>}
        {!error && helperText && (
          <p className="text-xs text-spectr-muted font-sans mt-1">{helperText}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  mono?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, mono = false, disabled, className = "", id, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5 font-sans">
        {label && (
          <label htmlFor={textareaId} className="block text-xs font-semibold text-spectr-ink uppercase tracking-wide">
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          className={`w-full bg-spectr-canvas border rounded-none text-spectr-ink placeholder-spectr-muted text-sm px-3.5 py-2.5 transition-colors focus:outline-none focus:ring-1 ${
            mono ? "font-mono text-xs" : "font-sans"
          } ${
            error
              ? "border-spectr-danger focus:border-spectr-danger focus:ring-spectr-danger"
              : "border-spectr-hairline focus:border-spectr-primary focus:ring-spectr-primary"
          } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
          {...props}
        />

        {error && <p className="text-xs text-spectr-danger font-mono mt-1">{error}</p>}
        {!error && helperText && (
          <p className="text-xs text-spectr-muted font-sans mt-1">{helperText}</p>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
