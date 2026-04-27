function getColor(s) {
  if (s > 65) return { bar: 'bg-red-500',     text: 'text-red-600' };
  if (s > 30) return { bar: 'bg-amber-500',   text: 'text-amber-600' };
  return        { bar: 'bg-emerald-500', text: 'text-emerald-600' };
}

export default function ChurnScoreBar({ score }) {
  const { bar, text } = getColor(score);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden min-w-[64px]">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-bold w-6 text-right tabular-nums ${text}`}>{score}</span>
    </div>
  );
}
