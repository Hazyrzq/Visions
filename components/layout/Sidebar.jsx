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
  { href: '/dashboard',                  icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/customer',         icon: Users,           label: 'Customer' },
  { href: '/dashboard/staf-view',        icon: UserCheck,       label: 'Staf View' },
  { href: '/dashboard/data',             icon: Database,        label: 'Data & Model' },
  { href: '/dashboard/user-management',  icon: Settings,        label: 'User Management' },
  { href: '/dashboard/report',           icon: BarChart2,       label: 'Report' },
];

const staffNav = [
  { href: '/dashboard',          icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/customer', icon: Users,           label: 'My Customer' },
  { href: '/dashboard/report',   icon: BarChart2,       label: 'Report' },
];

export default function Sidebar({ mobileOpen, onMobileClose }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { profile, logout } = useAuth();

  const nav = profile?.role === 'admin' ? adminNav : staffNav;

  const active = (href) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  const Inner = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-4 py-5 border-b border-white/8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="text-white font-bold text-sm">Visions</div>
              <div className="text-white/40 text-[11px]">ChurnShield</div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto sidebar-scroll">
        {nav.map(({ href, icon: Icon, label }) => {
          const isActive = active(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onMobileClose}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
                ${isActive
                  ? 'bg-white/15 text-white'
                  : 'text-white/55 hover:bg-white/8 hover:text-white/90'
                }`}
            >
              <Icon className={`w-[18px] h-[18px] flex-shrink-0 transition-colors ${isActive ? 'text-white' : 'text-white/45 group-hover:text-white/80'}`} />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-white/8 space-y-1">
        {!collapsed && profile && (
          <div className="px-3 py-2.5 mb-1 rounded-xl bg-white/6">
            <div className="text-white text-xs font-semibold truncate">{profile.full_name}</div>
            <div className="text-white/40 text-[11px] capitalize mt-0.5">{profile.role}</div>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50 hover:bg-red-500/10 hover:text-red-400 transition-all text-sm font-medium"
        >
          <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
          {!collapsed && 'Keluar'}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className={`hidden md:flex flex-col fixed inset-y-0 left-0 z-30 bg-[#0A1628] transition-[width] duration-300 ${collapsed ? 'w-16' : 'w-60'}`}>
        <Inner />
        <button
          onClick={() => setCollapsed(v => !v)}
          className="absolute -right-3 top-[76px] w-6 h-6 bg-[#0A1628] border border-white/15 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-colors shadow"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Mobile */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60" onClick={onMobileClose} />
          <aside className="relative w-60 h-full bg-[#0A1628]">
            <Inner />
          </aside>
        </div>
      )}
    </>
  );
}
