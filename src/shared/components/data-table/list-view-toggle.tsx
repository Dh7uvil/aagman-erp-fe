"use client";

import { LayoutGrid, Rows3 } from "lucide-react";
import type { ReactNode } from "react";

import type { ListViewMode, useListView } from "@/shared/hooks/use-list-view";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/cn";

export function ListViewToggle({
  view,
  setView,
  className,
}: {
  view: ListViewMode | undefined;
  setView: (mode: ListViewMode) => void;
  className?: string;
}) {
  const active = view ?? "cards";

  return (
    <div
      className={cn(
        "bg-muted inline-flex h-9 shrink-0 rounded-md p-0.5 md:hidden",
        className,
      )}
      role="group"
      aria-label="List view"
    >
      <Button
        type="button"
        variant={active === "cards" ? "secondary" : "ghost"}
        size="sm"
        className="h-8 px-2.5"
        aria-pressed={active === "cards"}
        aria-label="Card view"
        onClick={() => setView("cards")}
      >
        <LayoutGrid className="size-4" />
      </Button>
      <Button
        type="button"
        variant={active === "table" ? "secondary" : "ghost"}
        size="sm"
        className="h-8 px-2.5"
        aria-pressed={active === "table"}
        aria-label="Table view"
        onClick={() => setView("table")}
      >
        <Rows3 className="size-4" />
      </Button>
    </div>
  );
}

/**
 * Card/table toggle and column picker.
 * - Default: share a toolbar row (e.g. beside Sort); controls grouped on the right.
 * - `mobileFullRow`: own full-width row; toggle left, customize right.
 */
export function ListViewToolbarControls({
  listView,
  columnsDialog,
  mobileFullRow = false,
  className,
}: {
  listView: ReturnType<typeof useListView>;
  columnsDialog?: ReactNode;
  mobileFullRow?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-end gap-1 max-sm:w-full",
        mobileFullRow
          ? "max-sm:col-span-2 max-sm:justify-between max-sm:gap-2"
          : "max-sm:col-span-1 max-sm:min-w-0 max-sm:justify-end max-sm:justify-self-end",
        "sm:ml-auto sm:w-auto sm:shrink-0 sm:justify-end",
        className,
      )}
    >
      <ListViewToggle view={listView.view} setView={listView.setView} />
      {columnsDialog ? <div className="shrink-0">{columnsDialog}</div> : null}
    </div>
  );
}
