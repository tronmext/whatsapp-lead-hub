<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# NAO ESTOU VENDO O MARKDOWN

Vou colar o conteúdo completo aqui diretamente no chat!

---

# Evolution API v2 — Referência Completa de Endpoints

> **Base URL:** `https://{seu-servidor}`
> **Autenticação:** Header `apikey: {sua-global-api-key}`
> **Content-Type:** `application/json`

---

## 🔍 Informações Gerais

### GET `/`

```http
GET / HTTP/1.1
Host: seu-servidor.com
apikey: sua-api-key
```

**Response:**

```json
{
  "status": 200,
  "message": "Welcome to the Evolution API, it is working!",
  "version": "2.x.x",
  "swagger": "http://seu-servidor.com/docs",
  "manager": "http://seu-servidor.com/manager",
  "documentation": "https://doc.evolution-api.com"
}
```

---

## 🏗️ Instance Controller

### POST `/instance/create`

```json
{
  "instanceName": "minha-instancia",
  "token": "token-opcional",
  "number": "5511999999999",
  "qrcode": true,
  "integration": "WHATSAPP-BAILEYS",
  "reject_call": false,
  "msgCall": "",
  "groupsIgnore": false,
  "alwaysOnline": false,
  "readMessages": false,
  "readStatus": false,
  "syncFullHistory": false
}
```

**Response:**

```json
{
  "instance": { "instanceName": "minha-instancia", "status": "created" },
  "hash": { "apikey": "api-key-da-instancia" },
  "qrcode": { "code": "...", "base64": "data:image/png;base64,..." }
}
```

---

### GET `/instance/fetchInstances`

```http
GET /instance/fetchInstances HTTP/1.1
apikey: sua-api-key
```

> Query param opcional: `?instanceName=minha-instancia`

---

### GET `/instance/connectionState/{instance}`

```http
GET /instance/connectionState/minha-instancia HTTP/1.1
apikey: sua-api-key
```

**Response:**

```json
{ "instance": { "instanceName": "minha-instancia", "state": "open" } }
```

> Estados: `open`, `connecting`, `close`

---

### GET `/instance/connect/{instance}`

Gera QR Code.

```http
GET /instance/connect/minha-instancia HTTP/1.1
apikey: sua-api-key
```

**Response:**

```json
{ "code": "2@xyz...", "base64": "data:image/png;base64,..." }
```

---

### DELETE `/instance/logout/{instance}`

```http
DELETE /instance/logout/minha-instancia HTTP/1.1
apikey: sua-api-key
```

### DELETE `/instance/delete/{instance}`

```http
DELETE /instance/delete/minha-instancia HTTP/1.1
apikey: sua-api-key
```

### PUT `/instance/restart/{instance}`

```http
PUT /instance/restart/minha-instancia HTTP/1.1
apikey: sua-api-key
```

### POST `/instance/setPresence/{instance}`

```json
{ "presence": "available" }
```

> Valores: `available`, `unavailable`

---

## ⚙️ Settings

### POST `/settings/set/{instance}`

```json
{
  "reject_call": false,
  "msg_call": "Não posso atender agora.",
  "groups_ignore": false,
  "always_online": true,
  "read_messages": false,
  "read_status": false,
  "sync_full_history": false
}
```

### GET `/settings/find/{instance}`

```http
GET /settings/find/minha-instancia HTTP/1.1
apikey: sua-api-key
```

---

## 💬 Message Controller

> Número: `5511999999999@s.whatsapp.net` | Grupo: `120363xxxxxxxxx@g.us`

### POST `/message/sendText/{instance}`

```json
{
  "number": "5511999999999",
  "text": "Olá! Esta é uma mensagem de teste.",
  "delay": 1200,
  "quoted": {
    "key": {
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": false,
      "id": "ID_DA_MENSAGEM"
    },
    "message": { "conversation": "mensagem original" }
  },
  "mentionsEveryOne": false,
  "mentioned": ["5511999999999"]
}
```

---

### POST `/message/sendMedia/{instance}`

```json
{
  "number": "5511999999999",
  "mediatype": "image",
  "mimetype": "image/jpeg",
  "caption": "Legenda da imagem",
  "media": "https://exemplo.com/imagem.jpg",
  "fileName": "imagem.jpg",
  "delay": 1200
}
```

> `mediatype`: `image`, `video`, `document`, `gif` — `media` pode ser URL ou base64

---

### POST `/message/sendAudio/{instance}`

```json
{
  "number": "5511999999999",
  "audio": "https://exemplo.com/audio.mp3",
  "delay": 1200,
  "encoding": true
}
```

> `encoding: true` converte automaticamente para PTT

---

### POST `/message/sendSticker/{instance}`

```json
{
  "number": "5511999999999",
  "sticker": "https://exemplo.com/sticker.webp",
  "delay": 1200
}
```

---

### POST `/message/sendLocation/{instance}`

```json
{
  "number": "5511999999999",
  "name": "Pizza Napoletana",
  "address": "Rua das Flores, 123 - Cuiabá, MT",
  "latitude": -15.601411,
  "longitude": -56.097892,
  "delay": 1200
}
```

---

### POST `/message/sendContact/{instance}`

```json
{
  "number": "5511999999999",
  "contact": [
    {
      "fullName": "João Silva",
      "wuid": "5511988888888",
      "phoneNumber": "5511988888888",
      "organization": "Empresa XYZ",
      "email": "joao@empresa.com",
      "url": "https://empresa.com"
    }
  ]
}
```

---

### POST `/message/sendReaction/{instance}`

```json
{
  "key": {
    "remoteJid": "5511999999999@s.whatsapp.net",
    "fromMe": false,
    "id": "ID_DA_MENSAGEM"
  },
  "reaction": "👍"
}
```

> Para remover: `"reaction": ""`

---

### POST `/message/sendPoll/{instance}`

```json
{
  "number": "5511999999999",
  "name": "Qual seu sabor favorito?",
  "selectableCount": 1,
  "values": ["Margherita", "Pepperoni", "Calabresa", "Quatro Queijos"],
  "delay": 1200
}
```

---

### POST `/message/sendList/{instance}`

```json
{
  "number": "5511999999999",
  "title": "Cardápio",
  "description": "Escolha seu pedido",
  "buttonText": "Ver opções",
  "footerText": "Obrigado pela preferência!",
  "sections": [
    {
      "title": "Pizzas",
      "rows": [
        {
          "title": "Margherita",
          "description": "Molho, mussarela e manjericão",
          "rowId": "pizza_01"
        },
        { "title": "Pepperoni", "description": "Molho, mussarela e pepperoni", "rowId": "pizza_02" }
      ]
    }
  ],
  "delay": 1200
}
```

---

### POST `/message/sendButton/{instance}`

```json
{
  "number": "5511999999999",
  "title": "Título",
  "description": "Escolha uma opção:",
  "footer": "Rodapé",
  "buttons": [
    { "type": "reply", "displayText": "Sim", "id": "btn_sim" },
    { "type": "reply", "displayText": "Não", "id": "btn_nao" },
    { "type": "url", "displayText": "Saiba mais", "url": "https://seusite.com" },
    { "type": "call", "displayText": "Ligar", "phoneNumber": "5511999999999" }
  ],
  "delay": 1200
}
```

---

### POST `/message/sendStatus/{instance}`

```json
{
  "type": "text",
  "content": "Bom dia! 🌅",
  "backgroundColor": "#008000",
  "font": 1,
  "allContacts": false,
  "statusJidList": ["5511999999999@s.whatsapp.net"]
}
```

> `type`: `text`, `image`, `video`, `audio` | `font`: 1 a 5

---

## 🗂️ Chat Controller

### POST `/chat/checkIsWhatsapp/{instance}`

```json
{ "numbers": ["5511999999999", "5511888888888"] }
```

**Response:**

```json
[{ "exists": true, "jid": "5511999999999@s.whatsapp.net", "name": "João Silva" }]
```

---

### GET `/chat/findChats/{instance}`

```http
GET /chat/findChats/minha-instancia HTTP/1.1
apikey: sua-api-key
```

### GET `/chat/findMessages/{instance}`

```http
GET /chat/findMessages/minha-instancia?where[key.remoteJid]=5511999999999@s.whatsapp.net&limit=20 HTTP/1.1
```

### GET `/chat/findContacts/{instance}`

```http
GET /chat/findContacts/minha-instancia?where[id]=5511999999999@s.whatsapp.net HTTP/1.1
```

### GET `/chat/fetchProfilePictureUrl/{instance}`

```http
GET /chat/fetchProfilePictureUrl/minha-instancia?number=5511999999999 HTTP/1.1
```

---

### POST `/chat/markMessageAsRead/{instance}`

```json
{
  "readMessages": [
    { "remoteJid": "5511999999999@s.whatsapp.net", "fromMe": false, "id": "ID_DA_MENSAGEM" }
  ]
}
```

### POST `/chat/archiveChat/{instance}`

```json
{
  "lastMessage": {
    "key": { "remoteJid": "5511999999999@s.whatsapp.net", "fromMe": false, "id": "ID_DA_MENSAGEM" },
    "messageTimestamp": 1680000000
  },
  "archive": true
}
```

### POST `/chat/deleteMessageForEveryone/{instance}`

```json
{
  "id": "ID_DA_MENSAGEM",
  "remoteJid": "5511999999999@s.whatsapp.net",
  "fromMe": true,
  "participant": ""
}
```

### POST `/chat/updateMessage/{instance}`

```json
{
  "number": "5511999999999",
  "key": { "remoteJid": "5511999999999@s.whatsapp.net", "fromMe": true, "id": "ID_DA_MENSAGEM" },
  "text": "Mensagem editada"
}
```

### POST `/chat/sendPresence/{instance}`

```json
{ "number": "5511999999999", "delay": 3000, "presence": "composing" }
```

> `presence`: `composing`, `recording`, `paused`

### POST `/chat/updateBlockStatus/{instance}`

```json
{ "number": "5511999999999", "status": "block" }
```

> `status`: `block` ou `unblock`

### GET `/chat/getBase64FromMediaMessage/{instance}`

```json
{
  "message": {
    "key": { "remoteJid": "5511999999999@s.whatsapp.net", "fromMe": false, "id": "ID_DA_MENSAGEM" }
  },
  "convertToMp4": false
}
```

---

## 👤 Profile Settings

### GET `/profile/fetchProfile/{instance}`

```http
GET /profile/fetchProfile/minha-instancia?number=5511999999999 HTTP/1.1
```

### PUT `/profile/updateProfileName/{instance}`

```json
{ "name": "Meu Novo Nome" }
```

### PUT `/profile/updateProfileStatus/{instance}`

```json
{ "status": "Disponível para atendimento 🚀" }
```

### PUT `/profile/updateProfilePicture/{instance}`

```json
{ "picture": "https://exemplo.com/foto.jpg" }
```

### DELETE `/profile/removeProfilePicture/{instance}`

```http
DELETE /profile/removeProfilePicture/minha-instancia HTTP/1.1
```

### PUT `/profile/updatePrivacySettings/{instance}`

```json
{
  "readreceipts": "all",
  "profile": "contacts",
  "status": "contacts",
  "online": "all",
  "last": "contacts",
  "groupadd": "contacts"
}
```

> Valores: `all`, `contacts`, `contact_blacklist`, `none`

---

## 👥 Group Controller

### POST `/group/create/{instance}`

```json
{
  "subject": "Nome do Grupo",
  "description": "Descrição do grupo",
  "participants": ["5511999999999", "5511888888888"]
}
```

### GET `/group/fetchAllGroups/{instance}`

```http
GET /group/fetchAllGroups/minha-instancia?getParticipants=false HTTP/1.1
```

### GET `/group/findGroupInfos/{instance}`

```http
GET /group/findGroupInfos/minha-instancia?groupJid=120363xxxxxxxxx@g.us HTTP/1.1
```

### GET `/group/inviteCode/{instance}`

```http
GET /group/inviteCode/minha-instancia?groupJid=120363xxxxxxxxx@g.us HTTP/1.1
```

### PUT `/group/revokeInviteCode/{instance}`

```json
{ "groupJid": "120363xxxxxxxxx@g.us" }
```

### PUT `/group/updateParticipant/{instance}`

```json
{
  "groupJid": "120363xxxxxxxxx@g.us",
  "action": "add",
  "participants": ["5511999999999"]
}
```

> `action`: `add`, `remove`, `promote`, `demote`

### PUT `/group/updateGroupSubject/{instance}`

```json
{ "groupJid": "120363xxxxxxxxx@g.us", "subject": "Novo Nome do Grupo" }
```

### PUT `/group/updateGroupDescription/{instance}`

```json
{ "groupJid": "120363xxxxxxxxx@g.us", "description": "Nova descrição" }
```

### PUT `/group/updateSetting/{instance}`

```json
{ "groupJid": "120363xxxxxxxxx@g.us", "action": "announcement" }
```

> `action`: `announcement`, `not_announcement`, `locked`, `unlocked`

### PUT `/group/toggleEphemeral/{instance}`

```json
{ "groupJid": "120363xxxxxxxxx@g.us", "expiration": 86400 }
```

> `expiration` em segundos: `0` (off), `86400` (1 dia), `604800` (7 dias), `7776000` (90 dias)

### DELETE `/group/leaveGroup/{instance}`

```json
{ "groupJid": "120363xxxxxxxxx@g.us" }
```

---

## 🔔 Webhook

### POST `/webhook/set/{instance}`

```json
{
  "url": "https://meu-servidor.com/webhook",
  "webhook_by_events": false,
  "webhook_base64": false,
  "events": [
    "MESSAGES_UPSERT",
    "MESSAGES_UPDATE",
    "MESSAGES_DELETE",
    "SEND_MESSAGE",
    "CONNECTION_UPDATE",
    "QRCODE_UPDATED",
    "CONTACTS_UPSERT",
    "CONTACTS_UPDATE",
    "CHATS_UPSERT",
    "CHATS_UPDATE",
    "CHATS_DELETE",
    "GROUPS_UPSERT",
    "GROUPS_UPDATE",
    "GROUP_PARTICIPANTS_UPDATE",
    "PRESENCE_UPDATE",
    "CALL",
    "TYPEBOT_START",
    "TYPEBOT_CHANGE_STATUS"
  ]
}
```

### GET `/webhook/find/{instance}`

```http
GET /webhook/find/minha-instancia HTTP/1.1
apikey: sua-api-key
```

---

## 🔌 Integrações

### Chatwoot — POST `/chatwoot/set/{instance}`

```json
{
  "enabled": true,
  "account_id": "1",
  "token": "seu-token-chatwoot",
  "url": "https://app.chatwoot.com",
  "sign_msg": false,
  "reopen_conversation": false,
  "conversation_pending": false,
  "import_contacts": true,
  "name_inbox": "minha-instancia",
  "merge_brazil_contacts": true,
  "import_messages": true,
  "days_limit_import_messages": 60
}
```

---

### Typebot — POST `/typebot/set/{instance}`

```json
{
  "enabled": true,
  "url": "https://bot.exemplo.com",
  "typebot": "meu-flow",
  "triggerType": "keyword",
  "triggerOperator": "contains",
  "triggerValue": "oi",
  "expire": 20,
  "keywordFinish": "#sair",
  "delayMessage": 1000,
  "unknownMessage": "Não entendi",
  "listeningFromMe": false
}
```

### POST `/typebot/start/{instance}`

```json
{
  "url": "https://bot.exemplo.com",
  "typebot": "meu-flow",
  "remoteJid": "5511999999999@s.whatsapp.net",
  "startSession": false,
  "variables": [{ "name": "nome", "value": "João" }]
}
```

---

### OpenAI — POST `/openai/creds/{instance}`

```json
{ "name": "minha-openai", "apiKey": "sk-..." }
```

### POST `/openai/create/{instance}`

```json
{
  "enabled": true,
  "openaiCredsId": "id-da-credencial",
  "botType": "assistant",
  "assistantId": "asst_xxx",
  "model": "gpt-4o",
  "systemMessages": "Você é um assistente prestativo.",
  "maxTokens": 300,
  "triggerType": "keyword",
  "triggerOperator": "contains",
  "triggerValue": "oi",
  "expire": 20,
  "keywordFinish": "#sair",
  "delayMessage": 1000,
  "unknownMessage": "Não entendi",
  "listeningFromMe": false,
  "keepOpen": false,
  "debounceTime": 0
}
```

---

### Dify — POST `/dify/create/{instance}`

```json
{
  "enabled": true,
  "botType": "chatBot",
  "apiUrl": "https://api.dify.ai",
  "apiKey": "app-xxx",
  "triggerType": "keyword",
  "triggerOperator": "contains",
  "triggerValue": "oi",
  "expire": 20,
  "keywordFinish": "#sair",
  "delayMessage": 1000,
  "unknownMessage": "Não entendi",
  "listeningFromMe": false
}
```

---

### Flowise — POST `/flowise/create/{instance}`

```json
{
  "enabled": true,
  "apiUrl": "https://flowise.exemplo.com",
  "apiKey": "flowise-api-key",
  "chatflowId": "id-do-chatflow",
  "triggerType": "keyword",
  "triggerOperator": "contains",
  "triggerValue": "oi",
  "expire": 20,
  "keywordFinish": "#sair",
  "delayMessage": 1000,
  "unknownMessage": "Não entendi",
  "listeningFromMe": false
}
```

---

### Evolution Bot — POST `/evolutionBot/create/{instance}`

```json
{
  "enabled": true,
  "apiUrl": "https://meu-bot.com/webhook",
  "apiKey": "minha-chave",
  "triggerType": "keyword",
  "triggerOperator": "contains",
  "triggerValue": "oi",
  "expire": 20,
  "keywordFinish": "#sair",
  "delayMessage": 1000,
  "unknownMessage": "Não entendi",
  "listeningFromMe": false
}
```

---

### RabbitMQ — POST `/rabbitmq/set/{instance}`

```json
{ "enabled": true, "events": ["MESSAGES_UPSERT", "MESSAGES_UPDATE", "CONNECTION_UPDATE"] }
```

### SQS — POST `/sqs/set/{instance}`

```json
{ "enabled": true, "events": ["MESSAGES_UPSERT", "MESSAGES_UPDATE", "CONNECTION_UPDATE"] }
```

### WebSocket — POST `/websocket/set/{instance}`

```json
{ "enabled": true, "events": ["MESSAGES_UPSERT", "MESSAGES_UPDATE", "CONNECTION_UPDATE"] }
```

---

## 📌 Referência Rápida

| Item           | Formato                                             |
| :------------- | :-------------------------------------------------- |
| Número         | `5511999999999` (DDI+DDD+número)                    |
| JID individual | `5511999999999@s.whatsapp.net`                      |
| JID grupo      | `120363xxxxxxxxx@g.us`                              |
| Auth global    | Header `apikey: {AUTHENTICATION_API_KEY}` do `.env` |
| Auth instância | Header `apikey: {token da instância}`               |
| Delay          | Milissegundos (`1200` = 1.2s)                       |
| Mídia base64   | `data:image/jpeg;base64,{conteúdo}`                 |

---

_Fonte: [doc.evolution-api.com](https://doc.evolution-api.com)_[^1][^2][^3][^4]

<div align="center">⁂</div>

[^1]: https://doc.evolution-api.com/v2/api-reference/get-information

[^2]: https://doc.evolution-api.com/v2/api-reference/instance-controller/create-instance-basic

[^3]: https://doc.evolution-api.com/v2/api-reference/message-controller/send-text

[^4]: https://doc.evolution-api.com/v2/api-reference/webhook/set
