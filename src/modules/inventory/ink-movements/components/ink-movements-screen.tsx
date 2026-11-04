"use client";

import { useMemo, useState } from "react";

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
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useListView } from "@/shared/hooks/use-list-view";
import { useCan } from "@/shared/providers/session-provider";

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function InkMovementsScreen() {
  const can = useCan();
  const canViewPrice = can(inkPricePermissions.read);
  const [reportDate, setReportDate] = useState(todayIsoDate);
  const reportQuery = useInkDayReport(reportDate);
  const reportRows = reportQuery.data ?? [];

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
      { id: "in_drums", header: "In drums", cell: (row) => formatDecimal(row.in_drums) },
      {
        id: "in_qty",
        header: "In qty",
        cell: (row) => `${formatDecimal(row.in_qty)} ${row.drum_unit_code}`,
      },
      { id: "out_drums", header: "Out drums", cell: (row) => formatDecimal(row.out_drums) },
      {
        id: "out_qty",
        header: "Out qty",
        cell: (row) => `${formatDecimal(row.out_qty)} ${row.drum_unit_code}`,
      },
      {
        id: "closing_drums",
        header: "Closing drums",
        cell: (row) => formatDecimal(row.closing_drums),
      },
      {
        id: "closing_qty",
        header: "Closing qty",
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

  return (
    <ListPage>
      <PageHeader
        title="Inks report"
        subtitle="Daily in, out, and closing balances for every active ink line."
      />
      <DataTableToolbar>
        <div className="flex w-full min-w-0 flex-col gap-1 sm:w-auto sm:flex-row sm:items-center sm:gap-2">
          <Label htmlFor="ink-report-date" className="text-sm text-muted-foreground">
            Date
          </Label>
          <Input
            id="ink-report-date"
            type="date"
            value={reportDate}
            onChange={(event) => setReportDate(event.target.value)}
            className="w-full sm:w-auto"
          />
        </div>
        <ListViewToolbarControls listView={listView} columnsDialog={columnsDialog} />
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
        empty={<DataTableEmpty message="No ink movements for this date." />}
        listView={listView}
      />
    </ListPage>
  );
}
