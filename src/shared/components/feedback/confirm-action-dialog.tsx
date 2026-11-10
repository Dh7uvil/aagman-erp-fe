"use client";

import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import {
  CancelLabel,
  ConfirmLabel,
  DeleteLabel,
} from "@/shared/components/ui/action-button-labels";
import { Button } from "@/shared/components/ui/button";

export function ConfirmActionDialog({
  open,
  title,
  description,
  extra,
  confirmLabel = "Confirm",
  pending = false,
  confirmDisabled = false,
  variant = "destructive",
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: ReactNode;
  extra?: ReactNode;
  confirmLabel?: string;
  pending?: boolean;
  confirmDisabled?: boolean;
  variant?: "destructive" | "default";
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {extra}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>
            <CancelLabel />
          </AlertDialogCancel>
          <Button
            type="button"
            variant={variant}
            disabled={pending || confirmDisabled}
            onClick={() => onConfirm()}
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            {pending ? (
              confirmLabel
            ) : variant === "destructive" ? (
              <DeleteLabel>{confirmLabel}</DeleteLabel>
            ) : (
              <ConfirmLabel>{confirmLabel}</ConfirmLabel>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
