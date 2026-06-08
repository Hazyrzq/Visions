'use client';

import { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, X, Send, Bot, Sparkles,
  RefreshCw, ThumbsUp, ThumbsDown, Copy, Check, Minimize2,
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useLang } from '@/lib/i18n/LanguageContext';
import { supabase } from '@/lib/supabase';
import { sendChat } from '@/lib/churnshield';

// ── helpers ───────────────────────────────────────────────────────────
function formatTime(iso, lang = 'id') {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString(lang === 'en' ? 'en-US' : 'id-ID', { hour: '2-digit', minute: '2-digit' });
}

// ── Bot text renderer (newline + **bold**) ────────────────────────────
function BotText({ text }) {
  return (
    <span>
      {text.split('\n').map((line, i, arr) => {
        const parts = line.split(/\*\*(.+?)\*\*/g);
        return (
          <span key={i}>
            {parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
            {i < arr.length - 1 && <br />}
          </span>
        );
      })}
    </span>
  );
}

// ── Bot avatar ────────────────────────────────────────────────────────
function BotAvatar({ size = 36 }) {
  return (
    <div className="flex shrink-0 items-center justify-center rounded-2xl bg-blue-600 shadow-sm shadow-blue-600/30"
      style={{ width: size, height: size }}>
      <Bot style={{ width: size * 0.48, height: size * 0.48, color: '#fff' }} />
    </div>
  );
}

// ── Typing indicator ──────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-0.5">
      <span className="vs-dot h-2 w-2 rounded-full bg-slate-300" />
      <span className="vs-dot h-2 w-2 rounded-full bg-slate-300" />
      <span className="vs-dot h-2 w-2 rounded-full bg-slate-300" />
    </div>
  );
}

// ── Quick suggestion chips (bilingual) ───────────────────────────────
function getBotSuggestions(lang) {
  if (lang === 'en') return [
    { icon: '📊', label: 'High risk',       text: 'Show customers with high churn risk right now.' },
    { icon: '⚠️', label: 'Churned',         text: 'Show list of customers who have already churned.' },
    { icon: '🚨', label: 'Unassigned',      text: 'Show unassigned customers with highest risk.' },
    { icon: '👥', label: 'Staff workload',  text: 'Show current staff workload distribution.' },
    { icon: '📈', label: 'Data summary',    text: 'Show customer statistics summary.' },
    { icon: '👤', label: 'My customers',    text: 'Show customers assigned to me.' },
  ];
  return [
    { icon: '📊', label: 'Risiko tinggi',    text: 'Tampilkan pelanggan dengan risiko tinggi saat ini.' },
    { icon: '⚠️', label: 'Pelanggan churn', text: 'Tampilkan daftar pelanggan yang sudah churn.' },
    { icon: '🚨', label: 'Belum di-assign',  text: 'Tampilkan pelanggan belum di-assign yang paling berisiko.' },
    { icon: '👥', label: 'Beban staf',       text: 'Tampilkan beban kerja staf saat ini.' },
    { icon: '📈', label: 'Ringkasan data',   text: 'Tampilkan statistik ringkasan pelanggan.' },
    { icon: '👤', label: 'Pelanggan saya',   text: 'Tampilkan pelanggan yang ditugaskan ke saya.' },
  ];
}

// ── Local intent resolver ─────────────────────────────────────────────
// Mengganti parameter `lang` menjadi `t` untuk i18n
async function resolveIntent(message, profile, t) {
  const m = message.toLowerCase();

  if (m.match(/risiko.*(tinggi|high)|high.?risk|churn.*tertinggi|paling.*risiko|berisiko/)) {
    const { data } = await supabase.from('customers').select('customer_id,company_name,churn_score,plan_type,assigned_to')
      .eq('risk_level', 'Tinggi').order('churn_score', { ascending: false }).limit(10);
    if (!data?.length) return t('intent.noHighRisk');
    
    const lines = data.map((c, i) =>
      `${i+1}. **${c.company_name}** (${c.customer_id})\n   Score: ${c.churn_score}% | ${c.plan_type ?? '-'}${!c.assigned_to ? ` ${t('intent.unassignedLabel')}` : ''}`
    ).join('\n\n');
    
    return `${t('intent.highRiskHeader', { count: data.length })}\n\n${lines}\n\n${t('intent.highRiskFooter')}`;
  }

  if (m.match(/sudah.*churn|yang.*churn|pelanggan.*churn|churn.*aktual|daftar.*churn/)) {
    const { data } = await supabase.from('customers').select('customer_id,company_name,churn_score,plan_type')
      .eq('churn_actual', true).order('churn_score', { ascending: false }).limit(10);
    if (!data?.length) return t('intent.noChurned');
    
    const lines = data.map((c, i) =>
      `${i+1}. **${c.company_name}** (${c.customer_id}) — ${c.churn_score}% | ${c.plan_type ?? '-'}`
    ).join('\n');
    
    return `${t('intent.churnedHeader', { count: data.length })}\n\n${lines}`;
  }

  if (m.match(/belum.*assign|unassigned|belum.*ditugaskan|tidak.*assign/)) {
    const { data } = await supabase.from('customers').select('customer_id,company_name,churn_score,risk_level')
      .is('assigned_to', null).order('churn_score', { ascending: false }).limit(10);
    if (!data?.length) return t('intent.noUnassigned');
    
    const lines = data.map((c, i) =>
      `${i+1}. **${c.company_name}** (${c.customer_id}) — ${c.churn_score ?? '-'}% | ${c.risk_level ?? '-'}`
    ).join('\n');
    
    return `${t('intent.unassignedHeader', { count: data.length })}\n\n${lines}\n\n${t('intent.unassignedFooter')}`;
  }

  if (m.match(/beban.*(staf|kerja)|workload|distribusi.*staf|performa.*staf/)) {
    const { data: staffData } = await supabase.from('profiles').select('id,full_name').eq('role', 'staff');
    const { data: custData }  = await supabase.from('customers').select('assigned_to').not('assigned_to', 'is', null);
    if (!staffData?.length) return t('intent.noStaffData');
    
    const loads = staffData.map(s => ({
      name: s.full_name,
      count: custData?.filter(c => c.assigned_to === s.id).length ?? 0,
    })).sort((a, b) => b.count - a.count);
    
    const lines = loads.map((s, i) =>
      `${i+1}. **${s.name}**: ${s.count} ${t('intent.customers')}${s.count > 5 ? ` ${t('intent.overloaded')}` : ' ✅'}`
    ).join('\n');
    
    return `${t('intent.staffWorkloadHeader')}\n\n${lines}\n\n${t('intent.staffWorkloadFooter')}`;
  }

  if (m.match(/statistik|ringkasan|overview|summary|total pelanggan|berapa pelanggan/)) {
    const [{ count: total }, { count: high }, { count: churned }, { count: unassigned }] = await Promise.all([
      supabase.from('customers').select('*', { count: 'exact', head: true }),
      supabase.from('customers').select('*', { count: 'exact', head: true }).in('risk_level', ['Tinggi', 'High']),
      supabase.from('customers').select('*', { count: 'exact', head: true }).eq('churn_actual', true),
      supabase.from('customers').select('*', { count: 'exact', head: true }).is('assigned_to', null),
    ]);
    return t('intent.summaryHeader', { total: total ?? 0, high: high ?? 0, churned: churned ?? 0, unassigned: unassigned ?? 0 });
  }

  if (m.match(/pelanggan saya|my customer|ditugaskan ke saya/) && profile?.id) {
    const { data } = await supabase.from('customers').select('customer_id,company_name,churn_score,risk_level')
      .eq('assigned_to', profile.id).order('churn_score', { ascending: false }).limit(10);
    if (!data?.length) return t('intent.noMyCustomers');
    
    const lines = data.map((c, i) =>
      `${i+1}. **${c.company_name}** (${c.customer_id}) — ${c.churn_score ?? '-'}% | ${c.risk_level ?? '-'}`
    ).join('\n');
    
    return `${t('intent.myCustomersHeader', { count: data.length })}\n\n${lines}`;
  }

  if (m.match(/prioritas|mendesak|segera|urgen|kritis/)) {
    const { data } = await supabase.from('customers').select('customer_id,company_name,churn_score,plan_type')
      .eq('risk_level', 'Tinggi').is('assigned_to', null).order('churn_score', { ascending: false }).limit(5);
    if (!data?.length) return t('intent.noCritical');
    
    const lines = data.map((c, i) =>
      `${i+1}. **${c.company_name}** — ${c.churn_score}% risk (${c.plan_type ?? '-'})`
    ).join('\n');
    
    return `${t('intent.criticalHeader', { count: data.length })}\n\n${lines}\n\n${t('intent.criticalFooter')}`;
  }

  return null;
}

function extractCustomerId(message) {
  const match = message.toUpperCase().match(/\bC[-\s]?(\d{1,4})\b/);
  return match ? `C-${match[1].padStart(4, '0')}` : null;
}

async function callChatbotAPI(userMessage, customerId = null) {
  const res = await sendChat(userMessage, customerId);
  const raw = res?.reply ?? res?.message ?? res?.response ?? res?.answer
    ?? res?.text ?? res?.content ?? res?.output ?? res?.result
    ?? (res && typeof res === 'object' ? Object.values(res).find(v => typeof v === 'string' && v.trim()) : null);
  if (!raw) return { text: 'Maaf, asisten tidak memberikan respons yang valid.', suggestions: [] };
  return { text: raw.trim(), suggestions: [] };
}

// Tambahkan konstanta default suggestions di luar fungsi
const defaultSuggestions = {
  id: ["Risiko tinggi", "Pelanggan churn", "Belum di-assign", "Beban staf", "Ringkasan data", "Pelanggan saya"],
  en: ["High risk", "Churned customers", "Unassigned", "Staff workload", "Data summary", "My customers"]
};

// Fungsi helper untuk mengambil 3 suggestion awal secara acak
const getDefaultSuggestions = (lang) => {
  const defaults = defaultSuggestions[lang === 'en' ? 'en' : 'id'];
  // Mengacak urutan agar terlihat dinamis, lalu ambil 3 teratas
  return defaults.sort(() => 0.5 - Math.random()).slice(0, 3);
};

// fetchSuggestions diperbarui dengan parameter lang dan prompt anti-halusinasi
async function fetchSuggestions(topic, langCode, fallbackSuggestions) {
  try {
    // Prompt dibuat spesifik bahasanya secara keseluruhan agar AI tidak bingung
    const prompt = langCode === 'en'
      ? `Provide exactly 3 short follow-up questions in English about this topic: "${topic}".
      If the topic is random typing, meaningless, or irrelevant to business/dashboard data, reply ONLY with the exact word "IRRELEVANT" and nothing else.
      If relevant, output ONLY the questions, one per line. STRICTLY NO numbers, NO bullet points, and NO introductory conversational text like "Here are" or "Sure".`
      : `Berikan tepat 3 pertanyaan follow-up singkat dalam Bahasa Indonesia tentang topik berikut: "${topic}".
      Jika topik tersebut berupa ketikan acak, tidak bermakna, atau tidak relevan dengan data, balas HANYA dengan kata "IRRELEVANT" tanpa tambahan apapun.
      Jika relevan, tulis HANYA pertanyaannya saja, satu per baris. TANPA nomor, TANPA bullet, dan TANPA basa-basi pengantar seperti "Oke, berikut adalah" atau "Tentu".`;

    const res = await sendChat(prompt, null);
    const raw = res?.reply ?? res?.message ?? res?.response ?? res?.answer
      ?? res?.text ?? res?.content ?? res?.output ?? res?.result
      ?? (res && typeof res === 'object' ? Object.values(res).find(v => typeof v === 'string' && v.trim()) : null);

    // Deteksi jika AI menganggapnya tidak relevan
    if (!raw || raw.includes("IRRELEVANT")) {
      return fallbackSuggestions.sort(() => 0.5 - Math.random()).slice(0, 3);
    }

    // Ekstraksi teks dan filter ketat untuk membuang basa-basi yang masih lolos
    const parsed = raw.split(/[\n|]/)
      .map(s => s.replace(/^\d+[\.\)]\s*/, '').replace(/^[-\*]\s*/, '').replace(/^"|"$/g, '').trim())
      .filter(s => s.length >= 5 && s.length <= 120)
      .filter(s => !/pertanyaan|follow-up|berikut|here are|sure|tentu|oke|baiklah/i.test(s)) // Pembuang basa-basi otomatis
      .slice(0, 3);

    return parsed.length > 0 ? parsed : fallbackSuggestions.sort(() => 0.5 - Math.random()).slice(0, 3);
  } catch {
    return fallbackSuggestions.sort(() => 0.5 - Math.random()).slice(0, 3);
  }
}

// ── Deteksi bahasa dari teks pesan ───────────────────────────────────
// Sederhana: cek keberadaan kata umum Bahasa Inggris
function detectMsgLang(text) {
  const t = text.toLowerCase();
  const enWords = ['show', 'list', 'display', 'what', 'which', 'how', 'who', 'give', 'tell',
    'customers', 'staff', 'risk', 'churn', 'assign', 'high', 'medium', 'low', 'my', 'all'];
  const enCount = enWords.filter(w => t.includes(w)).length;
  return enCount >= 2 ? 'en' : 'id';
}

// ════════════════════════════════════════════════════════════════════
export default function FloatingChat() {
  const { profile } = useAuth();
  const { t, lang } = useLang();
  const [isOpen, setIsOpen]       = useState(false);
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [isTyping, setIsTyping]   = useState(false);
  const [copied, setCopied]       = useState(null);
  const [dataContext, setDataContext] = useState('');

  const endRef   = useRef(null);
  const inputRef = useRef(null);

  // pre-fetch Supabase context
  useEffect(() => {
    if (!profile) return;
    (async () => {
      try {
        const [{ data: customers }, { data: staff }, { data: activities }] = await Promise.all([
          supabase.from('customers').select('customer_id,company_name,churn_score,risk_level,plan_type,assigned_to,churn_actual'),
          supabase.from('profiles').select('id,full_name,role').eq('role', 'staff'),
          supabase.from('activities').select('staff_id,created_at')
            .gte('created_at', new Date(Date.now() - 30*24*60*60*1000).toISOString()),
        ]);
        if (!customers) return;
        const highRisk   = customers.filter(c => c.risk_level === 'Tinggi' || c.risk_level === 'High');
        const unassigned = customers.filter(c => !c.assigned_to);
        const staffLoads = (staff ?? []).map(s => ({
          name: s.full_name,
          customers:  customers.filter(c => c.assigned_to === s.id).length,
          activities: (activities ?? []).filter(a => a.staff_id === s.id).length,
        }));
        setDataContext(
          `[KONTEKS DATA CHURNSHIELD — ${new Date().toLocaleDateString('id-ID')}]\n` +
          `Pengguna: ${profile.full_name} (${profile.role})\n\n` +
          `RINGKASAN:\n- Total: ${customers.length} | Risiko Tinggi: ${highRisk.length} | Belum Di-assign: ${unassigned.length}\n\n` +
          `TOP 10 RISIKO TERTINGGI:\n` +
          highRisk.slice(0, 10).map((c, i) =>
            `${i+1}. ${c.company_name} (${c.customer_id}) — ${c.churn_score}%, ${c.assigned_to ? 'Assigned' : '⚠️ Unassigned'}`
          ).join('\n') + '\n\n' +
          `BEBAN STAF:\n` + staffLoads.map(s => `- ${s.name}: ${s.customers} pelanggan`).join('\n') + '\n\n' +
          `${lang === 'en' ? 'Answer in English based on the data above.' : 'Jawab dalam Bahasa Indonesia berdasarkan data di atas.'}`
        );
      } catch { /* silent */ }
    })();
  }, [profile, lang]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 80);
  }, [isOpen]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const addBotMsg = (text, suggestions = []) =>
    setMessages(prev => [...prev, {
      id: Date.now() + Math.random(), role: 'bot', text, suggestions,
      ts: new Date().toISOString(), feedback: null,
    }]);

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: trimmed, ts: new Date().toISOString() }]);
    setInput('');
    setIsTyping(true);

    // Buat ID unik untuk pesan bot sebelum ditambah, agar appendSuggestions
    // tetap mengupdate pesan yang benar meskipun user sudah kirim pesan baru
    const botMsgId = Date.now() + Math.random();

    const addBotMsgWithId = (text) => {
      setMessages(prev => [...prev, {
        id: botMsgId, role: 'bot', text, suggestions: [],
        ts: new Date().toISOString(), feedback: null,
      }]);
    };

    // Mengambil langsung `lang` dari LanguageContext, bukan bahasa teks ketikan
    const rawFallback = t('chatBot.defaultSuggestions');
    const fallbackSugg = Array.isArray(rawFallback) 
      ? [...rawFallback] 
      : (lang === 'en' ? ["High risk", "Churned customers", "Unassigned"] : ["Risiko tinggi", "Pelanggan churn", "Belum di-assign"]);

    // 1. Tambahkan parameter botText untuk menganalisis balasan bot
      const appendSuggestions = (topic, botText = "") => {
      // Perluas deteksi regex untuk mencakup bahasa Inggris
      const isRefusal = /maaf|sorry|apologize|tidak (menyebutkan|tersedia|relevan|tahu|ada informasi|menemukan)|cannot find|no information|don't have/i.test(botText);

      // Jika bot menolak menjawab, kirim 6 array of objects dari getBotSuggestions
      if (isRefusal) {
        setMessages(prev =>
          prev.map(m =>
            m.id === botMsgId && (!m.suggestions || !m.suggestions.length)
              ? { ...m, suggestions: getBotSuggestions(lang) }
              : m
          )
        );
        return; 
      }

      // Jika butuh fallback untuk AI (hanya ambil teksnya saja)
      const stringFallback = getBotSuggestions(lang).map(s => s.text);
      
      fetchSuggestions(topic, lang, stringFallback).then(saran => {
        if (!saran || !saran.length) return;
        setMessages(prev =>
          prev.map(m =>
            m.id === botMsgId && (!m.suggestions || !m.suggestions.length)
              ? { ...m, suggestions: saran }
              : m
          )
        );
      }).catch(() => {});
    };

    try {
      const msgLang = detectMsgLang(trimmed);
      const local = await resolveIntent(trimmed, profile, t);
      
      if (local) {
        addBotMsgWithId(local);
        appendSuggestions(trimmed, local); 
      } else {
        const cid = extractCustomerId(trimmed);
        
        // PAKSA chatbot untuk mengikuti bahasa UI yang sedang aktif
        const langInstruction = lang === 'en' ? 'IMPORTANT: You MUST answer in English.' : 'PENTING: Jawab dalam Bahasa Indonesia.';
        const msgCtx = cid 
          ? `${langInstruction}\n\n${trimmed}` 
          : (dataContext ? `${dataContext}\n\n${langInstruction}\nUser Input: ${trimmed}` : `${langInstruction}\n\n${trimmed}`);
        
        const result = await callChatbotAPI(msgCtx, cid);
        const botText = typeof result === 'object' ? result.text : (result ?? '');
        
        addBotMsgWithId(botText);
        appendSuggestions(trimmed, botText); 
      }
    } catch {
      setMessages(prev => [...prev, {
        id: botMsgId, role: 'bot',
        text: t('chatBot.errorMessage') || 'Error',
        suggestions: [], ts: new Date().toISOString(), feedback: null,
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFeedback = (id, val) =>
    setMessages(prev => prev.map(m => m.id === id ? { ...m, feedback: val } : m));

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 1800);
    });
  };

  if (!profile) return null;

  const isEmpty = messages.length === 0;

  return (
    <>
      <style>{`
        @keyframes chatReveal {
          from { opacity:0; transform:translateY(16px) scale(0.96); transform-origin:bottom right; }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes msgIn {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes bounce3 {
          0%,60%,100% { transform:translateY(0); }
          30%          { transform:translateY(-5px); }
        }
        @keyframes fabPulse {
          0%,100% { box-shadow: 0 8px 24px rgba(37,99,235,0.35), 0 0 0 0 rgba(37,99,235,0.2); }
          50%     { box-shadow: 0 8px 24px rgba(37,99,235,0.35), 0 0 0 8px rgba(37,99,235,0); }
        }
        .vs-chat-box  { animation: chatReveal 0.28s cubic-bezier(0.34,1.56,0.64,1); }
        .vs-msg-in    { animation: msgIn 0.2s ease; }
        .vs-dot       { animation: bounce3 1.3s infinite; }
        .vs-dot:nth-child(2) { animation-delay:.15s; }
        .vs-dot:nth-child(3) { animation-delay:.3s; }
        .vs-fab-pulse { animation: fabPulse 2.5s infinite; }
        .vs-scroll::-webkit-scrollbar { width:3px; }
        .vs-scroll::-webkit-scrollbar-thumb { background:#E2E8F0; border-radius:99px; }
      `}</style>

      {/* ── FAB ── */}
      <button
        onClick={() => setIsOpen(v => !v)}
        aria-label={lang === 'en' ? 'Open AI Assistant' : 'Buka AI Asisten'}
        className={`fixed bottom-6 right-6 z-[200] flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-200 hover:scale-105 active:scale-95 ${!isOpen ? 'vs-fab-pulse' : ''}`}
        style={{ background: '#2563EB', boxShadow: '0 8px 24px rgba(37,99,235,0.35)' }}
      >
        {isOpen
          ? <X className="h-5 w-5 text-white" />
          : <Bot className="h-6 w-6 text-white" />
        }
      </button>

      {/* ── Panel ── */}
      {isOpen && (
        <div
          className="vs-chat-box fixed bottom-[88px] right-6 z-[200] flex flex-col overflow-hidden bg-white"
          style={{
            width: 370, height: 580,
            borderRadius: 28,
            border: '1px solid rgba(15,23,42,0.08)',
            boxShadow: '0 24px 60px -8px rgba(15,23,42,0.22), 0 8px 24px -4px rgba(15,23,42,0.1)',
          }}
        >
          {/* ── Header ── */}
          <div className="flex shrink-0 items-center gap-3 border-b border-slate-100 bg-white px-5 py-4">
            <BotAvatar size={42} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-[15px] font-bold text-slate-900">{t('chatBot.title')}</p>
                <span className="flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-600">
                  <Sparkles className="h-2.5 w-2.5" /> AI
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <p className="text-[11px] font-medium text-slate-400">{t('chatBot.status')}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {!isEmpty && (
                <button
                  type="button"
                  onClick={() => setMessages([])}
                  title={t('chatBot.clearChat')}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* ── Messages ── */}
          <div className="vs-scroll flex-1 overflow-y-auto px-4 py-5" style={{ background: '#F7F9FF' }}>
            {isEmpty ? (
              /* Welcome state */
              <div className="flex flex-col items-center">
                <div className="mb-4 flex h-[68px] w-[68px] items-center justify-center rounded-[22px] bg-blue-600 shadow-xl shadow-blue-600/25">
                  <Bot className="h-9 w-9 text-white" />
                </div>
                <p className="text-[16px] font-bold text-slate-900">
                  {t('chatBot.welcomeTitle', { name: profile?.full_name?.split(' ')[0] ?? 'User' })}
                </p>
                <p className="mt-1.5 max-w-[230px] text-center text-[12px] leading-relaxed text-slate-500">
                  {t('chatBot.welcomeDesc')}
                </p>

                <div className="mt-6 w-full">
                  <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {t('chatBot.startHere')}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {getBotSuggestions(lang).map((s) => (
                      <button
                        key={s.label}
                        type="button"
                        onClick={() => sendMessage(s.text)}
                        className="flex flex-col items-start gap-2 rounded-2xl border border-slate-200 bg-white p-3.5 text-left shadow-sm transition-all hover:border-blue-300 hover:shadow-md active:scale-[0.97]"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-lg leading-none">{s.icon}</span>
                        <span className="text-[12px] font-semibold leading-tight text-slate-700">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Message list */
              <div className="space-y-5">
                {messages.map((msg) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div key={msg.id} className={`vs-msg-in flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                      {!isUser && (
                        <div className="mb-2 flex items-center gap-2">
                          <BotAvatar size={24} />
                          <span className="text-[11px] font-semibold text-slate-400">ChurnShield AI</span>
                        </div>
                      )}
                      <div className="max-w-[270px]">
                        <div
                          className="break-words px-4 py-3 text-[13px] leading-relaxed"
                          style={{
                            borderRadius: isUser ? '20px 20px 6px 20px' : '6px 20px 20px 20px',
                            background: isUser ? '#2563EB' : '#FFFFFF',
                            color: isUser ? '#fff' : '#1e293b',
                            border: isUser ? 'none' : '1px solid #E2E8F0',
                            boxShadow: isUser
                              ? '0 4px 14px rgba(37,99,235,0.28)'
                              : '0 2px 8px rgba(15,23,42,0.06)',
                          }}
                        >
                          {isUser ? msg.text : <BotText text={msg.text} />}
                        </div>

                        <div className={`mt-1 flex items-center gap-1.5 text-[10px] ${isUser ? 'justify-end pr-1' : 'pl-1'}`}>
                          <span className="text-slate-400">{formatTime(msg.ts, lang)}</span>
                        </div>

                        {/* Bot actions */}
                        {!isUser && (
                          <div className="mt-2 flex items-center gap-1 pl-1">
                            <button type="button" onClick={() => handleCopy(msg.text, msg.id)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white hover:text-blue-600 hover:shadow-sm"
                              title={t('chatBot.copy')}>
                              {copied === msg.id
                                ? <Check className="h-3.5 w-3.5 text-emerald-500" />
                                : <Copy className="h-3.5 w-3.5" />}
                            </button>
                            <button type="button" onClick={() => handleFeedback(msg.id, 'up')}
                              className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${msg.feedback === 'up' ? 'bg-emerald-100 text-emerald-600' : 'text-slate-400 hover:bg-white hover:text-emerald-600 hover:shadow-sm'}`}
                              title={t('chatBot.helpful')}>
                              <ThumbsUp className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" onClick={() => handleFeedback(msg.id, 'down')}
                              className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${msg.feedback === 'down' ? 'bg-red-100 text-red-500' : 'text-slate-400 hover:bg-white hover:text-red-500 hover:shadow-sm'}`}
                              title={t('chatBot.notHelpful')}>
                              <ThumbsDown className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Typing */}
                {isTyping && (
                  <div className="vs-msg-in flex items-start gap-2">
                    <BotAvatar size={24} />
                    <div className="rounded-[6px_20px_20px_20px] border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
                      <TypingDots />
                    </div>
                  </div>
                )}

                {/* Follow-up suggestions */}
                {!isTyping && messages.length > 0 && (() => {
                  const last = messages[messages.length - 1];
                  if (last?.role !== 'bot' || !last.suggestions?.length) return null;

                  // Cek apakah data suggestion berupa object (dari fallback 6 kotak) atau string (dari fetch AI)
                  const isObjectSugg = typeof last.suggestions[0] === 'object';

                  if (isObjectSugg) {
                    return (
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        {last.suggestions.map((s, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => sendMessage(s.text)}
                            className="flex flex-col items-start gap-2 rounded-2xl border border-slate-200 bg-white p-3.5 text-left shadow-sm transition-all hover:border-blue-300 hover:shadow-md active:scale-[0.97]"
                          >
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-lg leading-none">{s.icon}</span>
                            <span className="text-[12px] font-semibold leading-tight text-slate-700">{s.label}</span>
                          </button>
                        ))}
                      </div>
                    );
                  }

                  // Jika bentuk array string (dari hasil respon AI biasa)
                  return (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {last.suggestions.map((s, i) => (
                        <button key={i} type="button" onClick={() => sendMessage(s)}
                          className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm transition-all hover:border-blue-400 hover:text-blue-600 hover:shadow-md active:scale-95">
                          {s}
                        </button>
                      ))}
                    </div>
                  );
                })()}

                <div ref={endRef} />
              </div>
            )}
          </div>

          {/* ── Input ── */}
          <form
            onSubmit={e => { e.preventDefault(); sendMessage(input); }}
            className="shrink-0 border-t border-slate-100 bg-white px-4 py-4"
          >
            <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 transition-all focus-within:border-blue-300 focus-within:bg-white focus-within:shadow-sm">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={t('chatBot.placeholder')}
                disabled={isTyping}
                className="flex-1 bg-transparent text-[13px] text-slate-800 outline-none placeholder:text-slate-400 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-600/25 transition-all disabled:cursor-not-allowed disabled:opacity-40 hover:bg-blue-700 active:scale-95"
              >
                <Send className="h-3.5 w-3.5 translate-x-px" />
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-slate-400">
              {t('chatBot.disclaimer')}
            </p>
          </form>
        </div>
      )}
    </>
  );
}
