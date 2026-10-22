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
  type LucideIcon,
} from "lucide-react";

import { auditLogPermissions } from "@/modules/users-management/audit-logs/permissions";
import { branchPermissions } from "@/modules/users-management/branches/permissions";
import { departmentPermissions } from "@/modules/users-management/departments/permissions";
import { organizationSettingsPermissions } from "@/modules/users-management/organization-settings/permissions";
import { permissionCatalogPermissions } from "@/modules/users-management/permissions/permissions";
import { rolePermissions } from "@/modules/users-management/roles/permissions";
import { userPermissions } from "@/modules/users-management/users/permissions";
import { warehousePermissions } from "@/modules/users-management/warehouses/permissions";
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
    label: "Settings",
    items: [
      { label: "My Profile", href: "/settings/profile", permission: null, icon: User },
      { label: "Change Password", href: "/settings/password", permission: null, icon: KeyRound },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        label: "Users",
        href: "/users",
        permission: userPermissions.read,
        icon: UserCog,
        subsection: "User Management",
      },
      {
        label: "Roles",
        href: "/roles",
        permission: rolePermissions.read,
        icon: Shield,
        subsection: "User Management",
      },
      {
        label: "Permissions",
        href: "/permissions",
        permission: permissionCatalogPermissions.read,
        icon: Lock,
        subsection: "User Management",
      },
      {
        label: "Branches",
        href: "/branches",
        permission: branchPermissions.read,
        icon: Building2,
        subsection: "Locations",
      },
      {
        label: "Departments",
        href: "/departments",
        permission: departmentPermissions.read,
        icon: Network,
        subsection: "Locations",
      },
      {
        label: "Warehouses",
        href: "/warehouses",
        permission: warehousePermissions.read,
        icon: Warehouse,
        subsection: "Locations",
      },
      {
        label: "Settings",
        href: "/organization-settings",
        permission: organizationSettingsPermissions.read,
        icon: Settings,
        subsection: "Organization",
        keywords: ["organization", "company"],
      },
      {
        label: "Audit Logs",
        href: "/audit-logs",
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
