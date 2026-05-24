'use client';

import TeamChat from '@/components/chat/TeamChat';

export default function AdminChatPage() {
  return (
    <div className="h-[calc(100vh-148px)] min-h-[500px] overflow-hidden md:h-[calc(100vh-188px)] lg:h-[calc(100vh-220px)]">
      <TeamChat />
    </div>
  );
}
