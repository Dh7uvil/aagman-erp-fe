"use client";

import type { Control } from "react-hook-form";

import type { SolventNameFormValues } from "@/modules/inventory/solvent-names/schemas";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Switch } from "@/shared/components/ui/switch";

export function SolventNameFormFields({
  control,
  readOnly,
}: {
  control: Control<SolventNameFormValues>;
  readOnly: boolean;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-x-3 gap-y-4">
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
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
