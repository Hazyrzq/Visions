'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export function useProfiles() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading]   = useState(true);

  const reload = () => {
    supabase.from('profiles').select('*').order('role').order('full_name')
      .then(({ data }) => { setProfiles(data ?? []); setLoading(false); });
  };

  useEffect(() => { reload(); }, []);

  return { profiles, loading, reload };
}
