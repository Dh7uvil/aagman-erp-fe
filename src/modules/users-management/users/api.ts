import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  AssignRolesRequestSchema,
  AdminResetUserPasswordRequestSchema,
  UserCreateRequestSchema,
  UserDetailSchema,
  UserListSchema,
  UserUpdateRequestSchema,
  type User,
  type AdminResetUserPasswordRequest,
  type UserCreateRequest,
  type UserDetail,
  type UserListParams,
  type UserUpdateRequest,
} from "@/modules/users-management/users/schemas";
import { apiClient, type RequestParams } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";
import { fetchAllPages } from "@/shared/api/paginate";

function toListQuery(params: UserListParams): RequestParams {
  return {
    page: params.page ?? 1,
    page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
    search: params.search,
    sort_by: params.sort_by,
    sort_order: params.sort_order,
    status: params.status,
    role_id: params.role_id,
    role_ids: params.role_ids,
    department_id: params.department_id,
    branch_id: params.branch_id,
    designation: params.designation,
    last_login_from: params.last_login_from,
    last_login_to: params.last_login_to,
    phone: params.phone,
  };
}

export const usersApi = {
  list: async (params: UserListParams = {}): Promise<ListResponse<User[]>> => {
    const result = await apiClient.getList<unknown>("/users", {
      params: toListQuery(params),
    });
    return { data: UserListSchema.parse(result.data), meta: result.meta };
  },
  listAll: (): Promise<User[]> =>
    fetchAllPages((page, pageSize) => usersApi.list({ page, page_size: pageSize })),
  get: async (id: string): Promise<UserDetail> =>
    UserDetailSchema.parse(await apiClient.get(`/users/${id}`)),
  create: async (values: UserCreateRequest): Promise<UserDetail> =>
    UserDetailSchema.parse(await apiClient.post("/users", UserCreateRequestSchema.parse(values))),
  update: async (id: string, values: UserUpdateRequest): Promise<UserDetail> =>
    UserDetailSchema.parse(
      await apiClient.patch(`/users/${id}`, UserUpdateRequestSchema.parse(values)),
    ),
  deactivate: async (id: string): Promise<UserDetail> =>
    UserDetailSchema.parse(await apiClient.post(`/users/${id}/deactivate`)),
  activate: async (id: string): Promise<UserDetail> =>
    UserDetailSchema.parse(await apiClient.post(`/users/${id}/activate`)),
  assignRoles: async (id: string, roleIds: string[]): Promise<UserDetail> =>
    UserDetailSchema.parse(
      await apiClient.put(
        `/users/${id}/roles`,
        AssignRolesRequestSchema.parse({ role_ids: roleIds }),
      ),
    ),
  resetPassword: async (id: string, values: AdminResetUserPasswordRequest): Promise<UserDetail> =>
    UserDetailSchema.parse(
      await apiClient.post(
        `/users/${id}/password-reset`,
        AdminResetUserPasswordRequestSchema.parse(values),
      ),
    ),
};
