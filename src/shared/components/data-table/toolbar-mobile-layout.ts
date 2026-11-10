import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

import { ListSearch } from "@/shared/components/data-table/list-search";
import { ListViewToolbarControls } from "@/shared/components/data-table/list-view-toggle";

/** Mobile 2-col grid: full-width row when list view controls sit alone on the last row. */
export function listViewControlsMobileFullRow(children: ReactNode): boolean {
  const items = Children.toArray(children);
  let nonSearchIndex = 0;
  let controlsIndex = -1;
  let nonSearchCount = 0;

  for (const child of items) {
    if (!isValidElement(child)) {
      continue;
    }
    if (child.type === ListViewToolbarControls) {
      controlsIndex = nonSearchIndex;
    }
    if (child.type === ListSearch) {
      continue;
    }
    nonSearchIndex += 1;
    nonSearchCount += 1;
  }

  if (controlsIndex < 0) {
    return false;
  }
  return controlsIndex % 2 === 0 && controlsIndex === nonSearchCount - 1;
}

export function withToolbarMobileLayout(children: ReactNode): ReactNode {
  const mobileFullRow = listViewControlsMobileFullRow(children);

  return Children.map(children, (child) => {
    if (!isValidElement(child) || child.type !== ListViewToolbarControls) {
      return child;
    }
    const controls = child as ReactElement<{
      mobileFullRow?: boolean;
    }>;
    if (controls.props.mobileFullRow != null) {
      return child;
    }
    return cloneElement(controls, { mobileFullRow });
  });
}
