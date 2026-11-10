"use client";

import { cn } from "@/shared/lib/cn";

export type DashboardInventorySection =
  | "materials"
  | "cylinders"
  | "inks"
  | "adhesives"
  | "solvents";

export const DASHBOARD_INVENTORY_SECTIONS: {
  id: DashboardInventorySection;
  label: string;
}[] = [
  { id: "materials", label: "Materials" },
  { id: "cylinders", label: "Cylinders" },
  { id: "inks", label: "Inks" },
  { id: "adhesives", label: "Adhesives" },
  { id: "solvents", label: "Solvents" },
];

export function DashboardSectionTabs({
  value,
  onChange,
  sections,
  className,
}: {
  value: DashboardInventorySection;
  onChange: (section: DashboardInventorySection) => void;
  sections: DashboardInventorySection[];
  className?: string;
}) {
  const options = DASHBOARD_INVENTORY_SECTIONS.filter((option) => sections.includes(option.id));

  if (options.length <= 1) {
    return null;
  }

  return (
    <div
      className={cn(
        "bg-muted/50 flex w-full gap-1 overflow-x-auto rounded-xl p-1 sm:inline-flex sm:w-auto",
        className,
      )}
      role="tablist"
      aria-label="Dashboard inventory section"
    >
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="tab"
          aria-selected={value === option.id}
          className={cn(
            "min-h-10 shrink-0 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors sm:min-h-9 sm:px-5 sm:py-2",
            value === option.id
              ? "bg-background text-foreground shadow-sm ring-1 ring-border/60"
              : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
          )}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
