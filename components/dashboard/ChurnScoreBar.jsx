function getColor(s) {
  if (s > 65) return { bar: 'var(--vs-danger)',   text: 'var(--vs-danger)' };
  if (s > 30) return { bar: 'var(--vs-warn)',     text: 'var(--vs-warn)' };
  return        { bar: 'var(--vs-success)', text: 'var(--vs-success)' };
}

export default function ChurnScoreBar({ score }) {
  const { bar, text } = getColor(score);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-[var(--vs-line-soft)] rounded-full h-1.5 overflow-hidden min-w-[64px]">
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: bar }} />
      </div>
      <span className="text-[12px] font-bold w-6 text-right tabular-nums" style={{ color: text }}>{score}</span>
    </div>
  );
}
