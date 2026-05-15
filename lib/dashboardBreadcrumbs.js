/** Labels for URL segments under /dashboard/... */
const SEGMENT_LABELS = {
  admin: 'Admin',
  staff: 'Staf',
  profile: 'Profil',
  customer: 'Customer',
  'user-management': 'Users',
  'staf-view': 'Staff View',
  data: 'Data & Model',
  report: 'Reports',
  chat: 'Team Chat',
  notifikasi: 'Notifications',
};

const ROOT_LABEL = {
  admin: 'Overview',
  staff: 'Overview',
};

/**
 * @param {string} pathname
 * @returns {{ crumbs: { label: string }[], pageTitle: string }}
 */
export function getDashboardBreadcrumbs(pathname) {
  const clean = pathname.replace(/\/$/, '') || '/dashboard/admin';
  const after = clean.replace(/^\/dashboard\/?/, '');
  const segments = after ? after.split('/').filter(Boolean) : [];

  if (segments.length === 0) {
    return { crumbs: [{ label: 'Dashboard' }], pageTitle: 'Dashboard' };
  }

  const role = segments[0];
  const crumbs = [{ label: 'Dashboard' }, { label: SEGMENT_LABELS[role] ?? role }];

  if (segments.length === 1) {
    const root = ROOT_LABEL[role] ?? 'Beranda';
    crumbs.push({ label: root });
    return { crumbs, pageTitle: root };
  }

  const isUuid = (s) => /^[0-9a-f-]{36}$/i.test(s) || /^\d+$/.test(s);

  if (role === 'staff' && segments[1] === 'customer') {
    if (segments.length === 2) {
      crumbs.push({ label: 'My Customers' });
      return { crumbs, pageTitle: 'My Customers' };
    }
    crumbs.push({ label: 'My Customers' });
    const last = segments[2];
    const detail = isUuid(last) ? 'Detail' : SEGMENT_LABELS[last] ?? last;
    crumbs.push({ label: detail });
    return { crumbs, pageTitle: detail };
  }

  let pageTitle = 'Detail';
  for (let i = 1; i < segments.length; i++) {
    const seg = segments[i];
    const label = isUuid(seg) ? 'Detail' : SEGMENT_LABELS[seg] ?? seg;
    crumbs.push({ label });
    if (i === segments.length - 1) pageTitle = label;
  }

  return { crumbs, pageTitle };
}
