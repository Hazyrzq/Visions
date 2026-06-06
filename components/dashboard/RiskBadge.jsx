const tagClass = {
  tinggi: 'vs-tag vs-tag--high',
  high: 'vs-tag vs-tag--high',
  sedang: 'vs-tag vs-tag--medium',
  medium: 'vs-tag vs-tag--medium',
  rendah: 'vs-tag vs-tag--low',
  low: 'vs-tag vs-tag--low',
};

export default function RiskBadge({ level }) {
  // Normalisasi input menjadi huruf kecil agar selalu cocok dengan key di atas
  const normalized = (level || '').toLowerCase();
  
  return (
    <span className={tagClass[normalized] ?? tagClass.rendah}>
      {level}
    </span>
  );
}