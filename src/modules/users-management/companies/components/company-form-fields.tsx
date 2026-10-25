"use client";

import type { Control } from "react-hook-form";

import type { CompanyFormValues } from "@/modules/users-management/companies/schemas";
import { AddressFields } from "@/shared/components/form/address-fields";
import { CopyableAddressSection } from "@/shared/components/form/copyable-address-section";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";

export function CompanyFormFields({
  control,
  readOnly,
}: {
  control: Control<CompanyFormValues>;
  readOnly: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-x-3 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel>Company name</FormLabel>
            <FormControl>
              <Input placeholder="e.g. Acme Corp" disabled={readOnly} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input
                type="email"
                placeholder="contact@company.com"
                disabled={readOnly}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="phone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Phone</FormLabel>
            <FormControl>
              <Input placeholder="+1-555-0000" disabled={readOnly} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <section className="col-span-full flex flex-col gap-3">
        <p className="text-sm font-medium">Address</p>
        <AddressFields control={control} name="address" disabled={readOnly} />
      </section>
      <CopyableAddressSection
        control={control}
        title="Bill to address"
        addressName="bill_to_address"
        sameAsName="bill_to_same_as_address"
        sourceName="address"
        sameAsLabel="Same as address"
        disabled={readOnly}
      />
      <CopyableAddressSection
        control={control}
        title="Ship to address"
        addressName="ship_to_address"
        sameAsName="ship_to_same_as_address"
        sourceName="address"
        sameAsLabel="Same as address"
        disabled={readOnly}
      />
    </div>
  );
}
