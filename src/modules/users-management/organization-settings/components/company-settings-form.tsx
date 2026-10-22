"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { organizationSettingsPermissions } from "@/modules/users-management/organization-settings/permissions";
import { CompanyLogoCard } from "@/modules/users-management/organization-settings/components/company-logo-card";
import { useUpdateOrganization } from "@/modules/users-management/organization/mutations";
import { useOrganization } from "@/modules/users-management/organization/queries";
import {
  addressToFormValues,
  CompanySettingsFormSchema,
  emptyToNull,
  organizationHeadquarters,
  toAddressPayload,
  type CompanySettingsFormValues,
  type Organization,
  type OrganizationUpdate,
} from "@/modules/users-management/organization/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { DataTableError } from "@/shared/components/data-table/states";
import { AddressFields } from "@/shared/components/form/address-fields";
import { TimezoneSelect } from "@/shared/components/form/timezone-select";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { applyFieldErrors } from "@/shared/lib/form-errors";
import { useCan } from "@/shared/providers/session-provider";

function toFormValues(org: Organization): CompanySettingsFormValues {
  return {
    name: org.name,
    timezone: org.timezone,
    industry: org.industry ?? "",
    website: org.website ?? "",
    contact_email: org.contact_email ?? "",
    phone: org.phone ?? "",
    fiscal_year_start_month: org.fiscal_year_start_month,
    fiscal_year_start_day: org.fiscal_year_start_day,
    headquarters: addressToFormValues(organizationHeadquarters(org)),
  };
}

function toUpdatePayload(values: CompanySettingsFormValues): OrganizationUpdate {
  return {
    name: values.name.trim(),
    timezone: values.timezone.trim(),
    industry: emptyToNull(values.industry),
    website: emptyToNull(values.website),
    contact_email: emptyToNull(values.contact_email),
    phone: emptyToNull(values.phone),
    fiscal_year_start_month: values.fiscal_year_start_month,
    fiscal_year_start_day: values.fiscal_year_start_day,
    headquarters: toAddressPayload(values.headquarters),
  };
}

export function CompanySettingsForm() {
  const can = useCan();
  const canUpdate = can(organizationSettingsPermissions.update);
  const orgQuery = useOrganization();
  const updateOrg = useUpdateOrganization();

  const form = useForm<CompanySettingsFormValues>({
    resolver: zodResolver(CompanySettingsFormSchema),
    defaultValues: {
      name: "",
      timezone: "UTC",
      industry: "",
      website: "",
      contact_email: "",
      phone: "",
      fiscal_year_start_month: 1,
      fiscal_year_start_day: 1,
      headquarters: addressToFormValues(null),
    },
  });

  useEffect(() => {
    if (orgQuery.data) {
      form.reset(toFormValues(orgQuery.data));
    }
  }, [form, orgQuery.data]);

  async function onSubmit(values: CompanySettingsFormValues) {
    try {
      await updateOrg.mutateAsync(toUpdatePayload(values));
      toast.success("Organization settings saved");
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      toast.error(getErrorMessage(error));
    }
  }

  const pending = updateOrg.isPending || form.formState.isSubmitting;

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_max-content]">
      {orgQuery.isLoading ? (
        <Card className="gap-0">
          <CardHeader className="border-border border-b pt-4 pb-3 [.border-b]:pb-3">
            <CardTitle className="text-base">Company profile</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground pt-4 pb-3 [&:last-child]:pb-3 text-sm">
            Loading…
          </CardContent>
        </Card>
      ) : orgQuery.isError ? (
        <DataTableError
          message={getErrorMessage(orgQuery.error)}
          onRetry={() => {
            void orgQuery.refetch();
          }}
        />
      ) : (
        <Card className="gap-0">
          <CardHeader className="border-border border-b pt-4 pb-3 [.border-b]:pb-3">
            <CardTitle className="text-base">Company profile</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 pb-3 [&:last-child]:pb-3">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company name</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!canUpdate} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Timezone</FormLabel>
                        <FormControl>
                          <TimezoneSelect
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={!canUpdate}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industry</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!canUpdate} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!canUpdate} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contact_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} disabled={!canUpdate} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!canUpdate} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fiscal_year_start_month"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fiscal year start month</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={12}
                            {...field}
                            onChange={(event) => field.onChange(Number(event.target.value))}
                            disabled={!canUpdate}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fiscal_year_start_day"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fiscal year start day</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={31}
                            {...field}
                            onChange={(event) => field.onChange(Number(event.target.value))}
                            disabled={!canUpdate}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <AddressFields control={form.control} name="headquarters" disabled={!canUpdate} />
                {canUpdate ? (
                  <div className="flex justify-end">
                    <Button type="submit" disabled={pending}>
                      {pending ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      ) : null}
                      Save changes
                    </Button>
                  </div>
                ) : null}
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
      <CompanyLogoCard />
    </div>
  );
}
