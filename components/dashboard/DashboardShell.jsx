'use client';

import { motion } from 'framer-motion';
import { pageVariants, fadeUp, stagger } from '@/lib/motion';

/**
 * Layout halaman dashboard — hero tipografi + konten.
 */
export default function DashboardShell({
  title,
  description,
  actions,
  icon: Icon,
  children,
  className = '',
}) {
  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className={`space-y-10 pb-6 ${className}`}
    >
      <motion.header variants={fadeUp} className="relative">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 gap-4">
            {Icon && (
              <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--vs-brand)] to-blue-500 text-white shadow-lg shadow-blue-500/30 sm:flex">
                <Icon className="h-7 w-7" strokeWidth={2} aria-hidden />
              </div>
            )}
            <div className="min-w-0 pt-0.5">
              <h1 className="text-[1.65rem] font-bold leading-[1.15] tracking-tight text-slate-900 sm:text-4xl sm:leading-[1.1]">
                {title}
              </h1>
              {description ? (
                <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-slate-500 sm:text-[15px]">
                  {description}
                </p>
              ) : null}
              <div className="mt-5 flex items-center gap-3">
                <span className="h-1.5 w-12 rounded-full bg-[var(--vs-brand)]" aria-hidden />
                <span className="h-1.5 w-2 rounded-full bg-slate-200" aria-hidden />
                <span className="h-1.5 w-2 rounded-full bg-slate-200" aria-hidden />
              </div>
            </div>
          </div>
          {actions ? (
            <div className="flex shrink-0 flex-wrap items-center gap-2 lg:pb-1">{actions}</div>
          ) : null}
        </div>
      </motion.header>

      <motion.div variants={stagger} className="flex flex-col gap-8 lg:gap-10">
        {children}
      </motion.div>
    </motion.div>
  );
}
