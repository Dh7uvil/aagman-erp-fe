"use client";

import type { Control } from "react-hook-form";

import type { InkBrandFormValues } from "@/modules/inventory/inks/schemas";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Switch } from "@/shared/components/ui/switch";

export function InkBrandFormFields({
  control,
  readOnly,
}: {
  control: Control<InkBrandFormValues>;
  readOnly: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-x-3 gap-y-4 sm:grid-cols-2">
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel>Brand</FormLabel>
            <FormControl>
              <Input {...field} disabled={readOnly} autoComplete="off" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="is_active"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between gap-4 sm:col-span-2">
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
