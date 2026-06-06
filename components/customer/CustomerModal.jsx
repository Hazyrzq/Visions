'use client';
import Modal from '@/components/ui/Modal';
import RiskBadge from '@/components/dashboard/RiskBadge';
import ChurnScoreBar from '@/components/dashboard/ChurnScoreBar';
import { Building2, Calendar, Clock, Ticket, Star, TrendingDown, Lightbulb } from 'lucide-react';
import { useLang } from '@/lib/i18n/LanguageContext';

function Row({ label, value }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right">{value ?? '—'}</span>
    </div>
  );
}

export default function CustomerModal({ customer, isOpen, onClose }) {
  const { t } = useLang();
  if (!customer) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('customerModal.title') ?? 'Detail Pelanggan'} size="lg">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              {customer.company_name[0]}
            </div>
            <div>
              <div className="font-bold text-gray-900 text-lg">{customer.company_name}</div>
              <div className="text-sm text-gray-500">{customer.customer_id} · {customer.plan_type}</div>
            </div>
          </div>
          <RiskBadge level={customer.risk_level} />
        </div>

        {/* Churn Score */}
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="text-sm font-semibold text-gray-700 mb-2">{t('customer.churnScore') ?? 'Churn Score'}</div>
          <ChurnScoreBar score={customer.churn_score} />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Clock,      label: 'Usage / Bulan',      value: `${customer.monthly_usage_hrs} jam` },
            { icon: Calendar,   label: 'Tenure',             value: `${customer.tenure_months} bulan` },
            { icon: Ticket,     label: 'Tiket Terbuka',      value: `${customer.open_tickets} tiket` },
            { icon: Star,       label: 'NPS Terakhir',       value: `${customer.nps_latest}/10` },
            { icon: TrendingDown,label:'Dunning Count',      value: `${customer.dunning_count}x` },
            { icon: Clock,      label: 'Terakhir Login',     value: `${customer.days_since_login} hari lalu` },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-2.5">
              <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div>
                <div className="text-[11px] text-gray-400">{label}</div>
                <div className="text-sm font-semibold text-gray-800">{value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Info */}
        <div>
          <Row label={t('customerModal.plan') ?? 'Plan'} value={`${customer.plan_type} (${customer.contract_type})`} />
          <Row label={t('customerModal.featureAdoption') ?? 'Feature Adoption'} value={`${customer.feature_adoption_pct}%`} />
          <Row label={t('customerModal.assignedTo') ?? 'Assigned ke'} value={customer.assigned_name ?? (t('customerModal.unassigned') ?? 'Belum diassign')} />
        </div>

        {/* Alasan Churn */}
        {customer.alasan_churn && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4">
            <div className="text-sm font-semibold text-red-700 mb-1 flex items-center gap-2">
              <TrendingDown className="w-4 h-4" /> {t('customerModal.riskIndicator') ?? 'Indikator Risiko'}
            </div>
            <p className="text-sm text-red-600 leading-relaxed">{customer.alasan_churn}</p>
          </div>
        )}

        {/* Rekomendasi */}
        {customer.rekomendasi && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
            <div className="text-sm font-semibold text-indigo-700 mb-1 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" /> {t('customerModal.recommendation') ?? 'Rekomendasi Tindakan'}
            </div>
            <p className="text-sm text-indigo-600 leading-relaxed">{customer.rekomendasi}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
