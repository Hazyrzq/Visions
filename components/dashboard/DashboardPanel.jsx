'use client';

/**
 * Panel konten — header putih bersih, isi fleksibel.
 */
export default function DashboardPanel({
  title,
  description,
  action,
  children,
  className = '',
  bodyClassName = '',
}) {
  return (
    <div className={`vs-card overflow-hidden ${className}`}>
      {(title || description || action) && (
        <div className="flex flex-col gap-1 border-b border-slate-100 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-5">
          <div className="min-w-0">
            {title ? (
              <h2 className="text-[15px] font-semibold tracking-tight text-slate-900 sm:text-base">{title}</h2>
            ) : null}
            {description ? (
              <p className="mt-0.5 text-[13px] leading-relaxed text-slate-500">{description}</p>
            ) : null}
          </div>
          {action ? <div className="mt-2 shrink-0 sm:mt-0">{action}</div> : null}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}
