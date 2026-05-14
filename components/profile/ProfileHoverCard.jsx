'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Pencil, Settings } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

const LEAVE_MS = 180;

const placementClass = {
  top: 'bottom-full right-0 mb-1',
  bottom: 'top-full right-0 mt-2',
  right: 'left-full top-1/2 ml-1.5 -translate-y-1/2',
  left: 'right-full top-0 mr-1.5',
};

function initials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

function roleLabel(role) {
  if (role === 'admin') return 'Administrator';
  if (role === 'staff') return 'Staf';
  return role ?? '—';
}

function HoverBridge({ placement }) {
  if (placement === 'top') {
    return <div className="pointer-events-auto absolute -bottom-2 left-0 right-0 h-2" aria-hidden />;
  }
  if (placement === 'bottom') {
    return <div className="pointer-events-auto absolute -top-2 left-0 right-0 h-2" aria-hidden />;
  }
  if (placement === 'right') {
    return <div className="pointer-events-auto absolute -left-2 top-0 bottom-0 w-2" aria-hidden />;
  }
  if (placement === 'left') {
    return <div className="pointer-events-auto absolute -right-2 top-0 bottom-0 w-2" aria-hidden />;
  }
  return null;
}

function menuRowClass(minimal) {
  return `flex w-full items-center text-left text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 ${
    minimal ? 'gap-2.5 rounded-lg px-2.5 py-2' : 'gap-3 rounded-xl px-3 py-2.5'
  }`;
}

/**
 * Menu akun ringkas: hover atau klik (tanpa pindah halaman sampai pilih aksi).
 * @param {{ placement?: 'top'|'bottom'|'right'|'left', interaction?: 'hover'|'click', minimal?: boolean, children: React.ReactNode }} props
 */
export default function ProfileHoverCard({
  placement = 'bottom',
  interaction = 'hover',
  minimal = false,
  children,
}) {
  const pathname = usePathname();
  const { user, profile, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const leaveTimer = useRef(null);
  const rootRef = useRef(null);

  const base = pathname.startsWith('/dashboard/admin') ? '/dashboard/admin' : '/dashboard/staff';
  const profileEditHref = `${base}/profile?edit=1`;
  const settingsHref = profile?.role === 'admin' ? `${base}/user-management` : `${base}/profile`;

  const clearLeave = useCallback(() => {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
  }, []);

  const onEnter = useCallback(() => {
    if (interaction !== 'hover') return;
    clearLeave();
    setOpen(true);
  }, [clearLeave, interaction]);

  const onLeave = useCallback(() => {
    if (interaction !== 'hover') return;
    clearLeave();
    leaveTimer.current = setTimeout(() => setOpen(false), LEAVE_MS);
  }, [clearLeave, interaction]);

  const toggle = useCallback(() => {
    if (interaction !== 'click') return;
    setOpen((v) => !v);
  }, [interaction]);

  useEffect(() => {
    if (interaction !== 'click' || !open) return;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [interaction, open]);

  const onCoarseClick = useCallback(
    (e) => {
      if (interaction !== 'hover') return;
      if (typeof window === 'undefined') return;
      if (window.matchMedia('(hover: none)').matches) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    },
    [interaction]
  );

  return (
    <div
      ref={rootRef}
      className="relative inline-flex max-w-full"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={onCoarseClick}
    >
      <div
        role={interaction === 'click' ? 'button' : undefined}
        tabIndex={interaction === 'click' ? 0 : undefined}
        onClick={interaction === 'click' ? (e) => { e.stopPropagation(); toggle(); } : undefined}
        onKeyDown={
          interaction === 'click'
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggle();
                }
              }
            : undefined
        }
        className={interaction === 'click' ? 'cursor-pointer outline-none' : ''}
      >
        {children}
      </div>

      {open ? (
        <div
          className={`absolute z-[80] overflow-hidden border border-slate-200/90 bg-white shadow-lg ring-1 ring-slate-900/5 animate-in fade-in zoom-in-95 duration-150 ${
            minimal ? 'w-52 rounded-xl py-1.5 shadow-slate-900/10' : 'w-[min(calc(100vw-24px),280px)] min-w-[248px] rounded-2xl py-2 shadow-slate-900/12'
          } ${placementClass[placement]}`}
          role="menu"
          aria-label="Menu akun"
          onClick={(e) => e.stopPropagation()}
        >
          <HoverBridge placement={placement} />

          {minimal ? (
            <div className="relative border-b border-slate-100 px-3 pb-2 pt-1.5 mb-1">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-slate-800">{profile?.full_name ?? 'Pengguna'}</p>
                <p className="truncate text-[11px] text-slate-500 mt-0.5">{user?.email}</p>
              </div>
            </div>
          ) : (
            <div className="relative border-b border-slate-100 px-4 pb-3 pt-1">
              <div className="flex gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--vs-brand)] to-blue-500 text-[12px] font-bold text-white shadow-md">
                  {initials(profile?.full_name)}
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="truncate text-[14px] font-bold text-slate-900">{profile?.full_name ?? 'Pengguna'}</p>
                  <p className="mt-0.5 truncate text-[12px] text-slate-500">{user?.email}</p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--vs-brand)]">{roleLabel(profile?.role)}</p>
                </div>
              </div>
            </div>
          )}

          <nav className={`relative ${minimal ? 'px-2 py-1' : 'px-2 pt-1'}`}>
            <Link href={settingsHref} className={menuRowClass(minimal)} role="menuitem" onClick={() => setOpen(false)}>
              <Settings className="h-4 w-4 shrink-0 text-slate-400" />
              Pengaturan
            </Link>
            <Link href={profileEditHref} className={menuRowClass(minimal)} role="menuitem" onClick={() => setOpen(false)}>
              <Pencil className="h-4 w-4 shrink-0 text-slate-400" />
              Edit profil
            </Link>
          </nav>

          {!minimal && (
            <div className="relative mt-1 border-t border-slate-100 px-2 pb-1 pt-1">
              <button
                type="button"
                role="menuitem"
                className={`${menuRowClass(minimal)} w-full text-red-600 hover:bg-red-50 hover:text-red-700`}
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
              >
                <LogOut className="h-4 w-4 shrink-0" />
                Keluar
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
