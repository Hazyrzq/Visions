'use client';

import { useMemo, useState } from 'react';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/motion';
import { useLang } from '@/lib/i18n/LanguageContext';

const tooltipStyle = {
  background: '#0f172a',
  border: 'none',
  borderRadius: '14px',
  color: '#fff',
  fontSize: '12px',
  boxShadow: '0 16px 48px rgba(15,23,42,0.25)',
};

export default function LogipPerformanceChart({ data = [] }) {
  const [tab, setTab] = useState('6m');
  const { t } = useLang();

  const tabs = [
    { id: '6m', label: t('chart.sixMonths') ?? '6 bulan' },
    { id: 'q', label: t('chart.quarter') ?? 'Kuartal' },
    { id: 'y', label: t('chart.year') ?? 'Tahun' },
  ];

  // Potong data sesuai tab yang dipilih (3 bulan, 6 bulan, atau 12 bulan/setahun)
  const chartData = useMemo(() => {
    let slicedData = data;
    if (tab === 'q') slicedData = data.slice(-3); // Kuartal = 3 bulan terakhir
    else if (tab === '6m') slicedData = data.slice(-6); // 6 bulan terakhir
    else if (tab === 'y') slicedData = data.slice(-12); // Tahun = 12 bulan terakhir

    return slicedData.map((d) => ({
      ...d,
      target: Math.max(8, +(d.churn_rate * 0.82).toFixed(1)),
    }));
  }, [data, tab]);

  return (
    <motion.div variants={fadeUp} className="rounded-[24px] border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6 lg:p-7">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">Performa churn</h2>
          <p className="mt-1 text-[13px] text-slate-500">Aktual vs target mitigasi AI</p>
        </div>
        <div className="flex rounded-full border border-slate-200/90 bg-slate-50/90 p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-full px-4 py-1.5 text-[12px] font-semibold transition-all ${
                tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="h-[260px] w-full sm:h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="churnArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="bulan" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} dy={10} />
            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} dx={-4} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value, name) => [`${value}%`, name === 'churn_rate' ? (t('chart.actualChurn') ?? 'Churn aktual') : (t('chart.target') ?? 'Target')                
              ]}
            />
            <Area type="monotone" dataKey="churn_rate" stroke="none" fill="url(#churnArea)" fillOpacity={1} />
            <Line
              type="monotone"
              dataKey="churn_rate"
              stroke="#2563EB"
              strokeWidth={3}
              dot={{ r: 4, fill: '#fff', stroke: '#2563EB', strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="target"
              stroke="#f97316"
              strokeWidth={2.5}
              strokeDasharray="6 4"
              dot={{ r: 3, fill: '#fff', stroke: '#f97316', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-6 border-t border-slate-100 pt-4 text-[12px] font-semibold">
        <span className="flex items-center gap-2 text-slate-600">
          <span className="h-2.5 w-8 rounded-full bg-[#2563EB]" /> Churn aktual
        </span>
        <span className="flex items-center gap-2 text-slate-600">
          <span className="h-0.5 w-8 border-t-2 border-dashed border-orange-500" /> Target mitigasi
        </span>
      </div>
    </motion.div>
  );
}