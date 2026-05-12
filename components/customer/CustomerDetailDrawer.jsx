'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import CustomerDetailContent from '@/components/customer/CustomerDetailContent';

export default function CustomerDetailDrawer({ open, customerId, onClose, onExitComplete }) {
  const [mounted, setMounted] = useState(false);
  const exitNotified = useRef(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) exitNotified.current = false;
  }, [open]);

  useEffect(() => {
    if (!customerId) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [customerId]);

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
    <div className="fixed inset-0 z-[100] flex justify-end">
      <motion.button
        type="button"
        aria-label="Tutup"
        className="absolute inset-0 bg-slate-950/30"
        initial={false}
        animate={{ opacity: open ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{ pointerEvents: open ? 'auto' : 'none' }}
      />
      <motion.aside
        key={customerId}
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-detail-drawer-title"
        className="relative flex h-full w-full max-w-xl flex-col border-l border-[var(--vs-line)] bg-[var(--vs-surface)] shadow-[0_0_40px_-12px_rgba(15,23,42,0.35)]"
        initial={{ x: '100%' }}
        animate={{ x: open ? 0 : '100%' }}
        transition={{ type: 'spring', damping: 34, stiffness: 380 }}
        onAnimationComplete={handleAsideComplete}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--vs-line)] px-4 py-3">
          <p id="customer-detail-drawer-title" className="text-[11px] font-bold uppercase tracking-wider text-[var(--vs-muted-2)]">
            Detail pelanggan
          </p>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--vs-muted)] transition-colors hover:bg-[var(--vs-bg)] hover:text-[var(--vs-ink)]"
            aria-label="Tutup panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-5">
          <CustomerDetailContent customerId={customerId} />
        </div>
      </motion.aside>
    </div>,
    document.body
  );
}
