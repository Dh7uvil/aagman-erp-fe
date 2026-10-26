import type { BaseSyntheticEvent } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";

/** Prevent dialog / nested forms from bubbling submit to a parent page form. */
export function isolatedFormSubmitHandler<T extends FieldValues>(
  form: UseFormReturn<T>,
  onValid: (values: T) => void | Promise<void>,
) {
  return (event?: BaseSyntheticEvent) => {
    event?.preventDefault();
    event?.stopPropagation();
    void form.handleSubmit(onValid)(event);
  };
}
