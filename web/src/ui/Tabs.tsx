import React from "react";

export interface TabItem {
  id: string;
  label: React.ReactNode;
  badge?: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: "underline" | "enclosed";
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  activeTab,
  onChange,
  variant = "underline",
  className = "",
}) => {
  if (variant === "enclosed") {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {items.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              disabled={tab.disabled}
              onClick={() => onChange(tab.id)}
              className={`px-4 py-2 text-xs font-semibold font-mono tracking-wider rounded-none uppercase transition-all duration-150 inline-flex items-center gap-2 select-none border min-h-[36px] ${
                isActive
                  ? "bg-spectr-primary border-spectr-primary text-spectr-ink"
                  : "bg-spectr-surface border-spectr-hairline text-spectr-muted hover:text-spectr-ink hover:border-neutral-600"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <span>{tab.label}</span>
              {tab.badge && <span>{tab.badge}</span>}
            </button>
          );
        })}
      </div>
    );
  }

  // Underline variant (default)
  return (
    <div className={`flex border-b border-spectr-hairline gap-4 sm:gap-6 overflow-x-auto ${className}`}>
      {items.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            className={`pb-3 pt-1 text-sm font-sans font-medium transition-colors relative whitespace-nowrap inline-flex items-center gap-2 select-none ${
              isActive
                ? "text-spectr-ink font-semibold"
                : "text-spectr-muted hover:text-spectr-body"
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <span>{tab.label}</span>
            {tab.badge && <span>{tab.badge}</span>}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-spectr-primary" />
            )}
          </button>
        );
      })}
    </div>
  );
};
