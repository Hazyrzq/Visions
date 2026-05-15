'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, UserCheck, Database, Settings,
  BarChart2, LogOut, ChevronLeft, ChevronRight, ShieldCheck,
  Bell, MessageSquare,
} from 'lucide-react';
import { getNotifikasi } from '@/lib/churnshield';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/hooks/useAuth';
import ProfileHoverCard from '@/components/profile/ProfileHoverCard';

const adminNav = [
  { href: '/dashboard/admin',                 icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/admin/customer',        icon: Users,           label: 'Customer' },
  { href: '/dashboard/admin/staf-view',       icon: UserCheck,       label: 'Staff View' },
  { href: '/dashboard/admin/data',            icon: Database,        label: 'Data & Model' },
  { href: '/dashboard/admin/user-management', icon: Settings,        label: 'Users' },
  { href: '/dashboard/admin/report',          icon: BarChart2,       label: 'Reports' },
  { href: '/dashboard/admin/chat',            icon: MessageSquare,   label: 'Team Chat' },
  { href: '/dashboard/admin/notifikasi',      icon: Bell,            label: 'Notifications', badge: true },
];

const staffNav = [
  { href: '/dashboard/staff',           icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/staff/customer',  icon: Users,           label: 'My Customers' },
  { href: '/dashboard/staff/report',    icon: BarChart2,       label: 'Reports' },
  { href: '/dashboard/staff/chat',      icon: MessageSquare,   label: 'Team Chat' },
  { href: '/dashboard/staff/notifikasi',icon: Bell,            label: 'Notifications', badge: true },
];

export default function Sidebar({ mobileOpen, onMobileClose }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted,   setMounted]   = useState(false);
  const [unread,    setUnread]    = useState(0);
  const pathname    = usePathname();
  const { profile, logout } = useAuth();

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    const fetchBadge = async () => {
      try {
        const data = await getNotifikasi();
        const list = Array.isArray(data) ? data : (data?.data ?? []);
        const relevant = profile.role === 'admin'
          ? list.filter(n => n.type !== 'assign')
          : list.filter(n => n.type === 'assign' && n.recipient_id === profile.id);
        if (!cancelled) setUnread(relevant.filter(n => !n.is_read && !n.read).length);
      } catch {}
    };
    fetchBadge();
    const id = setInterval(fetchBadge, 30000);
    window.addEventListener('notif-updated', fetchBadge);
    return () => { cancelled = true; clearInterval(id); window.removeEventListener('notif-updated', fetchBadge); };
  }, [profile?.id, profile?.role]);

  useEffect(() => { setMounted(true); }, []);

  const nav    = profile?.role === 'admin' ? adminNav : staffNav;
  const base   = profile?.role === 'admin' ? '/dashboard/admin' : '/dashboard/staff';

  const isActive = (href) => {
    const exactPaths = ['/dashboard/admin', '/dashboard/staff'];
    return exactPaths.includes(href) ? pathname === href : pathname.startsWith(href);
  };

  if (!mounted) return (
    <aside className="relative z-30 hidden h-full w-[240px] shrink-0 flex-col md:flex" />
  );

  // ── shared sidebar content ─────────────────────────────────────────
  const renderContent = (isCollapsed, isMobile) => {
    // single flag to avoid repeating this condition everywhere
    const showLabel = !isCollapsed || isMobile;

    return (
      <div className="flex h-full flex-col overflow-hidden border-r border-slate-200 bg-white">

        {/* ── logo header ─────────────────────────────────────────── */}
        <div className={`flex min-h-[68px] shrink-0 items-center border-b border-slate-100 ${
          isCollapsed && !isMobile ? 'justify-center px-4' : 'px-5'
        }`}>
          <Link
            href={base}
            onClick={isMobile ? onMobileClose : undefined}
            className="flex items-center gap-3 overflow-hidden"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-600/25">
              <ShieldCheck className="h-[18px] w-[18px]" strokeWidth={2.5} />
            </div>

            {/* CSS transition — avoids Framer width:auto glitch */}
            <div
              className="overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 ease-in-out"
              style={{ maxWidth: showLabel ? 160 : 0, opacity: showLabel ? 1 : 0 }}
            >
              <span className="block text-[15px] font-bold tracking-tight text-slate-900">Visions</span>
              <span className="block text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400">ChurnShield</span>
            </div>
          </Link>
        </div>

        {/* ── navigation ──────────────────────────────────────────── */}
        <nav className="flex-1 overflow-x-hidden overflow-y-auto p-3 scrollbar-hide">
          <div className="space-y-0.5">
            {nav.map(({ href, icon: Icon, label, badge, purple }) => {
              const active     = isActive(href);
              const activeCls  = purple
                ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/25'
                : 'bg-blue-600 text-white shadow-sm shadow-blue-600/25';
              const inactiveCls = purple
                ? 'text-slate-500 hover:bg-violet-50 hover:text-violet-700'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800';

              return (
                <Link
                  key={href}
                  href={href}
                  onClick={isMobile ? onMobileClose : undefined}
                  title={isCollapsed && !isMobile ? label : undefined}
                  className={`flex items-center rounded-xl transition-all duration-200 ${
                    isCollapsed && !isMobile ? 'justify-center p-[11px]' : 'gap-3 px-3 py-[10px]'
                  } ${active ? activeCls : inactiveCls}`}
                >
                  {/* icon */}
                  <div className="relative shrink-0">
                    <Icon
                      className="h-[18px] w-[18px] shrink-0"
                      strokeWidth={active ? 2.5 : 2}
                    />
                    {/* unread dot — collapsed mode only */}
                    {badge && unread > 0 && isCollapsed && !isMobile && (
                      <span className="absolute -right-1 -top-1 flex h-[14px] w-[14px] items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white ring-[1.5px] ring-white">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </div>

                  {/* label — CSS max-width transition, no Framer */}
                  <span
                    className="flex flex-1 items-center justify-between overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 ease-in-out"
                    style={{ maxWidth: showLabel ? 200 : 0, opacity: showLabel ? 1 : 0 }}
                  >
                    <span className={`text-[13px] leading-none ${active ? 'font-semibold' : 'font-medium'}`}>
                      {label}
                    </span>
                    {badge && unread > 0 && (
                      <span className="ml-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                        {unread > 99 ? '99+' : unread}
                      </span>
                    )}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* ── collapse toggle (desktop only) ──────────────────────── */}
        {!isMobile && (
          <div className="shrink-0 border-t border-slate-100 px-3 py-2">
            <button
              type="button"
              onClick={() => setCollapsed(v => !v)}
              className={`flex w-full items-center rounded-xl px-3 py-2 text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-slate-600 ${
                isCollapsed ? 'justify-center' : 'gap-3'
              }`}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4 shrink-0" />
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4 shrink-0" />
                  <span className="whitespace-nowrap text-[13px] font-medium">Collapse</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* ── footer (profile + sign out) ─────────────────────────── */}
        <div className="shrink-0 space-y-1 border-t border-slate-100 bg-slate-50/60 p-3">

          {profile && (
            <ProfileHoverCard placement="right" minimal>
              <div className={`group flex cursor-pointer items-center rounded-xl border border-transparent transition-all duration-200 hover:border-slate-200 hover:bg-white hover:shadow-sm ${
                isCollapsed && !isMobile ? 'justify-center p-2' : 'gap-3 px-3 py-2.5'
              }`}>
                {/* avatar */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[11px] font-bold text-blue-700 ring-2 ring-white shadow-sm">
                  {profile.full_name?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() ?? '?'}
                </div>

                {/* name + role */}
                <div
                  className="min-w-0 flex-1 overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 ease-in-out"
                  style={{ maxWidth: showLabel ? 200 : 0, opacity: showLabel ? 1 : 0 }}
                >
                  <div className="truncate text-[13px] font-semibold text-slate-800 transition-colors group-hover:text-blue-600">
                    {profile.full_name}
                  </div>
                  <div className="truncate text-[11px] capitalize text-slate-400">{profile.role}</div>
                </div>
              </div>
            </ProfileHoverCard>
          )}

          <button
            type="button"
            onClick={logout}
            title={isCollapsed && !isMobile ? 'Sign Out' : undefined}
            className={`flex w-full items-center rounded-xl text-[13px] font-medium text-slate-500 transition-all duration-200 hover:bg-red-50 hover:text-red-500 ${
              isCollapsed && !isMobile ? 'justify-center p-2.5' : 'gap-3 px-3 py-2'
            }`}
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            <span
              className="overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 ease-in-out"
              style={{ maxWidth: showLabel ? 200 : 0, opacity: showLabel ? 1 : 0 }}
            >
              Sign Out
            </span>
          </button>
        </div>
      </div>
    );
  };

  // ── desktop sidebar ────────────────────────────────────────────────
  return (
    <>
      <aside
        className={`relative z-30 hidden h-full shrink-0 flex-col md:flex ${
          collapsed ? 'w-[68px]' : 'w-[240px]'
        }`}
        style={{ transition: 'width 300ms cubic-bezier(0.4,0,0.2,1)' }}
      >
        {renderContent(collapsed, false)}
      </aside>

      {/* ── mobile drawer ──────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
              onClick={onMobileClose}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
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
