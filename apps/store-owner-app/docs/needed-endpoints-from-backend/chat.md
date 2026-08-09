# Store Owner — Support Chat

> See [_shared.md](./_shared.md) for authentication headers and response envelope.

---

## ChatMessage Shape

```ts
interface ChatMessage {
  id: string;                           // UUID
  senderId: string;                     // UUID of the sender
  senderRole: "store_owner" | "admin";
  content: string;                      // plain text message body
  timestamp: string;                    // ISO 8601 datetime, e.g. "2026-04-10T09:00:00Z"
  isRead: boolean;
}
```

---

## REST Endpoints

### GET `/api/store/chat/messages`

Returns paginated chat history between this store and the platform admin.

#### Query Parameters

| Param      | Type     | Required | Default | Description     |
| ---------- | -------- | -------- | ------- | --------------- |
| `page`     | `number` | No       | 1       | Page number     |
| `pageSize` | `number` | No       | 50      | Items per page  |

#### Response `value`

Paginated list (see `_shared.md`), with `items: ChatMessage[]`.  
Messages should be ordered oldest-first (ascending `timestamp`).

---

### POST `/api/store/chat/messages`

Sends a new message from the store owner to the platform admin.

#### Request DTO

```ts
{
  content: string;    // required; plain text; must not be empty
}
```

#### Response `value`

`ChatMessage` (newly created, `senderRole: "store_owner"`, `isRead: false`).

---

### PUT `/api/store/chat/messages/read`

Marks one or more messages as read.

#### Request DTO

```ts
{
  messageIds: string[];   // required; array of ChatMessage UUIDs to mark as read
}
```

#### Response `value`

`null`

---

## Real-Time (WebSocket)

```
ws://<host>/api/store/chat/ws?token=<jwt_token>
```

The server **pushes** new `ChatMessage` objects over this connection whenever the platform admin sends a reply. The client should append each received message to the local chat history.

### WebSocket Message Payload

```ts
// Server → Client push event
{
  type: "new_message";
  data: ChatMessage;
}
```

No client-to-server messages are sent over WebSocket — use `POST /api/store/chat/messages` for sending.
