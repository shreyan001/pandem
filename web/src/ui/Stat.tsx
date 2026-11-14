import React, { forwardRef } from "react";

export interface StatProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  badge?: React.ReactNode;
  tone?: "default" | "primary" | "success" | "warning" | "danger";
}

export const Stat = forwardRef<HTMLDivElement, StatProps>(
  ({ label, value, hint, badge, tone = "default", className = "", ...props }, ref) => {
    const toneColor = {
      default: "text-spectr-ink",
      primary: "text-spectr-primary",
      success: "text-spectr-success",
      warning: "text-spectr-warning",
      danger: "text-spectr-danger",
    }[tone];

    return (
      <div
        ref={ref}
        className={`p-4 bg-spectr-surface border border-spectr-hairline rounded-none space-y-1 ${className}`}
        {...props}
      >
        <div className="flex items-center justify-between text-xs font-mono text-spectr-muted uppercase tracking-wider">
          <span>{label}</span>
          {badge && <div>{badge}</div>}
        </div>
        <div className={`text-2xl font-bold font-mono tracking-tight tabular-nums ${toneColor}`}>
          {value}
        </div>
        {hint && (
          <div className="text-xs text-spectr-body font-mono pt-0.5">
            {hint}
          </div>
        )}
      </div>
    );
  }
);
Stat.displayName = "Stat";
