"use client";

import { cn } from "@/shared/lib/cn";

export function InkHexSwatch({
  hex,
  className,
  showCode = true,
}: {
  hex: string | null | undefined;
  className?: string;
  showCode?: boolean;
}) {
  if (!hex?.trim()) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className="size-5 shrink-0 rounded border border-border"
        style={{ backgroundColor: hex }}
        aria-hidden
      />
      {showCode ? <span className="font-mono text-xs">{hex}</span> : null}
    </span>
  );
}
