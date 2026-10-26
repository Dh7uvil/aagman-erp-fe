"use client";

import type { ComponentProps } from "react";
import { useState } from "react";

import { Input } from "@/shared/components/ui/input";
import { DISPLAY_SCALE, normalizeDecimalInput, sanitizeNumericTyping } from "@/shared/lib/format";

export type DecimalInputKind = "money" | "quantity" | "percent" | "rate";

/** Max precision kept in form state on blur. */
const STORAGE_DIGITS: Record<DecimalInputKind, number> = {
  money: 4,
  quantity: 6,
  percent: 2,
  rate: 6,
};

export function DecimalInput({
  kind,
  precision,
  numericOnly = false,
  onBlur,
  onChange,
  onFocus,
  value,
  disabled,
  readOnly,
  ...props
}: Omit<ComponentProps<typeof Input>, "type" | "inputMode"> & {
  kind: DecimalInputKind;
  precision?: number;
  /** When true, blocks non-numeric characters while typing. */
  numericOnly?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const storageDigits = precision ?? STORAGE_DIGITS[kind];
  const blurDigits = precision != null ? precision : storageDigits;
  const raw = value == null ? "" : String(value);

  let displayValue: string | number | readonly string[] | undefined = value;
  if (raw !== "") {
    if (disabled || readOnly || !focused) {
      displayValue = normalizeDecimalInput(raw, DISPLAY_SCALE) || raw;
    } else {
      displayValue = raw;
    }
  }

  return (
    <Input
      {...props}
      value={displayValue}
      disabled={disabled}
      readOnly={readOnly}
      type="text"
      inputMode="decimal"
      onChange={(event) => {
        if (numericOnly && onChange) {
          const sanitized = sanitizeNumericTyping(event.target.value);
          if (sanitized !== event.target.value) {
            event.target.value = sanitized;
          }
        }
        onChange?.(event);
      }}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        const current = event.target.value;
        const normalized = normalizeDecimalInput(current, blurDigits);
        if (normalized !== current && onChange) {
          event.target.value = normalized;
          onChange(event);
        }
        onBlur?.(event);
      }}
    />
  );
}
