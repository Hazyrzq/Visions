'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import CustomerDetailContent from '@/components/customer/CustomerDetailContent';
import { useLang } from '@/lib/i18n/LanguageContext';

export default function CustomerDetailDrawer({ open, customerId, onClose, onExitComplete }) {
  const [mounted, setMounted] = useState(false);
  const exitNotified = useRef(false);
  const { t } = useLang();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) exitNotified.current = false;
  }, [open]);

  // body overflow lock intentionally removed — scroll container is motion.main, not body

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!mounted || typeof document === 'undefined' || !customerId) return null;

  const handleAsideComplete = () => {
    if (!open && !exitNotified.current) {
      exitNotified.current = true;
      onExitComplete?.();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-end" style={{ pointerEvents: open ? 'auto' : 'none' }}>
      <div 
        className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" 
        style={{ opacity: open ? 1 : 0 }} 
        onClick={onClose} 
      />
      <motion.aside
        key={customerId}
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-detail-drawer-title"
        className="relative flex h-full w-full max-w-2xl flex-col border-l border-[var(--vs-line)] bg-[var(--vs-surface)] shadow-[0_0_40px_-12px_rgba(15,23,42,0.35)]"
        initial={{ x: '100%' }}
        animate={{ x: open ? 0 : '100%' }}
        transition={{ type: 'spring', damping: 34, stiffness: 380 }}
        onAnimationComplete={handleAsideComplete}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--vs-line)] px-4 py-3">
          <p id="customer-detail-drawer-title" className="text-[11px] font-bold uppercase tracking-wider text-[var(--vs-muted-2)]">
            {t('customerDetail.drawerTitle') ?? 'Detail pelanggan'}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--vs-muted)] transition-colors hover:bg-[var(--vs-bg)] hover:text-[var(--vs-ink)]"
            aria-label={t('common.closePanel') ?? 'Tutup panel'}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <CustomerDetailContent customerId={customerId} />
        </div>
      </motion.aside>
    </div>,
    document.body
  );
}