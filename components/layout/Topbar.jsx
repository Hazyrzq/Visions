'use client';
import { usePathname } from 'next/navigation';
import { Menu, Bell } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

const titles = {
  '/dashboard':                 'Overview',
  '/dashboard/customer':        'Customer',
  '/dashboard/staf-view':       'Staf View',
  '/dashboard/data':            'Data & Model',
  '/dashboard/user-management': 'User Management',
  '/dashboard/report':          'Report',
};

export default function Topbar({ onMenuClick }) {
  const pathname = usePathname();
  const { profile } = useAuth();
  const title = titles[pathname] ?? 'Dashboard';
  const initials = profile?.full_name?.split(' ').slice(0,2).map(n => n[0]).join('').toUpperCase() ?? '?';

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-6 sticky top-0 z-20 shadow-sm">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      </div>

      <div className="flex items-center gap-1.5">
        <button className="relative p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </button>

        <div className="flex items-center gap-2.5 ml-1 pl-3 py-1.5 pr-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors border border-gray-100">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="hidden sm:block text-left leading-tight">
            <div className="text-sm font-semibold text-gray-800">{profile?.full_name}</div>
            <div className="text-[11px] text-gray-400 capitalize">{profile?.role}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
