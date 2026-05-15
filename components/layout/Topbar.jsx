'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Menu, Bell, ChevronRight } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { getDashboardBreadcrumbs } from '@/lib/dashboardBreadcrumbs';
import ProfileHoverCard from '@/components/profile/ProfileHoverCard';
import { getNotifikasi } from '@/lib/churnshield';

export default function Topbar({ onMenuClick }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useAuth();
  const { crumbs } = getDashboardBreadcrumbs(pathname);
  const initials = profile?.full_name?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() ?? '?';

  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    const fetchBadge = async () => {
      try {
        const raw = await getNotifikasi();
        const list = Array.isArray(raw) ? raw : [];
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

  const notifHref = profile?.role === 'admin'
    ? '/dashboard/admin/notifikasi'
    : '/dashboard/staff/notifikasi';

  return (
    <header className="relative z-[100] mx-3 mt-3 shrink-0 rounded-2xl border border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-md md:mx-4 md:mt-4">
      <div className="flex h-[64px] items-center gap-3 px-4 md:h-[68px] md:gap-4 md:px-5">

        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-xl p-2.5 text-slate-500 transition-colors hover:bg-slate-100 md:hidden"
          aria-label="Buka menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1 truncate text-[14px] font-semibold text-slate-800 md:hidden">
          {crumbs[crumbs.length - 1]?.label ?? 'Dashboard'}
        </div>

        <nav
          className="hidden min-w-0 flex-1 items-center gap-1.5 text-[13px] font-medium text-slate-400 md:flex"
          aria-label="Breadcrumb"
        >
          {crumbs.map((c, i) => (
            <span key={`${c.label}-${i}`} className="flex min-w-0 items-center gap-1.5">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" aria-hidden />}
              <span className={`truncate ${i === crumbs.length - 1 ? 'font-semibold text-slate-800' : 'text-slate-400 hover:text-slate-600 transition-colors'}`}>
                {c.label}
              </span>
            </span>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">

          <Link
            href={notifHref}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100"
            aria-label="Notifikasi"
          >
            <Bell className="h-[20px] w-[20px]" />
            {unread > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </Link>

          <div className="h-6 w-px bg-slate-200" />

          <ProfileHoverCard interaction="click" placement="bottom">
            <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/90 bg-slate-50/80 py-1.5 pl-1.5 pr-3.5 outline-none transition-colors hover:border-slate-300 hover:bg-white focus-visible:ring-2 focus-visible:ring-[var(--vs-brand)]">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--vs-brand)] to-blue-500 text-[11px] font-bold text-white shadow-sm">
                {initials}
              </div>
              <div className="hidden min-w-0 text-left leading-tight sm:block">
                <div className="max-w-[130px] truncate text-[13px] font-semibold text-slate-800">
                  {profile?.full_name}
                </div>
                <div className="text-[11px] capitalize text-slate-500">{profile?.role}</div>
              </div>
            </div>
          </ProfileHoverCard>
        </div>
      </div>
    </header>
  );
}
