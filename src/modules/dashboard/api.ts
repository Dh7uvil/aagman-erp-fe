import {
  JobsDashboardSchema,
  MaterialsDashboardSchema,
  type DashboardRangeParams,
  type JobsDashboard,
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
  jobs: async (params: DashboardRangeParams = {}): Promise<JobsDashboard> =>
    JobsDashboardSchema.parse(
      await apiClient.get("/inventory/dashboard/jobs", { params: rangeQuery(params) }),
    ),
  materials: async (params: DashboardRangeParams = {}): Promise<MaterialsDashboard> =>
    MaterialsDashboardSchema.parse(
      await apiClient.get("/inventory/dashboard/materials", { params: rangeQuery(params) }),
    ),
};
