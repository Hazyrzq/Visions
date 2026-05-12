import { TrendingUp, TrendingDown } from 'lucide-react';

const ringMap = {
  indigo: 'group-hover:bg-[var(--vs-brand-50)] group-hover:text-[var(--vs-brand)]',
  blue: 'group-hover:bg-[var(--vs-brand-50)] group-hover:text-[var(--vs-brand)]',
  red: 'group-hover:bg-red-50 group-hover:text-red-600',
  amber: 'group-hover:bg-amber-50 group-hover:text-amber-700',
  emerald: 'group-hover:bg-emerald-50 group-hover:text-emerald-700',
  sky: 'group-hover:bg-sky-50 group-hover:text-sky-600',
};

export default function MetricCard({ title, value, subtitle, icon: Icon, trend, trendValue, color = 'indigo' }) {
  const isUp = trend === 'up';
  const isDown = trend === 'down';

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300/90 hover:shadow-md">
      <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-gradient-to-br from-slate-200/40 to-[var(--vs-brand)]/10 blur-2xl" />
      <div className="relative mb-3 flex items-start justify-between gap-2">
        {Icon && (
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors ${ringMap[color] ?? ringMap.indigo}`}
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
          </span>
        )}
        {trendValue && (
          <div
            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${
              isUp ? 'bg-emerald-100 text-emerald-700' : isDown ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {isUp ? <TrendingUp className="h-3 w-3" /> : isDown ? <TrendingDown className="h-3 w-3" /> : null}
            {trendValue}
          </div>
        )}
      </div>
      <div className="relative text-[1.65rem] font-bold tabular-nums leading-none tracking-tight text-slate-900 sm:text-[1.85rem]">
        {value}
      </div>
      <div className="relative mt-2 text-[13px] font-semibold text-slate-600">{title}</div>
      {subtitle && <div className="relative mt-1 text-[11px] font-medium text-slate-400 sm:text-[12px]">{subtitle}</div>}
    </div>
  );
}
