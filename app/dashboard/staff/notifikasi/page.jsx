'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, Check, CheckCheck, RefreshCw, AlertTriangle, Info, UserPlus, FileText } from 'lucide-react';
import { getNotifikasi, markNotifikasiRead } from '@/lib/churnshield';
import { useAuth } from '@/lib/hooks/useAuth';
import { fadeUp, stagger, pageVariants } from '@/lib/motion';

const FILTERS = ['Semua', 'Belum Dibaca', 'Sudah Dibaca'];

function typeIcon(type) {
  if (!type) return Info;
  const t = type.toLowerCase();
  if (t.includes('assign')) return UserPlus;
  if (t.includes('activity') || t.includes('note')) return FileText;
  if (t.includes('warn') || t.includes('alert')) return AlertTriangle;
  return Info;
}

function typeColor(type) {
  if (!type) return { bg: 'bg-blue-50', text: 'text-blue-600', ring: 'ring-blue-100' };
  const t = type.toLowerCase();
  if (t.includes('assign')) return { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-100' };
  if (t.includes('warn') || t.includes('alert')) return { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-100' };
  return { bg: 'bg-blue-50', text: 'text-blue-600', ring: 'ring-blue-100' };
}

function NotifCard({ notif, onRead }) {
  const isRead = notif.is_read || notif.read;
  const Icon = typeIcon(notif.type);
  const colors = typeColor(notif.type);

  return (
    <motion.div
      variants={fadeUp}
      className={`flex items-start gap-4 rounded-2xl border p-4 transition-all ${
        isRead ? 'border-slate-100 bg-white' : 'border-blue-100 bg-blue-50/40'
      }`}
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-2 ${colors.bg} ${colors.text} ${colors.ring}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            {notif.title && (
              <p className={`text-[13px] font-semibold ${isRead ? 'text-slate-700' : 'text-slate-900'}`}>{notif.title}</p>
            )}
            <p className={`mt-0.5 text-[13px] leading-relaxed ${isRead ? 'text-slate-500' : 'text-slate-700'}`}>
              {notif.message ?? notif.body ?? notif.content ?? '(Tidak ada konten)'}
            </p>
          </div>
          {!isRead && (
            <button
              onClick={() => onRead(notif.id)}
              className="shrink-0 rounded-lg border border-blue-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-blue-600 transition hover:bg-blue-50"
            >
              Tandai Dibaca
            </button>
          )}
        </div>
        <div className="mt-2 flex items-center gap-3">
          {notif.type && (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${colors.bg} ${colors.text}`}>
              {notif.type}
            </span>
          )}
          {notif.customer_id && (
            <span className="text-[11px] text-slate-400">ID: {notif.customer_id}</span>
          )}
          {(notif.created_at || notif.timestamp) && (
            <span className="text-[11px] text-slate-400">
              {new Date(notif.created_at ?? notif.timestamp).toLocaleString('id-ID', {
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
              })}
            </span>
          )}
          {isRead && <Check className="h-3.5 w-3.5 text-slate-300" />}
        </div>
      </div>
    </motion.div>
  );
}

export default function StaffNotifikasiPage() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('Semua');
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotif = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getNotifikasi();
      const list = Array.isArray(res) ? res : (res?.data ?? []);
      // hanya notif penugasan yang ditujukan ke staff ini
      const mine = list.filter(n =>
        n.type === 'assign' && n.recipient_id === profile?.id
      );
      setNotifications(mine.sort((a, b) => {
        const ra = a.is_read || a.read, rb = b.is_read || b.read;
        if (ra !== rb) return ra ? 1 : -1;
        return new Date(b.created_at ?? b.timestamp ?? 0) - new Date(a.created_at ?? a.timestamp ?? 0);
      }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => { fetchNotif(); }, [fetchNotif]);

  const handleRead = async (id) => {
    try {
      await markNotifikasiRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true, read: true } : n));
      window.dispatchEvent(new CustomEvent('notif-updated'));
    } catch {}
  };

  const handleMarkAll = async () => {
    setMarkingAll(true);
    const unread = notifications.filter(n => !n.is_read && !n.read);
    await Promise.allSettled(unread.map(n => markNotifikasiRead(n.id)));
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read: true })));
    setMarkingAll(false);
    window.dispatchEvent(new CustomEvent('notif-updated'));
  };

  const unreadCount = notifications.filter(n => !n.is_read && !n.read).length;
  const filtered = notifications.filter(n => {
    if (filter === 'Belum Dibaca') return !n.is_read && !n.read;
    if (filter === 'Sudah Dibaca') return n.is_read || n.read;
    return true;
  });

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </span>
            <h1 className="text-[22px] font-bold tracking-tight text-slate-900">Notifikasi</h1>
          </div>
          <p className="text-[13px] text-slate-500">
            {unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : 'Semua notifikasi sudah dibaca'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchNotif}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
          {unreadCount > 0 && (
            <button onClick={handleMarkAll} disabled={markingAll}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60">
              <CheckCheck className="h-4 w-4" />
              {markingAll ? 'Memproses…' : 'Tandai Semua Dibaca'}
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-[12px] font-semibold transition ${
              filter === f ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700'
            }`}>
            {f}
            {f === 'Belum Dibaca' && unreadCount > 0 && (
              <span className="ml-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3">
          <AlertTriangle className="h-10 w-10 text-red-400" />
          <p className="text-[13px] text-red-600">{error}</p>
          <button onClick={fetchNotif} className="text-[12px] text-blue-600 underline">Coba lagi</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50">
          <BellOff className="h-10 w-10 text-slate-300" />
          <p className="text-[13px] text-slate-400">
            {filter === 'Belum Dibaca' ? 'Tidak ada notifikasi belum dibaca' : 'Tidak ada notifikasi'}
          </p>
        </div>
      ) : (
        <motion.div variants={stagger} className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.map(n => <NotifCard key={n.id} notif={n} onRead={handleRead} />)}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
}
