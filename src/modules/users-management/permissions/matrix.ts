import type {
  PermissionMatrixAction,
  PermissionMatrixResponse,
} from "@/modules/users-management/permissions/schemas";
import { humanizeEnum } from "@/shared/lib/format";

const PREFERRED_ACTIONS = ["create", "read", "update", "delete", "view_price", "history"];

const ACTION_LABELS: Record<string, string> = {
  create: "Create",
  read: "Read",
  update: "Update",
  delete: "Delete",
  view_price: "View price",
  history: "View history",
};

type MatrixResourceRef = {
  module: string;
  resource: string;
  label: string;
};

type MatrixDisplayModule = {
  label: string;
  resources: MatrixResourceRef[];
};

/** Display order and grouping for the permissions matrix (API keys unchanged). */
export const PERMISSION_MATRIX_LAYOUT: MatrixDisplayModule[] = [
  {
    label: "User management",
    resources: [
      { module: "identity", resource: "user", label: "Users" },
      { module: "identity", resource: "role", label: "Roles" },
      { module: "identity", resource: "permission", label: "Permissions" },
    ],
  },
  {
    label: "Organization",
    resources: [
      { module: "identity", resource: "settings", label: "Settings" },
      { module: "identity", resource: "audit_log", label: "Audit logs" },
    ],
  },
  {
    label: "Locations",
    resources: [
      { module: "identity", resource: "branch", label: "Branches" },
      { module: "identity", resource: "department", label: "Departments" },
      { module: "identity", resource: "warehouse", label: "Warehouses" },
    ],
  },
  {
    label: "Masters",
    resources: [
      { module: "identity", resource: "company", label: "Companies" },
      { module: "inventory", resource: "unit", label: "Units" },
    ],
  },
  {
    label: "Inventory",
    resources: [
      { module: "inventory", resource: "material", label: "Materials" },
      { module: "inventory", resource: "materials_report", label: "Materials report" },
      { module: "inventory", resource: "job", label: "Jobs" },
      { module: "inventory", resource: "job_image", label: "Job image" },
      { module: "inventory", resource: "job_challan", label: "Challan" },
      { module: "inventory", resource: "cylinder_return", label: "Cylinder returns" },
    ],
  },
];

const RESOURCE_LABELS: Record<string, string> = Object.fromEntries(
  PERMISSION_MATRIX_LAYOUT.flatMap((mod) =>
    mod.resources.map((ref) => [ref.resource, ref.label] as const),
  ),
);

export function matrixResourceLabel(resource: string): string {
  return RESOURCE_LABELS[resource] ?? humanizeEnum(resource);
}

export function matrixActionLabel(action: string): string {
  return ACTION_LABELS[action] ?? humanizeEnum(action);
}

export type PermissionMatrixRow = {
  module: string;
  resource: string;
  resourceLabel: string;
  actions: Record<string, PermissionMatrixAction>;
};

export function grantedPermissionIds(matrix: PermissionMatrixResponse): string[] {
  return matrix.modules.flatMap((mod) =>
    mod.resources.flatMap((resource) =>
      resource.actions.filter((action) => action.granted).map((action) => action.id),
    ),
  );
}

export function isPermissionMatrix(value: unknown): value is PermissionMatrixResponse {
  return Boolean(
    value &&
    typeof value === "object" &&
    "modules" in value &&
    Array.isArray((value as PermissionMatrixResponse).modules),
  );
}

export function applyGrantedIds(
  matrix: PermissionMatrixResponse,
  grantedIds: ReadonlySet<string>,
): PermissionMatrixResponse {
  return {
    modules: matrix.modules.map((mod) => ({
      ...mod,
      resources: mod.resources.map((resource) => ({
        ...resource,
        actions: resource.actions.map((action) => ({
          ...action,
          granted: grantedIds.has(action.id),
        })),
      })),
    })),
  };
}

export function sameIdSet(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  const rightSet = new Set(right);
  return left.every((id) => rightSet.has(id));
}

export function matrixActionColumns(rows: PermissionMatrixRow[]): string[] {
  const actionSet = new Set<string>();
  for (const row of rows) {
    for (const action of Object.keys(row.actions)) {
      actionSet.add(action);
    }
  }
  const rest = [...actionSet].filter((action) => !PREFERRED_ACTIONS.includes(action)).sort();
  return [...PREFERRED_ACTIONS.filter((action) => actionSet.has(action)), ...rest];
}

const READ_ACTION = "read";

export type MatrixPermissionLocation = {
  module: string;
  resource: string;
  action: PermissionMatrixAction;
  resourceActions: PermissionMatrixAction[];
};

export function findMatrixPermission(
  matrix: PermissionMatrixResponse,
  permissionId: string,
): MatrixPermissionLocation | null {
  for (const mod of matrix.modules) {
    for (const resource of mod.resources) {
      const action = resource.actions.find((item) => item.id === permissionId);
      if (action) {
        return {
          module: mod.module,
          resource: resource.resource,
          action,
          resourceActions: resource.actions,
        };
      }
    }
  }
  return null;
}

/** Enforces: non-read grants require read; clearing read clears all actions on that resource. */
export function applyPermissionToggle(
  matrix: PermissionMatrixResponse,
  currentIds: ReadonlySet<string>,
  permissionId: string,
  checked: boolean,
): string[] {
  const location = findMatrixPermission(matrix, permissionId);
  if (!location) {
    return [...currentIds];
  }

  const next = new Set(currentIds);
  const readAction = location.resourceActions.find((item) => item.action === READ_ACTION);

  if (checked) {
    next.add(permissionId);
    if (readAction && location.action.action !== READ_ACTION) {
      next.add(readAction.id);
    }
    return [...next];
  }

  if (location.action.action === READ_ACTION) {
    for (const item of location.resourceActions) {
      next.delete(item.id);
    }
    return [...next];
  }

  next.delete(permissionId);
  return [...next];
}

export function normalizePermissionIds(
  matrix: PermissionMatrixResponse,
  ids: ReadonlySet<string>,
): string[] {
  const next = new Set(ids);

  for (const mod of matrix.modules) {
    for (const resource of mod.resources) {
      const readAction = resource.actions.find((item) => item.action === READ_ACTION);
      if (!readAction) {
        continue;
      }

      const hasNonReadGrant = resource.actions.some(
        (item) => item.action !== READ_ACTION && next.has(item.id),
      );

      if (hasNonReadGrant) {
        next.add(readAction.id);
      } else if (!next.has(readAction.id)) {
        for (const item of resource.actions) {
          next.delete(item.id);
        }
      }
    }
  }

  return [...next];
}

function catalogActionMap(
  matrix: PermissionMatrixResponse,
): Map<string, Record<string, PermissionMatrixAction>> {
  const map = new Map<string, Record<string, PermissionMatrixAction>>();
  for (const mod of matrix.modules) {
    for (const resource of mod.resources) {
      const key = `${mod.module}:${resource.resource}`;
      const actions: Record<string, PermissionMatrixAction> = {};
      for (const item of resource.actions) {
        actions[item.action] = item;
      }
      map.set(key, actions);
    }
  }
  return map;
}

const layoutKeys = new Set(
  PERMISSION_MATRIX_LAYOUT.flatMap((mod) =>
    mod.resources.map((ref) => `${ref.module}:${ref.resource}`),
  ),
);

export function permissionMatrixTable(matrix: PermissionMatrixResponse): {
  actions: string[];
  rows: PermissionMatrixRow[];
} {
  const actionMap = catalogActionMap(matrix);
  const rows: PermissionMatrixRow[] = [];

  for (const displayMod of PERMISSION_MATRIX_LAYOUT) {
    for (const ref of displayMod.resources) {
      const actions = actionMap.get(`${ref.module}:${ref.resource}`);
      if (!actions || Object.keys(actions).length === 0) {
        continue;
      }
      rows.push({
        module: displayMod.label,
        resource: ref.resource,
        resourceLabel: ref.label,
        actions,
      });
    }
  }

  for (const mod of matrix.modules) {
    for (const resource of mod.resources) {
      const key = `${mod.module}:${resource.resource}`;
      if (layoutKeys.has(key)) {
        continue;
      }
      const actions: Record<string, PermissionMatrixAction> = {};
      for (const item of resource.actions) {
        actions[item.action] = item;
      }
      rows.push({
        module: humanizeEnum(mod.module),
        resource: resource.resource,
        resourceLabel: matrixResourceLabel(resource.resource),
        actions,
      });
    }
  }

  return { actions: matrixActionColumns(rows), rows };
}
