"use client";

import { useState } from "react";

import { cylindersApi } from "@/modules/inventory/cylinders/api";
import type { CylinderListItem } from "@/modules/inventory/cylinders/schemas";
import { Dialog, DialogContent, DialogTitle } from "@/shared/components/ui/dialog";

export function CylinderImagePreviewDialog({
  cylinder,
  open,
  onOpenChange,
}: {
  cylinder: CylinderListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [displayed, setDisplayed] = useState(cylinder);
  if (cylinder && displayed?.id !== cylinder.id) {
    setDisplayed(cylinder);
  }
  const current = cylinder ?? displayed;
  const meta = current?.cylinder_image;
  const isImage = meta?.content_type?.startsWith("image/");
  const isPdf = meta?.content_type === "application/pdf";
  const fileUrl = current ? cylindersApi.fileUrl(current.id, "cylinder_image") : "";
  const title = current
    ? `Cylinder image for ${current.cylinder_number}`
    : "Cylinder image preview";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[96dvh] w-[96vw] max-w-[96vw] flex-col items-center justify-center gap-0 border-0 bg-black/95 p-2 shadow-2xl sm:max-w-[96vw] sm:p-4 [&>button]:text-white [&>button]:hover:bg-white/10">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        {meta?.filename ? (
          <p className="mb-3 max-w-full truncate px-2 text-center text-xs text-white/70">
            {meta.filename}
          </p>
        ) : null}
        {current && isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fileUrl} alt={title} className="max-h-[85dvh] w-full object-contain" />
        ) : null}
        {current && isPdf ? (
          <iframe src={fileUrl} title={title} className="h-[85dvh] w-full rounded-sm bg-white" />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
