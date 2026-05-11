'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Building2, Mail, Phone, Clock, AlertTriangle, 
  CheckCircle2, Activity, Ticket, CreditCard, UserCircle, Users
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { mockCustomers } from '@/lib/mockData';
import ActivityModal from '@/components/customer/ActivityModal';

export default function CustomerDetailPage({ params }) {
  const router = useRouter();
  const [customer, setCustomer] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);

  const id = params?.id;

  useEffect(() => {
    if (id) {
      const fallbackData = mockCustomers.find(c => c.id === id) || mockCustomers[0];
      setCustomer(fallbackData);

      const savedActivities = localStorage.getItem(`activities_${id}`);
      if (savedActivities) {
        setActivities(JSON.parse(savedActivities));
      } else {
        setActivities([]);
      }

      setLoading(false);
    }
  }, [id]);

  const handleActivityAdded = (newActivity) => {
    const updatedActivities = [newActivity, ...activities];
    setActivities(updatedActivities);
    localStorage.setItem(`activities_${id}`, JSON.stringify(updatedActivities));
  };

  const getActivityIcon = (type) => {
    switch(type) {
      case 'Email': return <Mail className="w-4 h-4"/>;
      case 'Call': return <Phone className="w-4 h-4"/>;
      case 'Meeting': return <Users className="w-4 h-4"/>;
      case 'Ticket': return <Ticket className="w-4 h-4"/>;
      default: return <Activity className="w-4 h-4"/>;
    }
  };

  const getActivityColor = (type) => {
    switch(type) {
      case 'Email': return 'bg-blue-100 text-blue-600';
      case 'Call': return 'bg-emerald-100 text-emerald-600';
      case 'Meeting': return 'bg-purple-100 text-purple-600';
      case 'Ticket': return 'bg-amber-100 text-amber-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
  };

  if (loading) {
    return (
      <div className="w-full px-8 py-12 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!customer) return <div className="p-8">Pelanggan tidak ditemukan.</div>;

  return (
    <div className="w-full px-8 space-y-6 pb-12">
      
      <div className="flex flex-col gap-4">
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 text-[13px] font-medium text-gray-500 hover:text-gray-900 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4"/> Kembali ke Daftar Pelanggan
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-bold tracking-[-0.02em] text-gray-900 flex items-center gap-3">
              {customer.company_name}
              <span className={`text-[11px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider ${
                customer.risk_level === 'Tinggi' ? 'bg-red-100 text-red-700' : 
                customer.risk_level === 'Sedang' ? 'bg-amber-100 text-amber-700' : 
                'bg-emerald-100 text-emerald-700'
              }`}>
                Risiko {customer.risk_level}
              </span>
            </h1>
            <p className="text-sm text-gray-500 font-mono mt-1">ID: {customer.customer_id}</p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Mail className="w-4 h-4"/> Email Pelanggan
            </Button>
            <Button onClick={() => setIsActivityModalOpen(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
              <Activity className="w-4 h-4"/> Catat Aktivitas
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="space-y-6 lg:col-span-1">
          <Card className="p-5 border-gray-200 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-400"/> Informasi Perusahaan
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Paket Langganan</p>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  <CreditCard className="w-4 h-4 text-indigo-500"/> {customer.plan_type}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Ditugaskan Kepada (Staff)</p>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  <UserCircle className="w-4 h-4 text-gray-400"/> {customer.assigned_name || 'Belum di-assign'}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Terakhir Login</p>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  <Clock className="w-4 h-4 text-gray-400"/> {customer.days_since_login} hari yang lalu
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          
          <Card className="p-0 border-indigo-100 shadow-sm overflow-hidden bg-gradient-to-br from-indigo-50/50 to-white">
            <div className="border-b border-indigo-50 px-6 py-4 flex items-center justify-between bg-white/50">
              <h3 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600"/> AI Churn Prediction
              </h3>
              <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                Diperbarui hari ini
              </span>
            </div>
            
            <div className="p-6 flex flex-col md:flex-row gap-8 items-center">
              
              <div className="flex flex-col items-center justify-center shrink-0">
                <div className={`w-32 h-32 rounded-full flex flex-col items-center justify-center border-8 ${
                  customer.churn_score > 70 ? 'border-red-500 text-red-600' : 
                  customer.churn_score > 40 ? 'border-amber-400 text-amber-600' : 
                  'border-emerald-400 text-emerald-600'
                }`}>
                  <span className="text-4xl font-black tracking-tighter">{customer.churn_score}</span>
                  <span className="text-xs font-semibold uppercase tracking-widest mt-1 text-gray-400">Score</span>
                </div>
              </div>

              <div className="flex-1 w-full space-y-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Faktor Penentu Utama (Key Drivers)</h4>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    {customer.monthly_usage_hrs < 20 ? (
                      <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5"/>
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5"/>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Penggunaan Bulanan ({customer.monthly_usage_hrs} Jam)</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {customer.monthly_usage_hrs < 20 ? 'Penggunaan menurun drastis dalam 30 hari terakhir. Ini adalah indikator kuat risiko churn.' : 'Penggunaan aplikasi stabil dan sehat.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    {customer.open_tickets > 2 ? (
                      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5"/>
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5"/>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Tiket Dukungan Terbuka ({customer.open_tickets} Tiket)</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {customer.open_tickets > 2 ? 'Ada beberapa tiket komplain yang belum terselesaikan. Pelanggan mungkin merasa frustrasi.' : 'Tidak ada antrean keluhan pelanggan yang kritis.'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    {customer.nps_latest < 7 ? (
                      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5"/>
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5"/>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Skor NPS Terakhir ({customer.nps_latest}/10)</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {customer.nps_latest < 7 ? 'Pelanggan masuk kategori Detractor/Passive. Kurang puas dengan layanan.' : 'Pelanggan puas dan masuk kategori Promoter.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400"/> Riwayat Aktivitas & Follow-up
              </h3>
            </div>
            
            {activities.length === 0 ? (
               <div className="text-center py-10">
                 <p className="text-[13px] text-gray-500">Belum ada aktivitas tercatat untuk pelanggan ini.</p>
               </div>
            ) : (
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                {activities.map((act) => (
                  <div key={act.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 ${getActivityColor(act.activity_type)}`}>
                      {getActivityIcon(act.activity_type)}
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-gray-900 text-[13px]">{act.activity_type}</span>
                        <span className="text-[11px] font-medium text-gray-400">{formatDate(act.created_at)}</span>
                      </div>
                      <p className="text-[12px] text-gray-600 leading-relaxed whitespace-pre-wrap">{act.notes}</p>
                      {act.staff?.full_name && (
                         <div className="mt-3 pt-3 border-t border-gray-50 text-[10px] text-gray-400 font-medium">
                           Dicatat oleh: {act.staff.full_name}
                         </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

        </div>
      </div>

      <ActivityModal 
        isOpen={isActivityModalOpen} 
        onClose={() => setIsActivityModalOpen(false)} 
        customerId={customer.id}
        onActivityAdded={handleActivityAdded}
      />
    </div>
  );
}