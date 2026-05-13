'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare, X, Send, ChevronLeft, Search,
  Hash, Smile, ArrowDown, CornerUpLeft, XCircle, Eye,
  Bot, Sparkles, RefreshCw, ThumbsUp, ThumbsDown, Copy, Check
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { supabase } from '@/lib/supabase';

// ── Helpers ───────────────────────────────────────────────────────────
function initials(name) {
  if (!name) return '?';
  return name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase();
}
function formatTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}
function formatDay(iso) {
  if (!iso) return '';
  const d = new Date(iso), today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Hari ini';
  const y = new Date(today); y.setDate(today.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return 'Kemarin';
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

const AVATAR_COLORS = [
  ['#EFF6FF','#2563EB'],['#F0FDF4','#16A34A'],
  ['#FFF7ED','#EA580C'],['#FDF4FF','#9333EA'],['#FFF1F2','#E11D48'],
];
function Avatar({ name, size = 36, online }) {
  const idx = name ? name.charCodeAt(0) % AVATAR_COLORS.length : 0;
  const [bg, fg] = AVATAR_COLORS[idx];
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div className="flex items-center justify-center rounded-full font-bold select-none"
        style={{ width: size, height: size, background: bg, color: fg, fontSize: size * 0.3 }}>
        {initials(name)}
      </div>
      {online !== undefined && (
        <span className="absolute bottom-0 right-0 rounded-full border-2 border-white"
          style={{ width: size*0.28, height: size*0.28, background: online ? '#10B981' : '#CBD5E1' }} />
      )}
    </div>
  );
}

// ── Emoji Picker ──────────────────────────────────────────────────────
const EMOJIS = ['😊','😂','👍','❤️','🔥','🎉','👏','😍','🤔','😅','💯','🙏','😭','🫡','✅','🚀','💪','😎','🤝','⚡'];
function EmojiPicker({ onSelect, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [onClose]);
  return (
    <div ref={ref} className="absolute bottom-14 left-0 z-20 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl" style={{ width: 220 }}>
      <div className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Emoji</div>
      <div className="grid grid-cols-5 gap-0.5">
        {EMOJIS.map(e => (
          <button key={e} type="button" onClick={() => { onSelect(e); onClose(); }}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-lg transition-colors hover:bg-slate-100 active:scale-90">
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Reply helpers ─────────────────────────────────────────────────────
function parseMsg(text = '') {
  const match = text.match(/^\[REPLY:(.+?)\|(.+?)\]\n([\s\S]*)$/);
  if (!match) return { replyTo: null, replyQuote: null, body: text };
  return { replyTo: match[1], replyQuote: match[2], body: match[3] };
}
function buildReply(name, quote, msg) {
  const q = quote.length > 60 ? quote.slice(0, 60) + '...' : quote;
  return `[REPLY:${name}|${q}]\n${msg}`;
}

// ── Mention helpers ───────────────────────────────────────────────────
function MsgBody({ text, isMe, currentName }) {
  const parts = text.split(/(@\w[\w\s]*?)(?=\s|$|[^\w\s])/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('@')) {
          const isSelf = currentName && part.slice(1).toLowerCase() === currentName.split(' ')[0].toLowerCase();
          return (
            <span key={i}
              className="rounded px-1 font-bold"
              style={{
                background: isSelf
                  ? (isMe ? 'rgba(254,240,138,0.4)' : '#FEF08A')
                  : (isMe ? 'rgba(255,255,255,0.25)' : '#DBEAFE'),
                color: isSelf ? (isMe ? '#fef08a' : '#92400e') : (isMe ? '#bfdbfe' : '#1d4ed8'),
              }}>
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

// ── Mention Autocomplete ──────────────────────────────────────────────
function MentionList({ contacts, query, onSelect }) {
  const filtered = contacts.filter(c =>
    c.full_name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);
  if (!filtered.length) return null;
  return (
    <div className="absolute bottom-14 left-0 z-20 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
      <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 border-b border-slate-100">
        Mention anggota
      </div>
      {filtered.map(c => (
        <button key={c.id} type="button" onClick={() => onSelect(c)}
          className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-blue-50">
          <Avatar name={c.full_name} size={28} />
          <div>
            <p className="text-[12px] font-semibold text-slate-800">{c.full_name}</p>
            <p className="text-[10px] capitalize text-slate-400">{c.role}</p>
          </div>
          <span className="ml-auto text-[11px] font-mono text-blue-400">@{c.full_name.split(' ')[0]}</span>
        </button>
      ))}
    </div>
  );
}

// ── Seen Avatars (group) ──────────────────────────────────────────────
function SeenAvatars({ seenBy, contacts, limit = 3 }) {
  if (!seenBy?.length) return null;
  const shown = seenBy.slice(0, limit);
  const rest  = seenBy.length - limit;
  return (
    <div className="flex items-center gap-0.5 mt-0.5 justify-end">
      <Eye className="h-2.5 w-2.5 text-slate-400" />
      <div className="flex -space-x-1.5">
        {shown.map(uid => {
          const c = contacts.find(x => x.id === uid);
          const idx = c?.full_name ? c.full_name.charCodeAt(0) % AVATAR_COLORS.length : 0;
          const [bg, fg] = AVATAR_COLORS[idx];
          return (
            <div key={uid} title={c?.full_name ?? uid}
              className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-white text-[6px] font-bold"
              style={{ background: bg, color: fg }}>
              {initials(c?.full_name ?? '?')}
            </div>
          );
        })}
        {rest > 0 && (
          <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-white bg-slate-200 text-[6px] font-bold text-slate-500">
            +{rest}
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// ── CHATBOT ROOM ─────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════

const BOT_SUGGESTIONS = [
  { icon: '📊', label: 'Pelanggan berisiko tinggi', text: 'Tampilkan daftar pelanggan dengan risiko churn tertinggi saat ini.' },
  { icon: '🔍', label: 'Analisis churn score', text: 'Jelaskan faktor utama yang mempengaruhi churn score pelanggan.' },
  { icon: '💡', label: 'Rekomendasi retensi', text: 'Berikan rekomendasi terbaik untuk mencegah churn pelanggan Enterprise.' },
  { icon: '📈', label: 'Tren churn bulan ini', text: 'Bagaimana tren churn rate bulan ini dibandingkan bulan lalu?' },
  { icon: '👥', label: 'Distribusi beban staf', text: 'Siapa staf yang paling overload saat ini dan bagaimana cara meratakannya?' },
  { icon: '⚠️', label: 'Alert prioritas', text: 'Ada pelanggan mana saja yang butuh tindakan dalam 24 jam ke depan?' },
];

// Placeholder responses — nanti diganti dengan real API call
const BOT_PLACEHOLDER_RESPONSES = {
  default: 'Terima kasih atas pertanyaannya! Saat ini saya masih dalam tahap konfigurasi API. Fitur ini akan segera aktif. Silakan coba lagi nanti atau hubungi admin untuk informasi lebih lanjut.',
};

// Fungsi ini akan dipanggil ke API nanti
// TODO: Ganti dengan real API call ke endpoint chatbot
async function callChatbotAPI(userMessage, conversationHistory) {
  // PLACEHOLDER — return mock response
  // Ganti blok ini dengan fetch ke API Anda:
  //
  // const response = await fetch('/api/chatbot', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ message: userMessage, history: conversationHistory }),
  // });
  // const data = await response.json();
  // return data.reply;

  await new Promise(r => setTimeout(r, 1200 + Math.random() * 800)); // simulasi delay
  return BOT_PLACEHOLDER_RESPONSES.default;
}

function BotAvatar({ size = 32 }) {
  return (
    <div className="flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size, height: size,
        background: 'linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)',
        boxShadow: '0 2px 8px rgba(99,102,241,0.35)',
      }}>
      <Bot style={{ width: size * 0.5, height: size * 0.5, color: '#fff' }} />
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-3.5 py-3">
      <span className="vs-dot h-1.5 w-1.5 rounded-full bg-violet-400" />
      <span className="vs-dot h-1.5 w-1.5 rounded-full bg-violet-400" />
      <span className="vs-dot h-1.5 w-1.5 rounded-full bg-violet-400" />
    </div>
  );
}

function BotChatRoom({ onBack }) {
  const { profile } = useAuth();
  const [botMessages, setBotMessages] = useState([]); // { id, role: 'user'|'bot', text, ts, feedback }
  const [botInput, setBotInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copied, setCopied] = useState(null);
  const botEndRef = useRef(null);
  const botInputRef = useRef(null);

  // Scroll to bottom on new message
  useEffect(() => {
    botEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [botMessages, isTyping]);

  // Focus input on mount
  useEffect(() => {
    setTimeout(() => botInputRef.current?.focus(), 80);
  }, []);

  const addBotMessage = (text) => {
    setBotMessages(prev => [...prev, {
      id: Date.now() + Math.random(),
      role: 'bot',
      text,
      ts: new Date().toISOString(),
      feedback: null,
    }]);
  };

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    // Add user message
    const userMsg = { id: Date.now(), role: 'user', text: trimmed, ts: new Date().toISOString() };
    setBotMessages(prev => [...prev, userMsg]);
    setBotInput('');

    // Call API
    setIsTyping(true);
    try {
      const history = botMessages.map(m => ({ role: m.role, content: m.text }));
      const reply = await callChatbotAPI(trimmed, history);
      addBotMessage(reply);
    } catch {
      addBotMessage('Maaf, terjadi kesalahan saat menghubungi asisten. Silakan coba lagi.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(botInput);
  };

  const handleFeedback = (msgId, val) => {
    setBotMessages(prev => prev.map(m => m.id === msgId ? { ...m, feedback: val } : m));
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 1800);
    });
  };

  const handleClear = () => {
    setBotMessages([]);
  };

  const isEmpty = botMessages.length === 0;

  return (
    <>
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 px-3 py-3"
        style={{ background: 'linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)' }}>
        <button onClick={onBack}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/80 hover:bg-white/15 hover:text-white">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <BotAvatar size={36} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-[14px] font-bold leading-none text-white">ChurnShield AI</p>
            <span className="flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white/90">
              <Sparkles className="h-2.5 w-2.5" /> Beta
            </span>
          </div>
          <p className="mt-1 text-[11px]" style={{ color: '#c4b5fd' }}>
            Asisten cerdas untuk analisis churn
          </p>
        </div>
        {!isEmpty && (
          <button type="button" onClick={handleClear} title="Bersihkan chat"
            className="flex h-7 w-7 items-center justify-center rounded-full text-white/60 hover:bg-white/15 hover:text-white transition-colors">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Messages area */}
      <div className="vs-chat-scroll flex-1 overflow-y-auto px-3 py-3"
        style={{ background: 'linear-gradient(180deg,#faf5ff 0%,#ede9fe 100%)' }}>

        {/* Welcome / empty state */}
        {isEmpty ? (
          <div className="flex flex-col items-center pt-4 pb-2">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 8px 24px rgba(99,102,241,0.3)' }}>
              <Bot className="h-8 w-8 text-white" />
            </div>
            <p className="text-[14px] font-bold text-violet-900">Halo, {profile?.full_name?.split(' ')[0] ?? 'Pengguna'}! 👋</p>
            <p className="mt-1 max-w-[220px] text-center text-[12px] leading-relaxed text-violet-600">
              Saya siap membantu analisis churn, retensi pelanggan, dan performa tim Anda.
            </p>

            {/* Suggestion chips */}
            <div className="mt-5 w-full space-y-2">
              <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-wider text-violet-400">Coba tanyakan</p>
              {BOT_SUGGESTIONS.map((s) => (
                <button key={s.label} type="button"
                  onClick={() => sendMessage(s.text)}
                  className="flex w-full items-center gap-2.5 rounded-xl border border-violet-100 bg-white px-3 py-2.5 text-left text-[12px] font-medium text-slate-700 shadow-sm transition-all hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 active:scale-[0.98]">
                  <span className="text-base leading-none">{s.icon}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {botMessages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div key={msg.id}
                  className={`vs-msg-in flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  {!isUser && (
                    <div className="mb-1 flex items-center gap-1.5">
                      <BotAvatar size={20} />
                      <span className="text-[10px] font-bold text-violet-500">ChurnShield AI</span>
                    </div>
                  )}
                  <div className={`max-w-[240px] ${isUser ? '' : 'ml-0'}`}>
                    <div className="break-words px-3.5 py-2.5 text-[13px] leading-relaxed"
                      style={{
                        borderRadius: isUser ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                        background: isUser
                          ? 'linear-gradient(135deg,#4f46e5,#6d28d9)'
                          : '#FFFFFF',
                        color: isUser ? '#fff' : '#1e293b',
                        border: isUser ? 'none' : '1px solid #ede9fe',
                        boxShadow: isUser
                          ? '0 2px 8px rgba(79,70,229,0.3)'
                          : '0 1px 4px rgba(99,102,241,0.08)',
                      }}>
                      {msg.text}
                    </div>

                    {/* Timestamp */}
                    <div className={`mt-0.5 flex items-center gap-1 text-[10px] ${isUser ? 'justify-end pr-1' : 'pl-1'}`}>
                      <span className="text-slate-400">{formatTime(msg.ts)}</span>
                    </div>

                    {/* Bot message actions */}
                    {!isUser && (
                      <div className="mt-1.5 flex items-center gap-1 pl-1">
                        {/* Copy */}
                        <button type="button"
                          onClick={() => handleCopy(msg.text, msg.id)}
                          className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-violet-100 hover:text-violet-600"
                          title="Salin">
                          {copied === msg.id
                            ? <Check className="h-3 w-3 text-emerald-500" />
                            : <Copy className="h-3 w-3" />}
                        </button>
                        {/* Thumbs up */}
                        <button type="button"
                          onClick={() => handleFeedback(msg.id, 'up')}
                          className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors ${msg.feedback === 'up' ? 'bg-emerald-100 text-emerald-600' : 'text-slate-400 hover:bg-violet-100 hover:text-violet-600'}`}
                          title="Berguna">
                          <ThumbsUp className="h-3 w-3" />
                        </button>
                        {/* Thumbs down */}
                        <button type="button"
                          onClick={() => handleFeedback(msg.id, 'down')}
                          className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors ${msg.feedback === 'down' ? 'bg-red-100 text-red-500' : 'text-slate-400 hover:bg-violet-100 hover:text-violet-600'}`}
                          title="Tidak membantu">
                          <ThumbsDown className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {isTyping && (
              <div className="vs-msg-in flex items-start gap-1.5">
                <BotAvatar size={20} />
                <div className="rounded-2xl rounded-bl-sm border border-violet-100 bg-white shadow-sm">
                  <TypingDots />
                </div>
              </div>
            )}

            {/* Quick suggestion chips after bot replies */}
            {!isTyping && botMessages.length > 0 && botMessages[botMessages.length - 1]?.role === 'bot' && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {BOT_SUGGESTIONS.slice(0, 3).map((s) => (
                  <button key={s.label} type="button"
                    onClick={() => sendMessage(s.text)}
                    className="flex items-center gap-1 rounded-full border border-violet-100 bg-white px-2.5 py-1 text-[11px] font-medium text-violet-600 shadow-sm transition-all hover:border-violet-300 hover:bg-violet-50 active:scale-95">
                    <span>{s.icon}</span>
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            )}

            <div ref={botEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit}
        className="flex shrink-0 items-center gap-2 border-t border-violet-100 bg-white px-3 py-3">
        <input
          ref={botInputRef}
          type="text"
          value={botInput}
          onChange={e => setBotInput(e.target.value)}
          placeholder="Tanya sesuatu tentang churn..."
          disabled={isTyping}
          className="flex-1 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-[13px] text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100 disabled:opacity-60"
        />
        <button type="submit"
          disabled={!botInput.trim() || isTyping}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition-all disabled:cursor-not-allowed disabled:opacity-40 hover:opacity-90 active:scale-95"
          style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 2px 8px rgba(79,70,229,0.35)' }}>
          <Send className="h-4 w-4 translate-x-0.5" />
        </button>
      </form>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
export default function FloatingChat() {
  const { profile } = useAuth();
  const [isOpen, setIsOpen]           = useState(false);
  const [activeChat, setActiveChat]   = useState(null); // null | 'bot' | 'group' | userId
  const [messages, setMessages]       = useState([]);
  const [contacts, setContacts]       = useState([]);
  const [input, setInput]             = useState('');
  const [loading, setLoading]         = useState(true);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [search, setSearch]           = useState('');
  const [typingUsers, setTypingUsers] = useState({});
  const [replyTo, setReplyTo]         = useState(null);
  const [showEmoji, setShowEmoji]     = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [mentionQuery, setMentionQuery]   = useState(null);
  const [seenMap, setSeenMap]         = useState({});

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const scrollAreaRef  = useRef(null);
  const broadcastRef   = useRef(null);
  const typingTimer    = useRef(null);
  const lastSeenBroadcast = useRef(null);

  // ── scroll ──────────────────────────────────────────────────────────
  const scrollToBottom = (smooth = true) =>
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' });

  const handleScroll = () => {
    const el = scrollAreaRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 120);
  };

  useEffect(() => {
    if (isOpen && activeChat && activeChat !== 'bot') {
      scrollToBottom(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [activeChat, isOpen]);

  useEffect(() => {
    if (isOpen && activeChat && activeChat !== 'bot' && !showScrollBtn) scrollToBottom();
  }, [messages]);

  // ── contacts ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!profile) return;
    supabase.from('profiles').select('id, full_name, role')
      .neq('id', profile.id).order('role', { ascending: true })
      .then(({ data }) => { if (data) setContacts(data); });
  }, [profile]);

  // ── messages + presence + broadcast ──────────────────────────────────
  useEffect(() => {
    if (!profile) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`id, message, created_at, is_read, sender_id, receiver_id,
          sender:profiles!chat_messages_sender_id_fkey(full_name, role)`)
        .or(`receiver_id.is.null,receiver_id.eq.${profile.id},sender_id.eq.${profile.id}`)
        .order('created_at', { ascending: true });
      if (!error && data) setMessages(data);
      setLoading(false);
    };
    fetchMessages();

    const chatChannel = supabase.channel('realtime_chat_v2')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, fetchMessages)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_messages' }, fetchMessages)
      .subscribe();

    const presenceChannel = supabase.channel('online-radar', {
      config: { presence: { key: profile.id } },
    });
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        setOnlineUsers(Object.keys(presenceChannel.presenceState()));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED')
          await presenceChannel.track({ online_at: new Date().toISOString() });
      });

    const bc = supabase.channel('chat-broadcast')
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.userId === profile.id) return;
        setTypingUsers(prev => ({ ...prev, [payload.userId]: payload.name }));
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => {
          setTypingUsers(prev => { const n = { ...prev }; delete n[payload.userId]; return n; });
        }, 2500);
      })
      .on('broadcast', { event: 'seen' }, ({ payload }) => {
        if (payload.userId === profile.id) return;
        setSeenMap(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(mid => {
            updated[mid] = (updated[mid] || []).filter(uid => uid !== payload.userId);
          });
          updated[payload.msgId] = [...(updated[payload.msgId] || []), payload.userId];
          return updated;
        });
      })
      .subscribe();
    broadcastRef.current = bc;

    return () => {
      supabase.removeChannel(chatChannel);
      supabase.removeChannel(presenceChannel);
      supabase.removeChannel(bc);
    };
  }, [profile]);

  useEffect(() => {
    if (!profile || activeChat !== 'group' || !broadcastRef.current) return;
    const groupMsgs = messages.filter(m => m.receiver_id === null);
    if (!groupMsgs.length) return;
    const lastMsg = groupMsgs[groupMsgs.length - 1];
    if (lastSeenBroadcast.current === lastMsg.id) return;
    lastSeenBroadcast.current = lastMsg.id;
    broadcastRef.current.send({
      type: 'broadcast', event: 'seen',
      payload: { userId: profile.id, msgId: lastMsg.id },
    });
  }, [activeChat, messages, profile]);

  const markAsRead = useCallback(async (senderId) => {
    if (!profile || senderId === 'group' || senderId === 'bot') return;
    const unread = messages.filter(m => m.sender_id === senderId && m.receiver_id === profile.id && !m.is_read);
    if (unread.length > 0) {
      await supabase.from('chat_messages').update({ is_read: true })
        .eq('sender_id', senderId).eq('receiver_id', profile.id).eq('is_read', false);
    }
  }, [profile, messages]);

  useEffect(() => {
    if (isOpen && activeChat && activeChat !== 'group' && activeChat !== 'bot') markAsRead(activeChat);
  }, [isOpen, activeChat, messages]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInput(val);
    const mentionMatch = val.match(/@(\w*)$/);
    setMentionQuery(mentionMatch ? mentionMatch[1] : null);
    if (!broadcastRef.current || !profile) return;
    broadcastRef.current.send({
      type: 'broadcast', event: 'typing',
      payload: { userId: profile.id, name: profile.full_name, chatId: activeChat },
    });
  };

  const insertMention = (contact) => {
    const firstName = contact.full_name.split(' ')[0];
    const newVal = input.replace(/@(\w*)$/, `@${firstName} `);
    setInput(newVal);
    setMentionQuery(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !profile || !activeChat || activeChat === 'bot') return;
    let text = input.trim();
    if (replyTo) text = buildReply(replyTo.name, replyTo.text, text);
    setInput('');
    setReplyTo(null);
    setShowEmoji(false);
    setMentionQuery(null);
    await supabase.from('chat_messages').insert([{
      sender_id: profile.id,
      receiver_id: activeChat === 'group' ? null : activeChat,
      message: text,
    }]);
  };

  if (!profile) return null;

  // ── derived ───────────────────────────────────────────────────────────
  const totalUnread = messages.filter(m => m.receiver_id === profile.id && !m.is_read).length;

  const displayMessages = messages.filter(m => {
    if (activeChat === 'group') return m.receiver_id === null;
    if (activeChat === 'bot') return false;
    return (m.sender_id === activeChat && m.receiver_id === profile.id) ||
      (m.sender_id === profile.id && m.receiver_id === activeChat);
  });

  const activeContact   = contacts.find(c => c.id === activeChat);
  const isContactOnline = activeChat && activeChat !== 'group' && activeChat !== 'bot' && onlineUsers.includes(activeChat);

  const filteredContacts = contacts.filter(c =>
    c.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const whoIsTyping = Object.entries(typingUsers)
    .filter(([uid]) => activeChat === 'group' || uid === activeChat)
    .map(([, name]) => name.split(' ')[0]);

  const groupedMessages = [];
  let lastDay = '';
  displayMessages.forEach(msg => {
    const day = formatDay(msg.created_at);
    if (day !== lastDay) {
      groupedMessages.push({ type: 'sep', label: day, key: `sep-${day}-${msg.id}` });
      lastDay = day;
    }
    groupedMessages.push({ type: 'msg', ...msg });
  });

  const lastMsgFrom = (cid) => {
    const dm = messages.filter(m =>
      (m.sender_id === cid && m.receiver_id === profile.id) ||
      (m.sender_id === profile.id && m.receiver_id === cid)
    );
    return dm[dm.length - 1];
  };
  const unreadFrom = (cid) =>
    messages.filter(m => m.sender_id === cid && m.receiver_id === profile.id && !m.is_read).length;

  const lastGroupMsgs = messages.filter(m => m.receiver_id === null);
  const lastGroup     = lastGroupMsgs[lastGroupMsgs.length - 1];

  const isMentioned = (text) => {
    const first = profile.full_name?.split(' ')[0]?.toLowerCase();
    return first && text?.toLowerCase().includes(`@${first}`);
  };

  // ════════════════════════════════════════════════════════════════════
  return (
    <>
      <style>{`
        @keyframes chatReveal {
          from { opacity:0; transform:scale(0.93) translateY(10px); transform-origin:bottom right; }
          to   { opacity:1; transform:scale(1) translateY(0); }
        }
        @keyframes msgIn {
          from { opacity:0; transform:translateY(5px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes typingBounce {
          0%,80%,100% { transform:translateY(0); }
          40%          { transform:translateY(-4px); }
        }
        .vs-chat-box { animation: chatReveal 0.22s cubic-bezier(0.16,1,0.3,1); }
        .vs-msg-in   { animation: msgIn 0.16s ease; }
        .vs-dot      { animation: typingBounce 1.2s infinite; }
        .vs-dot:nth-child(2) { animation-delay:.2s; }
        .vs-dot:nth-child(3) { animation-delay:.4s; }
        .vs-chat-scroll::-webkit-scrollbar { width:3px; }
        .vs-chat-scroll::-webkit-scrollbar-thumb { background:#E2E8F0; border-radius:8px; }
        .vs-mention-hl { background: #FEF9C3; color: #854D0E; border-radius: 4px; padding: 0 3px; font-weight:700; }
      `}</style>

      {/* FAB */}
      <button onClick={() => setIsOpen(v => !v)} aria-label="Chat"
        className="fixed bottom-6 right-6 z-[200] flex h-14 w-14 items-center justify-center rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
        style={{
          background: 'linear-gradient(135deg,#1e40af 0%,#2563EB 100%)',
          boxShadow: '0 8px 32px rgba(37,99,235,0.4),0 2px 8px rgba(37,99,235,0.2)',
        }}>
        {isOpen ? <X className="h-5 w-5 text-white" /> : (
          <>
            <MessageSquare className="h-5 w-5 text-white" />
            {totalUnread > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 text-[10px] font-bold text-white">
                {totalUnread > 9 ? '9+' : totalUnread}
              </span>
            )}
          </>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="vs-chat-box fixed bottom-24 right-6 z-[200] flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white"
          style={{ width:360, height:540, boxShadow:'0 24px 64px -12px rgba(15,23,42,0.22),0 4px 16px -4px rgba(15,23,42,0.1)' }}>

          {/* ══ CHATBOT ROOM ════════════════════════════════════════ */}
          {activeChat === 'bot' ? (
            <BotChatRoom onBack={() => setActiveChat(null)} />

          /* ══ CONTACT LIST ══════════════════════════════════════════ */
          ) : !activeChat ? (
            <>
              <div className="flex shrink-0 items-center justify-between px-4 py-3.5"
                style={{ background:'linear-gradient(135deg,#1e3a8a 0%,#2563EB 100%)' }}>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-200" />
                  <span className="text-[15px] font-bold text-white">Pesan</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white/90">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                    {onlineUsers.length} online
                  </span>
                  <button onClick={() => setIsOpen(false)}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-white/70 hover:bg-white/15 hover:text-white">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="shrink-0 border-b border-slate-100 px-3 py-2.5">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari kontak..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-[12px] outline-none transition-all placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100" />
                </div>
              </div>

              <div className="vs-chat-scroll flex-1 overflow-y-auto">

                {/* ── AI Chatbot entry — di atas Team Chat ── */}
                <div onClick={() => setActiveChat('bot')}
                  className="flex cursor-pointer items-center gap-3 border-b-2 border-violet-100 bg-gradient-to-r from-violet-50 to-indigo-50 px-4 py-3 transition-colors hover:from-violet-100 hover:to-indigo-100">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                    style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }}>
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-bold text-slate-900">ChurnShield AI</span>
                      <span className="flex items-center gap-0.5 rounded-full bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-violet-600">
                        <Sparkles className="h-2 w-2" /> AI
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-violet-500">Tanya tentang churn, retensi, performa tim...</p>
                  </div>
                  <div className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
                </div>

                {/* Team Chat */}
                <div onClick={() => setActiveChat('group')}
                  className="flex cursor-pointer items-center gap-3 border-b border-slate-100 px-4 py-3 hover:bg-slate-50">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600">
                    <Hash className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-bold text-slate-900">Team Chat</span>
                      {lastGroup && <span className="ml-2 text-[10px] text-slate-400">{formatTime(lastGroup.created_at)}</span>}
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-slate-400">
                      {lastGroup ? `${lastGroup.sender?.full_name}: ${parseMsg(lastGroup.message).body}` : 'Ruang diskusi tim'}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50/80 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Direct Message
                </div>

                {loading ? (
                  <div className="flex flex-col gap-3 p-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex animate-pulse items-center gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3 w-24 rounded bg-slate-200" />
                          <div className="h-2.5 w-36 rounded bg-slate-100" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredContacts.length === 0 ? (
                  <p className="py-8 text-center text-[12px] text-slate-400">Tidak ditemukan</p>
                ) : (
                  filteredContacts.map(c => {
                    const last    = lastMsgFrom(c.id);
                    const unread  = unreadFrom(c.id);
                    const online  = onlineUsers.includes(c.id);
                    const isTyping = !!typingUsers[c.id];
                    return (
                      <div key={c.id} onClick={() => setActiveChat(c.id)}
                        className="flex cursor-pointer items-center gap-3 border-b border-slate-50 px-4 py-3 hover:bg-slate-50 last:border-0">
                        <Avatar name={c.full_name} size={40} online={online} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className={`text-[13px] text-slate-900 ${unread > 0 ? 'font-bold' : 'font-semibold'}`}>
                              {c.full_name}
                            </span>
                            {last && <span className="ml-2 shrink-0 text-[10px] text-slate-400">{formatTime(last.created_at)}</span>}
                          </div>
                          <div className="mt-0.5 flex items-center justify-between gap-2">
                            {isTyping ? (
                              <span className="text-[11px] italic font-medium text-blue-500">mengetik...</span>
                            ) : (
                              <span className="truncate text-[11px] text-slate-400">
                                {last
                                  ? (last.sender_id === profile.id ? `Anda: ${parseMsg(last.message).body}` : parseMsg(last.message).body)
                                  : <span className="italic capitalize">{c.role}</span>}
                              </span>
                            )}
                            {unread > 0 && (
                              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                                {unread}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>

          ) : (
          /* ══ REGULAR CHAT ROOM ════════════════════════════════════ */
            <>
              {/* Header */}
              <div className="flex shrink-0 items-center gap-3 px-3 py-3"
                style={{ background:'linear-gradient(135deg,#1e3a8a 0%,#2563EB 100%)' }}>
                <button onClick={() => { setActiveChat(null); setReplyTo(null); setShowEmoji(false); setMentionQuery(null); }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/80 hover:bg-white/15 hover:text-white">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                {activeChat === 'group' ? (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20">
                    <Hash className="h-4 w-4 text-white" />
                  </div>
                ) : (
                  <div className="relative shrink-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-[12px] font-bold text-white">
                      {initials(activeContact?.full_name)}
                    </div>
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-blue-800"
                      style={{ background: isContactOnline ? '#10B981' : '#94A3B8' }} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold leading-none text-white">
                    {activeChat === 'group' ? 'Team Chat' : activeContact?.full_name}
                  </p>
                  <p className="mt-1 text-[11px]"
                    style={{ color: isContactOnline || activeChat === 'group' ? '#6ee7b7' : 'rgba(255,255,255,0.5)' }}>
                    {activeChat === 'group'
                      ? `${onlineUsers.length} anggota online`
                      : (isContactOnline ? '● Online' : '○ Offline')}
                  </p>
                </div>
                {activeChat === 'group' && (
                  <span className="shrink-0 rounded-full bg-white/15 px-2 py-1 text-[10px] font-semibold text-white/80">
                    @ untuk mention
                  </span>
                )}
              </div>

              {/* Messages */}
              <div className="relative flex-1 overflow-hidden">
                <div ref={scrollAreaRef} onScroll={handleScroll}
                  className="vs-chat-scroll h-full overflow-y-auto px-3 py-3 space-y-0.5"
                  style={{ background:'linear-gradient(180deg,#F8FAFF 0%,#EFF6FF 100%)' }}>
                  {displayMessages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-100 bg-white shadow-sm">
                        <MessageSquare className="h-6 w-6 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-slate-700">Mulai percakapan</p>
                        <p className="mt-1 text-[12px] text-slate-400">
                          {activeChat === 'group' ? 'Gunakan @ untuk mention anggota' : 'Kirim pesan pertama Anda!'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    groupedMessages.map((item, idx) => {
                      if (item.type === 'sep') {
                        return (
                          <div key={item.key} className="flex items-center gap-3 py-3">
                            <div className="h-px flex-1 bg-slate-200/80" />
                            <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[10px] font-semibold text-slate-400 shadow-sm">
                              {item.label}
                            </span>
                            <div className="h-px flex-1 bg-slate-200/80" />
                          </div>
                        );
                      }

                      const msg = item;
                      const isMe = msg.sender_id === profile.id;
                      const prevItem = groupedMessages[idx - 1];
                      const sameAsPrev = prevItem?.type === 'msg' && prevItem.sender_id === msg.sender_id;
                      const showName = !isMe && activeChat === 'group' && !sameAsPrev;
                      const { replyTo: rName, replyQuote: rQuote, body } = parseMsg(msg.message);
                      const mentioned = !isMe && isMentioned(body);
                      const seenBy = seenMap[msg.id] || [];
                      const dmRead = isMe && activeChat !== 'group' && msg.is_read;
                      const dmSent = isMe && activeChat !== 'group' && !msg.is_read;

                      return (
                        <div key={msg.id}
                          className={`vs-msg-in group flex flex-col ${isMe ? 'items-end' : 'items-start'} ${sameAsPrev ? 'mt-0.5' : 'mt-3'}`}>
                          {mentioned && (
                            <div className="mb-1 ml-9 flex items-center gap-1 text-[10px] font-bold text-amber-600">
                              <span>🔔</span> Kamu disebutkan
                            </div>
                          )}
                          {showName && (
                            <span className="mb-1 ml-9 text-[10px] font-bold text-slate-500">{msg.sender?.full_name}</span>
                          )}
                          <div className={`flex items-end gap-1.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                            {!isMe && activeChat === 'group' && (
                              sameAsPrev
                                ? <div style={{ width:26 }} />
                                : <Avatar name={msg.sender?.full_name} size={26} />
                            )}
                            <div className="max-w-[215px]">
                              {rName && (
                                <div className={`mb-0.5 rounded-lg border-l-2 px-2.5 py-1.5 text-[11px] ${isMe ? 'border-blue-300 bg-blue-800/30 text-blue-100' : 'border-blue-400 bg-slate-100 text-slate-600'}`}>
                                  <p className="mb-0.5 font-bold" style={{ color: isMe ? '#93c5fd' : '#2563EB' }}>{rName}</p>
                                  <p className="truncate">{rQuote}</p>
                                </div>
                              )}
                              <div className="relative">
                                <div className="break-words px-3.5 py-2 text-[13px] leading-relaxed"
                                  style={{
                                    borderRadius: isMe
                                      ? (sameAsPrev ? '18px 18px 6px 18px' : '18px 4px 18px 18px')
                                      : (sameAsPrev ? '18px 18px 18px 6px' : '4px 18px 18px 18px'),
                                    background: mentioned
                                      ? '#FEF9C3'
                                      : isMe ? 'linear-gradient(135deg,#2563EB,#1d4ed8)' : '#FFFFFF',
                                    color: mentioned ? '#1e293b' : isMe ? '#fff' : '#1e293b',
                                    border: mentioned ? '1.5px solid #FCD34D' : isMe ? 'none' : '1px solid #E2E8F0',
                                    boxShadow: isMe ? '0 2px 8px rgba(37,99,235,0.25)' : '0 1px 4px rgba(15,23,42,0.06)',
                                  }}>
                                  <MsgBody text={body} isMe={isMe && !mentioned} currentName={profile.full_name} />
                                </div>
                                <button type="button"
                                  onClick={() => setReplyTo({ id: msg.id, name: msg.sender?.full_name ?? 'Anda', text: body })}
                                  className={`absolute top-1 opacity-0 group-hover:opacity-100 transition-opacity flex h-6 w-6 items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm text-slate-500 hover:text-blue-600 ${isMe ? '-left-7' : '-right-7'}`}
                                  title="Balas">
                                  <CornerUpLeft className="h-3 w-3" />
                                </button>
                              </div>
                              <div className={`mt-0.5 flex items-center gap-1 text-[10px] ${isMe ? 'justify-end pr-1' : 'pl-1'}`}>
                                <span className="text-slate-400">{formatTime(msg.created_at)}</span>
                                {dmRead && (
                                  <span className="font-bold" style={{ color: '#2563EB' }} title="Dibaca">✓✓</span>
                                )}
                                {dmSent && (
                                  <span className="text-slate-300" title="Terkirim">✓</span>
                                )}
                              </div>
                              {isMe && activeChat === 'group' && seenBy.length > 0 && (
                                <SeenAvatars seenBy={seenBy} contacts={contacts} />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {whoIsTyping.length > 0 && (
                    <div className="vs-msg-in mt-3 flex items-end gap-1.5">
                      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3 shadow-sm">
                        <span className="vs-dot h-1.5 w-1.5 rounded-full bg-slate-400" />
                        <span className="vs-dot h-1.5 w-1.5 rounded-full bg-slate-400" />
                        <span className="vs-dot h-1.5 w-1.5 rounded-full bg-slate-400" />
                        <span className="ml-1.5 text-[11px] italic text-slate-400">
                          {whoIsTyping.join(', ')} mengetik...
                        </span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {showScrollBtn && (
                  <button type="button" onClick={() => scrollToBottom()}
                    className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow-md transition-all hover:bg-blue-600 hover:text-white hover:border-blue-600">
                    <ArrowDown className="h-3.5 w-3.5" /> Pesan terbaru
                  </button>
                )}
              </div>

              {replyTo && (
                <div className="flex shrink-0 items-center gap-2 border-t border-blue-100 bg-blue-50 px-3 py-2">
                  <div className="min-w-0 flex-1 border-l-2 border-blue-500 pl-2">
                    <p className="text-[10px] font-bold text-blue-600">{replyTo.name}</p>
                    <p className="truncate text-[11px] text-slate-500">{replyTo.text}</p>
                  </div>
                  <button type="button" onClick={() => setReplyTo(null)} className="shrink-0 text-slate-400 hover:text-slate-600">
                    <XCircle className="h-4 w-4" />
                  </button>
                </div>
              )}

              <form onSubmit={handleSend}
                className="relative flex shrink-0 items-center gap-2 border-t border-slate-100 bg-white px-3 py-3">
                {mentionQuery !== null && (
                  <MentionList contacts={contacts} query={mentionQuery} onSelect={insertMention} />
                )}
                {showEmoji && (
                  <EmojiPicker
                    onSelect={(e) => setInput(v => v + e)}
                    onClose={() => setShowEmoji(false)}
                  />
                )}
                <button type="button" onClick={() => setShowEmoji(v => !v)}
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${showEmoji ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}>
                  <Smile className="h-5 w-5" />
                </button>
                <input ref={inputRef} type="text" value={input} onChange={handleInputChange}
                  onKeyDown={e => {
                    if (e.key === 'Escape') { setReplyTo(null); setShowEmoji(false); setMentionQuery(null); }
                  }}
                  placeholder={replyTo ? 'Ketik balasan...' : activeChat === 'group' ? 'Pesan atau @mention...' : 'Ketik pesan...'}
                  className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[13px] text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
                <button type="submit" disabled={!input.trim()}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition-all disabled:cursor-not-allowed disabled:opacity-40 hover:opacity-90 active:scale-95"
                  style={{ background:'linear-gradient(135deg,#2563EB,#1d4ed8)', boxShadow:'0 2px 8px rgba(37,99,235,0.3)' }}>
                  <Send className="h-4 w-4 translate-x-0.5" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}