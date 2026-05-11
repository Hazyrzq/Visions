'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks/useAuth';
import { Mail, Phone, Users, Ticket, X } from 'lucide-react';

export default function ActivityModal({ isOpen, onClose, customerId, onActivityAdded }) {
  const { profile } = useAuth();
  const [type, setType] = useState('Email');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const activityTypes = [
    { id: 'Email', icon: Mail, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { id: 'Call', icon: Phone, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { id: 'Meeting', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
    { id: 'Ticket', icon: Ticket, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!notes.trim()) return;

    setLoading(true);

    setTimeout(() => {
      const newActivity = {
        id: Date.now().toString(),
        customer_id: customerId,
        staff_id: profile?.id || 'dummy-staff',
        activity_type: type,
        notes: notes.trim(),
        created_at: new Date().toISOString(),
        staff: { full_name: profile?.full_name || 'Admin / Staff' }
      };

      setLoading(false);
      setNotes('');
      setType('Email');
      onActivityAdded(newActivity);
      onClose();
    }, 600);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-white p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
        <div className="p-6 pb-4 border-b border-gray-100 flex justify-between items-center">
          <DialogTitle className="text-[18px] font-bold text-gray-900 tracking-tight">Catat Aktivitas</DialogTitle>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-3">
            <label className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">Jenis Aktivitas</label>
            <div className="grid grid-cols-4 gap-3">
              {activityTypes.map((t) => {
                const Icon = t.icon;
                const isSelected = type === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setType(t.id)}
                    className={`flex flex-col items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
                      isSelected ? `${t.bg} ${t.border} shadow-sm ring-1 ring-${t.color.split('-')[1]}-500` : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isSelected ? t.color : 'text-gray-400'}`} />
                    <span className={`text-[11px] font-semibold ${isSelected ? t.color : 'text-gray-500'}`}>{t.id}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">Catatan / Hasil Follow-up</label>
            <textarea
              required
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Menghubungi pelanggan untuk menawarkan diskon perpanjangan..."
              className="w-full h-32 p-3 text-[13px] text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-none"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={onClose} className="text-gray-600 hover:bg-gray-100">Batal</Button>
            <Button type="submit" disabled={loading || !notes.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {loading ? 'Menyimpan...' : 'Simpan Aktivitas'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}