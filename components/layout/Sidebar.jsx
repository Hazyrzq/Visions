'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, UserCheck, Database, Settings,
  BarChart2, LogOut, ChevronLeft, ChevronRight, ShieldCheck,
  Bell, MessageSquare, Globe,
} from 'lucide-react';
import { getNotifikasi } from '@/lib/churnshield';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/hooks/useAuth';
import { useLang } from '@/lib/i18n/LanguageContext';
import ProfileHoverCard from '@/components/profile/ProfileHoverCard';

// Nav configs pakai key terjemahan, bukan label hardcoded
const adminNavConfig = [
  { href: '/dashboard/admin',                 icon: LayoutDashboard, key: 'overview' },
  { href: '/dashboard/admin/customer',        icon: Users,           key: 'customer' },
  { href: '/dashboard/admin/staf-view',       icon: UserCheck,       key: 'staffView' },
  { href: '/dashboard/admin/data',            icon: Database,        key: 'dataModel' },
  { href: '/dashboard/admin/user-management', icon: Settings,        key: 'users' },
  { href: '/dashboard/admin/report',          icon: BarChart2,       key: 'reports' },
  { href: '/dashboard/admin/chat',            icon: MessageSquare,   key: 'teamChat' },
  { href: '/dashboard/admin/notifikasi',      icon: Bell,            key: 'notifications', badge: true },
];

const staffNavConfig = [
  { href: '/dashboard/staff',           icon: LayoutDashboard, key: 'overview' },
  { href: '/dashboard/staff/customer',  icon: Users,           key: 'myCustomers' },
  { href: '/dashboard/staff/report',    icon: BarChart2,       key: 'reports' },
  { href: '/dashboard/staff/chat',      icon: MessageSquare,   key: 'teamChat' },
  { href: '/dashboard/staff/notifikasi',icon: Bell,            key: 'notifications', badge: true },
];

export default function Sidebar({ mobileOpen, onMobileClose }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted,   setMounted]   = useState(false);
  const [unread,    setUnread]    = useState(0);
  const pathname    = usePathname();
  const { profile, logout } = useAuth();
  const { lang, toggleLang, t } = useLang();

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

  const navConfig = profile?.role === 'admin' ? adminNavConfig : staffNavConfig;
  const base = profile?.role === 'admin' ? '/dashboard/admin' : '/dashboard/staff';

  const isActive = (href) => {
    const exactPaths = ['/dashboard/admin', '/dashboard/staff'];
    return exactPaths.includes(href) ? pathname === href : pathname.startsWith(href);
  };

  if (!mounted) return (
    <aside className="relative z-30 hidden h-full w-[240px] shrink-0 flex-col md:flex" />
  );

  const renderContent = (isCollapsed, isMobile) => {
    const showLabel = !isCollapsed || isMobile;

    return (
      <div className="flex h-full flex-col border-r border-slate-200 bg-white">

        {/* ── Logo ── */}
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
            <div
              className="overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 ease-in-out"
              style={{ maxWidth: showLabel ? 160 : 0, opacity: showLabel ? 1 : 0 }}
            >
              <span className="block text-[15px] font-bold tracking-tight text-slate-900">Visions</span>
              <span className="block text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400">ChurnShield</span>
            </div>
          </Link>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-x-hidden overflow-y-auto p-3 scrollbar-hide">
          <div className="space-y-0.5">
            {navConfig.map(({ href, icon: Icon, key, badge }) => {
              const label = t(`nav.${key}`);
              const active = isActive(href);
              const activeCls = 'bg-blue-600 text-white shadow-sm shadow-blue-600/25';
              const inactiveCls = 'text-slate-500 hover:bg-slate-100 hover:text-slate-800';

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
                  <div className="relative shrink-0">
                    <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={active ? 2.5 : 2} />
                    {badge && unread > 0 && isCollapsed && !isMobile && (
                      <span className="absolute -right-1 -top-1 flex h-[14px] w-[14px] items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white ring-[1.5px] ring-white">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </div>
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

        {/* ── Language toggle + Collapse (desktop only) ── */}
        {!isMobile && (
          <div className="shrink-0 border-t border-slate-100 px-3 pt-2 pb-1 space-y-1">
            {/* Toggle bahasa — di atas collapse */}
            <button
              type="button"
              onClick={toggleLang}
              title={lang === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
              className={`flex w-full items-center rounded-xl px-3 py-2 text-slate-400 transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 ${
                isCollapsed ? 'justify-center' : 'gap-3'
              }`}
            >
              <Globe className="h-4 w-4 shrink-0" />
              <span
                className="overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 ease-in-out text-[13px] font-medium"
                style={{ maxWidth: showLabel ? 200 : 0, opacity: showLabel ? 1 : 0 }}
              >
                {lang === 'id' ? 'Bahasa Indonesia' : 'English'}
              </span>
              {/* Badge bahasa saat collapsed */}
              {isCollapsed && (
                <span className="sr-only">{lang.toUpperCase()}</span>
              )}
              {!isCollapsed && (
                <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                  {lang.toUpperCase()}
                </span>
              )}
            </button>

            {/* Collapse toggle */}
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
                  <span className="whitespace-nowrap text-[13px] font-medium">{t('nav.collapse')}</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* ── Footer (profil + sign out) ── */}
        <div className="shrink-0 space-y-1 border-t border-slate-100 bg-slate-50/60 p-3 relative overflow-visible">
          {profile && (
            <ProfileHoverCard placement="sidebar-up" minimal>
              <div className={`group flex cursor-pointer items-center rounded-xl border border-transparent transition-all duration-200 hover:border-slate-200 hover:bg-white hover:shadow-sm ${
                isCollapsed && !isMobile ? 'justify-center p-2' : 'gap-3 px-3 py-2.5'
              }`}>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[11px] font-bold text-blue-700 ring-2 ring-white shadow-sm">
                  {profile.full_name?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() ?? '?'}
                </div>
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
            title={isCollapsed && !isMobile ? t('nav.signOut') : undefined}
            className={`flex w-full items-center rounded-xl text-[13px] font-medium text-slate-500 transition-all duration-200 hover:bg-red-50 hover:text-red-500 ${
              isCollapsed && !isMobile ? 'justify-center p-2.5' : 'gap-3 px-3 py-2'
            }`}
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            <span
              className="overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 ease-in-out"
              style={{ maxWidth: showLabel ? 200 : 0, opacity: showLabel ? 1 : 0 }}
            >
              {t('nav.signOut')}
            </span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <aside
        className={`relative z-30 hidden h-full shrink-0 flex-col md:flex ${collapsed ? 'w-[68px]' : 'w-[240px]'}`}
        style={{ transition: 'width 300ms cubic-bezier(0.4,0,0.2,1)' }}
      >
        {renderContent(collapsed, false)}
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onMobileClose} />
            <motion.aside
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
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
