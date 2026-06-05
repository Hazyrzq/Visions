'use client';

import { AuthProvider } from '@/lib/hooks/useAuth';
import FloatingChat from '@/components/FloatingChat';

export default function DashboardLayout({ children }) {
  return (
    <AuthProvider>
      {/* Cukup render children langsung karena sudah tercover oleh Root Layout */}
      {children}
      <FloatingChat />
    </AuthProvider>
  );
}