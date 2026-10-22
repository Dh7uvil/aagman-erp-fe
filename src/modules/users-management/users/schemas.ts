import { z } from "zod";

import { RoleSummarySchema } from "@/shared/auth/session-schema";
import {
  BranchSummarySchema,
  DepartmentSummarySchema,
} from "@/shared/auth/session-schema";

export const UserStatusSchema = z.enum(["ACTIVE", "INVITED", "DISABLED"]);
export type UserStatus = z.infer<typeof UserStatusSchema>;

export const EmployeeStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);
export type EmployeeStatus = z.infer<typeof EmployeeStatusSchema>;

export const EMPLOYEE_SELECT_NONE = "none";

export const EmployeeFormFieldsSchema = z.object({
  branch_id: z.string(),
  department_id: z.string(),
  designation: z.string().max(150),
});
export type EmployeeFormFields = z.infer<typeof EmployeeFormFieldsSchema>;

function optionalSelectUuid(value: string): string | null {
  return value && value !== EMPLOYEE_SELECT_NONE ? value : null;
}

export function emptyEmployeeFormValues(): EmployeeFormFields {
  return {
    branch_id: EMPLOYEE_SELECT_NONE,
    department_id: EMPLOYEE_SELECT_NONE,
    designation: "",
  };
}

export function employeeFormValuesFromUser(user: {
  branch_id?: string | null;
  department_id?: string | null;
  designation?: string | null;
  branch?: { id: string } | null;
  department?: { id: string } | null;
}): EmployeeFormFields {
  return {
    branch_id: user.branch_id ?? user.branch?.id ?? EMPLOYEE_SELECT_NONE,
    department_id: user.department_id ?? user.department?.id ?? EMPLOYEE_SELECT_NONE,
    designation: user.designation ?? "",
  };
}

export function toEmployeeUpsert(values: EmployeeFormFields) {
  return {
    branch_id: optionalSelectUuid(values.branch_id),
    department_id: optionalSelectUuid(values.department_id),
    designation: values.designation.trim() ? values.designation.trim() : null,
  };
}

export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  status: UserStatusSchema,
  designation: z.string().nullable().optional(),
  branch_id: z.string().uuid().nullable().optional(),
  department_id: z.string().uuid().nullable().optional(),
  last_login_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  roles: z.array(RoleSummarySchema).default([]),
  branch: BranchSummarySchema.nullable().optional(),
  department: DepartmentSummarySchema.nullable().optional(),
});
export type User = z.infer<typeof UserSchema>;

export const UserListSchema = z.array(UserSchema);

export const UserDetailSchema = UserSchema;
export type UserDetail = z.infer<typeof UserDetailSchema>;

export const UserCreateRequestSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().min(3).max(255),
  password: z.string().min(8).max(72),
  phone: z.string().max(50).nullable().optional(),
  status: UserStatusSchema.optional(),
  role_ids: z.array(z.string().uuid()).optional(),
  branch_id: z.string().uuid().nullable().optional(),
  department_id: z.string().uuid().nullable().optional(),
  designation: z.string().max(150).nullable().optional(),
});
export type UserCreateRequest = z.infer<typeof UserCreateRequestSchema>;

export const UserCreateFormSchema = z
  .object({
    name: z.string().min(1, "Enter a name").max(200),
    email: z.string().min(3, "Enter an email").max(255),
    password: z.string().min(8, "Use at least 8 characters").max(72),
    phone: z.string().max(50),
    status: UserStatusSchema,
    role_ids: z.array(z.string().uuid()),
  })
  .merge(EmployeeFormFieldsSchema);
export type UserCreateFormValues = z.infer<typeof UserCreateFormSchema>;

export const UserUpdateRequestSchema = z.object({
  name: z.string().min(1).max(200).nullable().optional(),
  email: z.string().min(3).max(255).nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  status: UserStatusSchema.nullable().optional(),
  branch_id: z.string().uuid().nullable().optional(),
  department_id: z.string().uuid().nullable().optional(),
  designation: z.string().max(150).nullable().optional(),
});
export type UserUpdateRequest = z.infer<typeof UserUpdateRequestSchema>;

export const UserUpdateFormSchema = z
  .object({
    name: z.string().min(1, "Enter a name").max(200),
    email: z.string().min(3, "Enter an email").max(255),
    phone: z.string().max(50),
    status: UserStatusSchema,
    role_ids: z.array(z.string().uuid()),
  })
  .merge(EmployeeFormFieldsSchema);
export type UserUpdateFormValues = z.infer<typeof UserUpdateFormSchema>;

export const AssignRolesRequestSchema = z.object({
  role_ids: z.array(z.string().uuid()),
});

export const AdminResetUserPasswordRequestSchema = z.object({
  new_password: z.string().min(8, "Use at least 8 characters").max(72),
});
export type AdminResetUserPasswordRequest = z.infer<typeof AdminResetUserPasswordRequestSchema>;

export type UserListSortBy =
  | "created_at"
  | "updated_at"
  | "name"
  | "email"
  | "status"
  | "last_login_at";
export type UserListSortOrder = "asc" | "desc";

export type UserListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: UserListSortBy;
  sort_order?: UserListSortOrder;
  status?: UserStatus;
  role_id?: string;
  role_ids?: string[];
  department_id?: string;
  branch_id?: string;
  designation?: string;
  last_login_from?: string;
  last_login_to?: string;
  phone?: string;
  employee_status?: EmployeeStatus;
  employee_code?: string;
  joining_date?: string;
  joining_date_from?: string;
  joining_date_to?: string;
  manager_id?: string;
};
