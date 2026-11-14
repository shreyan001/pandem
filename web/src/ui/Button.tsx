import React, { forwardRef } from "react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      disabled,
      className = "",
      ...props
    },
    ref
  ) => {
    // Base styles: sharp corners (rounded-none), geometric precision, font-medium, transition
    const baseStyles =
      "inline-flex items-center justify-center font-sans select-none tracking-tight rounded-none transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-spectr-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:translate-y-[1px]";

    const sizeStyles: Record<ButtonSize, string> = {
      sm: "h-8 px-3 text-xs font-medium gap-1.5",
      md: "h-11 px-5 text-sm font-semibold gap-2 min-h-[44px]", // 44px min touch target
      lg: "h-14 px-7 text-base font-bold gap-2.5 min-h-[56px]", // 56px per Spectr button-lg
    };

    const variantStyles: Record<ButtonVariant, string> = {
      primary:
        "bg-spectr-primary text-spectr-ink border border-spectr-ink hover:bg-spectr-primary-hover active:bg-spectr-primary shadow-none",
      secondary:
        "bg-spectr-surface-raised text-spectr-ink border border-spectr-hairline hover:bg-neutral-800 hover:border-neutral-600 active:bg-neutral-900",
      outline:
        "bg-transparent text-spectr-ink border border-spectr-hairline hover:bg-spectr-surface hover:border-spectr-primary active:bg-spectr-surface-raised",
      ghost:
        "bg-transparent text-spectr-body hover:text-spectr-ink hover:bg-spectr-surface active:bg-spectr-surface-raised border border-transparent",
      danger:
        "bg-spectr-danger text-spectr-ink border border-red-700 hover:bg-red-600 active:bg-red-700",
    };

    const widthStyle = fullWidth ? "w-full" : "";

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${widthStyle} ${className}`}
        {...props}
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2 font-mono text-xs">
            {/* Geometric sharp spinner */}
            <svg
              className="animate-spin h-3.5 w-3.5 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <rect x="2" y="2" width="8" height="8" fill="currentColor" opacity="0.25" />
              <rect x="14" y="2" width="8" height="8" fill="currentColor" opacity="0.5" />
              <rect x="14" y="14" width="8" height="8" fill="currentColor" opacity="0.75" />
              <rect x="2" y="14" width="8" height="8" fill="currentColor" />
            </svg>
            <span>Processing...</span>
          </span>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
