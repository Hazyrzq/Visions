'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
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
  { href: '/dashboard/admin/data', icon: Database, label: 'Data & Model' },
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
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { profile, logout } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  const nav = profile?.role === 'admin' ? adminNav : staffNav;
  const base = profile?.role === 'admin' ? '/dashboard/admin' : '/dashboard/staff';
  const helpHref = profile?.role === 'admin' ? `${base}/data` : `${base}/report`;

  const isActive = (href) => {
    const exactPaths = ['/dashboard/admin', '/dashboard/staff'];
    return exactPaths.includes(href) ? pathname === href : pathname.startsWith(href);
  };

  if (!mounted) return null;

  const renderContent = (isCollapsed, isMobile) => (
    <div className="flex h-full flex-col bg-white/95 backdrop-blur-md border-r border-slate-200">
      {/* header & logo */}
      <div className="relative flex items-center p-4 min-h-[76px] border-b border-slate-100">
        <Link
          href={base}
          onClick={isMobile ? onMobileClose : undefined}
          className={`flex items-center gap-3 overflow-hidden transition-opacity hover:opacity-80 w-full ${
            isCollapsed && !isMobile ? 'justify-center' : 'justify-start'
          }`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-600/20">
            <ShieldCheck className="h-5 w-5" strokeWidth={2} />
          </div>
          <AnimatePresence>
            {(!isCollapsed || isMobile) && (
              <motion.div
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -5 }}
                transition={{ duration: 0.2 }}
                className="whitespace-nowrap"
              >
                <span className="block text-[16px] font-bold text-slate-800 tracking-tight">
                  Visions
                </span>
                <span className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  ChurnShield
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>

        {/* tombol toggle dikembalikan ke posisi stabil */}
        {!isMobile && (
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-6 z-50 flex h-6 w-6 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 shadow-sm transition-colors hover:border-blue-400 hover:text-blue-600"
          >
            {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
          </button>
        )}
      </div>

      {/* navigasi menu */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3 scrollbar-hide">
        {nav.map(({ href, icon: Icon, label }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={isMobile ? onMobileClose : undefined}
              title={isCollapsed ? label : undefined}
              className={`group relative flex items-center rounded-lg transition-colors duration-200 ${
                isCollapsed && !isMobile ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
              } ${
                active
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              {/* garis indikator aktif pakai div biasa, bukan framer motion biar ga bug */}
              {active && !isCollapsed && !isMobile && (
                <div className="absolute left-0 top-1/2 h-3/5 w-1 -translate-y-1/2 rounded-r-full bg-blue-600" />
              )}
              
              <Icon 
                className={`shrink-0 transition-colors ${isCollapsed && !isMobile ? 'h-5 w-5' : 'h-[18px] w-[18px]'}`} 
                strokeWidth={active ? 2.5 : 2} 
              />
              
              <AnimatePresence>
                {(!isCollapsed || isMobile) && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`truncate text-[13px] ${active ? 'font-semibold' : 'font-medium'}`}
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* area footer */}
      <div className="border-t border-slate-100 p-3 space-y-2 bg-slate-50/50">

        {profile && (
          <ProfileHoverCard placement="right" minimal={true}>
            <div className={`group flex items-center rounded-lg transition-all cursor-pointer hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 ${
              isCollapsed && !isMobile ? 'justify-center p-2' : 'gap-3 px-3 py-2.5'
            }`}>
              {isCollapsed && !isMobile ? (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-50 text-[12px] font-bold text-blue-700 ring-2 ring-white shadow-sm">
                  {profile.full_name?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() ?? '?'}
                </div>
              ) : (
                <>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-50 text-[12px] font-bold text-blue-700 ring-2 ring-white shadow-sm">
                    {profile.full_name?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() ?? '?'}
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <div className="truncate text-[13px] font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">{profile.full_name}</div>
                    <div className="truncate text-[11px] font-medium capitalize text-slate-500">{profile.role}</div>
                  </div>
                </>
              )}
            </div>
          </ProfileHoverCard>
        )}

        <button
          type="button"
          onClick={logout}
          title={isCollapsed ? "Keluar" : undefined}
          className={`flex w-full items-center rounded-lg text-[13px] font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 ${
            isCollapsed && !isMobile ? 'justify-center p-2.5' : 'gap-3 px-3 py-2'
          }`}
        >
          <LogOut className={`shrink-0 ${isCollapsed && !isMobile ? 'h-5 w-5' : 'h-[18px] w-[18px]'}`} />
          <AnimatePresence>
            {(!isCollapsed || isMobile) && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
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
        className={`relative z-30 hidden h-full shrink-0 flex-col transition-[width] duration-300 ease-in-out md:flex ${
          collapsed ? 'w-[72px]' : 'w-[240px]'
        }`}
      >
        {renderContent(collapsed, false)}
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
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="relative h-full w-[260px] max-w-[85vw] shadow-2xl"
            >
              {renderContent(false, true)}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}