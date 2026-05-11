'use client';

import { AuthProvider } from '@/lib/hooks/useAuth';
import FloatingChat from '@/components/FloatingChat'; // <-- Import komponennya

export default function DashboardLayout({ children }) {
  return (
    <AuthProvider>
      {children}
      <FloatingChat /> {/* <-- Panggil di sini */}
    </AuthProvider>
  );
}