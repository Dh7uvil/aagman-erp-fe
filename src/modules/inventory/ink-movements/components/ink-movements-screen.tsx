"use client";

import { useCallback, useMemo, useState } from "react";

import { InkHexSwatch } from "@/modules/inventory/ink-colors/components/ink-hex-swatch";
import { useInkDayReport } from "@/modules/inventory/ink-movements/queries";
import type { InkDayReportRow } from "@/modules/inventory/ink-movements/schemas";
import { formatPricePerUnit } from "@/modules/inventory/format";
import { inkPricePermissions } from "@/modules/inventory/permissions";
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

export function InkMovementsScreen() {
  const can = useCan();
  const canViewPrice = can(inkPricePermissions.read);
  const [startDate, setStartDate] = useState(todayIsoDate);
  const [endDate, setEndDate] = useState(todayIsoDate);
  const reportQuery = useInkDayReport(startDate, endDate);
  const reportRows = reportQuery.data?.data ?? [];
  const reportMeta = reportQuery.data?.meta;

  const columnDefs = useMemo((): Array<DataTableColumn<InkDayReportRow>> => {
    const cols: Array<DataTableColumn<InkDayReportRow>> = [
      { id: "company", header: "Company", cell: (row) => row.company_name },
      { id: "brand", header: "Brand", cell: (row) => row.brand_name },
      {
        id: "color",
        header: "Color",
        cell: (row) => (
          <span className="inline-flex items-center gap-2">
            {row.color_name}
            <InkHexSwatch hex={row.hex_code} showCode={false} />
          </span>
        ),
      },
      {
        id: "in_drums",
        header: "In drums",
        numeric: true,
        cell: (row) => formatDecimal(row.in_drums),
      },
      {
        id: "in_qty",
        header: "In qty",
        numeric: true,
        cell: (row) => `${formatDecimal(row.in_qty)} ${row.drum_unit_code}`,
      },
      {
        id: "out_drums",
        header: "Out drums",
        numeric: true,
        cell: (row) => formatDecimal(row.out_drums),
      },
      {
        id: "out_qty",
        header: "Out qty",
        numeric: true,
        cell: (row) => `${formatDecimal(row.out_qty)} ${row.drum_unit_code}`,
      },
      {
        id: "closing_drums",
        header: "Closing drums",
        numeric: true,
        cell: (row) => formatDecimal(row.closing_drums),
      },
      {
        id: "closing_qty",
        header: "Closing qty",
        numeric: true,
        cell: (row) => `${formatDecimal(row.closing_qty)} ${row.drum_unit_code}`,
      },
    ];
    if (canViewPrice) {
      cols.push({
        id: "ink_rate",
        header: "Ink rate",
        cell: (row) => formatPricePerUnit(row.ink_rate, row.drum_unit_code),
      });
    }
    return cols;
  }, [canViewPrice]);

  const { columns, columnsDialog, colSpan } = useTableColumns(
    "inventory.inks_report",
    columnDefs,
    { pinnedCount: 0 },
  );
  const listView = useListView("inventory.inks_report");

  const buildExportParams = useCallback(
    () => ({
      start_date: startDate,
      end_date: endDate,
    }),
    [startDate, endDate],
  );

  const { exportDialog } = useReportExport({
    tableKey: "inventory.inks_report",
    columnDefs,
    exportPath: "/inventory/ink-movements/report/export",
    buildParams: buildExportParams,
    filteredRowCount: reportMeta?.total,
    enabled: true,
  });

  return (
    <ListPage>
      <PageHeader
        title="Inks report"
        subtitle="In and out totals for the selected date range; closing balance as of the end date."
      />
      <DataTableToolbar>
        <DateRangeFilter
          layout="inline"
          from={startDate}
          to={endDate}
          fromId="ink-report-start-date"
          toId="ink-report-end-date"
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
        getRowKey={(row) => row.ink_line_id}
        getRowLabel={(row) => `${row.company_name} ${row.brand_name}`}
        isLoading={reportQuery.isLoading}
        isError={reportQuery.isError}
        error={
          <DataTableError
            message={getErrorMessage(reportQuery.error)}
            onRetry={() => reportQuery.refetch()}
          />
        }
        columnTotals={reportQuery.data?.meta?.column_totals ?? null}
        empty={<DataTableEmpty message="No ink movements for this date." />}
        listView={listView}
      />
    </ListPage>
  );
}
