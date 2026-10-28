"use client";

import type { ReactNode } from "react";

import { DataTableColumnHeads, DataTableCells } from "@/shared/components/data-table/column-cells";
import { DataTableCards } from "@/shared/components/data-table/data-table-cards";
import { DataTable } from "@/shared/components/data-table/data-table";
import type { DataTableColumn } from "@/shared/components/data-table/columns";
import type { SortPatch } from "@/shared/components/data-table/sort";
import { ListPageTable } from "@/shared/components/layout/list-page";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useMediaQuery } from "@/shared/hooks/use-media-query";
import { useSyncExternalStore } from "react";
import type { ListViewMode } from "@/shared/hooks/use-list-view";
import type { SortOrder } from "@/shared/hooks/use-table-params";
import { cn } from "@/shared/lib/cn";

function CardListFooter({ footer }: { footer: ReactNode }) {
  return (
    <div className="bg-card shrink-0 rounded-md border empty:hidden">{footer}</div>
  );
}

export function ListView<T>({
  columns,
  colSpan,
  rows,
  getRowKey,
  getRowLabel,
  onRowClick,
  isLoading,
  isError,
  error,
  empty,
  sort,
  listView,
  footer,
  className,
}: {
  columns: readonly DataTableColumn<T>[];
  colSpan: number;
  rows: readonly T[];
  getRowKey: (row: T) => string;
  getRowLabel?: (row: T) => string;
  onRowClick?: (row: T) => void;
  isLoading: boolean;
  isError: boolean;
  error?: ReactNode;
  empty: ReactNode;
  sort?: {
    sortBy?: string;
    sortOrder?: SortOrder;
    onSort?: (next: SortPatch) => void;
  };
  listView: {
    view: ListViewMode | undefined;
    mounted: boolean;
  };
  footer?: ReactNode;
  className?: string;
}) {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const hydrating = !isClient;
  const mobileMode = listView.view ?? "cards";

  const showCards = hydrating || (isMobile && mobileMode === "cards");
  const showTable = hydrating || !isMobile || mobileMode === "table";

  const errorNode = isError ? error : null;
  const emptyNode = !isLoading && !isError && rows.length === 0 ? empty : null;

  const cardsWrapClass = hydrating ? "md:hidden" : showCards ? undefined : "hidden";
  const tableWrapClass = hydrating ? "hidden md:block" : showTable ? undefined : "hidden";

  const cardsBlock = showCards ? (
    <div
      className={cn(
        cardsWrapClass,
        "flex flex-col gap-3",
        !showTable && !hydrating && className,
      )}
    >
      <DataTableCards
        columns={columns}
        rows={rows}
        getRowKey={getRowKey}
        getRowLabel={getRowLabel}
        onRowClick={onRowClick}
        isLoading={isLoading}
        error={errorNode}
        empty={emptyNode}
      />
      {footer && !isLoading && !isError ? <CardListFooter footer={footer} /> : null}
    </div>
  ) : null;

  const tableBlock = showTable ? (
    <div className={cn(tableWrapClass, !showCards && !hydrating && className)}>
      <DataTable footer={footer ?? null}>
        <TableHeader>
          <TableRow>
            <DataTableColumnHeads
              columns={columns}
              sortBy={sort?.sortBy}
              sortOrder={sort?.sortOrder}
              onSort={sort?.onSort}
            />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={colSpan}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : isError ? (
            <TableRow>
              <TableCell colSpan={colSpan}>{errorNode}</TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan}>{emptyNode}</TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={getRowKey(row)}>
                <DataTableCells columns={columns} row={row} onRowClick={onRowClick} />
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
    </div>
  ) : null;

  if (hydrating || (showCards && showTable)) {
    return (
      <ListPageTable className={hydrating ? className : undefined}>
        {cardsBlock}
        {tableBlock}
      </ListPageTable>
    );
  }

  return (
    <>
      {cardsBlock}
      {tableBlock}
    </>
  );
}
