'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Send, Hash,
  Phone, Video, Smile, Paperclip,
  ArrowDown, CornerUpLeft, ChevronRight, ChevronLeft,
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useLang } from '@/lib/i18n/LanguageContext';

// ── helpers ───────────────────────────────────────────────────────────
function initials(name) {
  if (!name) return '?';
  return name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase();
}
function formatTime(iso, lang = 'id') {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString(lang === 'en' ? 'en-US' : 'id-ID', { hour: '2-digit', minute: '2-digit' });
}
function formatDay(iso, lang = 'id', t) {
  if (!iso) return '';
  const d = new Date(iso), today = new Date();
  if (d.toDateString() === today.toDateString()) return t('teamChat.today');
  const y = new Date(today); y.setDate(today.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return t('teamChat.yesterday');
  return d.toLocaleDateString(lang === 'en' ? 'en-US' : 'id-ID', { day: 'numeric', month: 'long' });
}
function parseMsg(text = '') {
  const match = text.match(/^\[REPLY:(.+?)\|(.+?)\]\n([\s\S]*)$/);
  if (!match) return { replyTo: null, replyQuote: null, body: text };
  return { replyTo: match[1], replyQuote: match[2], body: match[3] };
}
function buildReply(name, quote, msg) {
  const q = quote.length > 60 ? quote.slice(0, 60) + '...' : quote;
  return `[REPLY:${name}|${q}]\n${msg}`;
}

// ── Avatar ────────────────────────────────────────────────────────────
const AVATAR_PALETTE = [
  ['#DBEAFE', '#2563EB'], ['#D1FAE5', '#059669'],
  ['#FEE2E2', '#DC2626'], ['#EDE9FE', '#7C3AED'], ['#FEF3C7', '#D97706'],
];
function Avatar({ name, size = 40, online }) {
  const idx = name ? name.charCodeAt(0) % AVATAR_PALETTE.length : 0;
  const [bg, fg] = AVATAR_PALETTE[idx];
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="flex items-center justify-center rounded-full font-bold select-none"
        style={{ width: size, height: size, background: bg, color: fg, fontSize: size * 0.33 }}
      >
        {initials(name)}
      </div>
      {online !== undefined && (
        <span
          className="absolute bottom-0 right-0 rounded-full border-2 border-white"
          style={{ width: size * 0.28, height: size * 0.28, background: online ? '#10B981' : '#CBD5E1' }}
        />
      )}
    </div>
  );
}

// ── Typing dots ───────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map(i => (
        <span key={i} className="h-1.5 w-1.5 rounded-full bg-slate-400"
          style={{ animation: `tcBounce 1.2s infinite ${i * 0.15}s` }} />
      ))}
    </div>
  );
}

// ── Emoji picker ──────────────────────────────────────────────────────
const EMOJIS = ['😊','😂','👍','❤️','🔥','🎉','👏','😍','🤔','😅','💯','🙏','✅','🚀','💪'];
function EmojiPicker({ onSelect, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [onClose]);
  return (
    <div ref={ref}
      className="absolute bottom-16 right-0 z-30 rounded-2xl border border-slate-100 bg-white p-3 shadow-2xl"
      style={{ width: 230 }}>
      <div className="grid grid-cols-5 gap-1">
        {EMOJIS.map(e => (
          <button key={e} type="button" onClick={() => { onSelect(e); onClose(); }}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-xl transition-colors hover:bg-slate-100 active:scale-90">
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
export default function TeamChat() {
  const { t, lang } = useLang();
  const { profile } = useAuth();
  const [contacts, setContacts]         = useState([]);
  const [profilesById, setProfilesById] = useState({});
  const [messages, setMessages]         = useState([]);
  const [activeChat, setActiveChat]     = useState(null);
  const [activeMidTab, setActiveMidTab] = useState('messages'); // 'messages' | 'participants'
  const [showRight, setShowRight]       = useState(true);
  const [input, setInput]               = useState('');
  const [search, setSearch]             = useState('');
  const [loading, setLoading]           = useState(true);
  const [onlineUsers, setOnlineUsers]   = useState([]);
  const [typingUsers, setTypingUsers]   = useState({});
  const [replyTo, setReplyTo]           = useState(null);
  const [showEmoji, setShowEmoji]       = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const endRef       = useRef(null);
  const inputRef     = useRef(null);
  const scrollRef    = useRef(null);
  const broadcastRef = useRef(null);
  const typingTimer  = useRef(null);

  const scrollToBottom = (smooth = true) =>
    endRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' });

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 120);
  };

  // contacts + profilesById
  useEffect(() => {
    if (!profile) return;
    supabase.from('profiles').select('id,full_name,role').order('role')
      .then(({ data }) => {
        if (!data) return;
        setContacts(data.filter(p => p.id !== profile.id));
        const map = {};
        data.forEach(p => { map[p.id] = p; });
        setProfilesById(map);
      });
  }, [profile]);

  // messages + realtime
  useEffect(() => {
    if (!profile) return;
    const fetch = async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('id,message,created_at,is_read,sender_id,receiver_id')
        .or(`receiver_id.is.null,receiver_id.eq.${profile.id},sender_id.eq.${profile.id}`)
        .order('created_at', { ascending: true });
      if (!error && data) setMessages(data);
      setLoading(false);
    };
    fetch();

    const chatCh = supabase.channel('tc_chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, fetch)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_messages' }, fetch)
      .subscribe();

    const presenceCh = supabase.channel('tc_presence', { config: { presence: { key: profile.id } } });
    presenceCh
      .on('presence', { event: 'sync' }, () => setOnlineUsers(Object.keys(presenceCh.presenceState())))
      .subscribe(async status => {
        if (status === 'SUBSCRIBED') await presenceCh.track({ online_at: new Date().toISOString() });
      });

    const bc = supabase.channel('tc_broadcast')
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.userId === profile.id) return;
        setTypingUsers(prev => ({ ...prev, [payload.userId]: payload.name }));
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => {
          setTypingUsers(prev => { const n = { ...prev }; delete n[payload.userId]; return n; });
        }, 2500);
      })
      .subscribe();
    broadcastRef.current = bc;

    return () => {
      supabase.removeChannel(chatCh);
      supabase.removeChannel(presenceCh);
      supabase.removeChannel(bc);
    };
  }, [profile]);

  useEffect(() => { if (activeChat && !showScrollBtn) scrollToBottom(); }, [messages]);
  useEffect(() => {
    if (activeChat) { scrollToBottom(false); setTimeout(() => inputRef.current?.focus(), 80); }
  }, [activeChat]);

  const markRead = useCallback(async (senderId) => {
    if (!profile || senderId === 'group') return;
    const unread = messages.filter(m => m.sender_id === senderId && m.receiver_id === profile.id && !m.is_read);
    if (unread.length)
      await supabase.from('chat_messages').update({ is_read: true })
        .eq('sender_id', senderId).eq('receiver_id', profile.id).eq('is_read', false);
  }, [profile, messages]);

  useEffect(() => {
    if (activeChat && activeChat !== 'group') markRead(activeChat);
  }, [activeChat, messages]);

  const handleInputChange = e => {
    setInput(e.target.value);
    if (!broadcastRef.current || !profile) return;
    broadcastRef.current.send({
      type: 'broadcast', event: 'typing',
      payload: { userId: profile.id, name: profile.full_name },
    });
  };

  const handleSend = async e => {
    e.preventDefault();
    if (!input.trim() || !profile || !activeChat) return;
    let text = input.trim();
    if (replyTo) text = buildReply(replyTo.name, replyTo.text, text);
    setInput(''); setReplyTo(null); setShowEmoji(false);
    await supabase.from('chat_messages').insert([{
      sender_id: profile.id,
      receiver_id: activeChat === 'group' ? null : activeChat,
      message: text,
    }]);
  };

  if (!profile) return null;

  // derived
  const displayMsgs = messages.filter(m => {
    if (activeChat === 'group') return m.receiver_id === null;
    return (m.sender_id === activeChat && m.receiver_id === profile.id) ||
           (m.sender_id === profile.id && m.receiver_id === activeChat);
  });
  const activeContact   = contacts.find(c => c.id === activeChat);
  const isOnline        = activeChat && activeChat !== 'group' && onlineUsers.includes(activeChat);
  const filteredContacts = contacts.filter(c => c.full_name?.toLowerCase().includes(search.toLowerCase()));
  const whoTyping       = Object.entries(typingUsers)
    .filter(([uid]) => activeChat === 'group' || uid === activeChat)
    .map(([, name]) => name.split(' ')[0]);
  const lastMsgFrom = cid => {
    const dm = messages.filter(m =>
      (m.sender_id === cid && m.receiver_id === profile.id) ||
      (m.sender_id === profile.id && m.receiver_id === cid)
    );
    return dm[dm.length - 1];
  };
  const unreadFrom = cid =>
    messages.filter(m => m.sender_id === cid && m.receiver_id === profile.id && !m.is_read).length;
  const lastGroup  = messages.filter(m => m.receiver_id === null).at(-1);
  const totalUnread = messages.filter(m => m.receiver_id === profile.id && !m.is_read).length;

  // group messages by day with sender grouping
  const grouped = [];
  let lastDay = '', lastSender = '';
  displayMsgs.forEach((msg, i) => {
    const day = formatDay(msg.created_at, lang, t);
    if (day !== lastDay) { grouped.push({ type: 'sep', label: day, key: `sep-${msg.id}` }); lastDay = day; lastSender = ''; }
    const sameAsPrev = lastSender === msg.sender_id;
    grouped.push({ type: 'msg', ...msg, sameAsPrev });
    lastSender = msg.sender_id;
  });

  // ════════════════════════════════════════════════════════════════════
  return (
    <>
      <style>{`
        @keyframes tcBounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
        @keyframes tcFadeUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .tc-msg-in { animation: tcFadeUp 0.2s ease; }
        .tc-scroll::-webkit-scrollbar { width: 4px; }
        .tc-scroll::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 99px; }
        .tc-scroll::-webkit-scrollbar-track { background: transparent; }
      `}</style>

      <div className="flex h-full overflow-hidden rounded-[20px] bg-white shadow-sm border border-slate-100">

        {/* ══ LEFT: contacts ════════════════════════════════════════════ */}
        <div className="flex w-[280px] shrink-0 flex-col border-r border-slate-100 bg-white">

          {/* My profile */}
          <div className="shrink-0 px-5 pb-4 pt-6">
            <div className="flex items-center gap-3">
              <Avatar name={profile.full_name} size={52} />
              <div className="min-w-0">
                <p className="truncate text-[14px] font-bold text-slate-900">{profile.full_name}</p>
                <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {t('teamChat.available')}
                </span>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="shrink-0 px-4 pb-4">
            <div className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2.5">
              <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search"
                className="flex-1 bg-transparent text-[13px] text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Last chats label */}
          <div className="shrink-0 px-5 pb-2">
            <span className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">
              Last chats
              {totalUnread > 0 && (
                <span className="ml-2 rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {totalUnread}
                </span>
              )}
            </span>
          </div>

          {/* Contacts list */}
          <div className="tc-scroll flex-1 overflow-y-auto px-3 pb-4">

            {/* Group / Team Chat */}
            <button
              type="button"
              onClick={() => setActiveChat('group')}
              className={`mb-0.5 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all ${
                activeChat === 'group' ? 'bg-blue-50' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-900">
                <Hash className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className={`truncate text-[13px] font-bold ${activeChat === 'group' ? 'text-blue-700' : 'text-slate-900'}`}>
                    Team Chat
                  </p>
                  {lastGroup && (
                    <span className="shrink-0 text-[11px] text-slate-400">{formatTime(lastGroup.created_at, lang)}</span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-[12px] text-slate-400">
                  {lastGroup
                    ? `${profilesById[lastGroup.sender_id]?.full_name?.split(' ')[0]}: ${parseMsg(lastGroup.message).body}`
                    : t('teamChat.discRoom')}
                </p>
              </div>
            </button>

            {/* DMs */}
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="flex animate-pulse items-center gap-3 rounded-2xl px-3 py-3">
                  <div className="h-12 w-12 shrink-0 rounded-full bg-slate-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 rounded-full bg-slate-100" />
                    <div className="h-2.5 w-36 rounded-full bg-slate-100" />
                  </div>
                </div>
              ))
            ) : filteredContacts.length === 0 ? (
              <p className="py-8 text-center text-[12px] text-slate-400">{t('teamChat.notFound')}</p>
            ) : filteredContacts.map(c => {
              const last    = lastMsgFrom(c.id);
              const unread  = unreadFrom(c.id);
              const online  = onlineUsers.includes(c.id);
              const typing  = !!typingUsers[c.id];
              const isActive = activeChat === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveChat(c.id)}
                  className={`mb-0.5 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all ${
                    isActive ? 'bg-blue-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <Avatar name={c.full_name} size={48} online={online} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`truncate text-[13px] font-bold ${isActive ? 'text-blue-700' : 'text-slate-900'}`}>
                        {c.full_name}
                      </p>
                      {last && (
                        <span className="shrink-0 text-[11px] text-slate-400">{formatTime(last.created_at, lang)}</span>
                      )}
                    </div>
                    <p className={`mt-0.5 truncate text-[12px] ${typing ? 'italic text-blue-600' : 'text-slate-400'}`}>
                      {typing ? t('teamChat.typing') : last
                        ? (last.sender_id === profile.id ? `${t('teamChat.you')}: ${parseMsg(last.message).body}` : parseMsg(last.message).body)
                        : <span className="capitalize">{c.role === 'admin' ? t('role.admin') : t('role.staff')}</span>}
                    </p>
                  </div>
                  {unread > 0 && !isActive && (
                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
                      {unread}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ══ MIDDLE: chat ══════════════════════════════════════════════ */}
        <div className="flex flex-1 flex-col overflow-hidden bg-white">

          {!activeChat ? (
            /* empty state */
            <div className="flex flex-1 flex-col items-center justify-center gap-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100">
                <Hash className="h-9 w-9 text-slate-300" />
              </div>
              <div className="text-center">
                <p className="text-[15px] font-bold text-slate-700">{t('teamChat.chooseConv')}</p>
                <p className="mt-1 text-[13px] text-slate-400">{t('teamChat.chooseConvDesc')}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveChat('group')}
                className="mt-1 rounded-xl bg-blue-600 px-6 py-2.5 text-[13px] font-semibold text-white shadow-sm shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-95"
              >
                {t('teamChat.openTeamChat')}
              </button>
            </div>
          ) : (
            <>
              {/* ── Chat header ──────────────────────────────────────── */}
              <div className="flex shrink-0 items-center gap-4 border-b border-slate-100 bg-white px-6 py-4">

                {/* Title + status */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {activeChat === 'group' ? (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900">
                      <Hash className="h-4.5 w-4.5 text-white h-[18px] w-[18px]" />
                    </div>
                  ) : (
                    <Avatar name={activeContact?.full_name} size={40} online={isOnline} />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-[16px] font-bold text-slate-900">
                      {activeChat === 'group' ? 'Group Chat' : activeContact?.full_name}
                    </p>
                    {activeChat === 'group' ? (
                      <p className="text-[12px] text-slate-400">{contacts.length + 1} {t('teamChat.members')}</p>
                    ) : (
                      <p className="text-[12px] text-slate-400">
                        {isOnline ? (
                          <span className="flex items-center gap-1 text-emerald-500">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{t('teamChat.online')}
                          </span>
                        ) : (
                          <span className="capitalize">{activeContact?.role === 'admin' ? t('role.admin') : t('role.staff')}</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>

                {/* Messages / Participants tabs */}
                {activeChat === 'group' && (
                  <div className="flex items-center gap-0.5 rounded-full bg-slate-100 p-1">
                    {['messages', 'participants'].map(tab => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveMidTab(tab)}
                        className={`rounded-full px-4 py-1.5 text-[12px] font-semibold capitalize transition-all ${
                          activeMidTab === tab
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {tab === 'messages' ? t('teamChat.messagesTab') : t('teamChat.participantsTab')}
                      </button>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1.5">
                  {activeChat !== 'group' && (
                    <>
                      <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
                        <Phone className="h-4 w-4" />
                      </button>
                      <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
                        <Video className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowRight(v => !v)}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                  >
                    {showRight ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* ── Content (messages or participants) ───────────────── */}
              {activeMidTab === 'participants' && activeChat === 'group' ? (
                /* Participants list */
                <div className="tc-scroll flex-1 overflow-y-auto px-6 py-5">
                  <p className="mb-4 text-[12px] font-bold uppercase tracking-widest text-slate-400">
                    {t('teamChat.teamMembers', { count: contacts.length + 1 })}
                  </p>
                  {/* Self */}
                  <div className="mb-2 flex items-center gap-3 rounded-2xl px-3 py-3 bg-blue-50">
                    <Avatar name={profile.full_name} size={44} online={true} />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-[13px] font-bold text-blue-700">{profile.full_name} <span className="text-slate-400 font-normal">({t('teamChat.youLabel')})</span></p>
                      <p className="capitalize text-[12px] text-slate-400">{profile.role === 'admin' ? t('role.admin') : t('role.staff')}</p>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-500">{t('teamChat.online')}</span>
                  </div>
                  {contacts.map(c => {
                    const online = onlineUsers.includes(c.id);
                    return (
                      <div key={c.id} className="mb-1 flex items-center gap-3 rounded-2xl px-3 py-3 hover:bg-slate-50">
                        <Avatar name={c.full_name} size={44} online={online} />
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-[13px] font-bold text-slate-900">{c.full_name}</p>
                          <p className="capitalize text-[12px] text-slate-400">{c.role === 'admin' ? t('role.admin') : t('role.staff')}</p>
                        </div>
                        <span className={`text-[11px] font-semibold ${online ? 'text-emerald-500' : 'text-slate-300'}`}>
                          {online ? t('teamChat.online') : t('teamChat.offline')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Messages area */
                <div
                  ref={scrollRef}
                  onScroll={handleScroll}
                  className="tc-scroll relative flex-1 overflow-y-auto bg-slate-50/50 px-6 py-5"
                >
                  {displayMsgs.length === 0 && !loading ? (
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white shadow-sm border border-slate-100">
                        {activeChat === 'group'
                          ? <Hash className="h-7 w-7 text-slate-300" />
                          : <Avatar name={activeContact?.full_name} size={36} />}
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold text-slate-600">{t('teamChat.startConv')}</p>
                        <p className="mt-1 text-[12px] text-slate-400">
                          {activeChat === 'group' ? t('teamChat.sendToTeam') : t('teamChat.sendToUser', { name: activeContact?.full_name })}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      {grouped.map((item, idx) => {
                        if (item.type === 'sep') {
                          return (
                            <div key={item.key} className="flex items-center gap-4 py-4">
                              <div className="h-px flex-1 bg-slate-200/60" />
                              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-400">
                                {item.label}
                              </span>
                              <div className="h-px flex-1 bg-slate-200/60" />
                            </div>
                          );
                        }

                        const msg     = item;
                        const isMe    = msg.sender_id === profile.id;
                        const sName   = profilesById[msg.sender_id]?.full_name;
                        const { replyTo: rName, replyQuote: rQuote, body } = parseMsg(msg.message);
                        const showAvatar  = !isMe && !msg.sameAsPrev;
                        const showLabel   = !isMe && activeChat === 'group' && !msg.sameAsPrev;
                        const dmRead      = isMe && activeChat !== 'group' && msg.is_read;

                        return (
                          <div
                            key={msg.id}
                            className={`tc-msg-in group flex ${isMe ? 'justify-end' : 'justify-start'} ${msg.sameAsPrev ? 'mt-1' : 'mt-5'}`}
                          >
                            {/* Other avatar placeholder for alignment */}
                            {!isMe && (
                              <div className="mr-2.5 mt-auto shrink-0" style={{ width: 36 }}>
                                {showAvatar && <Avatar name={sName} size={36} />}
                              </div>
                            )}

                            <div className="max-w-[60%]">
                              {/* Sender label */}
                              {showLabel && (
                                <p className="mb-1.5 ml-1 text-[11px] font-semibold text-slate-500">
                                  {sName}
                                  <span className="ml-2 font-normal text-slate-400">{formatTime(msg.created_at)}</span>
                                </p>
                              )}
                              {isMe && !msg.sameAsPrev && (
                                <p className="mb-1.5 mr-1 text-right text-[11px] text-slate-400">
                                  You, {formatTime(msg.created_at)}
                                </p>
                              )}

                              {/* Reply quote visualization */}
                              {rQuote && (
                                <div className={`mb-1.5 rounded-lg border-l-2 border-slate-300 bg-slate-100 p-2 text-[11px] text-slate-500`}>
                                  <span className="font-bold text-slate-700">{rName}</span>
                                  <p className="truncate">{rQuote}</p>
                                </div>
                              )}

                              {/* Bubble + reply button */}
                              <div className="relative">
                                <div
                                  className={`break-words px-4 py-2.5 text-[13px] leading-relaxed ${
                                    isMe
                                      ? 'bg-blue-600 text-white'
                                      : 'border border-slate-100 bg-white text-slate-800 shadow-sm'
                                  }`}
                                  style={{
                                    borderRadius: isMe
                                      ? (msg.sameAsPrev ? '18px 18px 6px 18px' : '18px 6px 18px 18px')
                                      : (msg.sameAsPrev ? '18px 18px 18px 6px' : '6px 18px 18px 18px'),
                                  }}
                                >
                                  {body}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setReplyTo({ id: msg.id, name: sName ?? t('teamChat.you'), text: body })}
                                  className={`absolute top-1 opacity-0 group-hover:opacity-100 transition-opacity flex h-7 w-7 items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm text-slate-400 hover:text-blue-600 ${isMe ? '-left-9' : '-right-9'}`}
                                >
                                  <CornerUpLeft className="h-3.5 w-3.5" />
                                </button>
                              </div>


                              {/* Read indicator (DM only) */}
                              {isMe && activeChat !== 'group' && (
                                <p className={`mt-1 text-right text-[10px] ${dmRead ? 'text-blue-600 font-semibold' : 'text-slate-300'}`}>
                                  {dmRead ? t('teamChat.read') : t('teamChat.sent')}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Typing indicator */}
                      {whoTyping.length > 0 && (
                        <div className="tc-msg-in mt-5 flex items-end gap-2.5">
                          <Avatar name={whoTyping[0]} size={36} />
                          <div className="rounded-[6px_18px_18px_18px] border border-slate-100 bg-white px-4 py-3 shadow-sm">
                            <TypingDots />
                          </div>
                        </div>
                      )}
                      <div ref={endRef} />
                    </div>
                  )}

                  {/* Scroll to bottom */}
                  {showScrollBtn && (
                    <button
                      type="button"
                      onClick={() => scrollToBottom()}
                      className="absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 shadow-md transition-all hover:text-blue-600"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}

              {/* ── Input bar ─────────────────────────────────────────── */}
              {activeMidTab === 'messages' && (
                <div className="shrink-0 border-t border-slate-100 bg-white px-5 py-4">
                  {/* Reply bar */}
                  {replyTo && (
                    <div className="mb-2 flex items-center gap-3 rounded-xl border-l-2 border-blue-400 bg-blue-50 px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-blue-600">{replyTo.name}</p>
                        <p className="truncate text-[12px] text-slate-500">{replyTo.text}</p>
                      </div>
                      <button type="button" onClick={() => setReplyTo(null)} className="shrink-0 text-slate-400 hover:text-slate-600">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12"/></svg>
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleSend}>
                    <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-5 py-3">
                      {/* Emoji */}
                      <div className="relative shrink-0">
                        <button
                          type="button"
                          onClick={() => setShowEmoji(v => !v)}
                          className="text-slate-400 transition-colors hover:text-blue-600"
                        >
                          <Smile className="h-5 w-5" />
                        </button>
                        {showEmoji && (
                          <EmojiPicker
                            onSelect={e => setInput(v => v + e)}
                            onClose={() => setShowEmoji(false)}
                          />
                        )}
                      </div>

                      {/* Input */}
                      <input
                        ref={inputRef}
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSend(e); }}
                        placeholder={
                          replyTo ? t('teamChat.typeReply')
                          : activeChat === 'group' ? t('teamChat.writeMessage')
                          : t('teamChat.writeMessage')
                        }
                        className="flex-1 bg-transparent text-[13px] text-slate-700 outline-none placeholder:text-slate-400"
                      />

                      {/* Attach */}
                      <button type="button" className="shrink-0 text-slate-400 transition-colors hover:text-blue-600">
                        <Paperclip className="h-5 w-5" />
                      </button>

                      {/* Send */}
                      <button
                        type="submit"
                        disabled={!input.trim()}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </div>

        {/* ══ RIGHT: info panel ═════════════════════════════════════════ */}
        {showRight && activeChat && (
          <div className="flex w-[260px] shrink-0 flex-col border-l border-slate-100 bg-white">

            {/* Group / contact card */}
            <div className="flex shrink-0 flex-col items-center border-b border-slate-100 px-6 py-6 text-center">
              {activeChat === 'group' ? (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-900 shadow-sm">
                  <Hash className="h-9 w-9 text-white" />
                </div>
              ) : (
                <Avatar name={activeContact?.full_name} size={80} online={isOnline} />
              )}
              <p className="mt-4 text-[15px] font-bold text-slate-900">
                {activeChat === 'group' ? 'Team Chat' : activeContact?.full_name}
              </p>
              <p className="mt-1 text-[12px] text-slate-400">
                {activeChat === 'group'
                  ? `${contacts.length + 1} ${t('teamChat.members')}`
                  : <span className="capitalize">{activeContact?.role === 'admin' ? t('role.admin') : t('role.staff')}</span>}
              </p>
              {activeChat !== 'group' && isOnline && (
                <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {t('teamChat.online')}
                </span>
              )}
            </div>

            {/* Stats */}
            {activeChat === 'group' && (
              <div className="shrink-0 border-b border-slate-100 px-5 py-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-center">
                    <p className="text-[20px] font-bold text-slate-900">
                      {messages.filter(m => m.receiver_id === null).length}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">{t('teamChat.messagesCount')}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-center">
                    <p className="text-[20px] font-bold text-slate-900">{contacts.length + 1}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">{t('teamChat.participantsTab')}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Members / quick info */}
            <div className="tc-scroll flex-1 overflow-y-auto px-5 py-4">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                {activeChat === 'group' ? t('teamChat.participantsTab') : t('teamChat.info')}
              </p>
              {activeChat === 'group' ? (
                <div className="space-y-2">
                  {/* Self */}
                  <div className="flex items-center gap-3">
                    <Avatar name={profile.full_name} size={36} online={true} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-semibold text-slate-800">{profile.full_name}</p>
                      <p className="capitalize text-[11px] text-slate-400">{profile.role === 'admin' ? t('role.admin') : t('role.staff')}</p>
                    </div>
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  </div>
                  {contacts.map(c => {
                    const online = onlineUsers.includes(c.id);
                    return (
                      <div key={c.id} className="flex items-center gap-3">
                        <Avatar name={c.full_name} size={36} online={online} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px] font-semibold text-slate-800">{c.full_name}</p>
                          <p className="capitalize text-[11px] text-slate-400">{c.role === 'admin' ? t('role.admin') : t('role.staff')}</p>
                        </div>
                        <span className={`h-2 w-2 rounded-full ${online ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-slate-100 p-3">
                    <p className="text-[11px] text-slate-400">{t('teamChat.totalMsgs')}</p>
                    <p className="mt-1 text-[20px] font-bold text-slate-900">
                      {messages.filter(m =>
                        (m.sender_id === activeChat && m.receiver_id === profile.id) ||
                        (m.sender_id === profile.id && m.receiver_id === activeChat)
                      ).length}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 p-3">
                    <p className="text-[11px] text-slate-400">{t('teamChat.statusLabel')}</p>
                    <p className={`mt-1 flex items-center gap-1.5 text-[13px] font-semibold ${isOnline ? 'text-emerald-600' : 'text-slate-400'}`}>
                      <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      {isOnline ? t('teamChat.onlineNow') : t('teamChat.offline')}
                    </p>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </>
  );
}
