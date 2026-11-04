import {
  CylindersDashboardSchema,
  InksDashboardSchema,
  MaterialsDashboardSchema,
  type DashboardRangeParams,
  type CylindersDashboard,
  type InksDashboard,
  type MaterialsDashboard,
} from "@/modules/dashboard/schemas";
import { apiClient } from "@/shared/api/client";

function rangeQuery(params: DashboardRangeParams = {}) {
  return {
    date_from: params.date_from,
    date_to: params.date_to,
  };
}

export const dashboardApi = {
  cylinders: async (params: DashboardRangeParams = {}): Promise<CylindersDashboard> =>
    CylindersDashboardSchema.parse(
      await apiClient.get("/inventory/dashboard/cylinders", { params: rangeQuery(params) }),
    ),
  materials: async (params: DashboardRangeParams = {}): Promise<MaterialsDashboard> =>
    MaterialsDashboardSchema.parse(
      await apiClient.get("/inventory/dashboard/materials", { params: rangeQuery(params) }),
    ),
  inks: async (params: DashboardRangeParams = {}): Promise<InksDashboard> =>
    InksDashboardSchema.parse(
      await apiClient.get("/inventory/dashboard/inks", { params: rangeQuery(params) }),
    ),
};
