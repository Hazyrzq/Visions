import id from '@/lib/i18n/id.json';
import en from '@/lib/i18n/en.json';

const translations = { id, en };

// Mapping segment URL ke key terjemahan
const segmentMap = {
  dashboard:        'dashboard',
  admin:            'admin',
  staff:            'staff',
  customer:         'customer',
  'staf-view':      'staffView',
  data:             'data',
  'user-management':'userManagement',
  report:           'report',
  chat:             'chat',
  notifikasi:       'notifikasi',
  profile:          'profile',
};

/**
 * Hasilkan breadcrumb dari pathname, dengan label ter-translate.
 * @param {string} pathname  — dari usePathname()
 * @param {string} lang      — 'id' | 'en'
 */
export function getDashboardBreadcrumbs(pathname, lang = 'id') {
  const t = translations[lang]?.breadcrumb ?? translations.id.breadcrumb;

  const segments = pathname.split('/').filter(Boolean);
  const crumbs = [];
  let path = '';

  for (const seg of segments) {
    path += `/${seg}`;
    const key = segmentMap[seg];
    // Skip segment yang tidak ada di map (misal: UUID atau ID dinamis)
    if (!key) continue;
    const label = t[key] ?? seg;
    crumbs.push({ label, href: path });
  }

  return { crumbs };
}
