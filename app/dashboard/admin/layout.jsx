'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { useAuth } from '@/lib/hooks/useAuth';

export default function AdminLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace('/login'); return; }
    if (profile && profile.role !== 'admin') router.replace('/dashboard/staff');
  }, [user, profile, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--vs-dash-canvas)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[var(--vs-brand)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[var(--vs-muted-2)]">Memuat dashboard…</p>
        </div>
      </div>
    );
  }

  if (!user || (profile && profile.role !== 'admin')) return null;

  return (
    <div className="flex h-screen bg-[var(--vs-dash-canvas)] overflow-hidden">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <motion.main
          className="min-h-0 flex-1 overflow-y-auto px-3 py-4 md:px-5 md:py-6 lg:px-6 lg:py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mx-auto h-full w-full max-w-[1360px]">
            <div className="vs-workspace p-5 md:p-7 lg:p-9">{children}</div>
          </div>
        </motion.main>
      </div>
    </div>
  );
}
