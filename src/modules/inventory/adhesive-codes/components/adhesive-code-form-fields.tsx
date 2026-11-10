"use client";

import type { Control } from "react-hook-form";

import type { AdhesiveCodeFormValues } from "@/modules/inventory/adhesive-codes/schemas";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Switch } from "@/shared/components/ui/switch";

export function AdhesiveCodeFormFields({
  control,
  readOnly,
}: {
  control: Control<AdhesiveCodeFormValues>;
  readOnly: boolean;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-x-3 gap-y-4">
      <FormField
        control={control}
        name="code"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Code</FormLabel>
            <FormControl>
              <Input {...field} disabled={readOnly} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="is_active"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <FormLabel className="text-sm font-normal">Active</FormLabel>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} disabled={readOnly} />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}
