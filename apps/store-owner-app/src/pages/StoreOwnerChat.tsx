/*
 * ─── API: Store Owner — Support Chat ────────────────────────────────────────
 *
 * GET /api/store/chat/messages?page=1&pageSize=50
 * Headers: Authorization: Bearer <token>  (role must be "store_owner")
 *          X-Store-Id: {storeId}
 * Paginated response value:
 *   { items: ChatMessage[]; totalItems, page, pageSize, totalPages }
 *   ChatMessage: {
 *     id: string (GUID); senderId: string (GUID); senderRole: 'store_owner'|'admin';
 *     content: string; timestamp: string (ISO 8601); isRead: boolean;
 *   }
 *
 * POST /api/store/chat/messages
 * DTO: { content: string }
 * Response value: ChatMessage (newly created)
 *
 * PUT /api/store/chat/messages/read
 * DTO: { messageIds: string[] }   // mark multiple messages as read
 * Response value: null
 *
 * WebSocket (real-time): ws://api/store/chat/ws?token=<jwt>
 *   Server pushes ChatMessage objects when admin replies.
 *
 * Standard envelope (REST):
 *   { isSuccess, isError, errors, value: <above>, topError }
 */

import { useState, useRef, useEffect } from 'react';
import { Send, Shield } from 'lucide-react';
import { useLocale } from '@/shared/contexts/LocaleContext';
import { INITIAL_CHAT_MESSAGES, ChatMessage } from '~/entities/chat';

const StoreOwnerChat = () => {
  const { t } = useLocale();
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    const newMsg: ChatMessage = {
      id: `msg${Date.now()}`,
      sender: 'owner',
      textEn: text,
      textAr: text,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, newMsg]);
    setInput('');

    // Simulate admin auto-reply
    setTimeout(() => {
      const reply: ChatMessage = {
        id: `msg${Date.now() + 1}`,
        sender: 'admin',
        textEn: 'Thank you for your message! Our support team will get back to you shortly.',
        textAr: 'شكراً لرسالتك! سيتواصل معك فريق الدعم قريباً.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, reply]);
    }, 1200);
  };

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ height: 'calc(100vh - 160px)' }}>
      <div className="mb-4 shrink-0">
        <h1 className="text-2xl font-bold text-foreground">{t('Support Chat', 'التواصل مع الإدارة')}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t('Chat with the BabRizq platform team.', 'تواصل مع فريق منصة بابرزق.')}</p>
      </div>

      {/* Chat container */}
      <div className="flex flex-col flex-1 rounded-2xl border border-border bg-card overflow-hidden min-h-0">
        {/* Chat header */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-4 bg-muted/30 shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shrink-0">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{t('BabRizq Support', 'دعم بابرزق')}</p>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
              <p className="text-xs text-emerald-600 dark:text-emerald-400">{t('Online', 'متصل')}</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
          {messages.map(msg => {
            const isOwner = msg.sender === 'owner';
            return (
              <div key={msg.id} className={`flex items-end gap-2 ${isOwner ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                {!isOwner && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0 text-xs font-bold">
                    B
                  </div>
                )}
                {/* Bubble */}
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${isOwner
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-muted text-foreground rounded-bl-sm'
                  }`}>
                  <p className="text-sm leading-relaxed">{t(msg.textEn, msg.textAr)}</p>
                  <p className={`text-[10px] mt-1 ${isOwner ? 'text-primary-foreground/70 text-end' : 'text-muted-foreground'}`}>
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border px-4 py-3 shrink-0 bg-card">
          <form onSubmit={handleSend} className="flex items-center gap-3">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={t('Type a message...', 'اكتب رسالة...')}
              className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl gradient-gold text-primary-foreground transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StoreOwnerChat;









