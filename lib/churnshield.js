import { supabase } from '@/lib/supabase';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://basic-8.alstore.space:23998';

async function req(path, opts = {}) {
  const { headers: extraHeaders, ...restOpts } = opts;
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
    ...restOpts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || err.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const getStatistik = () => req('/statistik');

export const getPelanggan = (params = {}) => {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v != null && v !== '')
  );
  const qs = new URLSearchParams(clean).toString();
  return req(`/pelanggan${qs ? '?' + qs : ''}`);
};

export const reloadModel = () => req('/reload', { method: 'POST' });

export const getPelangganById = (id) => req(`/pelanggan/${id}`);
export const getRekomendasi = (id, lang = 'id') => req(`/rekomendasi/${id}?lang=${lang}`, { method: 'POST' });
export const getAnalisis = (id, lang = 'id') => req(`/analisis/${id}?lang=${lang}`, { method: 'POST' });

export const predictBatch = (formData) =>
  fetch(`${BASE}/predict-batch`, { method: 'POST', body: formData }).then(async (res) => {
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || 'Upload gagal');
    }
    return res.json();
  });

export const sendChat = (message, customer_id = null, session_id = null, lang = 'id') =>
  req('/chat', {
    method: 'POST',
    body: JSON.stringify({
      message,
      ...(customer_id ? { customer_id } : {}),
      ...(session_id ? { session_id } : {}),
      lang,
    }),
  });

export const getChatHistory = (session_id) => req(`/chat/session/${session_id}`);
export const clearChatSession = (session_id) => req(`/chat/session/${session_id}`, { method: 'DELETE' });

export const startRetensi = () => req('/retensi-otomatis/start', { method: 'POST' });
export const getRetensiStatus = () => req('/retensi-otomatis/status');
export const getRetensiHasil = () => req('/retensi-otomatis/hasil');

export async function getNotifikasi() {
  const { data, error } = await supabase
    .from('notifikasi')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function markNotifikasiRead(id) {
  const { error } = await supabase
    .from('notifikasi')
    .update({ is_read: true })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function addNotifikasi({ title, message, type = 'activity', customer_id = null, recipient_id = null }) {
  const res = await fetch('/api/notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, message, type, customer_id, recipient_id }),
  });
  const result = await res.json();
  if (!result.success) throw new Error(result.error);
}

export function riskLevel(score) {
  if (score >= 70) return 'High';
  if (score >= 30) return 'Medium';
  return 'Low';
}

export const RISK_LABEL = { High: 'Tinggi', Medium: 'Sedang', Low: 'Rendah' };
export const RISK_COLOR = {
  High: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', dot: 'bg-red-500' },
  Medium: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', dot: 'bg-amber-500' },
  Low: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', dot: 'bg-emerald-500' },
};
