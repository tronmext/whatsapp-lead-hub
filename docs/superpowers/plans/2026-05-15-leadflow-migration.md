# Leadflow Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all mock data with a Cloudflare D1 database and integrate real-time communication via Evolution API v2.

**Architecture:** Modular service layer (EvolutionService, AIService, PersistenceService) with a centralized Event Orchestrator for webhooks.

**Tech Stack:** TanStack Start (Vite + React), Cloudflare D1, Evolution API v2, Bun.

---

### Task 1: Infrastructure & Database Schema

**Files:**

- Modify: `/home/guilherme/Documentos/GG.AI/PLATAFORMAS/whatsapp-lead-hub/wrangler.jsonc`
- Create: `/home/guilherme/Documentos/GG.AI/PLATAFORMAS/whatsapp-lead-hub/migrations/0000_initial_schema.sql`
- Create: `/home/guilherme/Documentos/GG.AI/PLATAFORMAS/whatsapp-lead-hub/.env.example`

- [ ] **Step 1: Define the D1 Schema**
      Create the initial migration file with tables for instances, contacts, messages, and prompts.

```sql
-- migrations/0000_initial_schema.sql
CREATE TABLE IF NOT EXISTS instances (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    api_key TEXT NOT NULL,
    webhook_token TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contacts (
    jid TEXT PRIMARY KEY,
    instance_id TEXT NOT NULL,
    name TEXT,
    phone TEXT,
    type TEXT CHECK(type IN ('personal', 'business', 'lead', 'group')) DEFAULT 'lead',
    status TEXT CHECK(status IN ('novo', 'negociacao', 'qualificado', 'perdido')) DEFAULT 'novo',
    score INTEGER DEFAULT 0,
    ai_enabled INTEGER DEFAULT 0,
    prompt_id TEXT,
    metadata TEXT, -- JSON string
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instance_id) REFERENCES instances(id)
);

CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    contact_id TEXT NOT NULL,
    from_me INTEGER NOT NULL,
    content TEXT,
    type TEXT DEFAULT 'text',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contact_id) REFERENCES contacts(jid)
);

CREATE TABLE IF NOT EXISTS prompts_library (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT CHECK(category IN ('sales', 'tech', 'summary', 'referral')) DEFAULT 'sales'
);
```

- [ ] **Step 2: Initialize D1 in wrangler.jsonc**
      Update the configuration with the D1 binding (using placeholder for now).

- [ ] **Step 3: Create .env.example**
      Document required environment variables.

```env
EVOLUTION_API_BASE_URL=https://sua-instancia.com
EVOLUTION_API_GLOBAL_KEY=sua-api-key-global
EVOLUTION_WEBHOOK_TOKEN=token-de-seguranca
OPENAI_API_KEY=sk-...
```

### Task 2: Evolution API Service Layer

**Files:**

- Create: `/home/guilherme/Documentos/GG.AI/PLATAFORMAS/whatsapp-lead-hub/src/lib/services/evolution.service.ts`

- [ ] **Step 1: Implement base EvolutionService**
      Create a class to handle authenticated requests to Evolution API.

```typescript
export class EvolutionService {
  constructor(
    private baseUrl: string,
    private globalKey: string,
  ) {}

  async fetchInstances() {
    const res = await fetch(`${this.baseUrl}/instance/fetchInstances`, {
      headers: { apikey: this.globalKey },
    });
    return res.json();
  }

  async sendMessage(instance: string, number: string, text: string) {
    const res = await fetch(`${this.baseUrl}/message/sendText/${instance}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: this.globalKey,
      },
      body: JSON.stringify({ number, text }),
    });
    return res.json();
  }
}
```

### Task 3: Database Service Layer (D1)

**Files:**

- Create: `/home/guilherme/Documentos/GG.AI/PLATAFORMAS/whatsapp-lead-hub/src/lib/services/db.service.ts`

- [ ] **Step 1: Implement DatabaseService**
      Create a wrapper for D1 operations using the `DB` binding.

```typescript
export class DatabaseService {
  constructor(private db: D1Database) {}

  async getContact(jid: string) {
    return this.db.prepare("SELECT * FROM contacts WHERE jid = ?").bind(jid).first();
  }

  async upsertContact(contact: any) {
    return this.db
      .prepare(
        `
      INSERT INTO contacts (jid, instance_id, name, phone, type)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(jid) DO UPDATE SET
        name = excluded.name,
        updated_at = CURRENT_TIMESTAMP
    `,
      )
      .bind(contact.jid, contact.instance_id, contact.name, contact.phone, contact.type)
      .run();
  }
}
```

### Task 4: Webhook Orchestrator Update

**Files:**

- Modify: `/home/guilherme/Documentos/GG.AI/PLATAFORMAS/whatsapp-lead-hub/src/routes/api/public/evolution.webhook.ts`

- [ ] **Step 1: Connect Webhook to Services**
      Update the existing handler to use the new services for persistence and AI response.
