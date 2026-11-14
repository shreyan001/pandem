import React, { forwardRef } from "react";

export interface SectionProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  bordered?: boolean;
}

export const Section = forwardRef<HTMLElement, SectionProps>(
  ({ title, description, badge, actions, bordered = true, children, className = "", ...props }, ref) => {
    return (
      <section
        ref={ref}
        className={`bg-spectr-surface p-6 sm:p-8 space-y-6 ${
          bordered ? "border border-spectr-hairline rounded-none" : ""
        } ${className}`}
        {...props}
      >
        {(title || actions) && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-spectr-hairline pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {title && (
                  <h2 className="text-base font-bold font-sans text-spectr-ink tracking-tight">
                    {title}
                  </h2>
                )}
                {badge && <div>{badge}</div>}
              </div>
              {description && (
                <p className="text-xs font-mono text-spectr-body">{description}</p>
              )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        )}
        {children}
      </section>
    );
  }
);
Section.displayName = "Section";
