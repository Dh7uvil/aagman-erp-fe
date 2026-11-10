"use client";

import { useCallback, useMemo, useState } from "react";

import { useDayReport } from "@/modules/inventory/movements/queries";
import type { DayReportRow } from "@/modules/inventory/movements/schemas";
import { inventoryPricePermissions } from "@/modules/inventory/permissions";
import { formatPricePerUnit } from "@/modules/inventory/format";
import { getErrorMessage } from "@/shared/api/errors";
import { formatDecimal } from "@/shared/lib/format";
import { type DataTableColumn } from "@/shared/components/data-table/columns";
import { ListView } from "@/shared/components/data-table/list-view";
import { ListViewToolbarControls } from "@/shared/components/data-table/list-view-toggle";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { useTableColumns } from "@/shared/components/data-table/use-table-columns";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { DateRangeFilter } from "@/shared/components/data-table/date-range-filter";
import { useListView } from "@/shared/hooks/use-list-view";
import { useReportExport } from "@/shared/hooks/use-report-export";
import { useCan } from "@/shared/providers/session-provider";

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function MovementsScreen() {
  const can = useCan();
  const canViewPrice = can(inventoryPricePermissions.read);
  const [startDate, setStartDate] = useState(todayIsoDate);
  const [endDate, setEndDate] = useState(todayIsoDate);
  const reportQuery = useDayReport(startDate, endDate);
  const reportRows = reportQuery.data?.data ?? [];
  const reportMeta = reportQuery.data?.meta;

  const columnDefs = useMemo((): Array<DataTableColumn<DayReportRow>> => {
    const cols: Array<DataTableColumn<DayReportRow>> = [
      {
        id: "product",
        header: "Product",
        cell: (row) => row.product_name,
      },
      {
        id: "micron",
        header: "Micron",
        cell: (row) => row.micron_name,
      },
      {
        id: "size",
        header: "Size",
        cell: (row) => formatDecimal(row.size) + (row.size_unit_code ? ` ${row.size_unit_code}` : ""),
      },
      {
        id: "in_rolls",
        header: "In rolls",
        numeric: true,
        cell: (row) => formatDecimal(row.in_rolls),
      },
      { id: "in_kg", header: "In kg", numeric: true, cell: (row) => formatDecimal(row.in_kg) },
      {
        id: "out_rolls",
        header: "Out rolls",
        numeric: true,
        cell: (row) => formatDecimal(row.out_rolls),
      },
      { id: "out_kg", header: "Out kg", numeric: true, cell: (row) => formatDecimal(row.out_kg) },
      {
        id: "closing_rolls",
        header: "Closing rolls",
        numeric: true,
        cell: (row) => formatDecimal(row.closing_rolls),
      },
      {
        id: "closing_kg",
        header: "Closing kg",
        numeric: true,
        cell: (row) => formatDecimal(row.closing_kg),
      },
    ];
    if (canViewPrice) {
      cols.push({
        id: "price_per_unit",
        header: "Current price",
        cell: (row) => formatPricePerUnit(row.price_per_unit, row.price_unit_code),
      });
      cols.push({
        id: "avg_price_per_unit",
        header: "Avg price",
        defaultVisible: false,
        cell: (row) => formatPricePerUnit(row.avg_price_per_unit ?? null, row.price_unit_code),
      });
    }
    return cols;
  }, [canViewPrice]);

  const { columns, columnsDialog, colSpan } = useTableColumns(
    "inventory.materials_report",
    columnDefs,
    { pinnedCount: 0 },
  );
  const listView = useListView("inventory.materials_report");

  const buildExportParams = useCallback(
    () => ({
      start_date: startDate,
      end_date: endDate,
    }),
    [startDate, endDate],
  );

  const { exportDialog } = useReportExport({
    tableKey: "inventory.materials_report",
    columnDefs,
    exportPath: "/inventory/material-movements/report/export",
    buildParams: buildExportParams,
    filteredRowCount: reportMeta?.total,
    enabled: true,
  });

  return (
    <ListPage>
      <PageHeader
        title="Materials report"
        subtitle="In and out totals for the selected date range; closing balance as of the end date."
      />
      <DataTableToolbar>
        <DateRangeFilter
          layout="inline"
          from={startDate}
          to={endDate}
          fromId="materials-report-start-date"
          toId="materials-report-end-date"
          fromLabel="Start date"
          toLabel="End date"
          onFromChange={setStartDate}
          onToChange={setEndDate}
          showToday
          onToday={() => {
            const today = todayIsoDate();
            setStartDate(today);
            setEndDate(today);
          }}
        />
        <ListViewToolbarControls listView={listView} columnsDialog={columnsDialog} exportDialog={exportDialog} />
      </DataTableToolbar>
      <ListView
        columns={columns}
        colSpan={colSpan}
        rows={reportRows}
        getRowKey={(row) => `${row.category_id}-${row.product_name}-${row.micron_name}`}
        getRowLabel={(row) => row.product_name}
        isLoading={reportQuery.isLoading}
        isError={reportQuery.isError}
        error={
          <DataTableError
            message={getErrorMessage(reportQuery.error)}
            onRetry={() => reportQuery.refetch()}
          />
        }
        columnTotals={reportQuery.data?.meta?.column_totals ?? null}
        empty={<DataTableEmpty message="No active materials to report." />}
        listView={listView}
      />
    </ListPage>
  );
}
