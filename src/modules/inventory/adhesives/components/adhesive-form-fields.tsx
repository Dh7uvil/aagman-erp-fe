"use client";

import { type ReactNode, useState } from "react";
import type { Control } from "react-hook-form";
import { useFormContext } from "react-hook-form";

import { AdhesiveLineFields } from "@/modules/inventory/adhesives/components/adhesive-line-fields";
import type { AdhesiveFormValues } from "@/modules/inventory/adhesives/schemas";
import { CompanyQuickCreateDialog } from "@/modules/users-management/companies/components/company-quick-create-dialog";
import { companyPermissions } from "@/modules/users-management/companies/permissions";
import { useCompanies } from "@/modules/users-management/companies/queries";
import { MasterSelect } from "@/shared/components/form/master-select";
import {
  FormControl,
  FormField,
  FormGrid,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { useCan } from "@/shared/providers/session-provider";

function AdhesiveFormSection({
  title,
  actions,
  children,
}: {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 border-b border-border pb-5 last:border-b-0 last:pb-0">
      {title || actions ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {title ? <h3 className="text-sm font-semibold tracking-tight">{title}</h3> : null}
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function AdhesiveFormFields({
  control,
  readOnly,
  canViewPrice,
  isCreate,
}: {
  control: Control<AdhesiveFormValues>;
  readOnly: boolean;
  canViewPrice: boolean;
  isCreate: boolean;
}) {
  const can = useCan();
  const canCreateCompany = can(companyPermissions.create);
  const form = useFormContext<AdhesiveFormValues>();
  const companiesQuery = useCompanies({ page: 1, page_size: 200 });
  const companies = companiesQuery.data?.data ?? [];
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <AdhesiveFormSection>
        <FormGrid columns={2}>
          <FormField
            control={control}
            name="company_id"
            render={({ field }) => (
              <FormItem className="sm:col-span-2 lg:col-span-1">
                <FormLabel>Company</FormLabel>
                <FormControl>
                  <MasterSelect
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={readOnly || !isCreate}
                    placeholder="Select company"
                    options={companies.map((item) => ({ value: item.id, label: item.name }))}
                    createLabel={isCreate && !readOnly && canCreateCompany ? "Add company" : undefined}
                    onCreate={
                      isCreate && !readOnly && canCreateCompany
                        ? () => setCompanyDialogOpen(true)
                        : undefined
                    }
                    loading={companiesQuery.isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormGrid>
      </AdhesiveFormSection>

      <AdhesiveFormSection title="Adhesive lines">
        <AdhesiveLineFields
          control={control}
          readOnly={readOnly}
          canViewPrice={canViewPrice}
          embedded
        />
      </AdhesiveFormSection>

      <CompanyQuickCreateDialog
        open={companyDialogOpen}
        onOpenChange={setCompanyDialogOpen}
        onCreated={(created) => {
          form.setValue("company_id", created.id, { shouldValidate: true, shouldDirty: true });
        }}
      />
    </div>
  );
}
