"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import type { DefaultValues, FieldValues, UseFormReturn } from "react-hook-form";

/**
 * Resets a form from server/default values when the user navigates onto a route again
 * (for example after canceling an edit). Clears stale React Hook Form state kept by the
 * Next.js client router cache. While the user stays on the same route session, does not
 * reset again so in-progress edits are not wiped by background refetches.
 */
export function useFormResetOnRouteEntry<T extends FieldValues>(
  form: UseFormReturn<T>,
  values: DefaultValues<T> | T | undefined,
  ready: boolean,
  sessionKey: string,
) {
  const pathname = usePathname();
  const resetMarkerRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      resetMarkerRef.current = null;
    };
  }, [pathname]);

  useEffect(() => {
    if (!ready || values === undefined) {
      return;
    }
    const marker = `${pathname}|${sessionKey}`;
    if (resetMarkerRef.current === marker) {
      return;
    }
    resetMarkerRef.current = marker;
    form.reset(values);
  }, [pathname, sessionKey, ready, values, form]);
}
