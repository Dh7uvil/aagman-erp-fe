"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";

export function FilterChip({ label, onRemove }: { label: ReactNode; onRemove?: () => void }) {
  return (
    <Badge variant="secondary" className="h-7 gap-1 pr-1">
      <span className="max-w-40 truncate">{label}</span>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="hover:bg-background/60 cursor-pointer rounded-sm p-0.5"
          aria-label="Remove filter"
        >
          <X className="size-3" />
        </button>
      ) : null}
    </Badge>
  );
}

export function ActiveFilterBar({
  children,
  onClear,
  visible = true,
}: {
  children?: ReactNode;
  onClear?: () => void;
  visible?: boolean;
}) {
  if (!visible) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden">
      {children}
      {onClear ? (
        <Button type="button" variant="ghost" size="xs" onClick={onClear}>
          Clear
        </Button>
      ) : null}
    </div>
  );
}

export type ActiveFilterPill = {
  id: string;
  label: ReactNode;
  onRemove: () => void;
};

export function ActiveFilterPills({
  pills,
  onClearAll,
}: {
  pills: ActiveFilterPill[];
  onClearAll?: () => void;
}) {
  if (pills.length === 0) {
    return null;
  }

  return (
    <ActiveFilterBar onClear={onClearAll}>
      {pills.map((pill) => (
        <FilterChip key={pill.id} label={pill.label} onRemove={pill.onRemove} />
      ))}
    </ActiveFilterBar>
  );
}
