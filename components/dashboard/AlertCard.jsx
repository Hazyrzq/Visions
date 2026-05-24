import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

const cfgMap = {
  critical: { Icon: AlertCircle,  wrap: 'bg-red-50 border-red-200',   icon: 'text-red-500',   title: 'text-red-800' },
  warning:  { Icon: AlertTriangle,wrap: 'bg-amber-50 border-amber-200',icon: 'text-amber-500', title: 'text-amber-800' },
  info:     { Icon: Info,         wrap: 'bg-blue-50 border-blue-200',  icon: 'text-blue-500',  title: 'text-blue-800' },
};

export default function AlertCard({ alert }) {
  const c = cfgMap[alert.type] ?? cfgMap.info;
  const { Icon } = c;
  return (
    <div className={`flex gap-3 p-4 rounded-xl border ${c.wrap}`}>
      <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${c.icon}`} />
      <div className="min-w-0">
        <p className={`text-sm font-semibold ${c.title}`}>{alert.title}</p>
        <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{alert.message}</p>
        <p className="text-[11px] text-gray-400 mt-1.5">{alert.time}</p>
      </div>
    </div>
  );
}
