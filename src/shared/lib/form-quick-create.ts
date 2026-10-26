import type { FieldPath, FieldValues, PathValue, UseFormReturn } from "react-hook-form";

/** Options for react-hook-form setValue that avoid zodResolver full-schema validation. */
export const SET_VALUE_WITHOUT_VALIDATION = {
  shouldValidate: false as const,
  shouldDirty: true as const,
};

/**
 * After inline / master quick-create, update one field without validating unrelated inputs.
 * zodResolver with shouldValidate: true runs the entire schema and surfaces errors like empty size.
 */
export function setFormValueFromQuickCreate<T extends FieldValues>(
  form: UseFormReturn<T>,
  name: FieldPath<T>,
  value: PathValue<T, FieldPath<T>>,
) {
  form.setValue(name, value, SET_VALUE_WITHOUT_VALIDATION);
  form.clearErrors();
}

/**
 * Default master IDs (e.g. mm/kg units) when lists load — same no-validation rule as quick-create.
 */
export function setFormValueWhenDefaulting<T extends FieldValues>(
  form: UseFormReturn<T>,
  name: FieldPath<T>,
  value: PathValue<T, FieldPath<T>>,
  options?: { shouldDirty?: boolean },
) {
  form.setValue(name, value, {
    shouldValidate: false,
    shouldDirty: options?.shouldDirty ?? false,
  });
}
