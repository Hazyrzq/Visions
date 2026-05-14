'use client';

import { usePathname } from 'next/navigation';
import { Menu, Bell, Search, ChevronRight } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { motion } from 'framer-motion';
import { getDashboardBreadcrumbs } from '@/lib/dashboardBreadcrumbs';
import ProfileHoverCard from '@/components/profile/ProfileHoverCard';

export default function Topbar({ onMenuClick }) {
  const pathname = usePathname();
  const { profile } = useAuth();
  const { crumbs } = getDashboardBreadcrumbs(pathname);
  const initials = profile?.full_name?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() ?? '?';

  return (
    <motion.header
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-[100] mx-2 mt-2 shrink-0 rounded-2xl border border-slate-200/80 bg-white/95 px-2 shadow-sm backdrop-blur-md md:mx-3 md:mt-3"
    >
      <div className="flex h-[58px] items-center gap-2 px-2 md:h-[60px] md:gap-3 md:px-3">

        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-xl p-2.5 text-slate-500 transition-colors hover:bg-slate-100 md:hidden"
          aria-label="Buka menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1 truncate text-[13px] font-semibold text-slate-800 md:hidden">
          {crumbs[crumbs.length - 1]?.label ?? 'Dashboard'}
        </div>

        <nav
          className="hidden min-w-0 items-center gap-1 text-[12px] font-medium text-slate-500 md:flex md:flex-initial md:max-w-[min(100%,260px)]"
          aria-label="Breadcrumb"
        >
          {crumbs.map((c, i) => (
            <span key={`${c.label}-${i}`} className="flex min-w-0 items-center gap-1">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" aria-hidden />}
              <span className={`truncate ${i === crumbs.length - 1 ? 'font-semibold text-slate-800' : ''}`}>
                {c.label}
              </span>
            </span>
          ))}
        </nav>

        <div className="hidden min-w-0 flex-1 justify-center px-3 md:flex">
          <label className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Cari pelanggan, laporan…"
              className="w-full rounded-full border border-slate-200/90 bg-slate-50/90 py-2.5 pl-10 pr-4 text-[13px] text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-[var(--vs-brand-200)] focus:bg-white focus:ring-2 focus:ring-[var(--vs-brand-light)]"
            />
          </label>
        </div>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">

          <button
            type="button"
            className="relative rounded-full p-2.5 text-slate-500 transition-colors hover:bg-slate-100"
            aria-label="Notifikasi"
          >
            <Bell className="h-[21px] w-[21px]" />
            <span className="absolute right-2 top-2 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            </span>
          </button>

          <ProfileHoverCard interaction="click" placement="bottom">
            <div
              className="ml-0.5 flex items-center gap-2 rounded-full border border-slate-200/90 bg-slate-50/80 py-1 pl-1 pr-2.5 outline-none ring-offset-2 transition-colors hover:border-slate-300 hover:bg-white focus-visible:ring-2 focus-visible:ring-[var(--vs-brand)] sm:ml-1 sm:pr-3"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[var(--vs-brand)] to-blue-500 text-[10px] font-bold text-white shadow-md sm:h-9 sm:w-9 sm:text-[11px]">
                {initials}
              </div>
              <div className="hidden min-w-0 text-left leading-tight sm:block">
                <div className="max-w-[120px] truncate text-[12px] font-semibold text-slate-800 md:max-w-[140px] md:text-[13px]">
                  {profile?.full_name}
                </div>
                <div className="text-[10px] capitalize text-slate-500 md:text-[11px]">{profile?.role}</div>
              </div>
            </div>
          </ProfileHoverCard>
        </div>
      </div>
    </motion.header>
  );
}
