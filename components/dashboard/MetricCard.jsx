import { TrendingUp, TrendingDown } from 'lucide-react';

const colors = {
  indigo:  { icon: 'bg-indigo-600 text-white', ring: '' },
  red:     { icon: 'bg-red-500 text-white',    ring: '' },
  amber:   { icon: 'bg-amber-500 text-white',  ring: '' },
  emerald: { icon: 'bg-emerald-500 text-white',ring: '' },
  sky:     { icon: 'bg-sky-500 text-white',    ring: '' },
};

export default function MetricCard({ title, value, subtitle, icon: Icon, trend, trendValue, color = 'indigo' }) {
  const c = colors[color] ?? colors.indigo;
  const isUp = trend === 'up';
  const isDown = trend === 'down';

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-xl ${c.icon}`}>
          {Icon && <Icon className="w-5 h-5" />}
        </div>
        {trendValue && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${isUp ? 'bg-emerald-50 text-emerald-600' : isDown ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-500'}`}>
            {isUp ? <TrendingUp className="w-3 h-3" /> : isDown ? <TrendingDown className="w-3 h-3" /> : null}
            {trendValue}
          </div>
        )}
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold text-gray-900 tabular-nums">{value}</div>
        <div className="text-sm font-medium text-gray-600 mt-0.5">{title}</div>
        {subtitle && <div className="text-xs text-gray-400 mt-1">{subtitle}</div>}
      </div>
    </div>
  );
}
