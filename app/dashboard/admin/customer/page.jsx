'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import CustomerTable from '@/components/customer/CustomerTable';
import { mockCustomers } from '@/lib/mockData';
import { supabase } from '@/lib/supabase';

export default function AdminCustomerPage() {
  const { profile } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (!profile) return;
    supabase.from('customers').select('*').order('churn_score', { ascending: false })
      .then(({ data, error }) => {
        setCustomers(error || !data?.length ? mockCustomers : data);
        setLoading(false);
      });
  }, [profile]);

  return (
    <div className="max-w-[1400px]">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-900">Semua Pelanggan</h2>
        <p className="text-sm text-gray-400 mt-0.5">Pantau semua pelanggan dan skor risiko churn mereka</p>
      </div>
      <CustomerTable customers={customers} loading={loading} />
    </div>
  );
}
