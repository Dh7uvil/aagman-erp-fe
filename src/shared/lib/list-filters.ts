/** URL `active` filter values for master/list screens with an is_active column. */
export const LIST_ACTIVE_ALL = "all";
export const LIST_ACTIVE_ACTIVE = "active";
export const LIST_ACTIVE_INACTIVE = "inactive";

/** Selected value in the status dropdown (defaults to Active when omitted from URL). */
export function listActiveFilterValue(urlValue: string | undefined): string {
  return urlValue ?? LIST_ACTIVE_ACTIVE;
}

/** API `is_active`: default true (active only), false for inactive, undefined for all. */
export function parseListActiveFilter(urlValue: string | undefined): boolean | undefined {
  const value = listActiveFilterValue(urlValue);
  if (value === LIST_ACTIVE_INACTIVE) {
    return false;
  }
  if (value === LIST_ACTIVE_ALL) {
    return undefined;
  }
  return true;
}

export function isNonDefaultListActiveFilter(urlValue: string | undefined): boolean {
  return Boolean(urlValue && urlValue !== LIST_ACTIVE_ACTIVE);
}
