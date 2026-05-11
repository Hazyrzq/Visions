'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, Users, UserCheck, Database,
  Settings, BarChart2, LogOut, ChevronLeft, ChevronRight, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

const adminNav = [
  { href: '/dashboard/admin',                  icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/admin/customer',         icon: Users,           label: 'Customer' },
  { href: '/dashboard/admin/staf-view',        icon: UserCheck,       label: 'Staf View' },
  { href: '/dashboard/admin/data',             icon: Database,        label: 'Data & Model' },
  { href: '/dashboard/admin/user-management',  icon: Settings,        label: 'User Management' },
  { href: '/dashboard/admin/report',           icon: BarChart2,       label: 'Report' },
];

const staffNav = [
  { href: '/dashboard/staff',          icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/staff/customer', icon: Users,           label: 'My Customer' },
  { href: '/dashboard/staff/report',   icon: BarChart2,       label: 'Report' },
];

export default function Sidebar({ mobileOpen, onMobileClose }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { profile, logout } = useAuth();

  const nav = profile?.role === 'admin' ? adminNav : staffNav;

  const active = (href) => {
    const overviewPaths = ['/dashboard/admin', '/dashboard/staff'];
    if (overviewPaths.includes(href)) return pathname === href;
    return pathname.startsWith(href);
  };

  const Inner = () => (
    <div className="flex flex-col h-full relative">
      {/* subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A1628] via-[#0B1730] to-[#0A1628]" />
      <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle_at_30%_20%,#6366f1,transparent_60%)]" />

      <div className="relative flex flex-col h-full">
        {/* Brand */}
        <div className="px-4 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div className="leading-tight">
                <div className="text-white font-semibold text-sm tracking-tight">Visions</div>
                <div className="text-white/40 text-[11px]">ChurnShield</div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {nav.map(({ href, icon: Icon, label }) => {
            const isActive = active(href);

            return (
              <Link
                key={href}
                href={href}
                onClick={onMobileClose}
                title={collapsed ? label : undefined}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${isActive
                    ? 'text-white'
                    : 'text-white/50 hover:text-white'
                  }`}
              >
                {/* active background */}
                {isActive && (
                  <div className="absolute inset-0 rounded-xl bg-white/[0.08] border border-white/[0.06]" />
                )}

                <Icon className={`relative z-10 w-[18px] h-[18px] transition-colors
                  ${isActive ? 'text-white' : 'text-white/40 group-hover:text-white/80'}
                `} />

                {!collapsed && (
                  <span className="relative z-10 truncate">{label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-white/[0.06] space-y-2">
          {!collapsed && profile && (
            <div className="px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.05]">
              <div className="text-white text-xs font-medium truncate">{profile.full_name}</div>
              <div className="text-white/40 text-[11px] capitalize mt-0.5">{profile.role}</div>
            </div>
          )}

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50 hover:bg-red-500/10 hover:text-red-400 transition-all text-sm font-medium"
          >
            <LogOut className="w-[18px] h-[18px]" />
            {!collapsed && 'Keluar'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      {/* Desktop */}
      <aside className={`hidden md:flex flex-col relative h-full shrink-0 z-30 transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'}`}>
        <Inner />
        <button
          onClick={() => setCollapsed(v => !v)}
          className="absolute -right-3 top-[76px] w-6 h-6 bg-[#0A1628] border border-white/10 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-colors shadow"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Mobile */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onMobileClose} />
          <aside className="relative w-60 h-full">
            <Inner />
          </aside>
        </div>
      )}
    </>
  );
}