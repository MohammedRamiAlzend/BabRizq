# Back Office — Chat

> See [_shared.md](./_shared.md) for authentication headers and response envelope.

The back-office chat supports **two conversation types**:
- `customer` — back-office operator replies to messages from end-customers.
- `store` — back-office operator communicates with store owners.

---

## Shapes

### BackOfficeChatConversation

```ts
interface BackOfficeChatConversation {
  id: string;                           // UUID
  type: "customer" | "store";
  partnerNameEn: string;                // name of the other party
  partnerNameAr: string;
  partnerId: string;                    // UUID of the customer or store
  lastMessageEn: string;                // preview of the last message (English)
  lastMessageAr: string;                // preview of the last message (Arabic)
  lastTimestamp: string;                // ISO 8601 datetime of the last message
  unreadCount: number;                  // messages not yet read by this operator
}
```

### BackOfficeChatMessage

```ts
interface BackOfficeChatMessage {
  id: string;                           // UUID
  conversationId: string;               // UUID — parent conversation
  sender: "back_office" | "customer" | "store";
  content: string;                      // plain text message body
  timestamp: string;                    // ISO 8601 datetime
  isRead: boolean;
}
```

---

## GET `/api/backoffice/chat/conversations`

Returns all active conversations, grouped by type, for the authenticated operator.

### Query Parameters

| Param  | Type     | Required | Default | Description                                          |
| ------ | -------- | -------- | ------- | ---------------------------------------------------- |
| `type` | `string` | No       | —       | Filter by type: `customer` or `store`. Omit for all. |

### Response `value`

`BackOfficeChatConversation[]`

Items should be ordered by `lastTimestamp` descending (most recent first).

---

## GET `/api/backoffice/chat/conversations/{id}/messages`

Returns the paginated message history for a single conversation.

### Path Parameter

| Param | Type     | Description          |
| ----- | -------- | -------------------- |
| `id`  | `string` | Conversation UUID    |

### Query Parameters

| Param      | Type     | Required | Default | Description    |
| ---------- | -------- | -------- | ------- | -------------- |
| `page`     | `number` | No       | 1       | Page number    |
| `pageSize` | `number` | No       | 50      | Items per page |

### Response `value`

Paginated list (see `_shared.md`), with `items: BackOfficeChatMessage[]`.  
Items should be ordered oldest-first (ascending `timestamp`).

### Side Effect

Fetching messages automatically marks all previously unread messages in this conversation as `isRead: true` for the back-office operator.

### Error Cases

| `topError.code`          | HTTP Status | When                             |
| ------------------------ | ----------- | -------------------------------- |
| `CONVERSATION_NOT_FOUND` | 404         | No conversation with that UUID   |

---

## POST `/api/backoffice/chat/conversations/{id}/messages`

Sends a new message from the back-office operator to the other party in a conversation.

### Path Parameter

| Param | Type     | Description       |
| ----- | -------- | ----------------- |
| `id`  | `string` | Conversation UUID |

### Request DTO

```ts
{
  content: string;   // required; plain text; must not be empty
}
```

### Response `value`

`BackOfficeChatMessage` (newly created, `sender: "back_office"`, `isRead: false`).

### Side Effects

- Pushes the new message to the other party's WebSocket connection.
- Updates `lastMessage*` and `lastTimestamp` on the conversation.

### Error Cases

| `topError.code`          | HTTP Status | When                              |
| ------------------------ | ----------- | --------------------------------- |
| `CONVERSATION_NOT_FOUND` | 404         | No conversation with that UUID    |
| `EMPTY_MESSAGE`          | 400         | `content` is empty or whitespace  |

---

## Real-Time (WebSocket)

```
ws://<host>/api/backoffice/chat/ws?token=<jwt_token>
```

The server **pushes** new messages to the back-office operator whenever a customer or store owner sends a reply.

### Server → Client Push Events

```ts
// New message received
{
  type: "new_message";
  data: BackOfficeChatMessage;
}

// Conversation metadata updated (e.g. unread count changed)
{
  type: "conversation_updated";
  data: BackOfficeChatConversation;
}
```

No messages are sent from the client over WebSocket — use `POST .../messages` for sending.

---

## Conversation Creation

Conversations are **created automatically** on the server side:
- A `customer` conversation is created when a customer sends their first message.
- A `store` conversation is created when a store owner sends their first message (via `POST /api/store/chat/messages`).

The back-office operator does not explicitly create conversations.
