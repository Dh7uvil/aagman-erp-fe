"use client";

import type { Control } from "react-hook-form";

import { InkHexSwatch } from "@/modules/inventory/ink-colors/components/ink-hex-swatch";
import { hasDisplayHex, type InkColorFormValues } from "@/modules/inventory/ink-colors/schemas";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Switch } from "@/shared/components/ui/switch";
import { useWatch } from "react-hook-form";

export function InkColorFormFields({
  control,
  readOnly,
}: {
  control: Control<InkColorFormValues>;
  readOnly: boolean;
}) {
  const hex = useWatch({ control, name: "hex_code" });

  return (
    <div className="grid grid-cols-1 gap-x-3 gap-y-4 sm:grid-cols-2">
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Color</FormLabel>
            <FormControl>
              <Input {...field} disabled={readOnly} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="hex_code"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Hex code</FormLabel>
            <FormControl>
              <div className="flex items-center gap-2">
                <Input
                  {...field}
                  className="min-w-0 flex-1"
                  disabled={readOnly}
                  placeholder="#FF5733"
                  autoComplete="off"
                />
                {hasDisplayHex(hex) ? <InkHexSwatch hex={hex} showCode={false} /> : null}
              </div>
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
