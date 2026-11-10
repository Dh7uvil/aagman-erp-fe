"use client";

import { Plus } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { MultiSelect, type MultiSelectOption } from "@/shared/components/ui/multi-select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/cn";

export function MasterMultiSelect({
  options,
  value,
  onValueChange,
  disabled,
  placeholder,
  emptyText,
  showSelectedSummary,
  className,
  createLabel,
  onCreate,
  "aria-label": ariaLabel,
}: {
  options: MultiSelectOption[];
  value: string[];
  onValueChange: (value: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  emptyText?: string;
  showSelectedSummary?: boolean;
  className?: string;
  createLabel?: string;
  onCreate?: () => void;
  "aria-label"?: string;
}) {
  const canCreate = Boolean(onCreate && createLabel && !disabled);

  return (
    <div className={cn("flex w-full items-center gap-1", className)}>
      <div className="min-w-0 flex-1">
        <MultiSelect
          options={options}
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          placeholder={placeholder}
          emptyText={emptyText}
          showSelectedSummary={showSelectedSummary}
          aria-label={ariaLabel}
        />
      </div>
      {canCreate ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-9 shrink-0"
              aria-label={createLabel}
              onClick={onCreate}
            >
              <Plus className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{createLabel}</TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  );
}
