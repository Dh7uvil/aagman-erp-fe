"use client";

import { useMemo } from "react";
import { toast } from "sonner";

import { getErrorMessage } from "@/shared/api/errors";
import { ExportReportDialog } from "@/shared/components/data-table/export-report-dialog";
import type { DataTableColumn } from "@/shared/components/data-table/columns";
import type { ExportPreferencePatch } from "@/shared/components/data-table/columns";
import { apiClient } from "@/shared/api/client";
import {
  useResetTableExportPreferences,
  useSaveTableExportPreferences,
} from "@/shared/table-preferences/export-mutations";
import { useTableColumnPreferences } from "@/shared/table-preferences/queries";
import type { ExportFormat } from "@/shared/table-preferences/schemas";
import type { RequestParams } from "@/shared/api/client";
import type { ExportRowScope } from "@/shared/lib/list-export";

export function useReportExport<T>({
  tableKey,
  columnDefs,
  exportPath,
  buildParams,
  buildAllParams,
  filteredRowCount,
  enabled = true,
}: {
  tableKey: string;
  columnDefs: readonly DataTableColumn<T>[];
  exportPath: string;
  /** Query params for export_scope=filtered (all rows matching filters, not just the current page). */
  buildParams: () => RequestParams;
  /** Extra params for export_scope=all; defaults to none (server ignores list filters). */
  buildAllParams?: () => RequestParams;
  filteredRowCount?: number;
  enabled?: boolean;
}) {
  const prefsQuery = useTableColumnPreferences(tableKey);
  const saveExport = useSaveTableExportPreferences(tableKey);
  const resetExport = useResetTableExportPreferences(tableKey);

  const exportDialog = useMemo(() => {
    if (!enabled) {
      return null;
    }
    return (
      <ExportReportDialog
        columns={columnDefs}
        preference={prefsQuery.data ?? null}
        pending={saveExport.isPending || resetExport.isPending || prefsQuery.isLoading}
        onSave={async (next: ExportPreferencePatch) => {
          try {
            await saveExport.mutateAsync(next);
          } catch (error) {
            toast.error(getErrorMessage(error));
            throw error;
          }
        }}
        onReset={async () => {
          try {
            await resetExport.mutateAsync();
          } catch (error) {
            toast.error(getErrorMessage(error));
            throw error;
          }
        }}
        filteredRowCount={filteredRowCount}
        onDownload={async (format: ExportFormat, rowScope: ExportRowScope) => {
          const scopeParams =
            rowScope === "all"
              ? { ...(buildAllParams?.() ?? {}), export_scope: "all" }
              : { ...buildParams(), export_scope: "filtered" };
          await apiClient.downloadFile(exportPath, {
            params: { ...scopeParams, format },
            filename: `${tableKey.split(".").pop() ?? "report"}.${format}`,
          });
        }}
      />
    );
  }, [
    buildAllParams,
    buildParams,
    columnDefs,
    enabled,
    exportPath,
    filteredRowCount,
    prefsQuery.data,
    prefsQuery.isLoading,
    resetExport,
    saveExport,
    tableKey,
  ]);

  return { exportDialog };
}
