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
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { Switch } from "@/shared/components/ui/switch";
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

  // Keep picker toggles/order aligned with saved preferences after each successful save.
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

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            id={triggerId}
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Customize columns"
            aria-expanded={open}
            aria-haspopup="dialog"
            className={cn(
              "bg-background size-9 shrink-0",
              (open || customized) && "border-primary text-primary",
            )}
          >
            <Columns3 className="size-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-80 max-w-[calc(100vw-2rem)] p-0"
          onPointerDownOutside={(event) => {
            if (draggingId) {
              event.preventDefault();
            }
          }}
        >
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
                  void persist(moveItem(draft, fromId, item.id));
                  setDraggingId(null);
                }}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5",
                  draggingId === item.id && "bg-muted",
                )}
              >
                {item.pinned ? (
                  <span
                    className="text-muted-foreground inline-flex shrink-0"
                    title="Always visible"
                  >
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
                        void persist(
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
                onClick={() => void reset()}
              >
                Reset to default
              </Button>
            </div>
          ) : null}
        </PopoverContent>
      </Popover>
  );
}
