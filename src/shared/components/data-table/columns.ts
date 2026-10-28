import type { ReactNode } from "react";

export type TableColumnPreference = {
  visible_columns: string[];
  column_order: string[];
  is_default: boolean;
};

export type CardColumnSlot = "title" | "subtitle" | "badge" | "field" | "hidden";

export type DataTableColumn<T> = {
  id: string;
  header: string;
  defaultVisible?: boolean;
  locked?: boolean;
  sticky?: "right";
  sortableField?: string;
  className?: string;
  headerClassName?: string;
  hideable?: boolean;
  card?: {
    slot?: CardColumnSlot;
  };
  cell: (row: T) => ReactNode;
};

export type ResolvedCardSlot = CardColumnSlot | "actions";

export type CardColumnLayout<T> = {
  title?: DataTableColumn<T>;
  subtitle?: DataTableColumn<T>;
  badge?: DataTableColumn<T>;
  fields: DataTableColumn<T>[];
  actions?: DataTableColumn<T>;
};

export const LIST_OPEN_COLUMN_COUNT = 2;

export function isActionsColumn<T>(column: DataTableColumn<T>): boolean {
  return column.id === "actions" || (column.sticky === "right" && Boolean(column.locked));
}

/** Whether this visible column is among the first N data columns that open the record view. */
export function isListOpenColumn<T>(
  columns: readonly DataTableColumn<T>[],
  columnIndex: number,
): boolean {
  if (columnIndex < 0 || columnIndex >= columns.length) {
    return false;
  }
  let dataIndex = 0;
  for (let index = 0; index <= columnIndex; index++) {
    const column = columns[index];
    if (isActionsColumn(column)) {
      continue;
    }
    if (index === columnIndex) {
      return dataIndex < LIST_OPEN_COLUMN_COUNT;
    }
    dataIndex += 1;
  }
  return false;
}

export function resolveCardSlots<T>(
  columns: readonly DataTableColumn<T>[],
): CardColumnLayout<T> {
  const layout: CardColumnLayout<T> = { fields: [] };
  let titleAssigned = false;

  for (const column of columns) {
    if (isActionsColumn(column)) {
      layout.actions = column;
      continue;
    }

    const explicit = column.card?.slot;
    if (explicit === "hidden") {
      continue;
    }
    if (explicit === "title") {
      layout.title = column;
      titleAssigned = true;
      continue;
    }
    if (explicit === "subtitle") {
      layout.subtitle = column;
      continue;
    }
    if (explicit === "badge") {
      layout.badge = column;
      continue;
    }
    if (explicit === "field") {
      layout.fields.push(column);
      continue;
    }

    if (!titleAssigned) {
      layout.title = column;
      titleAssigned = true;
      continue;
    }

    layout.fields.push(column);
  }

  return layout;
}

export type ColumnPreferencePatch = {
  visible_columns: string[];
  column_order: string[];
};

export type ColumnPickerItem = {
  id: string;
  header: string;
  visible: boolean;
  extra: boolean;
  pinned: boolean;
};

/** Pin first identity column on horizontal scroll; `top-0` comes from TableHead. */
export const stickyIdentityHeadClass =
  "sticky left-0 z-30 bg-card shadow-[2px_0_6px_-2px_rgba(0,0,0,0.18)]";
/** Pin first identity cell on horizontal scroll. */
export const stickyIdentityCellClass =
  "sticky left-0 z-10 max-w-[10rem] truncate bg-card group-hover:bg-muted group-data-[state=selected]:bg-muted shadow-[2px_0_6px_-2px_rgba(0,0,0,0.18)] sm:max-w-none";
/** Pin actions header on horizontal scroll; `top-0` comes from TableHead. */
export const stickyActionsHeadClass =
  "sticky right-0 z-30 bg-card shadow-[-2px_0_6px_-2px_rgba(0,0,0,0.18)]";
/** Pin row actions on horizontal scroll only — opaque bg so scrolled cells do not show through. */
export const stickyActionsCellClass =
  "sticky right-0 z-10 bg-card group-hover:bg-muted group-data-[state=selected]:bg-muted shadow-[-2px_0_6px_-2px_rgba(0,0,0,0.18)]";

export function actionsColumn<T>(
  show: boolean,
  cell: (row: T) => ReactNode,
): Array<DataTableColumn<T>> {
  if (!show) {
    return [];
  }
  return [
    {
      id: "actions",
      header: "Actions",
      locked: true,
      sticky: "right",
      hideable: false,
      cell,
    },
  ];
}

export function omitColumnIds<T>(
  defs: readonly DataTableColumn<T>[],
  ids: readonly string[] = [],
): Array<DataTableColumn<T>> {
  if (ids.length === 0) {
    return [...defs];
  }
  const skip = new Set(ids);
  return defs.filter((column) => !skip.has(column.id));
}

export function customizableColumns<T>(
  defs: readonly DataTableColumn<T>[],
): Array<DataTableColumn<T>> {
  return defs.filter((column) => !column.locked);
}

export function defaultColumnPreference<T>(
  defs: readonly DataTableColumn<T>[],
): ColumnPreferencePatch {
  const customizable = customizableColumns(defs);
  return {
    visible_columns: customizable
      .filter((column) => column.defaultVisible !== false)
      .map((column) => column.id),
    column_order: customizable.map((column) => column.id),
  };
}

export function pinnedColumnIds<T>(
  defs: readonly DataTableColumn<T>[],
  pinnedCount = 2,
): string[] {
  if (pinnedCount <= 0) {
    return [];
  }
  return defaultColumnPreference(defs).visible_columns.slice(0, pinnedCount);
}

/** Visible column ids from saved preference, or column defs when none apply yet. */
export function preferenceVisibleColumnIds<T>(
  defs: readonly DataTableColumn<T>[],
  preference: TableColumnPreference | null | undefined,
): string[] {
  const customizable = customizableColumns(defs);
  const known = new Set(customizable.map((column) => column.id));
  const defaults = defaultColumnPreference(defs);
  const saved = (preference?.visible_columns ?? []).filter((id) => known.has(id));
  return saved.length > 0 ? saved : defaults.visible_columns;
}

function applyPinnedColumns(
  visible: string[],
  order: string[],
  pinned: readonly string[],
): { visible: string[]; order: string[] } {
  const pinnedSet = new Set(pinned);
  return {
    visible: [...pinned, ...visible.filter((id) => !pinnedSet.has(id))],
    order: [...pinned, ...order.filter((id) => !pinnedSet.has(id))],
  };
}

export function columnPickerDraft<T>(
  defs: readonly DataTableColumn<T>[],
  preference: TableColumnPreference | null | undefined,
  pinnedCount = 2,
): ColumnPickerItem[] {
  const customizable = customizableColumns(defs);
  const defaults = defaultColumnPreference(defs);
  const pinned = pinnedColumnIds(defs, pinnedCount);
  const pinnedSet = new Set(pinned);
  const known = new Map(customizable.map((column) => [column.id, column]));
  const savedOrder = (preference?.column_order ?? []).filter((id) => known.has(id));
  const order = applyPinnedColumns(
    [],
    [...savedOrder, ...defaults.column_order.filter((id) => !savedOrder.includes(id))],
    pinned,
  ).order;
  const visible = new Set(preferenceVisibleColumnIds(defs, preference));
  for (const id of pinned) {
    visible.add(id);
  }
  return order.flatMap((id) => {
    const column = known.get(id);
    if (!column) {
      return [];
    }
    return [
      {
        id,
        header: column.header,
        visible: visible.has(id),
        extra: column.defaultVisible === false,
        pinned: pinnedSet.has(id),
      },
    ];
  });
}

export function resolveTableColumns<T>(
  defs: readonly DataTableColumn<T>[],
  preference: TableColumnPreference | null | undefined,
  pinnedCount = 2,
): Array<DataTableColumn<T>> {
  const byId = new Map(defs.map((column) => [column.id, column]));
  const locked = defs.filter((column) => column.locked);
  const customizable = customizableColumns(defs);
  const known = new Set(customizable.map((column) => column.id));
  const defaults = defaultColumnPreference(defs);
  const pinned = pinnedColumnIds(defs, pinnedCount);

  const savedOrder = (preference?.column_order ?? []).filter((id) => known.has(id));
  const missing = defaults.column_order.filter((id) => !savedOrder.includes(id));
  const rawOrder = preference ? [...savedOrder, ...missing] : defaults.column_order;

  const rawVisible = preferenceVisibleColumnIds(defs, preference);

  const pinnedPreference = applyPinnedColumns(rawVisible, rawOrder, pinned);
  const visibleIds = new Set(pinnedPreference.visible);

  const visible = pinnedPreference.order
    .filter((id) => visibleIds.has(id))
    .map((id) => byId.get(id))
    .filter((column): column is DataTableColumn<T> => Boolean(column));

  return [...visible, ...locked];
}
