"use client";

import { useEffect } from "react";
import { useFormContext, useWatch, type Control, type FieldPath, type FieldValues } from "react-hook-form";

import {
  addressesMatch,
  type AddressFormValues,
} from "@/modules/users-management/organization/schemas";
import { AddressFields } from "@/shared/components/form/address-fields";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { FormControl, FormField, FormItem, FormLabel } from "@/shared/components/ui/form";

type CopyableAddressSectionProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  title: string;
  addressName: FieldPath<TFieldValues>;
  sameAsName: FieldPath<TFieldValues>;
  sourceName: FieldPath<TFieldValues>;
  sameAsLabel: string;
  disabled?: boolean;
};

export function CopyableAddressSection<TFieldValues extends FieldValues>({
  control,
  title,
  addressName,
  sameAsName,
  sourceName,
  sameAsLabel,
  disabled,
}: CopyableAddressSectionProps<TFieldValues>) {
  const { getValues, setValue } = useFormContext<TFieldValues>();
  const sameAsSource = useWatch({ control, name: sameAsName });
  const sourceAddress = useWatch({ control, name: sourceName }) as AddressFormValues | undefined;

  useEffect(() => {
    if (!sameAsSource || !sourceAddress) {
      return;
    }
    const targetAddress = getValues(addressName) as AddressFormValues | undefined;
    if (!targetAddress || addressesMatch(sourceAddress, targetAddress)) {
      return;
    }
    setValue(addressName, { ...sourceAddress } as never, {
      shouldDirty: true,
      shouldValidate: false,
    });
  }, [addressName, getValues, sameAsSource, setValue, sourceAddress]);

  return (
    <section className="col-span-full flex flex-col gap-3 border-t border-dashed border-border pt-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">{title}</p>
        <FormField
          control={control}
          name={sameAsName}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-2 space-y-0">
              <FormControl>
                <Checkbox
                  checked={Boolean(field.value)}
                  disabled={disabled}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                />
              </FormControl>
              <FormLabel>{sameAsLabel}</FormLabel>
            </FormItem>
          )}
        />
      </div>
      <AddressFields
        control={control}
        name={addressName}
        disabled={disabled || Boolean(sameAsSource)}
      />
    </section>
  );
}
