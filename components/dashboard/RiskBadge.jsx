const cfg = {
  Tinggi: { wrap: 'bg-red-100 text-red-700',     dot: 'bg-red-500' },
  Sedang: { wrap: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-500' },
  Rendah: { wrap: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
};

export default function RiskBadge({ level }) {
  const c = cfg[level] ?? cfg.Rendah;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${c.wrap}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {level}
    </span>
  );
}
