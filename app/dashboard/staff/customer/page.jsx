'use client';

import { Suspense, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/motion';
import { Users } from 'lucide-react';
import CustomerTable from '@/components/customer/CustomerTable';
import CustomerDetailDrawer from '@/components/customer/CustomerDetailDrawer';
import { mockCustomers } from '@/lib/mockData';
import { supabase } from '@/lib/supabase';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { hrefWithCustomerDetail, hrefWithoutCustomerDetail } from '@/lib/customerDetailNav';

function StaffCustomerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { profile } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const idFromUrl = searchParams.get('detail');
  const [drawerCustomerId, setDrawerCustomerId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (idFromUrl) {
      setDrawerCustomerId(idFromUrl);
      setDrawerOpen(true);
    } else {
      setDrawerOpen(false);
    }
  }, [idFromUrl]);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('customers')
      .select('*')
      .eq('assigned_to', profile.id)
      .order('churn_score', { ascending: false })
      .then(({ data, error }) => {
        if (error || !data?.length) {
          setCustomers(mockCustomers.filter((c) => c.assigned_to === profile.id));
        } else {
          setCustomers(data);
        }
        setLoading(false);
      });
  }, [profile]);

  const openDetail = (id) => {
    router.replace(hrefWithCustomerDetail(pathname, searchParams, id), { scroll: false });
  };

  const closeDetail = () => {
    router.replace(hrefWithoutCustomerDetail(pathname, searchParams), { scroll: false });
  };

  return (
    <DashboardShell
      title="Pelanggan saya"
      description="Daftar pelanggan yang di-assign ke Anda."
      icon={Users}
    >
      <motion.div variants={fadeUp}>
        <CustomerTable
          customers={customers}
          loading={loading}
          onCustomerOpen={(c) => openDetail(c.id)}
        />
      </motion.div>

      <CustomerDetailDrawer
        open={drawerOpen}
        customerId={drawerCustomerId}
        onClose={closeDetail}
        onExitComplete={() => setDrawerCustomerId(null)}
      />
    </DashboardShell>
  );
}

function StaffCustomerFallback() {
  return (
    <DashboardShell title="Pelanggan saya" description="Memuat…" icon={Users}>
      <div className="flex items-center justify-center p-16">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--vs-brand)] border-t-transparent" />
      </div>
    </DashboardShell>
  );
}

export default function StaffCustomerPage() {
  return (
    <Suspense fallback={<StaffCustomerFallback />}>
      <StaffCustomerInner />
    </Suspense>
  );
}
