import React, { forwardRef } from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, hoverable = false, className = "", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`bg-spectr-surface border border-spectr-hairline rounded-none text-spectr-ink transition-colors duration-150 ${
          hoverable ? "hover:border-spectr-primary/70" : ""
        } ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  bordered?: boolean;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ children, bordered = false, className = "", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`p-5 flex flex-col space-y-1.5 ${
          bordered ? "border-b border-spectr-hairline" : ""
        } ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);
CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ children, className = "", ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={`text-lg font-bold tracking-tight text-spectr-ink font-sans ${className}`}
        {...props}
      >
        {children}
      </h3>
    );
  }
);
CardTitle.displayName = "CardTitle";

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ children, className = "", ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={`text-xs text-spectr-body font-sans leading-relaxed ${className}`}
      {...props}
    >
      {children}
    </p>
  );
});
CardDescription.displayName = "CardDescription";

export const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className = "", ...props }, ref) => {
    return (
      <div ref={ref} className={`p-5 pt-0 text-sm font-sans text-spectr-body ${className}`} {...props}>
        {children}
      </div>
    );
  }
);
CardContent.displayName = "CardContent";

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  bordered?: boolean;
}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ children, bordered = true, className = "", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`p-5 flex items-center justify-between text-xs font-mono text-spectr-muted ${
          bordered ? "border-t border-spectr-hairline" : ""
        } ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);
CardFooter.displayName = "CardFooter";
