'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, ChevronLeft, Users, User } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { supabase } from '@/lib/supabase';

export default function FloatingChat() {
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeChat, setActiveChat] = useState(null); // null = List Kontak, 'group' = Team Chat, 'uuid' = Japri
  
  const [messages, setMessages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  
  // State baru untuk menyimpan daftar ID user yang sedang ONLINE
  const [onlineUsers, setOnlineUsers] = useState([]); 
  
  const messagesEndRef = useRef(null);

  // Auto-scroll ke pesan paling bawah
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && activeChat) scrollToBottom();
  }, [messages, isOpen, activeChat]);

  // Load Semua Kontak (Kecuali diri sendiri)
  useEffect(() => {
    if (!profile) return;
    const fetchContacts = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .neq('id', profile.id) 
        .order('role', { ascending: true });
      
      if (data) setContacts(data);
    };
    fetchContacts();
  }, [profile]);

  // =======================================================================
  // SISTEM SUPABASE PRESENCE (RADAR ONLINE/OFFLINE) & REALTIME MESSAGES
  // =======================================================================
  useEffect(() => {
    if (!profile) return;

    // --- 1. Load & Subscribe Pesan ---
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          id, message, created_at, is_read, sender_id, receiver_id,
          sender:profiles!chat_messages_sender_id_fkey(full_name, role)
        `)
        .or(`receiver_id.is.null,receiver_id.eq.${profile.id},sender_id.eq.${profile.id}`)
        .order('created_at', { ascending: true });

      if (!error && data) setMessages(data);
      setLoading(false);
    };

    fetchMessages();

    // Dengarkan pesan masuk/berubah
    const chatChannel = supabase
      .channel('realtime_chat_v2')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, () => fetchMessages())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_messages' }, () => fetchMessages())
      .subscribe();


    // --- 2. Sistem Radar Online (Presence) ---
    const presenceChannel = supabase.channel('online-radar', {
      config: { presence: { key: profile.id } },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        // Ambil data state kehadiran dari server
        const presenceState = presenceChannel.presenceState();
        // Extract ID user yang sedang terhubung
        const currentlyOnline = Object.keys(presenceState);
        setOnlineUsers(currentlyOnline);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Begitu terhubung, daftarkan diri kita sebagai ONLINE
          await presenceChannel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(chatChannel);
      supabase.removeChannel(presenceChannel);
    };
  }, [profile]);


  // Fungsi Tandai Pesan Telah Dibaca
  const markAsRead = async (senderId) => {
    if (!profile || senderId === 'group') return;
    
    const unreadMsgs = messages.filter(m => m.sender_id === senderId && m.receiver_id === profile.id && !m.is_read);
    
    if (unreadMsgs.length > 0) {
      await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('sender_id', senderId)
        .eq('receiver_id', profile.id)
        .eq('is_read', false);
    }
  };

  useEffect(() => {
    if (isOpen && activeChat && activeChat !== 'group') {
      markAsRead(activeChat);
    }
  }, [isOpen, activeChat, messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !profile || !activeChat) return;

    const textToSend = input.trim();
    setInput('');

    const receiverId = activeChat === 'group' ? null : activeChat;

    const { error } = await supabase
      .from('chat_messages')
      .insert([{ sender_id: profile.id, receiver_id: receiverId, message: textToSend }]);

    if (error) console.error('Gagal mengirim pesan:', error);
  };

  if (!profile) return null;

  const totalUnread = messages.filter(m => m.receiver_id === profile.id && !m.is_read).length;

  const displayMessages = messages.filter(m => {
    if (activeChat === 'group') return m.receiver_id === null;
    return (m.sender_id === activeChat && m.receiver_id === profile.id) || 
           (m.sender_id === profile.id && m.receiver_id === activeChat);
  });

  const activeContactInfo = contacts.find(c => c.id === activeChat);

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
        }
      `}</style>

      {/* Tombol Melayang */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl z-[100] transition-transform hover:scale-105 active:scale-95"
        style={{ background: 'linear-gradient(135deg, var(--brand), #7C3AED)', boxShadow: '0 8px 30px rgba(79,70,229,0.4)' }}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <>
            <MessageSquare className="w-6 h-6 text-white" />
            {totalUnread > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-[var(--danger)] border-2 border-white text-white text-[10px] font-bold rounded-full">
                {totalUnread > 9 ? '9+' : totalUnread}
              </span>
            )}
          </>
        )}
      </button>

      {/* Kotak Chat */}
      {isOpen && (
        <div 
          className="fixed bottom-24 right-6 w-[340px] h-[520px] bg-[var(--surface)] border border-[var(--line)] rounded-2xl shadow-2xl z-[100] flex flex-col overflow-hidden"
          style={{ animation: 'vsReveal 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
        >
          {/* ==================== TAMPILAN 1: DAFTAR KONTAK ==================== */}
          {!activeChat ? (
            <>
              <div className="px-5 py-4 bg-[var(--bg-2)] border-b border-[var(--line)] flex items-center justify-between">
                <h3 className="text-[16px] font-semibold text-[var(--ink)]">Pesan</h3>
                <button onClick={() => setIsOpen(false)} className="text-[var(--muted-3)] hover:text-[var(--ink)]">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto bg-[var(--surface)] divide-y divide-[var(--line-soft)]">
                
                <div 
                  className="flex items-center gap-3 p-4 hover:bg-[var(--bg)] cursor-pointer transition-colors"
                  onClick={() => setActiveChat('group')}
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                    <Users className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold text-[var(--ink)]">Team Chat (Global)</div>
                    <div className="text-[12px] text-[var(--success)] flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
                      {onlineUsers.length} User Online
                    </div>
                  </div>
                </div>

                <div className="px-4 py-2 bg-[var(--bg-2)] text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider">
                  Daftar Kontak
                </div>
                {loading ? (
                  <div className="p-4 text-center text-[12px] text-[var(--muted)]">Memuat kontak...</div>
                ) : (
                  contacts.map(c => {
                    const unreadFromContact = messages.filter(m => m.sender_id === c.id && m.receiver_id === profile.id && !m.is_read).length;
                    const isOnline = onlineUsers.includes(c.id);

                    return (
                      <div 
                        key={c.id} 
                        className="flex items-center gap-3 p-4 hover:bg-[var(--bg)] cursor-pointer transition-colors"
                        onClick={() => setActiveChat(c.id)}
                      >
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-[var(--line-soft)] flex items-center justify-center text-[var(--muted)] font-semibold uppercase">
                            {c.full_name.substring(0, 2)}
                          </div>
                          {/* Indikator Online Bulat di Foto Profil */}
                          {isOnline && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-[var(--success)] border-2 border-[var(--surface)] rounded-full" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="text-[14px] font-semibold text-[var(--ink)]">{c.full_name}</div>
                          <div className={`text-[11px] capitalize ${c.role === 'admin' ? 'text-indigo-600 font-medium' : 'text-[var(--muted)]'}`}>
                            {c.role}
                          </div>
                        </div>
                        {unreadFromContact > 0 && (
                          <div className="w-5 h-5 rounded-full bg-[var(--danger)] text-white text-[10px] font-bold flex items-center justify-center">
                            {unreadFromContact}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (

          /* ==================== TAMPILAN 2: RUANG OBROLAN ==================== */
            <>
              <div className="px-3 py-3 bg-[var(--bg-2)] border-b border-[var(--line)] flex items-center gap-2">
                <button onClick={() => setActiveChat(null)} className="p-1.5 rounded-md hover:bg-[var(--line-soft)] text-[var(--muted)] transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-white border border-[var(--line)] flex items-center justify-center">
                    {activeChat === 'group' ? <Users className="w-4 h-4 text-indigo-600" /> : <User className="w-4 h-4 text-[var(--muted)]" />}
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold text-[var(--ink)] leading-none">
                      {activeChat === 'group' ? 'Team Chat' : activeContactInfo?.full_name}
                    </div>
                    {/* Status Online/Offline Dinamis (Asli) */}
                    <div className={`text-[11px] flex items-center gap-1.5 mt-1 ${activeChat === 'group' || onlineUsers.includes(activeChat) ? 'text-[var(--success)]' : 'text-[var(--muted-3)]'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${activeChat === 'group' || onlineUsers.includes(activeChat) ? 'bg-[var(--success)] animate-pulse' : 'bg-[var(--muted-3)]'}`} /> 
                      {activeChat === 'group' ? `${onlineUsers.length} Online` : (onlineUsers.includes(activeChat) ? 'Online' : 'Offline')}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--bg)]">
                {displayMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
                    <MessageSquare className="w-8 h-8 text-[var(--muted-3)] mb-2" />
                    <p className="text-[12px] text-[var(--muted)]">Belum ada pesan.<br/>Kirim pesan pertama Anda!</p>
                  </div>
                ) : (
                  displayMessages.map((msg) => {
                    const isMe = msg.sender_id === profile.id;
                    const senderName = msg.sender?.full_name || 'User';

                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        {!isMe && activeChat === 'group' && (
                          <div className="text-[11px] font-semibold text-[var(--muted)] mb-1 mx-1">
                            {senderName}
                          </div>
                        )}
                        
                        <div className="flex items-end gap-1.5">
                          <div 
                            className={`px-3.5 py-2.5 max-w-[240px] text-[13px] leading-relaxed shadow-sm ${
                              isMe 
                                ? 'bg-[var(--brand)] text-white rounded-2xl rounded-br-sm' 
                                : 'bg-[var(--surface)] text-[var(--ink)] border border-[var(--line-soft)] rounded-2xl rounded-bl-sm'
                            }`}
                          >
                            {msg.message}
                          </div>
                        </div>

                        {isMe && activeChat !== 'group' && (
                          <div className="text-[10px] text-[var(--muted-3)] mt-1 mr-1">
                            {msg.is_read ? 'Dibaca' : 'Terkirim'}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-3 bg-[var(--surface)] border-t border-[var(--line)] flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ketik pesan..."
                  className="flex-1 bg-[var(--bg-2)] border border-[var(--line)] rounded-full px-4 py-2 text-[13px] text-[var(--ink)] focus:outline-none focus:border-[var(--brand)] transition-colors placeholder:text-[var(--muted-3)]"
                />
                <button 
                  type="submit" 
                  disabled={!input.trim()}
                  className="w-9 h-9 rounded-full bg-[var(--brand)] flex items-center justify-center text-white shrink-0 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}