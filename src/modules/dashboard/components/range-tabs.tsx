"use client";

import { cn } from "@/shared/lib/cn";
import type { DashboardRangeDays } from "@/modules/dashboard/schemas";

const OPTIONS: { days: DashboardRangeDays; label: string }[] = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
];

export function DashboardRangeTabs({
  value,
  onChange,
  className,
}: {
  value: DashboardRangeDays;
  onChange: (days: DashboardRangeDays) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-muted/50 grid w-full grid-cols-3 rounded-lg p-0.5 sm:inline-flex sm:w-auto",
        className,
      )}
      role="tablist"
      aria-label="Dashboard date range"
    >
      {OPTIONS.map((option) => (
        <button
          key={option.days}
          type="button"
          role="tab"
          aria-selected={value === option.days}
          className={cn(
            "rounded-md px-3 py-2 text-xs font-medium transition-colors sm:py-1.5",
            value === option.days
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => onChange(option.days)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
