"use client";

import { useCallback, useSyncExternalStore } from "react";

export type ListViewMode = "cards" | "table";

const STORAGE_PREFIX = "aagman-list-view:";
const MOBILE_BREAKPOINT = 768;
const LIST_VIEW_EVENT = "aagman-list-view-change";

function defaultViewForViewport(): ListViewMode {
  if (typeof window === "undefined") {
    return "table";
  }
  return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches ? "cards" : "table";
}

function readView(tableKey: string): ListViewMode {
  const key = `${STORAGE_PREFIX}${tableKey}`;
  const stored = localStorage.getItem(key);
  if (stored === "cards" || stored === "table") {
    return stored;
  }
  return defaultViewForViewport();
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener(LIST_VIEW_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(LIST_VIEW_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function useListView(tableKey: string) {
  const view = useSyncExternalStore(
    subscribe,
    () => readView(tableKey),
    () => "table" as ListViewMode,
  );

  const setView = useCallback(
    (next: ListViewMode) => {
      localStorage.setItem(`${STORAGE_PREFIX}${tableKey}`, next);
      window.dispatchEvent(new Event(LIST_VIEW_EVENT));
    },
    [tableKey],
  );

  return {
    view,
    setView,
    mounted: true,
  };
}
