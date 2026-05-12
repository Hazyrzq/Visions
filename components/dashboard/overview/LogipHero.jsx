'use client';

import { Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/motion';
import { useAuth } from '@/lib/hooks/useAuth';

export default function LogipHero({ subtitle, eyebrow = 'Dashboard' }) {
  const { profile } = useAuth();
  const first = profile?.full_name?.split(' ')[0] ?? '';
  const dateLine = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <motion.div variants={fadeUp} className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--vs-brand)]">{eyebrow}</p>
        <h1 className="text-[2.25rem] font-bold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.25rem]">
          Halo, {first || 'Pengguna'}
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-slate-500 sm:text-base">{subtitle}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-slate-200/90 bg-white px-5 py-3.5 shadow-sm">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <Calendar className="h-5 w-5" strokeWidth={2} />
        </span>
        <span className="text-[13px] font-semibold capitalize leading-snug text-slate-700 sm:text-[14px]">{dateLine}</span>
      </div>
    </motion.div>
  );
}
