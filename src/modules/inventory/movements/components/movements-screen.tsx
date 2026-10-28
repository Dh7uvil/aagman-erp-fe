"use client";

import { useMemo, useState } from "react";

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
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useListView } from "@/shared/hooks/use-list-view";
import { useCan } from "@/shared/providers/session-provider";

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function MovementsScreen() {
  const can = useCan();
  const canViewPrice = can(inventoryPricePermissions.read);
  const [reportDate, setReportDate] = useState(todayIsoDate);
  const reportQuery = useDayReport(reportDate);
  const reportRows = reportQuery.data ?? [];

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
      { id: "in_rolls", header: "In rolls", cell: (row) => formatDecimal(row.in_rolls) },
      { id: "in_kg", header: "In kg", cell: (row) => formatDecimal(row.in_kg) },
      { id: "out_rolls", header: "Out rolls", cell: (row) => formatDecimal(row.out_rolls) },
      { id: "out_kg", header: "Out kg", cell: (row) => formatDecimal(row.out_kg) },
      {
        id: "closing_rolls",
        header: "Closing rolls",
        cell: (row) => formatDecimal(row.closing_rolls),
      },
      { id: "closing_kg", header: "Closing kg", cell: (row) => formatDecimal(row.closing_kg) },
    ];
    if (canViewPrice) {
      cols.push({
        id: "price_per_unit",
        header: "Price",
        cell: (row) => formatPricePerUnit(row.price_per_unit, row.price_unit_code),
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

  return (
    <ListPage>
      <PageHeader
        title="Materials report"
        subtitle="Daily in, out, and closing balances for every active material."
      />
      <DataTableToolbar>
        <div className="flex w-full min-w-0 flex-col gap-1 sm:w-auto sm:flex-row sm:items-center sm:gap-2">
          <Label htmlFor="report-date" className="text-sm text-muted-foreground">
            Date
          </Label>
          <Input
            id="report-date"
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
        empty={<DataTableEmpty message="No active materials to report." />}
        listView={listView}
      />
    </ListPage>
  );
}
