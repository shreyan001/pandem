import React from "react";

export type BadgeVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "score"
  | "category"
  | "outline";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
  pulse?: boolean;
  score?: number | string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  dot = false,
  pulse = false,
  score,
  className = "",
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-mono select-none rounded-none border leading-tight";

  const variantStyles: Record<BadgeVariant, string> = {
    default: "bg-spectr-surface-raised border-spectr-hairline text-spectr-ink",
    primary: "bg-spectr-primary/15 border-spectr-primary/50 text-spectr-primary-hover font-semibold",
    success: "bg-spectr-surface border-spectr-success/50 text-spectr-success font-medium",
    warning: "bg-spectr-surface border-spectr-warning/50 text-spectr-warning font-medium",
    danger: "bg-spectr-surface border-spectr-danger/50 text-spectr-danger font-medium",
    score: "bg-spectr-surface border-spectr-primary text-spectr-ink font-bold tracking-tight px-2.5 py-1",
    category:
      "bg-spectr-surface border-spectr-hairline text-spectr-muted text-xs uppercase tracking-wider",
    outline: "bg-transparent border-spectr-hairline text-spectr-body font-normal",
  };

  const dotColor: Record<BadgeVariant, string> = {
    default: "bg-spectr-muted",
    primary: "bg-spectr-primary",
    success: "bg-spectr-success",
    warning: "bg-spectr-warning",
    danger: "bg-spectr-danger",
    score: "bg-spectr-primary",
    category: "bg-spectr-muted",
    outline: "bg-spectr-muted",
  };

  return (
    <span className={`${baseStyles} ${variantStyles[variant]} ${className}`} {...props}>
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-none shrink-0 ${dotColor[variant]} ${
            pulse ? "animate-pulse" : ""
          }`}
        />
      )}
      {variant === "score" && score !== undefined ? (
        <span>
          <span className="text-spectr-muted text-xs mr-1 uppercase">Score</span>
          <span className="text-spectr-primary font-bold">{score}</span>
          <span className="text-spectr-muted text-xs">/100</span>
        </span>
      ) : (
        children
      )}
    </span>
  );
};
