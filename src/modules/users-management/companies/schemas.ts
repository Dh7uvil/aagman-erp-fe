import { z } from "zod";

import {
  AddressFormSchema,
  AddressPayloadSchema,
  addressesMatch,
  addressToFormValues,
  type AddressFormValues,
  type AddressPayload,
} from "@/modules/users-management/organization/schemas";

export const CompanySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  address: AddressPayloadSchema.nullable().default(null),
  bill_to_address: AddressPayloadSchema.nullable().default(null),
  ship_to_address: AddressPayloadSchema.nullable().default(null),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Company = z.infer<typeof CompanySchema>;

export const CompanyListSchema = z.array(CompanySchema);

export const CompanyCreateRequestSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().max(255).nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  address: AddressPayloadSchema.nullable().optional(),
  bill_to_address: AddressPayloadSchema.nullable().optional(),
  ship_to_address: AddressPayloadSchema.nullable().optional(),
});
export type CompanyCreateRequest = z.infer<typeof CompanyCreateRequestSchema>;

export const CompanyUpdateRequestSchema = z.object({
  name: z.string().min(1).max(200).nullable().optional(),
  email: z.string().max(255).nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  address: AddressPayloadSchema.nullable().optional(),
  bill_to_address: AddressPayloadSchema.nullable().optional(),
  ship_to_address: AddressPayloadSchema.nullable().optional(),
});
export type CompanyUpdateRequest = z.infer<typeof CompanyUpdateRequestSchema>;

export const CompanyFormSchema = z.object({
  name: z.string().min(1, "Enter a company name").max(200),
  email: z
    .string()
    .max(255)
    .refine((value) => !value.trim() || value.includes("@"), {
      message: "Enter a valid email address",
    }),
  phone: z.string().max(50),
  address: AddressFormSchema,
  bill_to_address: AddressFormSchema,
  ship_to_address: AddressFormSchema,
  bill_to_same_as_address: z.boolean(),
  ship_to_same_as_address: z.boolean(),
});
export type CompanyFormValues = z.infer<typeof CompanyFormSchema>;

export type CompanyListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
};

function sameAsPrimary(
  primary: AddressFormValues,
  other: AddressPayload | null | undefined,
): boolean {
  return addressesMatch(primary, addressToFormValues(other));
}

export function companyToFormValues(company: Company | null): CompanyFormValues {
  const address = addressToFormValues(company?.address);
  const billTo = addressToFormValues(company?.bill_to_address);
  const shipTo = addressToFormValues(company?.ship_to_address);
  return {
    name: company?.name ?? "",
    email: company?.email ?? "",
    phone: company?.phone ?? "",
    address,
    bill_to_address: billTo,
    ship_to_address: shipTo,
    bill_to_same_as_address: company ? sameAsPrimary(address, company.bill_to_address) : false,
    ship_to_same_as_address: company ? sameAsPrimary(address, company.ship_to_address) : false,
  };
}
