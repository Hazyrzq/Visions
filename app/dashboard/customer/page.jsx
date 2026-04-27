'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import CustomerTable from '@/components/customer/CustomerTable';
import { mockCustomers } from '@/lib/mockData';
import { supabase } from '@/lib/supabase';

export default function CustomerPage() {
  const { profile, isAdmin, isStaff } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (!profile) return;
    let q = supabase.from('customers').select('*').order('churn_score', { ascending: false });
    if (isStaff) q = q.eq('assigned_to', profile.id);
    q.then(({ data, error }) => {
      if (error || !data?.length) {
        // fallback mock
        setCustomers(isStaff ? mockCustomers.filter(c => c.assigned_to === profile.id) : mockCustomers);
      } else {
        setCustomers(data);
      }
      setLoading(false);
    });
  }, [profile, isStaff]);

  return (
    <div className="max-w-[1400px]">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-900">
          {isAdmin ? 'Semua Pelanggan' : 'Pelanggan Saya'}
        </h2>
        <p className="text-sm text-gray-400 mt-0.5">
          {isAdmin
            ? 'Pantau semua pelanggan dan skor risiko churn mereka'
            : 'Daftar pelanggan yang di-assign ke Anda'}
        </p>
      </div>
      <CustomerTable customers={customers} loading={loading} />
    </div>
  );
}
