'use client';

import Link from 'next/link';
import { Phone, Video, MoreHorizontal, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/motion';
import { useAuth } from '@/lib/hooks/useAuth';
import { mockActivities, mockAlerts } from '@/lib/mockData';

function initials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export default function LogipRightColumn({ activityFilterStaffId = null, customerHref = '/dashboard/admin/customer', showAlerts = true }) {
  const { profile } = useAuth();
  const handle = profile?.email?.split('@')[0] ?? 'pengguna';

  const activities = (activityFilterStaffId
    ? mockActivities.filter((a) => a.staff_id === activityFilterStaffId)
    : mockActivities
  ).slice(0, 5);

  const alertDot = (type) => {
    const t = (type || '').toLowerCase();
    if (t === 'critical') return 'bg-red-500';
    if (t === 'warning') return 'bg-amber-500';
    return 'bg-[var(--vs-brand)]';
  };

  return (
    <motion.aside variants={fadeUp} className="flex flex-col gap-6 lg:gap-7">
      {/* Profil — seperti kartu Megan Norton */}
      <div className="rounded-[24px] border border-slate-200/80 bg-gradient-to-b from-slate-50 to-white p-6 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-gradient-to-br from-[var(--vs-brand)] to-blue-500 text-2xl font-bold text-white shadow-lg shadow-blue-500/25">
                {initials(profile?.full_name)}
              </div>
              <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-500" title="Online" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">{profile?.full_name ?? 'Pengguna'}</h3>
            <p className="mt-0.5 text-[13px] font-medium text-slate-500">@{handle}</p>
          </div>
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:border-[var(--vs-brand-200)] hover:text-[var(--vs-brand)]"
              aria-label="Telepon"
            >
              <Phone className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:border-[var(--vs-brand-200)] hover:text-[var(--vs-brand)]"
              aria-label="Video"
            >
              <Video className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:border-[var(--vs-brand-200)] hover:text-[var(--vs-brand)]"
              aria-label="Menu"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Aktivitas tim */}
      <div className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Aktivitas</h3>
          <Link href={customerHref} className="text-[12px] font-semibold text-[var(--vs-brand)] hover:underline">
            Lihat semua
          </Link>
        </div>
        <ul className="relative space-y-0 before:absolute before:left-[15px] before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-slate-200">
          {activities.map((a) => (
            <li key={a.id} className="relative flex gap-3 pb-6 last:pb-0">
              <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-[10px] font-bold text-slate-600">
                {initials(a.staff_name)}
              </div>
              <div className="min-w-0 pt-0.5">
                <p className="text-[13px] font-semibold text-slate-900">{a.staff_name}</p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-slate-600">
                  <span className="font-medium text-slate-800">{a.company_name}</span>
                  {' · '}
                  {a.description}
                </p>
                <p className="mt-1 text-[11px] font-medium text-slate-400">
                  {new Date(a.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Ringkasan alert singkat */}
      {showAlerts ? (
      <div className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4 text-[var(--vs-brand)]" />
          <h3 className="text-sm font-bold text-slate-900">Pemberitahuan</h3>
        </div>
        <ul className="space-y-3">
          {mockAlerts.slice(0, 3).map((a) => (
            <li key={a.id} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
              <div className="flex gap-2">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${alertDot(a.type)}`} />
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-slate-900">{a.title}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{a.message}</p>
                  <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">{a.time}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      ) : null}
    </motion.aside>
  );
}
