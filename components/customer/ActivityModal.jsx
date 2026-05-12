'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { scaleIn } from '@/lib/motion';
import { useAuth } from '@/lib/hooks/useAuth';
import { Mail, Phone, Users, Ticket, X } from 'lucide-react';

const activityTypes = [
  { id: 'Email',   icon: Mail,   selClass: 'bg-[var(--vs-brand-50)] border-[var(--vs-brand-100)] text-[var(--vs-brand)]' },
  { id: 'Call',    icon: Phone,  selClass: 'bg-emerald-50 border-emerald-200 text-emerald-600' },
  { id: 'Meeting', icon: Users,  selClass: 'bg-purple-50 border-purple-200 text-purple-600' },
  { id: 'Ticket',  icon: Ticket, selClass: 'bg-amber-50 border-amber-200 text-amber-600' },
];

export default function ActivityModal({ isOpen, onClose, customerId, onActivityAdded }) {
  const { profile } = useAuth();
  const [type, setType]     = useState('Email');
  const [notes, setNotes]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!notes.trim()) return;
    setLoading(true);
    setTimeout(() => {
      onActivityAdded({
        id: Date.now().toString(),
        customer_id: customerId,
        staff_id: profile?.id || 'dummy-staff',
        activity_type: type,
        notes: notes.trim(),
        created_at: new Date().toISOString(),
        staff: { full_name: profile?.full_name || 'Admin / Staff' },
      });
      setLoading(false);
      setNotes('');
      setType('Email');
      onClose();
    }, 600);
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
              <h3 className="text-[15px] font-bold text-[var(--vs-ink)]">Catat Aktivitas</h3>
              <button onClick={onClose} className="text-[var(--vs-muted-3)] hover:text-[var(--vs-ink)] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-2.5">
                <label className="text-[11px] font-semibold text-[var(--vs-muted-2)] uppercase tracking-wider">Jenis Aktivitas</label>
                <div className="grid grid-cols-4 gap-2">
                  {activityTypes.map(({ id, icon: Icon, selClass }) => {
                    const sel = type === id;
                    return (
                      <button key={id} type="button" onClick={() => setType(id)}
                        className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all ${sel ? selClass : 'bg-[var(--vs-bg)] border-[var(--vs-line)] text-[var(--vs-muted-3)] hover:bg-[var(--vs-bg-2)]'}`}>
                        <Icon className="w-4 h-4" />
                        <span className="text-[11px] font-semibold">{id}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="text-[11px] font-semibold text-[var(--vs-muted-2)] uppercase tracking-wider">Catatan / Hasil Follow-up</label>
                <textarea
                  required
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Contoh: Menghubungi pelanggan untuk menawarkan diskon perpanjangan..."
                  className="vs-input w-full h-32 p-3 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose} className="vs-btn vs-btn--ghost flex-1 justify-center">Batal</button>
                <button type="submit" disabled={loading || !notes.trim()} className="vs-btn vs-btn--primary flex-1 justify-center">
                  {loading && <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                  {loading ? 'Menyimpan...' : 'Simpan Aktivitas'}
                </button>
              </div>
            </form>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
