const tagClass = {
  Tinggi: 'vs-tag vs-tag--high',
  Sedang: 'vs-tag vs-tag--medium',
  Rendah: 'vs-tag vs-tag--low',
};

export default function RiskBadge({ level }) {
  return (
    <span className={tagClass[level] ?? tagClass.Rendah}>
      {level}
    </span>
  );
}
