'use client';

import { useEffect, useState } from 'react';
import {
  Building2, Mail, Clock, AlertTriangle,
  CheckCircle2, Activity, Ticket, CreditCard, UserCircle, Users, Phone,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp, stagger } from '@/lib/motion';
import { mockCustomers } from '@/lib/mockData';
import { supabase } from '@/lib/supabase';
import ActivityModal from '@/components/customer/ActivityModal';

const activityColors = {
  Email: 'bg-[var(--vs-brand-50)] text-[var(--vs-brand)]',
  Call: 'bg-emerald-50 text-emerald-600',
  Meeting: 'bg-purple-50 text-purple-600',
  Ticket: 'bg-amber-50 text-amber-600',
};

const activityIcons = (type) => {
  switch (type) {
    case 'Email': return <Mail className="w-4 h-4" />;
    case 'Call': return <Phone className="w-4 h-4" />;
    case 'Meeting': return <Users className="w-4 h-4" />;
    case 'Ticket': return <Ticket className="w-4 h-4" />;
    default: return <Activity className="w-4 h-4" />;
  }
};

const riskTagClass = {
  Tinggi: 'vs-tag vs-tag--high',
  Sedang: 'vs-tag vs-tag--medium',
  Rendah: 'vs-tag vs-tag--low',
};

function resolveCustomerFromMock(id) {
  if (id == null || id === '') return null;
  return mockCustomers.find((c) => String(c.id) === String(id)) ?? null;
}

export default function CustomerDetailContent({ customerId }) {
  const [customer, setCustomer] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);

  useEffect(() => {
    if (!customerId) {
      setCustomer(null);
      setActivities([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('customers')
        .select('*, staff:profiles!customers_assigned_to_fkey(full_name)')
        .eq('id', customerId)
        .maybeSingle();

      if (cancelled) return;

      if (data && !error) {
        const assignedName = data.staff?.full_name ?? data.assigned_name ?? null;
        setCustomer({ ...data, assigned_name: assignedName });
      } else {
        setCustomer(resolveCustomerFromMock(customerId));
      }

      const saved = localStorage.getItem(`activities_${customerId}`);
      setActivities(saved ? JSON.parse(saved) : []);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [customerId]);

  const handleActivityAdded = (newActivity) => {
    if (!customerId) return;
    const updated = [newActivity, ...activities];
    setActivities(updated);
    localStorage.setItem(`activities_${customerId}`, JSON.stringify(updated));
  };

  const formatDate = (d) =>
    new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(d));

  if (!customerId) return null;

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--vs-brand)] border-t-transparent" />
      </div>
    );
  }

  if (!customer) {
    return (
      <p className="py-10 text-center text-[13px] text-[var(--vs-muted)]">Pelanggan tidak ditemukan.</p>
    );
  }

  const scoreColor = customer.churn_score > 70 ? 'var(--vs-danger)' : customer.churn_score > 40 ? 'var(--vs-warn)' : 'var(--vs-success)';

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 border-b border-[var(--vs-line-soft)] pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold tracking-tight text-[var(--vs-ink)] sm:text-xl">{customer.company_name}</h2>
          <p className="mt-0.5 font-mono text-[12px] text-[var(--vs-muted-2)]">{customer.customer_id}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={riskTagClass[customer.risk_level] ?? riskTagClass.Rendah}>
            Risiko {customer.risk_level}
          </span>
          <button type="button" className="vs-btn vs-btn--secondary gap-2 text-[12px]">
            <Mail className="h-3.5 w-3.5" /> Email
          </button>
          <button
            type="button"
            onClick={() => setIsActivityModalOpen(true)}
            className="vs-btn vs-btn--primary gap-2 text-[12px]"
          >
            <Activity className="h-3.5 w-3.5" /> Catat aktivitas
          </button>
        </div>
      </div>

      <motion.div variants={stagger} className="flex flex-col gap-5">
        <motion.div variants={fadeUp}>
          <div className="vs-card p-5">
            <h3 className="mb-4 flex items-center gap-2 text-[13px] font-bold text-[var(--vs-ink)]">
              <Building2 className="h-4 w-4 text-[var(--vs-muted-3)]" /> Informasi
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Paket', icon: <CreditCard className="h-4 w-4 text-[var(--vs-brand)]" />, value: customer.plan_type },
                { label: 'Assigned', icon: <UserCircle className="h-4 w-4 text-[var(--vs-muted-3)]" />, value: customer.assigned_name || 'Belum di-assign' },
                { label: 'Terakhir login', icon: <Clock className="h-4 w-4 text-[var(--vs-muted-3)]" />, value: `${customer.days_since_login} hari lalu` },
              ].map(({ label, icon, value }) => (
                <div key={label}>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--vs-muted-2)]">{label}</p>
                  <div className="flex items-center gap-2 text-[13px] font-medium text-[var(--vs-ink)]">
                    {icon}
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="vs-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--vs-line)] bg-[var(--vs-brand-50)] px-4 py-3 sm:px-5">
            <h3 className="flex items-center gap-2 text-[13px] font-bold text-[var(--vs-ink)]">
              <Activity className="h-4 w-4 text-[var(--vs-brand)]" /> AI Churn
            </h3>
            <span className="rounded-md border border-[var(--vs-brand-100)] bg-[var(--vs-surface)] px-2 py-0.5 text-[10px] font-medium text-[var(--vs-brand)]">
              Hari ini
            </span>
          </div>

          <div className="flex flex-col items-center gap-6 p-5 sm:flex-row sm:items-start sm:p-6">
            <div className="flex shrink-0 flex-col items-center justify-center">
              <div
                className="flex h-28 w-28 flex-col items-center justify-center rounded-full border-[5px]"
                style={{ borderColor: scoreColor }}
              >
                <span className="text-3xl font-black tracking-tighter" style={{ color: scoreColor }}>{customer.churn_score}</span>
                <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-widest text-[var(--vs-muted-3)]">Score</span>
              </div>
            </div>

            <div className="w-full flex-1 space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--vs-muted-2)]">Faktor utama</h4>
              {[
                {
                  bad: customer.monthly_usage_hrs < 20,
                  title: `Penggunaan (${customer.monthly_usage_hrs} jam)`,
                  desc: customer.monthly_usage_hrs < 20
                    ? 'Penggunaan menurun — indikator risiko churn.'
                    : 'Penggunaan stabil.',
                },
                {
                  bad: customer.open_tickets > 2,
                  title: `Tiket terbuka (${customer.open_tickets})`,
                  desc: customer.open_tickets > 2
                    ? 'Beberapa tiket belum terselesaikan.'
                    : 'Antrean keluhan tidak kritis.',
                },
                {
                  bad: customer.nps_latest < 7,
                  title: `NPS (${customer.nps_latest}/10)`,
                  desc: customer.nps_latest < 7
                    ? 'Detractor / passive.'
                    : 'Promoter.',
                },
              ].map(({ bad, title, desc }) => (
                <div key={title} className="flex items-start gap-2.5">
                  {bad
                    ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--vs-warn)]" />
                    : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--vs-success)]" />}
                  <div>
                    <p className="text-[13px] font-semibold text-[var(--vs-ink)]">{title}</p>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--vs-muted)]">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="vs-card p-5 sm:p-6">
          <h3 className="mb-4 flex items-center gap-2 text-[13px] font-bold text-[var(--vs-ink)]">
            <Clock className="h-4 w-4 text-[var(--vs-muted-3)]" /> Aktivitas
          </h3>

          {activities.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-[var(--vs-muted-2)]">Belum ada aktivitas.</p>
          ) : (
            <div className="space-y-3">
              {activities.map((act) => (
                <div key={act.id} className="flex items-start gap-2.5">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${activityColors[act.activity_type] ?? 'bg-[var(--vs-bg-2)] text-[var(--vs-muted)]'}`}>
                    {activityIcons(act.activity_type)}
                  </div>
                  <div className="min-w-0 flex-1 rounded-xl border border-[var(--vs-line-soft)] bg-[var(--vs-bg)] p-3">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="text-[12px] font-bold text-[var(--vs-ink)]">{act.activity_type}</span>
                      <span className="shrink-0 font-mono text-[10px] text-[var(--vs-muted-3)]">{formatDate(act.created_at)}</span>
                    </div>
                    <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-[var(--vs-muted)]">{act.notes}</p>
                    {act.staff?.full_name && (
                      <p className="mt-2 border-t border-[var(--vs-line-soft)] pt-2 text-[10px] text-[var(--vs-muted-3)]">
                        {act.staff.full_name}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>

      <ActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        customerId={customer.id}
        onActivityAdded={handleActivityAdded}
      />
    </>
  );
}
