"use client";

import * as React from "react";
import { ChevronDownIcon, Search } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import {
  shouldSearchOptions,
} from "@/shared/components/form/searchable-select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/lib/cn";

export type MultiSelectOption = {
  value: string;
  label: string;
};

export function MultiSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select…",
  emptyText = "No options available.",
  showSelectedSummary = true,
  className,
  disabled,
  searchable,
  ...props
}: Omit<React.ComponentProps<"button">, "value" | "onChange"> & {
  options: MultiSelectOption[];
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  emptyText?: string;
  showSelectedSummary?: boolean;
  searchable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const showSearch = shouldSearchOptions({ searchable, optionCount: options.length });

  const selectedLabels = options
    .filter((option) => value.includes(option.value))
    .map((option) => option.label);
  const summary =
    showSelectedSummary && selectedLabels.length > 0 ? selectedLabels.join(", ") : placeholder;

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!showSearch || !needle) {
      return options;
    }
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(needle) || option.value.toLowerCase().includes(needle),
    );
  }, [options, query, showSearch]);

  return (
    <DropdownMenu
      modal={false}
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setQuery("");
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          data-slot="multi-select-trigger"
          data-placeholder={summary === placeholder ? "" : undefined}
          className={cn(
            "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 bg-input-background flex h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-sm transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          {...props}
        >
          <span className="min-w-0 flex-1 truncate">{summary}</span>
          <ChevronDownIcon className="size-4 shrink-0 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="flex max-h-60 min-w-(--radix-dropdown-menu-trigger-width) w-max max-w-[min(36rem,calc(100vw-2rem))] flex-col overflow-hidden p-0"
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        {showSearch ? (
          <div className="shrink-0 p-1.5">
            <div className="relative">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
              <Input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search…"
                aria-label="Search options"
                autoComplete="off"
                className="h-8 pl-8"
                onPointerDown={(event) => event.stopPropagation()}
                onKeyDown={(event) => {
                  if (
                    event.key === "ArrowDown" ||
                    event.key === "ArrowUp" ||
                    event.key === "Enter" ||
                    event.key === "Escape" ||
                    event.key === "Home" ||
                    event.key === "End" ||
                    event.key === "Tab"
                  ) {
                    return;
                  }
                  event.stopPropagation();
                }}
              />
            </div>
          </div>
        ) : null}
        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1"
          onWheel={(event) => event.stopPropagation()}
        >
          {filtered.length === 0 ? (
            <p className="text-muted-foreground px-2 py-1.5 text-xs">{emptyText}</p>
          ) : (
            filtered.map((option) => {
              const checked = value.includes(option.value);
              return (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={checked}
                  onSelect={(event) => event.preventDefault()}
                  onCheckedChange={(nextChecked) => {
                    onValueChange(
                      nextChecked
                        ? [...value, option.value]
                        : value.filter((selected) => selected !== option.value),
                    );
                  }}
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
