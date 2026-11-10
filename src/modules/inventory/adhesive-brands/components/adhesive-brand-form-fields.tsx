"use client";

import type { Control } from "react-hook-form";

import type { AdhesiveBrandFormValues } from "@/modules/inventory/adhesives/schemas";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Switch } from "@/shared/components/ui/switch";

export function AdhesiveBrandFormFields({
  control,
  readOnly,
}: {
  control: Control<AdhesiveBrandFormValues>;
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
          <FormItem className="flex flex-row items-center gap-2 space-y-0 sm:col-span-2">
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
