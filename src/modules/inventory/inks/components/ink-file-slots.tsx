"use client";

import { Expand, ImageIcon, Loader2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { useDeleteInkFile, useUploadInkFile } from "@/modules/inventory/inks/mutations";
import { inksApi } from "@/modules/inventory/inks/api";
import type { InkSheet } from "@/modules/inventory/inks/schemas";
import { inkImagePermissions } from "@/modules/inventory/permissions";
import { MAX_ATTACHMENT_BYTES } from "@/config/constants";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/shared/components/ui/dialog";
import { getErrorMessage } from "@/shared/api/errors";
import { cn } from "@/shared/lib/cn";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

function formatFileSize(bytes: number | null | undefined): string | null {
  if (bytes == null || bytes <= 0) {
    return null;
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileSlot({
  title,
  sheetId,
  slot,
  meta,
  hideHeading = false,
}: {
  title: string;
  sheetId: string;
  slot: "product_image" | "ink_image";
  meta: InkSheet["product_image"];
  hideHeading?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const { canRead, canCreate, canUpdate, canDelete } = useCrudPermissions(inkImagePermissions);
  const upload = useUploadInkFile();
  const remove = useDeleteInkFile();
  if (!canRead) {
    return null;
  }
  const hasFile = Boolean(meta?.filename);
  const canUpload = hasFile ? canUpdate : canCreate;
  const isImage = meta?.content_type?.startsWith("image/");
  const isPdf = meta?.content_type === "application/pdf";
  const sizeLabel = formatFileSize(meta?.size_bytes);
  const pending = upload.isPending || remove.isPending;
  const fileUrl = inksApi.fileUrl(sheetId, slot);
  const canPreviewFile = hasFile && (isImage || isPdf);

  async function onFile(file: File) {
    if (file.size > MAX_ATTACHMENT_BYTES) {
      toast.error("File must be 25 MB or smaller.");
      return;
    }
    if (!ALLOWED.includes(file.type)) {
      toast.error("Use JPEG, PNG, WebP, or PDF.");
      return;
    }
    try {
      await upload.mutateAsync({ id: sheetId, slot, file });
      toast.success(`${title} uploaded`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function onDelete() {
    try {
      await remove.mutateAsync({ id: sheetId, slot });
      toast.success(`${title} removed`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  function openPicker() {
    if (canUpload && !pending) {
      inputRef.current?.click();
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-3">
      {hideHeading ? null : (
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-medium">{title}</p>
          {hasFile ? (
            <span className="text-muted-foreground shrink-0 text-xs">Attached</span>
          ) : (
            <span className="text-muted-foreground shrink-0 text-xs">Optional</span>
          )}
        </div>
      )}
      <div
        role={canUpload ? "button" : undefined}
        tabIndex={canUpload && !hasFile ? 0 : undefined}
        onKeyDown={(event) => {
          if (canUpload && !hasFile && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            openPicker();
          }
        }}
        onClick={() => {
          if (!hasFile) {
            openPicker();
          }
        }}
        onDragOver={(event) => {
          if (!canUpload) {
            return;
          }
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          if (!canUpload || pending) {
            return;
          }
          const file = event.dataTransfer.files?.[0];
          if (file) {
            void onFile(file);
          }
        }}
        className={cn(
          "relative flex min-h-[168px] flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed px-4 py-5 text-center transition-colors",
          "bg-muted/20",
          canUpload && !hasFile && "cursor-pointer hover:bg-muted/40",
          dragOver && canUpload && "border-primary bg-primary/5",
          hasFile && "border-solid bg-background",
        )}
      >
        {pending ? (
          <div className="text-muted-foreground flex flex-col items-center gap-2">
            <Loader2 className="size-8 animate-spin" aria-hidden />
            <p className="text-sm">Uploading…</p>
          </div>
        ) : hasFile && isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fileUrl}
            alt={title}
            className={cn("max-h-36 w-full object-contain", canPreviewFile && "cursor-zoom-in")}
            onClick={() => canPreviewFile && setPreviewOpen(true)}
          />
        ) : hasFile ? (
          <div className="flex flex-col items-center gap-2 px-2">
            <p className="max-w-full truncate text-sm font-medium">{meta?.filename}</p>
            {sizeLabel ? <p className="text-muted-foreground text-xs">{sizeLabel}</p> : null}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="bg-muted flex size-12 items-center justify-center rounded-full">
              <ImageIcon className="text-muted-foreground size-6" aria-hidden />
            </div>
            <p className="text-sm font-medium">
              {canUpload ? "Click or drop to upload" : "No file uploaded"}
            </p>
          </div>
        )}
      </div>
      {hasFile && !pending ? (
        <div className="flex flex-wrap items-center gap-2">
          {canPreviewFile ? (
            <Button type="button" variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
              <Expand className="size-3.5" aria-hidden />
              Preview
            </Button>
          ) : null}
          <Button variant="outline" size="sm" asChild>
            <a href={fileUrl} target="_blank" rel="noreferrer">
              Download
            </a>
          </Button>
          {canUpload ? (
            <>
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept={ALLOWED.join(",")}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void onFile(file);
                  }
                  event.target.value = "";
                }}
              />
              <Button type="button" variant="secondary" size="sm" onClick={openPicker}>
                <Upload className="size-3.5" aria-hidden />
                Replace
              </Button>
            </>
          ) : null}
          {canDelete ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive ms-auto"
              onClick={() => void onDelete()}
            >
              <X className="size-3.5" aria-hidden />
              Remove
            </Button>
          ) : null}
        </div>
      ) : null}
      {!hasFile && canUpload ? (
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={ALLOWED.join(",")}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void onFile(file);
            }
            event.target.value = "";
          }}
        />
      ) : null}
      {canPreviewFile ? (
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="flex max-h-[96dvh] w-[96vw] max-w-[96vw] flex-col items-center justify-center gap-0 border-0 bg-black/95 p-2 shadow-2xl sm:max-w-[96vw] sm:p-4 [&>button]:text-white [&>button]:hover:bg-white/10">
            <DialogTitle className="sr-only">{title} preview</DialogTitle>
            {isImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fileUrl} alt={title} className="max-h-[85dvh] w-full object-contain" />
            ) : isPdf ? (
              <iframe src={fileUrl} title={title} className="h-[85dvh] w-full rounded-sm bg-white" />
            ) : null}
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}

export function ProductImageFileSlot({ sheet }: { sheet: InkSheet }) {
  return (
    <FileSlot
      title="Product image"
      sheetId={sheet.id}
      slot="product_image"
      meta={sheet.product_image}
    />
  );
}

export function InkImageFileSlot({ sheet }: { sheet: InkSheet }) {
  return (
    <FileSlot
      title="Ink image"
      sheetId={sheet.id}
      slot="ink_image"
      meta={sheet.ink_image}
    />
  );
}

export function InkFileSlots({ sheet }: { sheet: InkSheet }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <ProductImageFileSlot sheet={sheet} />
      <InkImageFileSlot sheet={sheet} />
    </div>
  );
}

export function InkFileSlotsPlaceholder() {
  return (
    <div className="border-border bg-muted/20 text-muted-foreground flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-6 text-center">
      <Upload className="size-6 opacity-60" aria-hidden />
      <p className="text-sm">Save the ink sheet first to upload product image and ink image.</p>
    </div>
  );
}
