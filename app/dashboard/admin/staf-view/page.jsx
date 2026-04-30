'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, UserCheck, AlertTriangle, X, ShieldAlert } from 'lucide-react';
import { mockStaffPerformance, mockCustomers, mockProfiles } from '@/lib/mockData';
import { useToast, ToastContainer } from '@/components/ui/Toast';

// Catatan: Impor komponen UI custom di bawah dinonaktifkan sementara karena 
// UI-nya di-inline langsung agar presisi dengan design system yang baru.
// import Button from '@/components/ui/Button';
// import Modal from '@/components/ui/Modal';
// import RiskBadge from '@/components/dashboard/RiskBadge';

const performanceBadge = {
  'Sangat Baik': 'bg-emerald-50 text-emerald-600 border-emerald-100',
  'Baik':        'bg-[var(--bg-2)] text-[var(--muted)] border-[var(--line)]',
  'Cukup':       'bg-amber-50 text-amber-600 border-amber-100',
};

export default function AdminStafViewPage() {
  const { toasts, toast, remove } = useToast();
  const [assignModal, setAssignModal]       = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedStaff, setSelectedStaff]   = useState('');
  const [assigning, setAssigning]           = useState(false);

  const staffOnly  = mockProfiles.filter(p => p.role === 'staff' && p.is_active);
  const unassigned = mockCustomers.filter(c => !c.assigned_to && c.risk_level === 'Tinggi');

  const handleAssign = async () => {
    if (!selectedStaff) return;
    setAssigning(true);
    await new Promise(r => setTimeout(r, 800));
    const staffName = mockProfiles.find(p => p.id === selectedStaff)?.full_name;
    toast(`${selectedCustomer?.company_name ?? 'Pelanggan'} berhasil di-assign ke ${staffName}`, 'success');
    setAssignModal(false);
    setSelectedStaff('');
    setAssigning(false);
  };

  return (
    <div className="vs-root">
      {/* ─── CSS Global (Design System Visions) ─── */}
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
          border: 1px solid transparent;
        }
        
        /* Buttons */
        .vs-btn {
          display:inline-flex; align-items:center; justify-content:center; gap:6px;
          font-size: 13px; font-weight: 500;
          padding: 6px 12px; border-radius: 8px;
          transition: all .2s ease; cursor: pointer;
        }
        .vs-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .vs-btn--primary {
          color: #fff; background: var(--ink); border: 1px solid var(--ink);
        }
        .vs-btn--primary:hover:not(:disabled) { background: var(--ink-2); transform: translateY(-0.5px); }
        .vs-btn--ghost {
          color: var(--ink); background: var(--surface); border: 1px solid var(--line);
        }
        .vs-btn--ghost:hover:not(:disabled) { background: var(--bg-2); border-color: var(--line-2); }
        .vs-btn--danger {
          color: #fff; background: var(--danger); border: 1px solid var(--danger);
        }
        .vs-btn--danger:hover:not(:disabled) { filter: brightness(0.9); transform: translateY(-0.5px); }

        /* Form Controls */
        .vs-select {
          width: 100%; background: var(--surface); border: 1px solid var(--line);
          border-radius: 8px; font-size: 13px; color: var(--ink); padding: 8px 12px;
          outline: none; transition: all 0.2s ease; appearance: none;
        }
        .vs-select:focus { border-color: var(--muted-3); box-shadow: 0 0 0 1px var(--muted-3); }

        @keyframes vsReveal { from { opacity:0; transform: scale(0.96) translateY(8px); } to { opacity:1; transform: none; } }
      `}</style>

      <div className="max-w-[1200px] mx-auto space-y-6 pb-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-lg bg-[var(--bg-2)] border border-[var(--line)] flex items-center justify-center">
                <Users className="w-4 h-4 text-[var(--ink)]" />
              </div>
              <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-[var(--ink)]">Staff View</h1>
            </div>
            <p className="text-[14px] text-[var(--muted)] ml-11">Pantau beban kerja tim dan distribusikan penanganan pelanggan berisiko.</p>
          </div>
        </div>

        <div className="grid xl:grid-cols-3 gap-5">
          
          {/* ═══════════════════════ STAFF TABLE (2/3) ═══════════════════════ */}
          <div className="xl:col-span-2 vs-card overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-[var(--line)] bg-[var(--surface)] flex items-center justify-between">
              <h3 className="text-[14px] font-semibold text-[var(--ink)]">Tim Customer Success</h3>
              <span className="text-[12px] font-medium text-[var(--muted-2)]">{staffOnly.length} Anggota Aktif</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--bg-2)] border-b border-[var(--line)]">
                    {['Nama Staff', 'Beban Kerja', 'Selesai / Bln', 'Performa', 'Aksi'].map(h => (
                      <th key={h} className="px-5 py-3.5 text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line-soft)] bg-[var(--surface)]">
                  {mockStaffPerformance.map(s => (
                    <tr key={s.id} className="hover:bg-[var(--bg)] transition-colors group">
                      
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[var(--bg-2)] border border-[var(--line)] flex items-center justify-center text-[11px] font-semibold text-[var(--muted)] uppercase">
                            {s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <div className="text-[13px] font-medium text-[var(--ink)]">{s.name}</div>
                            <div className="text-[11px] text-[var(--muted-3)] mono mt-0.5">{s.assigned} assigned</div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-5 py-3.5 min-w-[140px]">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 rounded-full bg-[var(--line-soft)] overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ 
                                width: `${s.workload_pct}%`,
                                backgroundColor: s.workload_pct > 80 ? 'var(--danger)' : s.workload_pct > 60 ? 'var(--warn)' : 'var(--success)'
                              }}
                            />
                          </div>
                          <span className="text-[12px] font-semibold tabular-nums w-8 text-right" style={{
                            color: s.workload_pct > 80 ? 'var(--danger)' : s.workload_pct > 60 ? 'var(--warn)' : 'var(--muted)'
                          }}>
                            {s.workload_pct}%
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-5 py-3.5 text-[13px] font-semibold tabular-nums text-[var(--ink)]">
                        {s.resolved_month}
                      </td>
                      
                      <td className="px-5 py-3.5">
                        <span className={`vs-tag ${performanceBadge[s.performance]}`}>
                          {s.performance}
                        </span>
                      </td>
                      
                      <td className="px-5 py-3.5">
                        <button 
                          className="vs-btn vs-btn--ghost"
                          onClick={() => { setSelectedCustomer(null); setSelectedStaff(s.id); setAssignModal(true); }}
                        >
                          Assign
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ═══════════════════════ UNASSIGNED PANEL (1/3) ═══════════════════════ */}
          <div className="vs-card flex flex-col h-fit">
            <div className="px-5 py-4 border-b border-[var(--line)] bg-[var(--surface)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[var(--danger)]" />
                <h3 className="text-[14px] font-semibold text-[var(--ink)]">Belum Di-assign</h3>
              </div>
              <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-50 text-red-600 border border-red-100 rounded-md text-[11px] font-bold tabular-nums">
                {unassigned.length}
              </span>
            </div>
            
            <div className="p-4 space-y-3 bg-[var(--bg)] min-h-[300px]">
              {unassigned.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-10 h-10 rounded-full bg-[var(--line-soft)] flex items-center justify-center mb-3">
                    <UserCheck className="w-5 h-5 text-[var(--muted-3)]" />
                  </div>
                  <div className="text-[13px] font-medium text-[var(--muted)]">Semua pelanggan tertangani</div>
                  <div className="text-[11px] text-[var(--muted-3)] mt-1">Tidak ada pelanggan berisiko yang mengantre.</div>
                </div>
              ) : (
                unassigned.map(c => (
                  <div key={c.id} className="bg-[var(--surface)] border border-[var(--line-soft)] rounded-xl p-4 hover:border-[var(--line)] transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <div className="text-[13px] font-semibold text-[var(--ink)]">{c.company_name}</div>
                        <div className="text-[11px] text-[var(--muted-3)] mono mt-0.5">{c.customer_id} · {c.plan_type}</div>
                      </div>
                      <span className="vs-tag bg-red-50 text-red-600 border-red-100">Tinggi</span>
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[11px] font-medium text-[var(--muted)]">Churn Score</span>
                      <span className="text-[13px] font-bold text-[var(--danger)] tabular-nums">{c.churn_score}</span>
                    </div>
                    
                    <button 
                      className="vs-btn vs-btn--danger w-full py-[7px]"
                      onClick={() => { setSelectedCustomer(c); setSelectedStaff(''); setAssignModal(true); }}
                    >
                      Assign Sekarang
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ═══════════════════════ MODAL (INLINED) ═══════════════════════ */}
      {assignModal && (
        <div className="fixed inset-0 z-[99] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[var(--ink)]/40 backdrop-blur-sm" onClick={() => setAssignModal(false)} />
          
          <div className="vs-card relative w-full max-w-[400px] shadow-[var(--shadow-xl)] flex flex-col overflow-hidden" style={{ animation: 'vsReveal 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            
            <div className="px-5 py-4 border-b border-[var(--line)] flex items-center justify-between bg-[var(--surface)]">
              <h3 className="text-[15px] font-semibold text-[var(--ink)]">Assign Pelanggan ke Staff</h3>
              <button onClick={() => setAssignModal(false)} className="text-[var(--muted-3)] hover:text-[var(--ink)] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-5 bg-[var(--surface)]">
              {/* Info Pelanggan */}
              {selectedCustomer && (
                <div className="bg-[var(--bg-2)] border border-[var(--line-soft)] rounded-xl p-3.5">
                  <div className="text-[11px] font-medium text-[var(--muted-2)] uppercase tracking-wider mb-1">Target Pelanggan</div>
                  <div className="text-[13px] font-semibold text-[var(--ink)]">{selectedCustomer.company_name}</div>
                  <div className="text-[12px] text-[var(--muted)] mt-0.5 mono">{selectedCustomer.customer_id} · Score: <span className="text-[var(--danger)] font-bold">{selectedCustomer.churn_score}</span></div>
                </div>
              )}

              {/* Dropdown Staff */}
              <div>
                <label className="block text-[12px] font-semibold text-[var(--ink)] mb-2">Pilih Staff Penanggung Jawab</label>
                <div className="relative">
                  <select 
                    value={selectedStaff} 
                    onChange={e => setSelectedStaff(e.target.value)} 
                    className="vs-select"
                  >
                    <option value="" disabled>— Pilih anggota tim —</option>
                    {staffOnly.map(s => (
                      <option key={s.id} value={s.id}>{s.full_name}</option>
                    ))}
                  </select>
                  {/* Custom Arrow for Select */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted-3)]">
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-[var(--line)] bg-[var(--bg-2)] flex gap-3">
              <button className="vs-btn vs-btn--ghost flex-1 py-2" onClick={() => setAssignModal(false)}>
                Batal
              </button>
              <button 
                className="vs-btn vs-btn--primary flex-1 py-2" 
                disabled={!selectedStaff || assigning} 
                onClick={handleAssign}
              >
                {assigning ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : 'Konfirmasi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast System (Logic dipertahankan) */}
      <ToastContainer toasts={toasts} onRemove={remove} />
    </div>
  );
}