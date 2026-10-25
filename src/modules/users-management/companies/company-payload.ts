import type {
  CompanyCreateRequest,
  CompanyFormValues,
  CompanyUpdateRequest,
} from "@/modules/users-management/companies/schemas";
import { emptyToNull, toAddressPayload } from "@/modules/users-management/organization/schemas";

function resolveAddressPayload(
  values: CompanyFormValues,
  field: "bill_to_address" | "ship_to_address",
  sameAsField: "bill_to_same_as_address" | "ship_to_same_as_address",
) {
  if (values[sameAsField]) {
    return toAddressPayload(values.address);
  }
  return toAddressPayload(values[field]);
}

export function companyFormToCreateRequest(values: CompanyFormValues): CompanyCreateRequest {
  return {
    name: values.name.trim(),
    email: emptyToNull(values.email),
    phone: emptyToNull(values.phone),
    address: toAddressPayload(values.address),
    bill_to_address: resolveAddressPayload(values, "bill_to_address", "bill_to_same_as_address"),
    ship_to_address: resolveAddressPayload(values, "ship_to_address", "ship_to_same_as_address"),
  };
}

export function companyFormToUpdateRequest(values: CompanyFormValues): CompanyUpdateRequest {
  return companyFormToCreateRequest(values);
}
