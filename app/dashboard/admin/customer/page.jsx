'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Users, Search, AlertTriangle, CheckSquare } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/lib/hooks/useAuth';
import { mockCustomers } from '@/lib/mockData';
import { useToast, ToastContainer } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { useConfirm } from '@/components/ui/ConfirmProvider';

export default function AdminCustomerPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { toasts, toast, remove } = useToast();
  const confirm = useConfirm();
  
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    if (!profile) return;
    
    const fetchCustomers = async () => {
      const { data, error } = await supabase
        .from('customers')
        .select(`*, staff:profiles!customers_assigned_to_fkey(full_name)`)
        .order('churn_score', { ascending: false });

      if (error || !data?.length) {
        setCustomers(mockCustomers);
      } else {
        setCustomers(data);
      }
      setLoading(false);
    };

    fetchCustomers();
  }, [profile]);

  const filteredCustomers = customers.filter(c => 
    c.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.customer_id?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredCustomers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCustomers.map(c => c.id));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(selectedId => selectedId !== id) : [...prev, id]
    );
  };

  const handleDeleteSingle = async (id, companyName) => {
    const isConfirmed = await confirm({
      title: 'Hapus Pelanggan',
      message: `Yakin ingin menghapus ${companyName} secara permanen? Data yang sudah dihapus tidak bisa dikembalikan.`,
      confirmText: 'Hapus Permanen',
      cancelText: 'Batal',
      variant: 'destructive'
    });

    if (!isConfirmed) return;

    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) {
      toast('Gagal menghapus data pelanggan', 'error');
    } else {
      setCustomers(prev => prev.filter(c => c.id !== id));
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
      toast(`${companyName} berhasil dihapus`, 'success');
    }
  };

  const handleBulkDelete = async () => {
    const isConfirmed = await confirm({
      title: 'Hapus Massal',
      message: `Yakin ingin menghapus ${selectedIds.length} pelanggan yang dipilih secara permanen?`,
      confirmText: 'Hapus Semua',
      cancelText: 'Batal',
      variant: 'destructive'
    });

    if (!isConfirmed) return;

    const { error } = await supabase.from('customers').delete().in('id', selectedIds);
    
    if (error) {
      toast('Gagal menghapus data terpilih', 'error');
    } else {
      setCustomers(prev => prev.filter(c => !selectedIds.includes(c.id)));
      toast(`${selectedIds.length} pelanggan berhasil dihapus`, 'success');
      setSelectedIds([]);
    }
  };

  return (
    <div className="vs-root">
      <style jsx global>{`
        .vs-root {
          --bg:        #FAFAFA;
          --bg-2:      #F4F4F5;
          --surface:   #FFFFFF;
          --ink:       #0A0A0A;
          --ink-2:     #18181B;
          --muted:     #52525B;
          --muted-2:   #71717A;
          --muted-3:   #A1A1AA;
          --line:      #E4E4E7;
          --line-2:    #EAEAEC;
          --line-soft: #F0F0F2;

          --brand:     #4F46E5;
          --success:   #10B981;
          --warn:      #F59E0B;
          --danger:    #EF4444;

          --shadow-xs: 0 1px 2px rgba(16,24,40,0.04);
          --shadow-xl: 0 20px 40px -8px rgba(0,0,0,0.15);
          
          font-family: 'Geist', 'Inter', -apple-system, sans-serif;
          color: var(--ink);
        }
        .vs-root .mono { font-family: 'Geist Mono', monospace; }
        
        .vs-card {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 12px;
          box-shadow: var(--shadow-xs);
        }
        
        .vs-tag {
          display: inline-flex; align-items: center; justify-content: center; gap: 4px;
          padding: 4px 10px; border-radius: 6px;
          font-size: 11px; font-weight: 600; letter-spacing: 0.02em;
          border: 1px solid transparent; text-transform: capitalize;
        }

        .vs-input {
          width: 100%; background: var(--surface); border: 1px solid var(--line);
          border-radius: 8px; font-size: 13px; color: var(--ink);
          outline: none; transition: all 0.2s ease;
        }
        .vs-input:focus { border-color: var(--muted-3); box-shadow: 0 0 0 1px var(--muted-3); }
        .vs-input::placeholder { color: var(--muted-3); }

        .vs-btn {
          display:inline-flex; align-items:center; justify-content:center; gap:6px;
          font-size: 13px; font-weight: 500; padding: 8px 16px; border-radius: 8px;
          transition: all .2s ease; cursor: pointer;
        }
        .vs-btn--danger {
          color: #fff; background: var(--danger); border: 1px solid var(--danger);
        }
        .vs-btn--danger:hover { filter: brightness(0.9); transform: translateY(-0.5px); }

        .vs-checkbox {
          width: 16px; height: 16px; cursor: pointer;
          accent-color: var(--brand); border-radius: 4px;
        }
      `}</style>

      <div className="w-full px-8 space-y-6 pb-12">
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-lg bg-[var(--bg-2)] border border-[var(--line)] flex items-center justify-center">
                <Users className="w-4 h-4 text-[var(--ink)]" />
              </div>
              <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-[var(--ink)]">Pelanggan</h1>
            </div>
            <p className="text-[14px] text-[var(--muted)] ml-11">Pantau seluruh pelanggan dan kelola risiko churn mereka.</p>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {selectedIds.length > 0 && (
              <Button 
                variant="destructive"
                onClick={handleBulkDelete}
                className="shrink-0 animate-[vsReveal_0.2s_ease] gap-2"
              >
                <Trash2 className="w-4 h-4" /> Hapus ({selectedIds.length})
              </Button>
            )}

            <div className="relative w-full sm:w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                type="text" 
                placeholder="Cari nama atau ID..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-[var(--surface)]"
              />
            </div>
          </div>
        </div>

        <div className="vs-card overflow-hidden flex flex-col min-h-[400px]">
          {loading ? (
            <div className="flex flex-1 items-center justify-center p-10">
              <div className="w-6 h-6 border-2 border-[var(--brand)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="flex flex-col flex-1 items-center justify-center py-20 text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--bg-2)] flex items-center justify-center mb-3">
                <Search className="w-5 h-5 text-[var(--muted-3)]" />
              </div>
              <div className="text-[14px] font-medium text-[var(--ink)] mb-1">Tidak ada pelanggan</div>
              <div className="text-[12px] text-[var(--muted)] max-w-[250px]">
                {search ? 'Tidak ada yang cocok dengan pencarianmu.' : 'Belum ada data pelanggan yang terdaftar.'}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--bg-2)] border-b border-[var(--line)]">
                    <th className="px-5 py-3.5 w-10 text-center">
                      <input 
                        type="checkbox" 
                        className="vs-checkbox"
                        checked={selectedIds.length > 0 && selectedIds.length === filteredCustomers.length}
                        onChange={toggleSelectAll}
                        title="Pilih Semua"
                      />
                    </th>
                    {['Pelanggan', 'Paket Langganan', 'Churn Score', 'Risk Level', 'Ditugaskan Ke', 'Aksi'].map(h => (
                      <th key={h} className="px-3 py-3.5 text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line-soft)] bg-[var(--surface)]">
                  {filteredCustomers.map(c => {
                    const isSelected = selectedIds.includes(c.id);
                    return (
                      <tr 
                        key={c.id} 
                        onClick={() => router.push(`/dashboard/admin/customer/${c.id}`)}
                        className={`transition-colors group cursor-pointer ${isSelected ? 'bg-indigo-50/50' : 'hover:bg-[var(--bg)]'}`}
                      >
                        <td className="px-5 py-3.5 w-10 text-center">
                          <input 
                            type="checkbox" 
                            className="vs-checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleSelectOne(c.id);
                            }}
                          />
                        </td>
                        <td className="px-3 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[var(--bg-2)] border border-[var(--line)] flex items-center justify-center text-[11px] font-semibold text-[var(--muted)] uppercase">
                              {c.company_name?.substring(0, 2) || '??'}
                            </div>
                            <div>
                              <div className="text-[13px] font-semibold text-[var(--ink)] group-hover:text-[var(--brand)] transition-colors">{c.company_name}</div>
                              <div className="text-[11px] text-[var(--muted-3)] mono mt-0.5">{c.customer_id}</div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-3 py-3.5">
                          <span className="text-[13px] text-[var(--muted)]">{c.plan_type}</span>
                        </td>
                        
                        <td className="px-3 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className={`text-[13px] font-bold tabular-nums ${c.churn_score > 70 ? 'text-[var(--danger)]' : c.churn_score > 40 ? 'text-[var(--warn)]' : 'text-[var(--success)]'}`}>
                              {c.churn_score}
                            </span>
                            {c.churn_score > 70 && <AlertTriangle className="w-3.5 h-3.5 text-[var(--danger)]" />}
                          </div>
                        </td>
                        
                        <td className="px-3 py-3.5">
                          <span className={`vs-tag ${
                            c.risk_level === 'Tinggi' ? 'bg-red-50 text-red-600 border-red-100' : 
                            c.risk_level === 'Sedang' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                            'bg-emerald-50 text-emerald-600 border-emerald-100'
                          }`}>
                            {c.risk_level}
                          </span>
                        </td>

                        <td className="px-3 py-3.5 text-[13px] text-[var(--muted)]">
                          {c.staff?.full_name ? (
                             <div className="flex items-center gap-2">
                               <div className="w-2 h-2 rounded-full bg-[var(--brand)]" />
                               {c.staff.full_name}
                             </div>
                          ) : (
                            <span className="text-[var(--muted-3)] italic">Belum di-assign</span>
                          )}
                        </td>
                        
                        <td className="px-3 py-3.5">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSingle(c.id, c.company_name);
                            }} 
                            className="p-1.5 rounded-md hover:bg-red-50 text-[var(--muted-3)] hover:text-[var(--danger)] transition-colors" 
                            title="Hapus Pelanggan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ToastContainer toasts={toasts} onRemove={remove} />
    </div>
  );
}