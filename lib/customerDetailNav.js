/**
 * Query param `detail` opens customer detail in a slide-over (same URL, no /[id] page).
 */
export function hrefWithCustomerDetail(pathname, searchParams, customerId) {
  const p = new URLSearchParams(searchParams?.toString?.() ?? '');
  p.set('detail', String(customerId));
  const q = p.toString();
  return q ? `${pathname}?${q}` : pathname;
}

export function hrefWithoutCustomerDetail(pathname, searchParams) {
  const p = new URLSearchParams(searchParams?.toString?.() ?? '');
  p.delete('detail');
  const q = p.toString();
  return q ? `${pathname}?${q}` : pathname;
}
