import type { NavigationItem } from "@/config/navigation";
import { navigation } from "@/config/navigation";
import {
  getHistoryResource,
  historyPageTitle,
  isHistoryResource,
} from "@/shared/lib/history";

export type BreadcrumbCrumb = {
  label: string;
  href?: string;
};

function navMatchForHref(href: string) {
  return navigation
    .flatMap((group) => group.items.map((item) => ({ group: group.label, item })))
    .filter(({ item }) => item.href === href)
    .map(({ group, item }) => ({ group, item }))[0];
}

function appendRecordCrumbs(
  crumbs: BreadcrumbCrumb[],
  recordTrail: BreadcrumbCrumb[] | null | undefined,
  recordLabel: string | null | undefined,
  recordHref: string,
) {
  if (recordTrail?.length) {
    crumbs.push(...recordTrail);
    return;
  }
  if (recordLabel) {
    crumbs.push({ label: recordLabel, href: recordHref });
  }
}

function buildHistoryBreadcrumbs(
  pathname: string,
  recordLabel?: string | null,
  recordTrail?: BreadcrumbCrumb[] | null,
): BreadcrumbCrumb[] | null {
  const match = /^\/history\/([^/]+)\/([^/]+)/.exec(pathname);
  if (!match) {
    return null;
  }
  const resourceSlug = match[1] ?? "";
  const recordId = match[2] ?? "";
  if (!isHistoryResource(resourceSlug)) {
    return null;
  }
  const spec = getHistoryResource(resourceSlug);
  if (!spec) {
    return null;
  }

  const crumbs: BreadcrumbCrumb[] = [];
  const nav = navMatchForHref(spec.listHref);
  if (nav) {
    crumbs.push({ label: nav.group });
    crumbs.push({ label: nav.item.label, href: nav.item.href });
  } else {
    crumbs.push({ label: spec.label, href: spec.listHref });
  }

  const recordHref = `${spec.listHref}/${recordId}`;
  appendRecordCrumbs(crumbs, recordTrail, recordLabel, recordHref);
  crumbs.push({ label: historyPageTitle() });
  return crumbs;
}

export function buildBreadcrumbs({
  pathname,
  active,
  recordLabel,
  recordTrail,
}: {
  pathname: string;
  active?: { group: string; item: NavigationItem };
  recordLabel?: string | null;
  recordTrail?: BreadcrumbCrumb[] | null;
}): BreadcrumbCrumb[] {
  const historyCrumbs = buildHistoryBreadcrumbs(pathname, recordLabel, recordTrail);
  if (historyCrumbs) {
    return historyCrumbs;
  }

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

  if (recordTrail?.length) {
    crumbs.push(...recordTrail);
  } else if (recordLabel) {
    crumbs.push({ label: recordLabel });
  }

  return crumbs;
}
