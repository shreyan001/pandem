import React, { forwardRef } from "react";

export interface PageHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  description?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}

export const PageHeader = forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ title, description, badge, actions, className = "", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`border-b border-spectr-hairline pb-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${className}`}
        {...props}
      >
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold font-sans tracking-tight text-spectr-ink">
              {title}
            </h1>
            {badge && <div>{badge}</div>}
          </div>
          {description && (
            <p className="text-sm font-sans text-spectr-body max-w-2xl leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
      </div>
    );
  }
);
PageHeader.displayName = "PageHeader";
