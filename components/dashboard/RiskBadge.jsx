import { useLang } from '@/lib/i18n/LanguageContext';

const tagClass = {
  tinggi: 'vs-tag vs-tag--high',
  high: 'vs-tag vs-tag--high',
  sedang: 'vs-tag vs-tag--medium',
  medium: 'vs-tag vs-tag--medium',
  rendah: 'vs-tag vs-tag--low',
  low: 'vs-tag vs-tag--low',
};

export default function RiskBadge({ level }) {
  const { t } = useLang();
  // Normalisasi input menjadi huruf kecil agar selalu cocok dengan key di atas
  const normalized = (level || '').toLowerCase();
  
  let label = level;
  if (normalized === 'tinggi' || normalized === 'high') label = t('customer.high');
  else if (normalized === 'sedang' || normalized === 'medium') label = t('customer.medium');
  else if (normalized === 'rendah' || normalized === 'low') label = t('customer.low');

  return (
    <span className={tagClass[normalized] ?? tagClass.rendah}>
      {label}
    </span>
  );
}