"use client";

import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { cn } from "@/shared/lib/cn";

type KpiCardProps = {
  label: string;
  icon: LucideIcon;
  isLoading: boolean;
  unit?: string;
  className?: string;
} & (
  | { value: number | undefined; displayValue?: never }
  | { displayValue: string | undefined; value?: never }
);

export function KpiCard({
  label,
  icon: Icon,
  isLoading,
  unit,
  className,
  value,
  displayValue,
}: KpiCardProps) {
  const rendered =
    displayValue !== undefined ? displayValue : value === undefined ? "—" : value.toLocaleString();

  // Long values would otherwise truncate inside the narrow card column on mobile.
  const valueSize = rendered.length > 11 ? "text-lg" : rendered.length > 8 ? "text-xl" : "text-2xl";

  return (
    <Card className={cn("hover:border-primary/30 h-full gap-0 transition-colors", className)}>
      <CardContent className="flex h-full flex-col justify-between gap-3 p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-muted-foreground text-[11px] leading-tight font-medium tracking-wide uppercase sm:text-xs">
            {label}
          </p>
          <div className="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-lg">
            <Icon className="text-primary size-4" />
          </div>
        </div>

        {isLoading ? (
          <Skeleton className="h-7 w-20" />
        ) : (
          <div className="flex min-w-0 items-baseline gap-1.5">
            <span
              className={cn(
                "truncate font-mono leading-none font-semibold tabular-nums",
                valueSize,
              )}
            >
              {rendered}
            </span>
            {unit ? (
              <span className="text-muted-foreground shrink-0 text-sm font-medium">{unit}</span>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
