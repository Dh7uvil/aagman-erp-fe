"use client";

import type { Control } from "react-hook-form";

import type { UnitFormValues } from "@/modules/inventory/units/schemas";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Switch } from "@/shared/components/ui/switch";

export function UnitFormFields({
  control,
  readOnly,
}: {
  control: Control<UnitFormValues>;
  readOnly: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-x-3 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
      <FormField
        control={control}
        name="code"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Code</FormLabel>
            <FormControl>
              <Input {...field} disabled={readOnly} autoComplete="off" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel>Name</FormLabel>
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
          <FormItem className="flex items-center justify-between gap-4 sm:col-span-2 lg:col-span-3">
            <FormLabel>Active</FormLabel>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} disabled={readOnly} />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}
