"use client";

import { Columns3, GripVertical, Lock } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";

import {
  columnPickerDraft,
  type ColumnPickerItem,
  type ColumnPreferencePatch,
  type DataTableColumn,
  type TableColumnPreference,
} from "@/shared/components/data-table/columns";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { Switch } from "@/shared/components/ui/switch";
import { useMediaQuery } from "@/shared/hooks/use-media-query";
import { cn } from "@/shared/lib/cn";

function patchFrom(items: ColumnPickerItem[]): ColumnPreferencePatch {
  return {
    visible_columns: items.filter((item) => item.visible).map((item) => item.id),
    column_order: items.map((item) => item.id),
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
  if (items[from]?.pinned || items[to]?.pinned) {
    return items;
  }
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function ColumnPickerPanel({
  title,
  draft,
  draggingId,
  setDraggingId,
  pending,
  customized,
  onPersist,
  onReset,
}: {
  title: string;
  draft: ColumnPickerItem[];
  draggingId: string | null;
  setDraggingId: (id: string | null) => void;
  pending: boolean;
  customized: boolean;
  onPersist: (next: ColumnPickerItem[]) => void;
  onReset: () => void;
}) {
  return (
    <>
      <div className="px-3 py-2.5">
        <p className="text-sm font-medium">{title}</p>
      </div>
      <ul className="max-h-80 overflow-y-auto px-1 pb-1">
        {draft.map((item) => (
          <li
            key={item.id}
            onDragOver={(event) => {
              if (item.pinned) {
                return;
              }
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
            }}
            onDrop={(event) => {
              event.preventDefault();
              if (item.pinned) {
                return;
              }
              const fromId = event.dataTransfer.getData("text/plain") || draggingId;
              if (!fromId) {
                return;
              }
              onPersist(moveItem(draft, fromId, item.id));
              setDraggingId(null);
            }}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1.5",
              draggingId === item.id && "bg-muted",
            )}
          >
            {item.pinned ? (
              <span className="text-muted-foreground inline-flex shrink-0" title="Always visible">
                <Lock className="size-4" />
              </span>
            ) : (
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
            )}
            <span className="min-w-0 flex-1 text-sm leading-5 break-words whitespace-normal">
              {item.header}
            </span>
            {item.pinned ? null : (
              <div
                className="shrink-0"
                onPointerDown={(event) => event.stopPropagation()}
                onMouseDown={(event) => event.stopPropagation()}
              >
                <Switch
                  checked={item.visible}
                  disabled={pending}
                  aria-label={`Show ${item.header} column`}
                  onCheckedChange={(checked) => {
                    onPersist(
                      draft.map((entry) =>
                        entry.id === item.id ? { ...entry, visible: checked } : entry,
                      ),
                    );
                  }}
                />
              </div>
            )}
          </li>
        ))}
      </ul>
      {customized ? (
        <div className="border-t px-2 py-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            disabled={pending}
            onClick={onReset}
          >
            Reset to default
          </Button>
        </div>
      ) : null}
    </>
  );
}

export function ColumnsDialog<T>({
  columns,
  preference,
  pending = false,
  pinnedCount = 2,
  title = "Customize list view",
  onApply,
  onReset,
}: {
  columns: readonly DataTableColumn<T>[];
  preference: TableColumnPreference | null;
  pending?: boolean;
  pinnedCount?: number;
  title?: string;
  onApply: (next: ColumnPreferencePatch) => Promise<void> | void;
  onReset: () => Promise<void> | void;
}) {
  const triggerId = useId();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ColumnPickerItem[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const customized = Boolean(preference && !preference.is_default);

  function handleOpenChange(next: boolean) {
    if (next) {
      setDraft(columnPickerDraft(columns, preference, pinnedCount));
    }
    setOpen(next);
  }

  useEffect(() => {
    if (!open) {
      return;
    }
    setDraft(columnPickerDraft(columns, preference, pinnedCount));
  }, [columns, open, pinnedCount, preference]);

  async function persist(next: ColumnPickerItem[]) {
    if (next.every((item) => !item.visible)) {
      toast.error("Keep at least one column visible.");
      return;
    }
    setDraft(next);
    try {
      await onApply(patchFrom(next));
    } catch {
      setDraft(columnPickerDraft(columns, preference, pinnedCount));
    }
  }

  async function reset() {
    try {
      await onReset();
      setDraft(columnPickerDraft(columns, null));
    } catch {
      // Toast is handled by the caller.
    }
  }

  const triggerClassName = cn(
    "bg-background size-9 shrink-0",
    (open || customized) && "border-primary text-primary",
  );

  const trigger = (
    <Button
      id={triggerId}
      type="button"
      variant="outline"
      size="icon-sm"
      aria-label="Customize columns"
      aria-expanded={open}
      aria-haspopup="dialog"
      className={triggerClassName}
      onClick={isMobile ? () => handleOpenChange(true) : undefined}
    >
      <Columns3 className="size-3.5" />
    </Button>
  );

  const panel = (
    <ColumnPickerPanel
      title={title}
      draft={draft}
      draggingId={draggingId}
      setDraggingId={setDraggingId}
      pending={pending}
      customized={customized}
      onPersist={(next) => void persist(next)}
      onReset={() => void reset()}
    />
  );

  if (isMobile) {
    return (
      <>
        {trigger}
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogContent mobileSheet className="max-w-[min(32rem,calc(100vw-1.5rem))] gap-0 p-0">
            <DialogTitle className="sr-only">{title}</DialogTitle>
            {panel}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 max-w-[calc(100vw-2rem)] p-0"
        onPointerDownOutside={(event) => {
          if (draggingId) {
            event.preventDefault();
          }
        }}
      >
        {panel}
      </PopoverContent>
    </Popover>
  );
}
