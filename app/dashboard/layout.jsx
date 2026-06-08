'use client';

import { Suspense } from 'react';
import { AuthProvider } from '@/lib/hooks/useAuth';
import FloatingChat from '@/components/FloatingChat';

export default function DashboardLayout({ children }) {
  return (
    <AuthProvider>
      {/* Cukup render children langsung karena sudah tercover oleh Root Layout */}
      {children}
      <Suspense fallback={null}>
        <FloatingChat />
      </Suspense>
    </AuthProvider>
  );
}