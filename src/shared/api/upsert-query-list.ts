import type { QueryClient, QueryKey } from "@tanstack/react-query";

/** Keep list queries in sync immediately after inline / quick-create. */
export function upsertQueryListItem<T extends { id: string }>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  item: T,
): void {
  queryClient.setQueryData<T[]>(queryKey, (old) => {
    const list = old ?? [];
    if (list.some((row) => row.id === item.id)) {
      return list.map((row) => (row.id === item.id ? item : row));
    }
    return [...list, item];
  });
}
