'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Database,
  Settings,
  BarChart2,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CircleHelp,
  UserCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/hooks/useAuth';
import ProfileHoverCard from '@/components/profile/ProfileHoverCard';

const adminNav = [
  { href: '/dashboard/admin', icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/admin/customer', icon: Users, label: 'Customer' },
  { href: '/dashboard/admin/staf-view', icon: UserCheck, label: 'Staf View' },
  { href: '/dashboard/admin/data', icon: Database, label: 'Data & model' },
  { href: '/dashboard/admin/user-management', icon: Settings, label: 'Pengguna' },
  { href: '/dashboard/admin/report', icon: BarChart2, label: 'Report' },
];

const staffNav = [
  { href: '/dashboard/staff', icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/staff/customer', icon: Users, label: 'Pelanggan saya' },
  { href: '/dashboard/staff/report', icon: BarChart2, label: 'Report' },
];

export default function Sidebar({ mobileOpen, onMobileClose }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { profile, logout } = useAuth();

  const nav = profile?.role === 'admin' ? adminNav : staffNav;
  const base = profile?.role === 'admin' ? '/dashboard/admin' : '/dashboard/staff';
  const helpHref = profile?.role === 'admin' ? `${base}/data` : `${base}/report`;

  const isActive = (href) => {
    const exactPaths = ['/dashboard/admin', '/dashboard/staff'];
    return exactPaths.includes(href) ? pathname === href : pathname.startsWith(href);
  };

  const Inner = ({ narrow, onMobileClose, onToggleCollapse }) => (
    <div
      className="flex h-full flex-col border-r border-[var(--vs-sidebar-rail-border)] bg-[var(--vs-sidebar-rail-bg)]"
    >
      {/* Brand + toggle (toggle hanya desktop) */}
      <div className={narrow ? 'flex flex-col items-center border-b border-[var(--vs-sidebar-rail-border)] px-2 pb-3 pt-5' : 'border-b border-[var(--vs-sidebar-rail-border)] px-4 pb-3 pt-6'}>
        {narrow ? (
          <>
            <Link
              href={base}
              onClick={onMobileClose}
              className="flex flex-col items-center rounded-2xl outline-none ring-offset-2 transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--vs-brand)]"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--vs-brand)] text-white shadow-lg shadow-blue-500/30">
                <ShieldCheck className="h-[22px] w-[22px]" strokeWidth={2} aria-hidden />
              </div>
            </Link>
            {onToggleCollapse ? (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="mt-3 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200/90 bg-white text-slate-500 shadow-sm transition-colors hover:border-[var(--vs-brand-200)] hover:text-[var(--vs-brand)]"
                aria-label="Perluas sidebar"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href={base}
              onClick={onMobileClose}
              className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl outline-none ring-offset-2 transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--vs-brand)]"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--vs-brand)] text-white shadow-lg shadow-blue-500/30">
                <ShieldCheck className="h-[22px] w-[22px]" strokeWidth={2} aria-hidden />
              </div>
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="min-w-0 overflow-hidden leading-none"
                >
                  <span className="block text-[22px] font-bold tracking-tight text-[var(--vs-sidebar-ink)]">
                    Visions
                  </span>
                  <span className="mt-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    ChurnShield
                  </span>
                </motion.div>
              </AnimatePresence>
            </Link>
            {onToggleCollapse ? (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200/90 bg-white text-slate-500 shadow-sm transition-colors hover:border-[var(--vs-brand-200)] hover:text-[var(--vs-brand)]"
                aria-label="Ciutkan sidebar"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        )}
      </div>

      {/* Nav — aktif: ikon dalam kotak biru, label tebal */}
      <nav className={`min-h-0 flex-1 space-y-0.5 overflow-y-auto sidebar-scroll-light ${narrow ? 'px-2 pb-2' : 'px-3 pb-2'}`}>
        {nav.map(({ href, icon: Icon, label }, i) => {
          const active = isActive(href);
          return (
            <motion.div
              key={href}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.22 }}
            >
              <Link
                href={href}
                onClick={onMobileClose}
                title={narrow ? label : undefined}
                className={`group flex items-center rounded-2xl transition-colors duration-200 ${
                  narrow ? 'justify-center px-2 py-2' : 'gap-3 px-3 py-2'
                } ${
                  active
                    ? 'bg-white text-[var(--vs-brand)] shadow-sm shadow-slate-900/5'
                    : 'text-slate-500 hover:bg-white/70 hover:text-slate-900'
                }`}
              >
                <span
                  className={`flex shrink-0 items-center justify-center transition-all duration-200 ${
                    narrow ? 'h-10 w-10' : 'h-10 w-10'
                  } ${
                    active
                      ? 'rounded-xl bg-[var(--vs-brand)] text-white shadow-md shadow-blue-500/25'
                      : 'rounded-xl bg-transparent text-slate-400 group-hover:bg-slate-200/60 group-hover:text-slate-700'
                  }`}
                >
                  <Icon className="h-[19px] w-[19px]" strokeWidth={active ? 2.25 : 2} />
                </span>
                <AnimatePresence>
                  {!narrow && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.18 }}
                      className={`truncate text-[14px] ${active ? 'font-bold' : 'font-medium'}`}
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Footer: bantuan + keluar + chip user */}
      <div className={`mt-auto border-t border-[var(--vs-sidebar-rail-border)] ${narrow ? 'px-2 py-3' : 'px-3 py-4'}`}>
        {!narrow ? (
          <Link
            href={helpHref}
            onClick={onMobileClose}
            className="mb-2 flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[13px] font-medium text-slate-500 transition-colors hover:bg-white/80 hover:text-slate-900"
          >
            <CircleHelp className="h-[18px] w-[18px] shrink-0 text-slate-400" />
            {profile?.role === 'admin' ? 'Bantuan & data' : 'Bantuan & laporan'}
          </Link>
        ) : (
          <Link
            href={helpHref}
            onClick={onMobileClose}
            title="Bantuan"
            className="mb-2 flex justify-center rounded-2xl py-2 text-slate-500 hover:bg-white/80 hover:text-slate-900"
          >
            <CircleHelp className="h-[18px] w-[18px]" />
          </Link>
        )}

        {narrow && profile && (
          <ProfileHoverCard placement="right">
            <button
              type="button"
              title="Profil"
              className="mb-2 flex w-full justify-center rounded-2xl py-2 text-slate-500 transition-colors hover:bg-white/80 hover:text-slate-900"
            >
              <UserCircle className="h-[18px] w-[18px]" />
            </button>
          </ProfileHoverCard>
        )}

        <AnimatePresence>
          {!narrow && profile && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-3">
              <ProfileHoverCard placement="right">
                <div className="flex w-full cursor-default items-center gap-3 rounded-2xl border border-white/60 bg-white/50 px-3 py-2.5 outline-none ring-offset-2 transition-colors hover:border-[var(--vs-brand-200)] hover:bg-white/90 focus-within:ring-2 focus-within:ring-[var(--vs-brand)]">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--vs-brand)] to-blue-500 text-[11px] font-bold text-white shadow-sm">
                    {profile.full_name?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() ?? '?'}
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <div className="truncate text-[13px] font-semibold text-[var(--vs-sidebar-ink)]">{profile.full_name}</div>
                    <div className="truncate text-[11px] font-medium capitalize text-slate-500">{profile.role}</div>
                  </div>
                </div>
              </ProfileHoverCard>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={logout}
          className={`flex w-full items-center rounded-2xl text-[13px] font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 ${
            narrow ? 'justify-center px-2 py-2' : 'gap-3 px-3 py-2.5'
          }`}
        >
          <span
            className={`flex shrink-0 items-center justify-center rounded-xl bg-white/80 text-slate-400 shadow-sm ${
              narrow ? 'h-10 w-10' : 'h-10 w-10'
            }`}
          >
            <LogOut className="h-[18px] w-[18px]" />
          </span>
          <AnimatePresence>
            {!narrow && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden whitespace-nowrap"
              >
                Keluar
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={`relative z-30 hidden h-full shrink-0 flex-col transition-[width] duration-300 ease-out md:flex ${
          collapsed ? 'w-[76px]' : 'w-[272px]'
        }`}
      >
        <Inner narrow={collapsed} onToggleCollapse={() => setCollapsed((v) => !v)} />
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            <div className="absolute inset-0 bg-slate-900/35 backdrop-blur-[2px]" onClick={onMobileClose} />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="relative h-full w-[288px] max-w-[88vw] shadow-2xl"
            >
              <Inner narrow={false} onMobileClose={onMobileClose} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
