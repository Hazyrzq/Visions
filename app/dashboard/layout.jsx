'use client';
import { AuthProvider } from '@/lib/hooks/useAuth';

export default function DashboardLayout({ children }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}