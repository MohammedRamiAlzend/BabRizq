/*
 * ─── API: Back Office — Chat ─────────────────────────────────────────────────
 *
 * GET /api/backoffice/chat/conversations
 * Headers: Authorization: ******  (role must be "back_office")
 * Response value: BackOfficeChatConversation[]
 *
 * GET /api/backoffice/chat/conversations/{id}/messages?page=1&pageSize=50
 * Response value: { items: BackOfficeChatMessage[]; totalItems, page, pageSize, totalPages }
 *
 * POST /api/backoffice/chat/conversations/{id}/messages
 * DTO: { content: string }
 * Response value: BackOfficeChatMessage (newly created)
 *
 * WebSocket (real-time): ws://api/backoffice/chat/ws?token=<jwt>
 *   Server pushes BackOfficeChatMessage when the other party replies.
 *
 * Standard envelope (REST):
 *   { isSuccess, isError, errors, value: <above>, topError }
 */

import { useState, useRef, useEffect } from 'react';
import { useLocale } from '@/shared/contexts/LocaleContext';
import {
  INITIAL_CONVERSATIONS,
  BackOfficeChatConversation,
  BackOfficeChatMessage,
  BackOfficeConversationType,
} from '~/entities/backOfficeData';
import { Send, User, Store, MessageSquare } from 'lucide-react';

/* ---------- Helpers ---------- */

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
}

function formatDate(iso: string, lang: 'en' | 'ar'): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

const TAB_LABELS: Record<BackOfficeConversationType, { en: string; ar: string }> = {
  customer: { en: 'Customers', ar: 'الزبائن' },
  store: { en: 'Stores', ar: 'المتاجر' },
};

const PARTNER_ICON: Record<BackOfficeConversationType, typeof User> = {
  customer: User,
  store: Store,
};

/* ---------- Auto-reply simulator ---------- */
function autoReply(type: BackOfficeConversationType): BackOfficeChatMessage {
  const replies: Record<BackOfficeConversationType, { en: string; ar: string }> = {
    customer: {
      en: 'Thank you for reaching out. We are looking into your request.',
      ar: 'شكراً للتواصل معنا، سنتابع طلبك بأقرب وقت.',
    },
    store: {
      en: 'Noted! We will coordinate with the driver accordingly.',
      ar: 'تم الأخذ بعين الاعتبار! سنتواصل مع السائق وفقاً لذلك.',
    },
  };
  return {
    id: `auto_${Date.now()}`,
    sender: type,
    textEn: replies[type].en,
    textAr: replies[type].ar,
    timestamp: new Date().toISOString(),
  };
}

/* ---------- Conversation List Item ---------- */
const ConversationItem = ({
  conv,
  isSelected,
  onClick,
}: {
  conv: BackOfficeChatConversation;
  isSelected: boolean;
  onClick: () => void;
}) => {
  const { t, lang } = useLocale();
  const Icon = PARTNER_ICON[conv.type];

  return (
    <button
      onClick={onClick}
      className={`w-full text-start flex items-center gap-3 px-4 py-3 transition-colors ${isSelected ? 'bg-primary/8 border-s-2 border-primary' : 'hover:bg-muted/40 border-s-2 border-transparent'
        }`}
    >
      <div className="relative shrink-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon className="h-5 w-5" />
        </div>
        {conv.unreadCount > 0 && (
          <span className="absolute -top-1 -end-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground px-1">
            {conv.unreadCount}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : 'text-foreground'}`}>
            {t(conv.partnerNameEn, conv.partnerNameAr)}
          </p>
          <span className="text-[10px] text-muted-foreground shrink-0">
            {formatDate(conv.lastTimestamp, lang)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {t(conv.lastMessageEn, conv.lastMessageAr)}
        </p>
      </div>
    </button>
  );
};

/* ---------- Chat Bubble ---------- */
const ChatBubble = ({ msg }: { msg: BackOfficeChatMessage }) => {
  const { t } = useLocale();
  const isMe = msg.sender === 'back_office';

  return (
    <div className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isMe && (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground shrink-0 text-xs font-bold">
          {msg.sender === 'customer' ? <User className="h-4 w-4" /> : <Store className="h-4 w-4" />}
        </div>
      )}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${isMe
            ? 'gradient-gold text-primary-foreground rounded-br-sm'
            : 'bg-muted text-foreground rounded-bl-sm'
          }`}
      >
        <p className="text-sm leading-relaxed">{t(msg.textEn, msg.textAr)}</p>
        <p className={`text-[10px] mt-1 ${isMe ? 'text-primary-foreground/70 text-end' : 'text-muted-foreground'}`}>
          {formatTime(msg.timestamp)}
        </p>
      </div>
    </div>
  );
};

/* ---------- Main Page ---------- */

const BackOfficeChat = () => {
  const { t } = useLocale();
  const [conversations, setConversations] = useState<BackOfficeChatConversation[]>(INITIAL_CONVERSATIONS);
  const [activeTab, setActiveTab] = useState<BackOfficeConversationType>('customer');
  const [selectedId, setSelectedId] = useState<string | null>(conversations[0]?.id ?? null);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const tabConversations = conversations.filter(c => c.type === activeTab);
  const selected = conversations.find(c => c.id === selectedId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selected?.messages.length]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    // Mark as read
    setConversations(prev =>
      prev.map(c => (c.id === id ? { ...c, unreadCount: 0 } : c)),
    );
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !selectedId) return;

    const newMsg: BackOfficeChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'back_office',
      textEn: text,
      textAr: text,
      timestamp: new Date().toISOString(),
    };

    setConversations(prev =>
      prev.map(c =>
        c.id === selectedId
          ? {
            ...c,
            messages: [...c.messages, newMsg],
            lastMessageEn: text,
            lastMessageAr: text,
            lastTimestamp: newMsg.timestamp,
          }
          : c,
      ),
    );
    setInput('');

    // Simulate reply from the other party
    if (selected) {
      setTimeout(() => {
        const reply = autoReply(selected.type);
        setConversations(prev =>
          prev.map(c =>
            c.id === selectedId
              ? {
                ...c,
                messages: [...c.messages, reply],
                lastMessageEn: reply.textEn,
                lastMessageAr: reply.textAr,
                lastTimestamp: reply.timestamp,
              }
              : c,
          ),
        );
      }, 1200);
    }
  };

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('Chat', 'التواصل')}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t('Communicate with customers and stores.', 'التواصل مع الزبائن والمتاجر.')}
          {totalUnread > 0 && (
            <span className="ms-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground px-1">
              {totalUnread}
            </span>
          )}
        </p>
      </div>

      <div
        className="flex rounded-2xl border border-border bg-card overflow-hidden"
        style={{ height: 'calc(100vh - 260px)', minHeight: 480 }}
      >
        {/* Sidebar — conversation list */}
        <div className="w-72 shrink-0 flex flex-col border-e border-border">
          {/* Tabs */}
          <div className="flex border-b border-border shrink-0">
            {(['customer', 'store'] as BackOfficeConversationType[]).map(tab => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  const first = conversations.find(c => c.type === tab);
                  if (first) setSelectedId(first.id);
                }}
                className={`flex-1 py-3 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${activeTab === tab
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                {tab === 'customer' ? <User className="h-3.5 w-3.5" /> : <Store className="h-3.5 w-3.5" />}
                {t(TAB_LABELS[tab].en, TAB_LABELS[tab].ar)}
              </button>
            ))}
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {tabConversations.length === 0 ? (
              <div className="flex flex-col items-center py-10 gap-2 text-muted-foreground">
                <MessageSquare className="h-8 w-8 opacity-30" />
                <p className="text-xs">{t('No conversations', 'لا توجد محادثات')}</p>
              </div>
            ) : (
              tabConversations.map(conv => (
                <ConversationItem
                  key={conv.id}
                  conv={conv}
                  isSelected={selectedId === conv.id}
                  onClick={() => handleSelect(conv.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Chat area */}
        {selected ? (
          <div className="flex flex-col flex-1 min-w-0">
            {/* Chat header */}
            <div className="flex items-center gap-3 border-b border-border px-5 py-3.5 bg-muted/20 shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                {selected.type === 'customer' ? <User className="h-4 w-4" /> : <Store className="h-4 w-4" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {t(selected.partnerNameEn, selected.partnerNameAr)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selected.type === 'customer'
                    ? t('Customer', 'زبون')
                    : t('Store Owner', 'صاحب متجر')}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {selected.messages.map(msg => (
                <ChatBubble key={msg.id} msg={msg} />
              ))}
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
        ) : (
          <div className="flex flex-col flex-1 items-center justify-center gap-3 text-muted-foreground">
            <MessageSquare className="h-12 w-12 opacity-20" />
            <p className="text-sm">{t('Select a conversation', 'اختر محادثة')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BackOfficeChat;









