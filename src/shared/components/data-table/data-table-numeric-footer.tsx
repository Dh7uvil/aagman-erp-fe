"use client";

import type { DataTableColumn } from "@/shared/components/data-table/columns";
import { isActionsColumn } from "@/shared/components/data-table/columns";
import { TableCell, TableFooter, TableRow } from "@/shared/components/ui/table";
import { cn } from "@/shared/lib/cn";

export function DataTableNumericFooter<T>({
  columns,
  columnTotals,
  className,
}: {
  columns: readonly DataTableColumn<T>[];
  columnTotals: Record<string, string>;
  className?: string;
}) {
  const hasTotals = columns.some(
    (column) => !isActionsColumn(column) && column.numeric && columnTotals[column.id],
  );
  if (!hasTotals) {
    return null;
  }

  let firstData = true;

  return (
    <TableFooter className={cn("bg-muted/40", className)}>
      <TableRow>
        {columns.map((column) => {
          if (isActionsColumn(column)) {
            return <TableCell key={column.id} className={column.className} />;
          }
          if (firstData) {
            firstData = false;
            return (
              <TableCell key={column.id} className={cn("font-medium", column.className)}>
                Total
              </TableCell>
            );
          }
          const total = column.numeric ? columnTotals[column.id] : undefined;
          return (
            <TableCell
              key={column.id}
              className={cn("font-medium tabular-nums", column.className)}
            >
              {total ?? ""}
            </TableCell>
          );
        })}
      </TableRow>
    </TableFooter>
  );
}
