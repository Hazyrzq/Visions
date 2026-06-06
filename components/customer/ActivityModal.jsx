'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { scaleIn } from '@/lib/motion';
import { useAuth } from '@/lib/hooks/useAuth';
import { Mail, Phone, Users, FileText, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { addNotifikasi } from '@/lib/churnshield';
import { useLang } from '@/lib/i18n/LanguageContext';

const activityTypes = [
  { id: 'email',   label: 'Email',   icon: Mail,      selClass: 'bg-[var(--vs-brand-50)] border-[var(--vs-brand-100)] text-[var(--vs-brand)]' },
  { id: 'call',    label: 'Call',    icon: Phone,     selClass: 'bg-emerald-50 border-emerald-200 text-emerald-600' },
  { id: 'meeting', label: 'Meeting', icon: Users,     selClass: 'bg-purple-50 border-purple-200 text-purple-600' },
  { id: 'note',    label: 'Note',    icon: FileText,  selClass: 'bg-amber-50 border-amber-200 text-amber-600' },
];

export default function ActivityModal({ isOpen, onClose, customerTextId, onActivityAdded }) {
  const { profile } = useAuth();
  const { t } = useLang();
  const [type, setType]       = useState('email');
  const [notes, setNotes]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!notes.trim() || !customerTextId || !profile?.id) return;
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase
      .from('activities')
      .insert({
        staff_id: profile.id,
        customer_id: customerTextId,
        action_type: type,
        description: notes.trim(),
      })
      .select('*, staff:profiles(full_name)')
      .single();

    if (err) {
      setError('Gagal menyimpan. Coba lagi.');
      setLoading(false);
      return;
    }

    // kirim notifikasi ke admin (fire-and-forget, jangan block)
    const typeLabel = { email: 'Email', call: 'Panggilan', meeting: 'Meeting', note: 'Catatan', other: 'Aktivitas' };
    addNotifikasi({
      title: `${typeLabel[type] ?? 'Aktivitas'} baru — ${customerTextId}`,
      message: `${profile?.full_name ?? 'Staf'} mencatat ${typeLabel[type]?.toLowerCase() ?? 'aktivitas'} untuk pelanggan ${customerTextId}: ${notes.trim()}`,
      type: 'activity',
      customer_id: customerTextId,
    }).catch(() => {});

    onActivityAdded(data);
    setNotes('');
    setType('email');
    setLoading(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[var(--vs-ink)]/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div variants={scaleIn} initial="hidden" animate="visible" exit="hidden"
            className="vs-card relative w-full max-w-[440px] shadow-[var(--vs-shadow-md)] overflow-hidden">

            <div className="px-6 py-4 border-b border-[var(--vs-line)] flex items-center justify-between">
              <h3 className="text-[15px] font-bold text-[var(--vs-ink)]">
                {t('activity.title') ?? 'Catat Aktivitas'}
              </h3>
              <button onClick={onClose} className="text-[var(--vs-muted-3)] hover:text-[var(--vs-ink)] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-2.5">
                <label className="text-[11px] font-semibold text-[var(--vs-muted-2)] uppercase tracking-wider">
                  {t('activity.typeLabel') ?? 'Jenis Aktivitas'}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {activityTypes.map(({ id, label, icon: Icon, selClass }) => {
                    const sel = type === id;
                    return (
                      <button key={id} type="button" onClick={() => setType(id)}
                        className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all ${sel ? selClass : 'bg-[var(--vs-bg)] border-[var(--vs-line)] text-[var(--vs-muted-3)] hover:bg-[var(--vs-bg-2)]'}`}>
                        <Icon className="w-4 h-4" />
                        <span className="text-[11px] font-semibold">
                          {t(`activity.type.${id}`) ?? label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="text-[11px] font-semibold text-[var(--vs-muted-2)] uppercase tracking-wider">
                  {t('activity.notesLabel') ?? 'Catatan / Hasil Follow-up'}
                </label>
                <textarea
                  required
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder={t('activity.notesPlaceholder') ?? 'Contoh: Menghubungi pelanggan untuk menawarkan diskon perpanjangan...'}
                  className="vs-input w-full h-32 p-3 resize-none"
                />
              </div>

              {error && <p className="text-[12px] text-red-500">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose} className="vs-btn vs-btn--ghost flex-1 justify-center">
                  {t('common.cancel') ?? 'Batal'}
                </button>
                <button type="submit" disabled={loading || !notes.trim()} className="vs-btn vs-btn--primary flex-1 justify-center">
                  {loading && <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                  {loading ? (t('common.saving') ?? 'Menyimpan...') : (t('activity.save') ?? 'Simpan Aktivitas')}
                </button>
              </div>
            </form>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
