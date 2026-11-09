"use client";

import { Download, GripVertical } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  type ColumnPickerItem,
  type DataTableColumn,
  exportColumnPickerDraft,
  type ExportPreferencePatch,
} from "@/shared/components/data-table/columns";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";
import type { ExportFormat, TablePreference } from "@/shared/table-preferences/schemas";
import type { ExportRowScope } from "@/shared/lib/list-export";
import { cn } from "@/shared/lib/cn";

function patchFrom(items: ColumnPickerItem[], format: ExportFormat): ExportPreferencePatch {
  return {
    export_visible_columns: items.filter((item) => item.visible).map((item) => item.id),
    export_column_order: items.map((item) => item.id),
    export_format: format,
  };
}

function moveItem(items: ColumnPickerItem[], fromId: string, toId: string): ColumnPickerItem[] {
  if (fromId === toId) {
    return items;
  }
  const from = items.findIndex((item) => item.id === fromId);
  const to = items.findIndex((item) => item.id === toId);
  if (from < 0 || to < 0) {
    return items;
  }
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function ExportReportDialog<T>({
  columns,
  preference,
  pending = false,
  onSave,
  onReset,
  onDownload,
  filteredRowCount,
}: {
  columns: readonly DataTableColumn<T>[];
  preference: TablePreference | null;
  pending?: boolean;
  onSave: (next: ExportPreferencePatch) => Promise<void> | void;
  onReset: () => Promise<void> | void;
  onDownload: (format: ExportFormat, rowScope: ExportRowScope) => Promise<void> | void;
  /** Total rows matching current list filters (from list meta.total). */
  filteredRowCount?: number;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ColumnPickerItem[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [format, setFormat] = useState<ExportFormat>(preference?.export_format ?? "csv");
  const [rowScope, setRowScope] = useState<ExportRowScope>("filtered");
  const [downloadPending, setDownloadPending] = useState(false);
  const customized = Boolean(preference && !preference.export_is_default);

  const exportableCount = useMemo(() => draft.filter((item) => !item.pinned).length, [draft]);

  function handleOpenChange(next: boolean) {
    if (next) {
      setDraft(exportColumnPickerDraft(columns, preference));
      setFormat(preference?.export_format ?? "csv");
      setRowScope("filtered");
    }
    setOpen(next);
  }

  useEffect(() => {
    if (!open) {
      return;
    }
    setDraft(exportColumnPickerDraft(columns, preference));
    setFormat(preference?.export_format ?? "csv");
  }, [columns, open, preference]);

  async function persist(next: ColumnPickerItem[]) {
    if (next.every((item) => !item.visible)) {
      toast.error("Select at least one column.");
      return;
    }
    setDraft(next);
    try {
      await onSave(patchFrom(next, format));
      toast.success("Export settings saved");
    } catch {
      setDraft(exportColumnPickerDraft(columns, preference));
    }
  }

  function selectAll() {
    void persist(draft.map((item) => ({ ...item, visible: true })));
  }

  function clearAll() {
    const first = draft[0];
    if (!first) {
      return;
    }
    void persist(draft.map((item) => ({ ...item, visible: item.id === first.id })));
  }

  async function download() {
    if (draft.every((item) => !item.visible)) {
      toast.error("Select at least one column.");
      return;
    }
    setDownloadPending(true);
    try {
      await onSave(patchFrom(draft, format));
      await onDownload(format, rowScope);
      toast.success("Report downloaded");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Download failed");
    } finally {
      setDownloadPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Download report"
          className="bg-background size-9 shrink-0"
        >
          <Download className="size-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent
        mobileSheet
        className="flex max-h-[min(90vh,640px)] flex-col gap-0 p-0 sm:max-w-[min(28rem,calc(100vw-1.5rem))]"
      >
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle>Download report</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 border-y px-4 py-3">
          <div className="space-y-1.5">
            <Label htmlFor="export-row-scope">Rows to include</Label>
            <Select
              value={rowScope}
              onValueChange={(value) => setRowScope(value as ExportRowScope)}
            >
              <SelectTrigger id="export-row-scope" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="filtered">
                  {filteredRowCount != null
                    ? `All matching filters (${filteredRowCount.toLocaleString()} rows)`
                    : "All rows matching current filters"}
                </SelectItem>
                <SelectItem value="all">Entire module (ignore filters)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs leading-snug">
              Exports never include only the current page—every row in the chosen scope is
              included (up to server limits).
            </p>
          </div>
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="export-format">Format</Label>
            <Select
              value={format}
              onValueChange={(value) => setFormat(value as ExportFormat)}
            >
              <SelectTrigger id="export-format" className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="xlsx">XLSX</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={selectAll}>
              Select all ({exportableCount})
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={clearAll}>
              Clear
            </Button>
          </div>
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto px-2 py-1">
          {draft.map((item) => (
            <li
              key={item.id}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
              }}
              onDrop={(event) => {
                event.preventDefault();
                const fromId = event.dataTransfer.getData("text/plain") || draggingId;
                if (!fromId) {
                  return;
                }
                void persist(moveItem(draft, fromId, item.id));
                setDraggingId(null);
              }}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5",
                draggingId === item.id && "bg-muted",
              )}
            >
              <span
                draggable
                className="text-muted-foreground inline-flex shrink-0 cursor-grab active:cursor-grabbing"
                aria-hidden="true"
                onDragStart={(event) => {
                  setDraggingId(item.id);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", item.id);
                }}
                onDragEnd={() => setDraggingId(null)}
              >
                <GripVertical className="size-4" />
              </span>
              <span className="min-w-0 flex-1 text-sm leading-5 break-words whitespace-normal">
                {item.header}
              </span>
              <Switch
                checked={item.visible}
                disabled={pending}
                aria-label={`Include ${item.header}`}
                onCheckedChange={(checked) => {
                  void persist(
                    draft.map((entry) =>
                      entry.id === item.id ? { ...entry, visible: checked } : entry,
                    ),
                  );
                }}
              />
            </li>
          ))}
        </ul>
        <DialogFooter className="flex-col gap-2 border-t px-4 py-3 sm:flex-row sm:justify-between">
          {customized ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => void onReset()}
            >
              Reset export defaults
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2 sm:ml-auto">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={pending}
              onClick={() => void persist(draft)}
            >
              Save
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={pending || downloadPending}
              onClick={() => void download()}
            >
              Download
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
