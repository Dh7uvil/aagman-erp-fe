"use client";

import type { ReactNode } from "react";

import {
  isListOpenColumn,
  resolveCardSlots,
  type CardColumnLayout,
  type DataTableColumn,
} from "@/shared/components/data-table/columns";
import { ViewCellContent } from "@/shared/components/data-table/view-cell";
import { Card } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { cn } from "@/shared/lib/cn";

function CardFieldGrid<T>({
  layout,
  row,
  columns,
  onRowClick,
}: {
  layout: CardColumnLayout<T>;
  row: T;
  columns: readonly DataTableColumn<T>[];
  onRowClick?: (row: T) => void;
}) {
  if (layout.fields.length === 0) {
    return null;
  }

  return (
    <dl className="grid grid-cols-1 gap-x-4 gap-y-3 min-[360px]:grid-cols-2">
      {layout.fields.map((column) => {
        const columnIndex = columns.findIndex((item) => item.id === column.id);
        const opensView =
          Boolean(onRowClick) &&
          columnIndex >= 0 &&
          isListOpenColumn(columns, columnIndex);
        return (
          <div key={column.id} className="min-w-0">
            <dt className="text-muted-foreground text-xs font-medium">{column.header}</dt>
            <dd className={cn("mt-0.5 text-sm break-words", column.className)}>
              <ViewCellContent enabled={opensView} onActivate={() => onRowClick?.(row)}>
                {column.cell(row)}
              </ViewCellContent>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

function DataTableCardRow<T>({
  row,
  columns,
  onRowClick,
  getRowLabel,
}: {
  row: T;
  columns: readonly DataTableColumn<T>[];
  onRowClick?: (row: T) => void;
  getRowLabel?: (row: T) => string;
}) {
  const layout = resolveCardSlots(columns);
  const label = getRowLabel?.(row);

  const headerContent = (
    <div className="flex min-h-11 min-w-0 flex-1 items-start gap-2">
      <div className="min-w-0 flex-1">
        {layout.title ? (
          <div className="truncate font-semibold">{layout.title.cell(row)}</div>
        ) : null}
        {layout.subtitle ? (
          <div className="text-muted-foreground truncate text-xs">{layout.subtitle.cell(row)}</div>
        ) : null}
      </div>
      {layout.badge ? (
        <div className="shrink-0">{layout.badge.cell(row)}</div>
      ) : null}
    </div>
  );

  return (
    <Card className="overflow-hidden py-0">
      <div className="flex flex-col gap-3 p-3">
        <div className="flex items-start gap-1">
          {onRowClick ? (
            <button
              type="button"
              className="flex min-h-11 min-w-0 flex-1 cursor-pointer rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => onRowClick(row)}
              aria-label={label ? `View ${label}` : "View record"}
            >
              {headerContent}
            </button>
          ) : (
            headerContent
          )}
          {layout.actions ? (
            <div className="shrink-0 self-start" onClick={(event) => event.stopPropagation()}>
              {layout.actions.cell(row)}
            </div>
          ) : null}
        </div>
        <CardFieldGrid
          layout={layout}
          row={row}
          columns={columns}
          onRowClick={onRowClick}
        />
      </div>
    </Card>
  );
}

export function DataTableCards<T>({
  columns,
  rows,
  getRowKey,
  getRowLabel,
  onRowClick,
  isLoading,
  empty,
  error,
  className,
}: {
  columns: readonly DataTableColumn<T>[];
  rows: readonly T[];
  getRowKey: (row: T) => string;
  getRowLabel?: (row: T) => string;
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  empty?: ReactNode;
  error?: ReactNode;
  className?: string;
}) {
  if (isLoading) {
    return (
      <ul className={cn("flex flex-col gap-2.5", className)}>
        {Array.from({ length: 5 }).map((_, index) => (
          <li key={index}>
            <Card className="p-3">
              <Skeleton className="mb-3 h-5 w-2/3" />
              <Skeleton className="mb-2 h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </Card>
          </li>
        ))}
      </ul>
    );
  }

  if (error) {
    return <div className={className}>{error}</div>;
  }

  if (rows.length === 0) {
    return <div className={className}>{empty}</div>;
  }

  return (
    <ul className={cn("flex flex-col gap-2.5", className)}>
      {rows.map((row) => (
        <li key={getRowKey(row)}>
          <DataTableCardRow
            row={row}
            columns={columns}
            onRowClick={onRowClick}
            getRowLabel={getRowLabel}
          />
        </li>
      ))}
    </ul>
  );
}
