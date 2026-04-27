'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export function useCustomers(assignedTo = null) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    let q = supabase
      .from('customers')
      .select('*, profiles!assigned_to(full_name)')
      .order('churn_score', { ascending: false });

    if (assignedTo) q = q.eq('assigned_to', assignedTo);

    q.then(({ data, error }) => {
      if (!error) setCustomers(data ?? []);
      setLoading(false);
    });
  }, [assignedTo]);

  return { customers, loading, setCustomers };
}
