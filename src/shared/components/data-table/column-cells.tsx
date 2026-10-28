"use client";

import {
  isListOpenColumn,
  stickyActionsCellClass,
  stickyActionsHeadClass,
  stickyIdentityCellClass,
  stickyIdentityHeadClass,
  type DataTableColumn,
} from "@/shared/components/data-table/columns";
import { ViewCellContent } from "@/shared/components/data-table/view-cell";
import { SortableTableHead } from "@/shared/components/data-table/sortable-head";
import type { SortPatch } from "@/shared/components/data-table/sort";
import { TableCell, TableHead } from "@/shared/components/ui/table";
import type { SortOrder } from "@/shared/hooks/use-table-params";
import { cn } from "@/shared/lib/cn";

export function DataTableColumnHeads<T>({
  columns,
  sortBy,
  sortOrder,
  onSort,
}: {
  columns: readonly DataTableColumn<T>[];
  sortBy?: string;
  sortOrder?: SortOrder;
  onSort?: (next: SortPatch) => void;
}) {
  return (
    <>
      {columns.map((column, index) => {
        const isFirstIdentity = index === 0 && column.id !== "actions";
        const className = cn(
          column.headerClassName,
          isFirstIdentity && stickyIdentityHeadClass,
          column.sticky === "right" && stickyActionsHeadClass,
        );
        if (!column.sortableField || !onSort) {
          return (
            <TableHead key={column.id} className={className}>
              {column.header}
            </TableHead>
          );
        }
        return (
          <SortableTableHead
            key={column.id}
            field={column.sortableField}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={onSort}
            className={className}
          >
            {column.header}
          </SortableTableHead>
        );
      })}
    </>
  );
}

export function DataTableCells<T>({
  columns,
  row,
  onRowClick,
}: {
  columns: readonly DataTableColumn<T>[];
  row: T;
  onRowClick?: (row: T) => void;
}) {
  return (
    <>
      {columns.map((column, index) => {
        const isFirstIdentity = index === 0 && column.id !== "actions";
        const opensView = Boolean(onRowClick && isListOpenColumn(columns, index));
        return (
          <TableCell
            key={column.id}
            className={cn(
              column.className,
              isFirstIdentity && stickyIdentityCellClass,
              column.sticky === "right" && stickyActionsCellClass,
            )}
          >
            <ViewCellContent
              enabled={opensView}
              onActivate={() => onRowClick?.(row)}
            >
              {column.cell(row)}
            </ViewCellContent>
          </TableCell>
        );
      })}
    </>
  );
}
