"use client";

import { useEffect, useRef } from "react";
import type { DefaultValues, FieldValues, UseFormReturn } from "react-hook-form";

/**
 * Resets a dialog form from server/default values each time the dialog opens, including
 * after the user closed it without saving.
 */
export function useFormResetOnDialogOpen<T extends FieldValues>(
  form: UseFormReturn<T>,
  values: DefaultValues<T> | T | undefined,
  open: boolean,
  sessionKey: string,
) {
  const openMarkerRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) {
      openMarkerRef.current = null;
      return;
    }
    if (values === undefined) {
      return;
    }
    if (openMarkerRef.current === sessionKey) {
      return;
    }
    openMarkerRef.current = sessionKey;
    form.reset(values);
  }, [open, sessionKey, values, form]);
}
