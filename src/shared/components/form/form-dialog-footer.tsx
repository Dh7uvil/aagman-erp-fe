"use client";

import { Loader2 } from "lucide-react";

import {
  CancelLabel,
  CloseLabel,
  SubmitFormLabel,
} from "@/shared/components/ui/action-button-labels";
import { Button, buttonVariants } from "@/shared/components/ui/button";
import { DialogFooter } from "@/shared/components/ui/dialog";
import type { VariantProps } from "class-variance-authority";

export function FormDialogFooter({
  pending,
  canSubmit,
  submitLabel,
  submitVariant = "default",
  submitClassName,
  onClose,
  onSubmit,
}: {
  pending: boolean;
  canSubmit: boolean;
  submitLabel: string;
  submitVariant?: VariantProps<typeof buttonVariants>["variant"];
  submitClassName?: string;
  onClose: () => void;
  /** Use type="button" so nested dialogs never submit a parent page form. */
  onSubmit: () => void;
}) {
  return (
    <DialogFooter>
      <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
        {canSubmit ? <CancelLabel /> : <CloseLabel />}
      </Button>
      {canSubmit ? (
        <Button
          type="button"
          variant={submitVariant}
          className={submitClassName}
          disabled={pending}
          onClick={onSubmit}
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          {pending ? submitLabel : <SubmitFormLabel>{submitLabel}</SubmitFormLabel>}
        </Button>
      ) : null}
    </DialogFooter>
  );
}
