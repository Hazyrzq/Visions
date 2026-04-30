'use client';
import { usePathname } from 'next/navigation';
import { Menu, Bell } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

const titles = {
  '/dashboard/admin':                 'Overview',
  '/dashboard/admin/customer':        'Customer',
  '/dashboard/admin/staf-view':       'Staf View',
  '/dashboard/admin/data':            'Data & Model',
  '/dashboard/admin/user-management': 'User Management',
  '/dashboard/admin/report':          'Report',
  '/dashboard/staff':                 'Overview',
  '/dashboard/staff/customer':        'My Customer',
  '/dashboard/staff/report':          'Report',
};

export default function Topbar({ onMenuClick }) {
  const pathname = usePathname();
  const { profile } = useAuth();
  const title    = titles[pathname] ?? 'Dashboard';
  const initials = profile?.full_name?.split(' ').slice(0,2).map(n => n[0]).join('').toUpperCase() ?? '?';

  return (
    <header className="h-16 sticky top-0 z-20 backdrop-blur-xl bg-white/70 border-b border-gray-200/70 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
      
      {/* subtle top gradient line */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

      <div className="h-full flex items-center justify-between px-4 md:px-6">
        
        {/* LEFT */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onMenuClick} 
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-[17px] font-semibold text-gray-900 tracking-tight">
              {title}
            </h1>
            <p className="text-[11px] text-gray-400 -mt-[2px] hidden sm:block">
              Dashboard overview
            </p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2">
          
          {/* Notification */}
          <button className="relative p-2.5 rounded-xl hover:bg-gray-100 text-gray-400 transition-all">
            <Bell className="w-5 h-5" />
            
            {/* pulse dot */}
            <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-white"></span>
            </span>
          </button>

          {/* User */}
          <div className="flex items-center gap-2.5 ml-1 pl-2.5 pr-3 py-1.5 rounded-xl border border-gray-200/70 bg-white/70 backdrop-blur hover:bg-gray-50 cursor-pointer transition-all">
            
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold shadow-sm">
              {initials}
            </div>

            {/* Info */}
            <div className="hidden sm:block text-left leading-tight">
              <div className="text-sm font-semibold text-gray-800">
                {profile?.full_name}
              </div>
              <div className="text-[11px] text-gray-400 capitalize">
                {profile?.role}
              </div>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}