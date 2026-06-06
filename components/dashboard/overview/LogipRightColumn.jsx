'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Phone, Video, MoreHorizontal, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/motion';
import { useAuth } from '@/lib/hooks/useAuth';
import { supabase } from '@/lib/supabase'; // Langsung pakai supabase, bye-bye mockData!
import { useLang } from '@/lib/i18n/LanguageContext';

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
  const { t, lang } = useLang();
  const handle = profile?.email?.split('@')[0] ?? (lang === 'id' ? 'pengguna' : 'user');

  const [activities, setActivities] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Ambil data AKTIVITAS dan PEMBERITAHUAN asli dari database
  useEffect(() => {
    const fetchRealData = async () => {
      setLoading(true);

      // 1. Fetch data dari tabel 'activities'
      // Asumsi ada relasi ke tabel profiles (buat nama staff) & customers (buat nama perusahaan)
      let actQuery = supabase
        .from('activities')
        .select('*, staff:profiles(full_name), customers(company_name)')
        .order('created_at', { ascending: false })
        .limit(5);

      if (activityFilterStaffId) {
        actQuery = actQuery.eq('staff_id', activityFilterStaffId);
      }

      const { data: actData, error: actError } = await actQuery;

      // 2. Fetch data dari tabel 'alerts'
      const { data: alertData, error: alertError } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

      // Kalau ga ada error, simpan datanya ke state
      if (!actError && actData) {
        setActivities(actData);
      }
      if (!alertError && alertData) {
        setAlerts(alertData);
      }

      setLoading(false);
    };

    fetchRealData();
  }, [activityFilterStaffId]);

  const alertDot = (type) => {
    const t = (type || '').toLowerCase();
    if (t === 'critical' || t === 'tinggi') return 'bg-red-500';
    if (t === 'warning' || t === 'sedang') return 'bg-amber-500';
    return 'bg-[var(--vs-brand)]';
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
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
        
        {loading ? (
          <p className="text-[12px] text-slate-500 text-center py-4">{t('notifications.loadingAlerts') ?? 'Memuat pemberitahuan...'}</p>
        ) : activities.length === 0 ? (
          <p className="text-[12px] text-slate-500 text-center py-4">{t('notifications.emptyAlerts') ?? 'Tidak ada pemberitahuan baru.'}</p>
        ) : (
          <ul className="relative space-y-0 before:absolute before:left-[15px] before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-slate-200">
            {activities.map((a) => {
              // Mapping data biar fleksibel misal nama kolom di DB kamu sedikit beda
              const staffName = a.staff?.full_name || a.staff_name || 'System';
              const companyName = a.customers?.company_name || a.company_name || 'Umum';
              const description = a.notes || a.description || a.activity_type || 'Melakukan aktivitas';

              return (
                <li key={a.id} className="relative flex gap-3 pb-6 last:pb-0">
                  <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-[10px] font-bold text-slate-600">
                    {initials(staffName)}
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-[13px] font-semibold text-slate-900">{staffName}</p>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-slate-600">
                      {companyName !== 'Umum' && <><span className="font-medium text-slate-800">{companyName}</span>{' · '}</>}
                      {description}
                    </p>
                    <p className="mt-1 text-[11px] font-medium text-slate-400">
                      {formatTime(a.created_at)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Ringkasan alert singkat */}
      {showAlerts ? (
      <div className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4 text-[var(--vs-brand)]" />
          <h3 className="text-sm font-bold text-slate-900">Pemberitahuan</h3>
        </div>
        
        {loading ? (
          <p className="text-[12px] text-slate-500 text-center py-4">Memuat pemberitahuan...</p>
        ) : alerts.length === 0 ? (
          <p className="text-[12px] text-slate-500 text-center py-4">Tidak ada pemberitahuan baru.</p>
        ) : (
          <ul className="space-y-3">
            {alerts.map((a) => {
              const type = a.type || a.risk_level || 'info';
              const title = a.title || 'Pemberitahuan';
              const message = a.message || a.description || '';
              
              return (
                <li key={a.id} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                  <div className="flex gap-2">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${alertDot(type)}`} />
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-slate-900">{title}</p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{message}</p>
                      <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                        {formatTime(a.created_at || a.time)}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      ) : null}
    </motion.aside>
  );
}