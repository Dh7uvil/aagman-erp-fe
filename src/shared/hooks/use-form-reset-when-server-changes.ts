"use client";

import { useEffect, useRef } from "react";
import type { DefaultValues, FieldValues, UseFormReturn } from "react-hook-form";

/**
 * Resets the form when server-backed values change (e.g. after save + refetch) while the
 * user is not editing. Keeps useFieldArray in sync with the API; route-entry reset alone
 * does not run again on the same URL when React/Next restores cached pages.
 */
export function useFormResetWhenServerChanges<T extends FieldValues>(
  form: UseFormReturn<T>,
  values: DefaultValues<T> | T | undefined,
  ready: boolean,
  serverRevision: string | undefined,
) {
  const lastRevisionRef = useRef<string | null>(null);

  useEffect(() => {
    if (!ready || values === undefined || !serverRevision) {
      return;
    }
    if (form.formState.isDirty) {
      return;
    }
    if (lastRevisionRef.current === serverRevision) {
      return;
    }
    lastRevisionRef.current = serverRevision;
    form.reset(values);
  }, [ready, values, serverRevision, form]);
}
