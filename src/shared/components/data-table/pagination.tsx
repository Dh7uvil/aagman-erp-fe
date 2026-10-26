"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useId } from "react";

import { PAGE_SIZE_OPTIONS } from "@/config/constants";
import type { PaginationMeta } from "@/shared/api/envelope";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { Button } from "@/shared/components/ui/button";
import { useTableParams } from "@/shared/hooks/use-table-params";

/** Shown in the page-size select on list screens (e.g. "10 / page"). */
export const PAGE_SIZE_OPTION_SUFFIX = " / page";

function compactPageItems(current: number, total: number): Array<number | "ellipsis"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  if (current <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis", total];
  }

  if (current >= total - 3) {
    return [1, "ellipsis", total - 4, total - 3, total - 2, total - 1, total];
  }

  return [1, "ellipsis", current - 1, current, current + 1, "ellipsis", total];
}

function PaginationControls({
  meta,
  onPageChange,
  onPageSizeChange,
  rangeItemLabel,
  pageSizeOptionSuffix = PAGE_SIZE_OPTION_SUFFIX,
}: {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  /** e.g. "widths" → "1–25 of 79 widths" */
  rangeItemLabel?: string;
  /** Appended to each page-size option (default `" / page"`). */
  pageSizeOptionSuffix?: string;
}) {
  const pageSizeId = useId();
  const totalPages = Math.max(meta.total_pages, 1);
  const from = meta.total === 0 ? 0 : (meta.page - 1) * meta.page_size + 1;
  const to = Math.min(meta.page * meta.page_size, meta.total);
  const pages = compactPageItems(meta.page, totalPages);
  const pageSize = String(meta.page_size);
  const pageSizeOptions = PAGE_SIZE_OPTIONS.some((option) => option === meta.page_size)
    ? PAGE_SIZE_OPTIONS
    : ([meta.page_size, ...PAGE_SIZE_OPTIONS] as const);

  function handlePageSizeChange(value: string) {
    const next = Number.parseInt(value, 10);
    if (!Number.isFinite(next) || next === meta.page_size) {
      return;
    }
    onPageSizeChange(next);
  }

  return (
    <div className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2.5">
        <FilterSelect
          id={pageSizeId}
          hideLabel
          className="h-9 min-w-[3.25rem] w-20 shrink-0 px-2 text-sm tabular-nums"
          placeholder="10"
          aria-label="Rows per page"
          value={pageSize}
          onValueChange={handlePageSizeChange}
          options={pageSizeOptions.map((option) => ({
            value: String(option),
            label: `${option}${pageSizeOptionSuffix}`,
            ...(pageSizeOptionSuffix ? { triggerLabel: String(option) } : {}),
          }))}
        />
        {meta.total > 0 ? (
          <p className="text-muted-foreground text-sm">
            {`${from}–${to} of ${meta.total}${rangeItemLabel ? ` ${rangeItemLabel}` : ""}`}
          </p>
        ) : null}
      </div>
      {meta.total > 0 ? (
        <nav className="flex min-w-0 items-center gap-1" aria-label="Pagination">
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Previous"
            disabled={meta.page <= 1}
            onClick={() => onPageChange(meta.page - 1)}
          >
            <ChevronLeft className="size-3.5" />
            <span className="hidden sm:inline">Previous</span>
          </Button>
          <div className="flex items-center gap-1 overflow-x-auto">
            {pages.map((item, index) =>
              item === "ellipsis" ? (
                <span
                  key={`ellipsis-${index}`}
                  className="text-muted-foreground px-1 text-xs"
                  aria-hidden="true"
                >
                  …
                </span>
              ) : (
                <Button
                  key={item}
                  type="button"
                  variant={item === meta.page ? "default" : "outline"}
                  size="sm"
                  aria-current={item === meta.page ? "page" : undefined}
                  aria-label={`Page ${item}`}
                  className="min-w-8 px-2"
                  onClick={() => {
                    if (item !== meta.page) {
                      onPageChange(item);
                    }
                  }}
                >
                  {item}
                </Button>
              ),
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Next"
            disabled={meta.page >= totalPages}
            onClick={() => onPageChange(meta.page + 1)}
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="size-3.5" />
          </Button>
        </nav>
      ) : null}
    </div>
  );
}

function DataTablePaginationFromUrl({
  meta,
  onPageChange,
}: {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}) {
  const { setPageSize } = useTableParams();
  return (
    <PaginationControls
      meta={meta}
      onPageChange={onPageChange}
      onPageSizeChange={setPageSize}
      pageSizeOptionSuffix={PAGE_SIZE_OPTION_SUFFIX}
    />
  );
}

export function DataTablePagination({
  meta,
  onPageChange,
  onPageSizeChange,
  rangeItemLabel,
  pageSizeOptionSuffix,
}: {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  rangeItemLabel?: string;
  pageSizeOptionSuffix?: string;
}) {
  if (onPageSizeChange) {
    return (
      <PaginationControls
        meta={meta}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        rangeItemLabel={rangeItemLabel}
        pageSizeOptionSuffix={pageSizeOptionSuffix}
      />
    );
  }
  return <DataTablePaginationFromUrl meta={meta} onPageChange={onPageChange} />;
}
