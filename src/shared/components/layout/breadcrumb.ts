import type { NavigationItem } from "@/config/navigation";
import { navigation } from "@/config/navigation";

export type BreadcrumbCrumb = {
  label: string;
  href?: string;
};

export function buildBreadcrumbs({
  pathname,
  active,
  recordLabel,
}: {
  pathname: string;
  active?: { group: string; item: NavigationItem };
  recordLabel?: string | null;
}): BreadcrumbCrumb[] {
  const crumbs: BreadcrumbCrumb[] = [];

  if (active) {
    crumbs.push({ label: active.group });
    if (active.item.href !== "/") {
      crumbs.push({ label: active.item.label, href: active.item.href });
    } else {
      crumbs.push({ label: active.item.label });
    }
  } else {
    const match = navigation
      .flatMap((group) => group.items.map((item) => ({ group, item })))
      .find(({ item }) =>
        item.href === "/"
          ? pathname === "/"
          : pathname === item.href || pathname.startsWith(`${item.href}/`),
      );
    if (match) {
      crumbs.push({ label: match.group.label });
      crumbs.push(
        match.item.href === "/"
          ? { label: match.item.label }
          : { label: match.item.label, href: match.item.href },
      );
    }
  }

  if (recordLabel) {
    crumbs.push({ label: recordLabel });
  }

  return crumbs;
}
