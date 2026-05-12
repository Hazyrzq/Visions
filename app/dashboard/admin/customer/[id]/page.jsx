'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

/**
 * Tautan lama /customer/[id] diarahkan ke daftar + panel detail (slide dari kanan).
 */
export default function CustomerDetailLegacyRedirect() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const id = params?.id;
    if (id != null && id !== '') {
      router.replace(`/dashboard/admin/customer?detail=${encodeURIComponent(id)}`);
    }
  }, [params?.id, router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--vs-brand)] border-t-transparent" />
    </div>
  );
}
