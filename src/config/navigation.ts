import {
  Building2,
  ClipboardList,
  KeyRound,
  LayoutDashboard,
  Lock,
  Network,
  Settings,
  Shield,
  User,
  UserCog,
  Warehouse,
  Briefcase,
  Package,
  ArrowLeftRight,
  Ruler,
  type LucideIcon,
} from "lucide-react";

import { cylinderReturnRoutes } from "@/modules/inventory/cylinder-returns/routes";
import { jobRoutes } from "@/modules/inventory/jobs/routes";
import { materialRoutes } from "@/modules/inventory/materials/routes";
import {
  cylinderReturnPermissions,
  jobPermissions,
  materialPermissions,
  materialsReportPermissions,
  unitPermissions,
} from "@/modules/inventory/permissions";
import { unitRoutes } from "@/modules/inventory/units/routes";

import { auditLogRoutes } from "@/modules/users-management/audit-logs/routes";
import { auditLogPermissions } from "@/modules/users-management/audit-logs/permissions";
import { branchRoutes } from "@/modules/users-management/branches/routes";
import { branchPermissions } from "@/modules/users-management/branches/permissions";
import { companyRoutes } from "@/modules/users-management/companies/routes";
import { companyPermissions } from "@/modules/users-management/companies/permissions";
import { departmentRoutes } from "@/modules/users-management/departments/routes";
import { departmentPermissions } from "@/modules/users-management/departments/permissions";
import { organizationSettingsRoutes } from "@/modules/users-management/organization-settings/routes";
import { organizationSettingsPermissions } from "@/modules/users-management/organization-settings/permissions";
import { permissionRoutes } from "@/modules/users-management/permissions/routes";
import { permissionCatalogPermissions } from "@/modules/users-management/permissions/permissions";
import { roleRoutes } from "@/modules/users-management/roles/routes";
import { rolePermissions } from "@/modules/users-management/roles/permissions";
import { userRoutes } from "@/modules/users-management/users/routes";
import { userPermissions } from "@/modules/users-management/users/permissions";
import { warehouseRoutes } from "@/modules/users-management/warehouses/routes";
import { warehousePermissions } from "@/modules/users-management/warehouses/permissions";
import { appSegments } from "@/config/app-segments";
import { can } from "@/shared/auth/permissions";

export type NavigationItem = {
  label: string;
  href: string;
  permission: string | null;
  icon: LucideIcon;
  keywords?: string[];
  subsection?: string;
};

export type NavigationGroup = {
  label: string;
  items: NavigationItem[];
};

export const navigation: NavigationGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/", permission: null, icon: LayoutDashboard }],
  },
  {
    label: "Masters",
    items: [
      {
        label: "Companies",
        href: companyRoutes.list,
        permission: companyPermissions.read,
        icon: Briefcase,
      },
      {
        label: "Units",
        href: unitRoutes.list,
        permission: unitPermissions.read,
        icon: Ruler,
      },
    ],
  },
  {
    label: "Inventory",
    items: [
      {
        label: "Materials",
        href: materialRoutes.list,
        permission: materialPermissions.read,
        icon: Package,
        subsection: "Materials",
      },
      {
        label: "Materials report",
        href: materialRoutes.report,
        permission: materialsReportPermissions.read,
        icon: ArrowLeftRight,
        subsection: "Materials",
      },
      {
        label: "Jobs",
        href: jobRoutes.list,
        permission: jobPermissions.read,
        icon: Briefcase,
        subsection: "Operations",
      },
      {
        label: "Cylinder returns",
        href: cylinderReturnRoutes.list,
        permission: cylinderReturnPermissions.read,
        icon: ClipboardList,
        subsection: "Operations",
      },
    ],
  },
  {
    label: "Settings",
    items: [
      {
        label: "My Profile",
        href: `${appSegments.settings}/profile`,
        permission: null,
        icon: User,
      },
      {
        label: "Change Password",
        href: `${appSegments.settings}/password`,
        permission: null,
        icon: KeyRound,
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        label: "Users",
        href: userRoutes.list,
        permission: userPermissions.read,
        icon: UserCog,
        subsection: "User Management",
      },
      {
        label: "Roles",
        href: roleRoutes.list,
        permission: rolePermissions.read,
        icon: Shield,
        subsection: "User Management",
      },
      {
        label: "Permissions",
        href: permissionRoutes.list,
        permission: permissionCatalogPermissions.read,
        icon: Lock,
        subsection: "User Management",
      },
      {
        label: "Branches",
        href: branchRoutes.list,
        permission: branchPermissions.read,
        icon: Building2,
        subsection: "Locations",
      },
      {
        label: "Departments",
        href: departmentRoutes.list,
        permission: departmentPermissions.read,
        icon: Network,
        subsection: "Locations",
      },
      {
        label: "Warehouses",
        href: warehouseRoutes.list,
        permission: warehousePermissions.read,
        icon: Warehouse,
        subsection: "Locations",
      },
      {
        label: "Settings",
        href: organizationSettingsRoutes.list,
        permission: organizationSettingsPermissions.read,
        icon: Settings,
        subsection: "Organization",
        keywords: ["organization", "company"],
      },
      {
        label: "Audit Logs",
        href: auditLogRoutes.list,
        permission: auditLogPermissions.read,
        icon: ClipboardList,
        subsection: "Organization",
      },
    ],
  },
];

export function visibleNavigation(permissions: readonly string[]): NavigationGroup[] {
  return navigation
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => item.permission === null || can(item.permission, permissions),
      ),
    }))
    .filter((group) => group.items.length > 0);
}

export function searchableNavigation(permissions: readonly string[]): NavigationGroup[] {
  return visibleNavigation(permissions);
}

export function findActiveNav(
  pathname: string,
): { group: string; item: NavigationItem } | undefined {
  const matches = navigation.flatMap((group) =>
    group.items
      .filter((item) =>
        item.href === "/"
          ? pathname === "/"
          : pathname === item.href || pathname.startsWith(`${item.href}/`),
      )
      .map((item) => ({ group: group.label, item })),
  );
  matches.sort((a, b) => b.item.href.length - a.item.href.length);
  return matches[0];
}
