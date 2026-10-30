import { z } from "zod";

export const AddressPayloadSchema = z.object({
  address_line_1: z.string().max(250).nullable().optional(),
  address_line_2: z.string().max(250).nullable().optional(),
  address_line_3: z.string().max(250).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  state: z.string().max(100).nullable().optional(),
  country: z.string().max(100).nullable().optional(),
  country_code: z.string().max(10).nullable().optional(),
  postal_code: z.string().max(30).nullable().optional(),
});
export type AddressPayload = z.infer<typeof AddressPayloadSchema>;

export const AddressFormSchema = z.object({
  address_line_1: z.string().max(250),
  address_line_2: z.string().max(250),
  address_line_3: z.string().max(250),
  city: z.string().max(100),
  state: z.string().max(100),
  country: z.string().max(100),
  country_code: z.string().max(10),
  postal_code: z.string().max(30),
});
export type AddressFormValues = z.infer<typeof AddressFormSchema>;

export const EMPTY_ADDRESS_FORM: AddressFormValues = {
  address_line_1: "",
  address_line_2: "",
  address_line_3: "",
  city: "",
  state: "",
  country: "",
  country_code: "",
  postal_code: "",
};

export function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function addressesMatch(a: AddressFormValues, b: AddressFormValues): boolean {
  return (
    a.address_line_1 === b.address_line_1 &&
    a.address_line_2 === b.address_line_2 &&
    a.address_line_3 === b.address_line_3 &&
    a.city === b.city &&
    a.state === b.state &&
    a.country === b.country &&
    a.country_code === b.country_code &&
    a.postal_code === b.postal_code
  );
}

export function addressToFormValues(address: AddressPayload | null | undefined): AddressFormValues {
  return {
    address_line_1: address?.address_line_1 ?? "",
    address_line_2: address?.address_line_2 ?? "",
    address_line_3: address?.address_line_3 ?? "",
    city: address?.city ?? "",
    state: address?.state ?? "",
    country: address?.country ?? "",
    country_code: address?.country_code ?? "",
    postal_code: address?.postal_code ?? "",
  };
}

export function toAddressPayload(address: AddressFormValues): AddressPayload | null {
  const payload: AddressPayload = {
    address_line_1: emptyToNull(address.address_line_1),
    address_line_2: emptyToNull(address.address_line_2),
    address_line_3: emptyToNull(address.address_line_3),
    city: emptyToNull(address.city),
    state: emptyToNull(address.state),
    country: emptyToNull(address.country),
    country_code: emptyToNull(address.country_code),
    postal_code: emptyToNull(address.postal_code),
  };
  return Object.values(payload).some(Boolean) ? payload : null;
}

export const OrganizationBrandingSchema = z.object({
  name: z.string(),
  logo_url: z.string().nullable().optional(),
});
export type OrganizationBranding = z.infer<typeof OrganizationBrandingSchema>;

export const OrganizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  timezone: z.string(),
  logo_url: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  contact_email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  fiscal_year_start_month: z.number().int().min(1).max(12).default(1),
  fiscal_year_start_day: z.number().int().min(1).max(31).default(1),
  settings: z
    .object({
      headquarters: AddressPayloadSchema.nullable().optional(),
    })
    .passthrough()
    .optional()
    .default({}),
  users_count: z.number().int().nonnegative(),
  departments_count: z.number().int().nonnegative(),
  branches_count: z.number().int().nonnegative(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Organization = z.infer<typeof OrganizationSchema>;

export function organizationHeadquarters(org: Organization): AddressPayload | null | undefined {
  const hq = org.settings?.headquarters;
  return hq ?? null;
}

export const OrganizationUpdateSchema = z.object({
  name: z.string().min(1).max(200).nullable().optional(),
  timezone: z.string().min(1).max(100).nullable().optional(),
  industry: z.string().max(150).nullable().optional(),
  website: z.string().max(255).nullable().optional(),
  contact_email: z.string().max(255).nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  fiscal_year_start_month: z.number().int().min(1).max(12).nullable().optional(),
  fiscal_year_start_day: z.number().int().min(1).max(31).nullable().optional(),
  headquarters: AddressPayloadSchema.nullable().optional(),
});
export type OrganizationUpdate = z.infer<typeof OrganizationUpdateSchema>;

export const CompanySettingsFormSchema = z.object({
  name: z.string().min(1, "Enter a company name").max(200),
  timezone: z.string().min(1, "Select a timezone").max(100),
  industry: z.string().max(150),
  website: z.string().max(255),
  contact_email: z.string().max(255),
  phone: z.string().max(50),
  fiscal_year_start_month: z.number().int().min(1).max(12),
  fiscal_year_start_day: z.number().int().min(1).max(31),
  headquarters: AddressFormSchema,
});
export type CompanySettingsFormValues = z.infer<typeof CompanySettingsFormSchema>;
