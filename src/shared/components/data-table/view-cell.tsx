"use client";

import Link from "next/link";
import { Children, Fragment, isValidElement, type ReactNode } from "react";

import { RecordLink } from "@/shared/components/data-table/record-link";
import { cn } from "@/shared/lib/cn";

function nodeContainsLink(node: ReactNode): boolean {
  if (!isValidElement(node)) {
    return false;
  }
  if (node.type === Link || node.type === RecordLink) {
    return true;
  }
  if ((node.props as { "data-slot"?: string })["data-slot"] === "record-link") {
    return true;
  }
  if (node.type === Fragment) {
    return Children.toArray((node.props as { children?: ReactNode }).children).some(nodeContainsLink);
  }
  const props = node.props as { children?: ReactNode };
  if (props.children === undefined || props.children === null) {
    return false;
  }
  return Children.toArray(props.children).some((child) =>
    isValidElement(child) ? nodeContainsLink(child) : false,
  );
}

export function ViewCellContent({
  children,
  enabled,
  onActivate,
  className,
}: {
  children: ReactNode;
  enabled: boolean;
  onActivate: () => void;
  className?: string;
}) {
  if (!enabled || nodeContainsLink(children)) {
    return <>{children}</>;
  }

  return (
    <button
      type="button"
      className={cn(
        "block w-full min-w-0 cursor-pointer rounded-sm text-left hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        className,
      )}
      onClick={onActivate}
    >
      {children}
    </button>
  );
}
