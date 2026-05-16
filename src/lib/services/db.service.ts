import { DEFAULT_CONVERSATION_CATEGORIES } from "@/lib/defaults/conversation-categories";

export interface D1Instance {
  id: string;
  name: string;
  alias?: string;
  api_key: string;
  webhook_token?: string;
  is_active: number;
  created_at: string;
}

export interface D1Contact {
  jid: string;
  instance_id: string;
  name?: string;
  phone?: string;
  type: "personal" | "business" | "lead" | "group";
  status: "novo" | "negociacao" | "qualificado" | "perdido";
  score: number;
  ai_enabled: number;
  prompt_id?: string;
  metadata?: string;
  updated_at: string;
}

export interface D1LeadLite {
  jid: string;
  name?: string;
  status?: "novo" | "negociacao" | "qualificado" | "perdido";
  category?: string;
  updated_at: string;
}

export interface D1LeadAiRow {
  jid: string;
  name?: string;
  status?: "novo" | "negociacao" | "qualificado" | "perdido";
  ai_enabled: number;
  updated_at: string;
}

export interface D1InstanceAiStatus {
  instance_id: string;
  total: number;
  enabled: number;
  disabled: number;
}

export interface D1Message {
  id: string;
  contact_id: string;
  from_me: number;
  content: string;
  type: string;
  timestamp: string;
  raw_message?: string;
}

export interface D1Prompt {
  id: string;
  name: string;
  content: string;
  category: string;
  scope_instance_id?: string | null;
  scope_tag?: string | null;
}

export interface ConversationCategorySettings {
  categories: string[];
  visibleCategories: string[];
}

export interface DispatchSettings {
  secretaria: string;
  comercial: string;
  followupNotify: string;
}

export const DISPATCH_SETTINGS_KEY = "dispatch_targets";

export interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = any>(): Promise<T | null>;
  run<T = any>(): Promise<{ success: boolean; meta: any; results: T[] }>;
  all<T = any>(): Promise<{ success: boolean; meta: any; results: T[] }>;
  raw<T = any>(): Promise<T[]>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = any>(
    statements: D1PreparedStatement[],
  ): Promise<{ success: boolean; meta: any; results: T[] }[]>;
  exec(query: string): Promise<{ count: number; duration: number }>;
}

export class DatabaseService {
  constructor(private db: D1Database) {}
  private promptScopeSupportCache: boolean | null = null;

  static readonly VALID_LEAD_FILTER = `
    type IN ('lead', 'personal', 'business')
    AND jid NOT LIKE '%@g.us'
    AND jid NOT LIKE '%@broadcast'
    AND jid NOT LIKE '%@lid'
  `;

  private normalizeCategory(raw: unknown): string {
    return String(raw || "")
      .trim()
      .toLowerCase();
  }

  private parseContactCategory(type?: string, metadata?: string): string {
    const safeType = this.normalizeCategory(type) || "lead";
    if (!metadata || typeof metadata !== "string") return safeType;
    try {
      const parsed = JSON.parse(metadata);
      const fromMetadata = this.normalizeCategory(parsed?.lead_category);
      return fromMetadata || safeType;
    } catch {
      return safeType;
    }
  }

  private sanitizeCategoryList(input: unknown, fallback: string[]): string[] {
    if (!Array.isArray(input)) return fallback;
    const normalized = input.map((v) => this.normalizeCategory(v)).filter(Boolean);
    const unique = Array.from(new Set(normalized));
    return unique.length > 0 ? unique : fallback;
  }

  private async ensureAppSettingsTable() {
    await this.db
      .prepare(
        `CREATE TABLE IF NOT EXISTS app_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
      )
      .run();
  }

  private buildJidVariations(jid: string): string[] {
    const clean = jid.split("@")[0].replace(/\D/g, "");
    const variations = [jid, clean];

    if (clean.startsWith("55") && clean.length > 11) {
      variations.push(clean.substring(2));
      variations.push(clean.substring(2) + "@s.whatsapp.net");
    } else {
      variations.push("55" + clean);
      variations.push("55" + clean + "@s.whatsapp.net");
      variations.push(clean + "@s.whatsapp.net");
    }

    return Array.from(new Set(variations.filter(Boolean)));
  }

  // Instances
  async getInstances(): Promise<D1Instance[]> {
    const { results } = await this.db.prepare("SELECT * FROM instances").all<D1Instance>();
    return results;
  }

  async upsertInstance(instance: Partial<D1Instance>) {
    return this.db
      .prepare(
        `
      INSERT INTO instances (id, name, alias, api_key, webhook_token, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        alias = excluded.alias,
        api_key = excluded.api_key,
        webhook_token = excluded.webhook_token,
        is_active = excluded.is_active
    `,
      )
      .bind(
        instance.id,
        instance.name,
        instance.alias,
        instance.api_key,
        instance.webhook_token,
        instance.is_active ?? 1,
      )
      .run();
  }

  async updateInstanceAlias(id: string, alias: string) {
    return this.db
      .prepare(
        `INSERT INTO instances (id, name, alias, api_key, webhook_token, is_active)
       VALUES (?, ?, ?, '', '', 0)
       ON CONFLICT(id) DO UPDATE SET alias = ?`,
      )
      .bind(id, id, alias, alias)
      .run();
  }

  // Contacts
  async getContact(jid: string): Promise<D1Contact | null> {
    const variations = this.buildJidVariations(jid);

    const placeholders = variations.map(() => "?").join(",");
    return this.db
      .prepare(
        `
      SELECT * FROM contacts 
      WHERE jid IN (${placeholders}) 
      ORDER BY updated_at DESC
      LIMIT 1
    `,
      )
      .bind(...variations)
      .first<D1Contact>();
  }

  async getContactByJid(jid: string) {
    return this.getContact(jid);
  }

  async getContacts(instanceId?: string): Promise<D1Contact[]> {
    const filter = DatabaseService.VALID_LEAD_FILTER;
    let query = `SELECT jid, instance_id, name, type, status, score, ai_enabled, metadata, updated_at FROM contacts WHERE ${filter}`;
    const params: unknown[] = [];
    if (instanceId) {
      query += " AND instance_id = ?";
      params.push(instanceId);
    }
    query += " ORDER BY updated_at DESC";
    const { results } = await this.db
      .prepare(query)
      .bind(...params)
      .all<D1Contact>();
    return results;
  }

  async getContactsLite(instanceId?: string): Promise<D1LeadLite[]> {
    let query = "SELECT jid, name, status, type, metadata, updated_at FROM contacts";
    const params: any[] = [];

    if (instanceId) {
      query += " WHERE instance_id = ?";
      params.push(instanceId);
    }

    query += " ORDER BY updated_at DESC";

    const { results } = await this.db
      .prepare(query)
      .bind(...params)
      .all<
        D1LeadLite & {
          type?: string;
          metadata?: string;
        }
      >();

    return results.map((r: any) => ({
      jid: r.jid,
      name: r.name,
      status: r.status,
      category: this.parseContactCategory(r.type, r.metadata),
      updated_at: r.updated_at,
    }));
  }

  async getLeadsForAi(instanceId: string): Promise<D1LeadAiRow[]> {
    const { results } = await this.db
      .prepare(
        `
        SELECT jid, name, status, ai_enabled, updated_at
        FROM contacts
        WHERE instance_id = ?
          AND type IN ('lead', 'personal', 'business')
        ORDER BY updated_at DESC
      `,
      )
      .bind(instanceId)
      .all<D1LeadAiRow>();
    return results;
  }

  async getInstanceAiStatus(instanceId: string): Promise<D1InstanceAiStatus> {
    const row = await this.db
      .prepare(
        `
        SELECT
          ? AS instance_id,
          COUNT(*) AS total,
          SUM(CASE WHEN ai_enabled = 1 THEN 1 ELSE 0 END) AS enabled
        FROM contacts
        WHERE instance_id = ?
          AND type IN ('lead', 'personal', 'business')
      `,
      )
      .bind(instanceId, instanceId)
      .first<{ instance_id?: string; total?: number | string; enabled?: number | string }>();

    const total = Number(row?.total ?? 0);
    const enabled = Number(row?.enabled ?? 0);
    return {
      instance_id: row?.instance_id || instanceId,
      total: Number.isFinite(total) ? total : 0,
      enabled: Number.isFinite(enabled) ? enabled : 0,
      disabled: Math.max(
        0,
        (Number.isFinite(total) ? total : 0) - (Number.isFinite(enabled) ? enabled : 0),
      ),
    };
  }

  async ensureContact(input: { jid: string; instance_id: string; name?: string; phone?: string }) {
    const existing = await this.getContact(input.jid);
    if (existing) return existing;

    await this.upsertContact({
      jid: input.jid,
      instance_id: input.instance_id,
      name: input.name || input.jid.split("@")[0],
      phone: input.phone || input.jid.split("@")[0],
      type: input.jid.includes("@g.us") ? "group" : "lead",
      status: "novo",
      ai_enabled: 0,
      score: 0,
      metadata: "{}",
    });

    return this.getContact(input.jid);
  }

  async upsertContact(contact: Partial<D1Contact>) {
    return this.db
      .prepare(
        `
      INSERT INTO contacts (jid, instance_id, name, phone, type, status, score, ai_enabled, prompt_id, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(jid) DO UPDATE SET
        name = COALESCE(excluded.name, contacts.name),
        phone = COALESCE(excluded.phone, contacts.phone),
        type = COALESCE(excluded.type, contacts.type),
        updated_at = CURRENT_TIMESTAMP
    `,
      )
      .bind(
        contact.jid,
        contact.instance_id,
        contact.name,
        contact.phone,
        contact.type ?? "lead",
        contact.status ?? "novo",
        contact.score ?? 0,
        contact.ai_enabled ?? 0,
        contact.prompt_id,
        contact.metadata,
      )
      .run();
  }

  async updateContact(jid: string, updates: Partial<D1Contact>, instanceId?: string) {
    // Para garantir que atualiza o contato certo mesmo se o jid mudar de formato,
    // buscamos primeiro o contato com a lógica "smart"
    const contact = await this.getContact(jid);

    if (!contact) {
      // Se não existe, usamos o upsertContact para criá-lo!
      const fallbackInstanceId = instanceId || (updates.instance_id as string) || "default";
      await this.upsertContact({
        jid,
        instance_id: fallbackInstanceId,
        name: updates.name ?? jid.split("@")[0],
        phone: updates.phone ?? jid.split("@")[0],
        type: updates.type ?? "lead",
        status: updates.status ?? "novo",
        score: updates.score ?? 0,
        ai_enabled: updates.ai_enabled ?? 0,
        prompt_id: updates.prompt_id,
        metadata: updates.metadata ?? "{}",
      });

      // If this call was only to ensure existence, we're done.
      if (Object.keys(updates).length === 0) {
        return { success: true };
      }

      const created = await this.getContact(jid);
      if (!created) {
        return { success: false, error: "failed_to_create_contact" };
      }

      const entries = Object.entries(updates);
      if (entries.length === 0) return { success: true };

      const setClause = entries.map(([key]) => `${key} = ?`).join(", ");
      const params = entries.map(([, value]) => value);
      const variationSet = new Set(this.buildJidVariations(jid));
      variationSet.add(created.jid);
      const targets = Array.from(variationSet);
      const placeholders = targets.map(() => "?").join(", ");
      return this.db
        .prepare(
          `
      UPDATE contacts 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE jid IN (${placeholders})
    `,
        )
        .bind(...params, ...targets)
        .run();
    }

    const entries = Object.entries(updates);
    if (entries.length === 0) return { success: true };
    const variationSet = new Set(this.buildJidVariations(jid));
    variationSet.add(contact.jid);
    const targets = Array.from(variationSet);
    const placeholders = targets.map(() => "?").join(", ");
    const setClause = entries.map(([key]) => `${key} = ?`).join(", ");
    const params = entries.map(([, value]) => value);

    return this.db
      .prepare(
        `
      UPDATE contacts 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE jid IN (${placeholders})
    `,
      )
      .bind(...params, ...targets)
      .run();
  }

  // Messages
  async saveMessage(msg: Partial<D1Message>) {
    return this.db
      .prepare(
        `
      INSERT INTO messages (id, contact_id, from_me, content, type, raw_message, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO NOTHING
    `,
      )
      .bind(
        msg.id,
        msg.contact_id,
        msg.from_me,
        msg.content,
        msg.type ?? "text",
        msg.raw_message ?? null,
        msg.timestamp ?? new Date().toISOString(),
      )
      .run();
  }

  async getMessages(contactId: string, limit = 50): Promise<D1Message[]> {
    const { results } = await this.db
      .prepare(
        "SELECT id, contact_id, from_me, content, type, raw_message, timestamp FROM messages WHERE contact_id = ? ORDER BY timestamp DESC LIMIT ?",
      )
      .bind(contactId, limit)
      .all<D1Message>();
    return results.reverse();
  }

  async getMessagesSmart(contactId: string, limit = 50): Promise<D1Message[]> {
    let clean = contactId.split("@")[0].replace(/\D/g, "");
    let variations = [contactId, clean];

    if (clean.startsWith("55") && clean.length > 11) {
      variations.push(clean.substring(2));
      variations.push(clean.substring(2) + "@s.whatsapp.net");
    } else {
      variations.push("55" + clean);
      variations.push("55" + clean + "@s.whatsapp.net");
    }

    const placeholders = variations.map(() => "?").join(",");
    const { results } = await this.db
      .prepare(
        `
      SELECT id, contact_id, from_me, content, type, raw_message, timestamp FROM messages
      WHERE contact_id IN (${placeholders})
      ORDER BY timestamp DESC LIMIT ?
    `,
      )
      .bind(...variations, limit)
      .all<D1Message>();

    return results.reverse();
  }

  async getMessagesByContact(contactId: string, limit = 50) {
    return this.getMessagesSmart(contactId, limit);
  }

  private buildWeeklyQualifiedSeries(
    rows: { week_start: string; count: number }[],
  ): { week_start: string; count: number }[] {
    const weekMap = new Map<string, number>();
    for (const row of rows) {
      weekMap.set(row.week_start, row.count);
    }
    const series: { week_start: string; count: number }[] = [];
    const now = new Date();
    const anchor = new Date(now);
    anchor.setHours(12, 0, 0, 0);
    anchor.setDate(anchor.getDate() - anchor.getDay());
    for (let i = 17; i >= 0; i--) {
      const d = new Date(anchor);
      d.setDate(d.getDate() - i * 7);
      const key = d.toISOString().slice(0, 10);
      series.push({ week_start: key, count: weekMap.get(key) ?? 0 });
    }
    return series;
  }

  // Analytics
  async getAnalyticsMetrics() {
    const validLeadFilter = DatabaseService.VALID_LEAD_FILTER;

    const totalContacts = await this.db
      .prepare(`SELECT COUNT(*) as count FROM contacts WHERE ${validLeadFilter}`)
      .first<{ count: number }>();

    const newToday = await this.db
      .prepare(
        `SELECT COUNT(*) as count FROM (
          SELECT c.jid
          FROM contacts c
          WHERE ${validLeadFilter}
            AND (
              date(c.updated_at, 'localtime') = date('now', 'localtime')
              AND NOT EXISTS (
                SELECT 1 FROM messages m
                WHERE m.contact_id = c.jid
                  AND date(m.timestamp, 'localtime') < date('now', 'localtime')
              )
            )
        )`,
      )
      .first<{ count: number }>();

    const inNegotiation = await this.db
      .prepare(
        `SELECT COUNT(*) as count FROM contacts WHERE ${validLeadFilter} AND status = 'negociacao'`,
      )
      .first<{ count: number }>();

    const avgResponse = await this.db
      .prepare(
        `SELECT AVG(diff_ms) as avg_ms FROM (
          SELECT
            (julianday(timestamp) - julianday(prev_timestamp)) * 86400000 as diff_ms,
            from_me,
            prev_from_me
          FROM (
            SELECT
              contact_id,
              timestamp,
              from_me,
              LAG(timestamp) OVER (PARTITION BY contact_id ORDER BY timestamp) as prev_timestamp,
              LAG(from_me) OVER (PARTITION BY contact_id ORDER BY timestamp) as prev_from_me
            FROM messages
            WHERE contact_id IN (SELECT jid FROM contacts WHERE ${validLeadFilter})
          )
        )
        WHERE diff_ms IS NOT NULL
          AND diff_ms > 0
          AND diff_ms < 86400000
          AND from_me = 1
          AND prev_from_me = 0`,
      )
      .first<{ avg_ms: number | null }>();

    const conversion = await this.db
      .prepare(
        `SELECT 
        SUM(CASE WHEN status = 'qualificado' THEN 1 ELSE 0 END) as qualified,
        SUM(CASE WHEN status = 'perdido' THEN 1 ELSE 0 END) as lost,
        SUM(CASE WHEN status IN ('qualificado', 'perdido') THEN 1 ELSE 0 END) as total
      FROM contacts
      WHERE ${validLeadFilter}`,
      )
      .first<{ qualified: number; lost: number; total: number }>();

    const aiAutomations = await this.db
      .prepare(
        `SELECT COUNT(*) as count FROM messages m 
       JOIN contacts c ON m.contact_id = c.jid 
       WHERE m.from_me = 1
         AND (m.raw_message LIKE '%"ai_generated":true%' OR m.raw_message LIKE '%"ai_generated": true%')
         AND ${validLeadFilter.replaceAll("jid", "c.jid").replaceAll("type", "c.type")}`,
      )
      .first<{ count: number }>();

    const aiEnabledLeads = await this.db
      .prepare(`SELECT COUNT(*) as count FROM contacts WHERE ${validLeadFilter} AND ai_enabled = 1`)
      .first<{ count: number }>();

    const messagesToday = await this.db
      .prepare(
        `SELECT COUNT(*) as count
         FROM messages
         WHERE date(timestamp, 'localtime') = date('now', 'localtime')
           AND contact_id IN (SELECT jid FROM contacts WHERE ${validLeadFilter})`,
      )
      .first<{ count: number }>();

    const avgScore = await this.db
      .prepare(`SELECT AVG(score) as avg_score FROM contacts WHERE ${validLeadFilter}`)
      .first<{ avg_score: number | null }>();

    const weeklyRaw = await this.db
      .prepare(
        `SELECT date(updated_at, 'weekday 0', '-6 days') as week_start, COUNT(*) as count
       FROM contacts 
       WHERE ${validLeadFilter} AND status = 'qualificado' AND updated_at >= date('now', '-125 days')
       GROUP BY week_start
       ORDER BY week_start`,
      )
      .all<{ week_start: string; count: number }>();

    const weeklyQualified = this.buildWeeklyQualifiedSeries(weeklyRaw.results ?? []);

    const prevWeekQualified = weeklyQualified.slice(0, 17).reduce((sum, w) => sum + w.count, 0);
    const currentWeekQualified = weeklyQualified[17]?.count ?? 0;

    return {
      totalContacts: totalContacts?.count ?? 0,
      newToday: newToday?.count ?? 0,
      inNegotiation: inNegotiation?.count ?? 0,
      avgResponseMs: avgResponse?.avg_ms ?? 0,
      conversionRate: conversion?.total ? (conversion.qualified / conversion.total) * 100 : 0,
      aiAutomations: aiAutomations?.count ?? 0,
      aiEnabledLeads: aiEnabledLeads?.count ?? 0,
      messagesToday: messagesToday?.count ?? 0,
      avgScore: avgScore?.avg_score ?? 0,
      qualifiedCount: conversion?.qualified ?? 0,
      lostCount: conversion?.lost ?? 0,
      weeklyQualified,
      prevWeekQualified,
      currentWeekQualified,
    };
  }

  // Prompts (getPrompt already exists below)

  private async supportsPromptScopes(): Promise<boolean> {
    if (this.promptScopeSupportCache !== null) return this.promptScopeSupportCache;
    try {
      const { results } = await this.db
        .prepare("PRAGMA table_info(prompts_library)")
        .all<{ name: string }>();
      const names = new Set((results || []).map((r: any) => r.name));
      this.promptScopeSupportCache = names.has("scope_instance_id") && names.has("scope_tag");
      return this.promptScopeSupportCache;
    } catch {
      this.promptScopeSupportCache = false;
      return false;
    }
  }

  private async ensurePromptScopeColumns(): Promise<boolean> {
    const hasScopes = await this.supportsPromptScopes();
    if (hasScopes) return true;
    try {
      await this.db.prepare("ALTER TABLE prompts_library ADD COLUMN scope_instance_id TEXT").run();
    } catch {}
    try {
      await this.db.prepare("ALTER TABLE prompts_library ADD COLUMN scope_tag TEXT").run();
    } catch {}
    try {
      await this.db
        .prepare(
          "CREATE INDEX IF NOT EXISTS idx_prompts_scope_instance ON prompts_library(scope_instance_id)",
        )
        .run();
    } catch {}
    try {
      await this.db
        .prepare("CREATE INDEX IF NOT EXISTS idx_prompts_scope_tag ON prompts_library(scope_tag)")
        .run();
    } catch {}
    try {
      await this.db
        .prepare(
          "CREATE INDEX IF NOT EXISTS idx_prompts_scope_instance_tag ON prompts_library(scope_instance_id, scope_tag)",
        )
        .run();
    } catch {}

    this.promptScopeSupportCache = null;
    return this.supportsPromptScopes();
  }

  async getPrompts() {
    const hasScopes = await this.supportsPromptScopes();
    if (hasScopes) {
      const { results } = await this.db
        .prepare(
          `
          SELECT id, name, content, category, scope_instance_id, scope_tag
          FROM prompts_library
          ORDER BY name
        `,
        )
        .all<D1Prompt>();
      return results;
    }
    const { results } = await this.db
      .prepare("SELECT id, name, content, category FROM prompts_library ORDER BY name")
      .all<D1Prompt>();
    return results.map((p: any) => ({ ...p, scope_instance_id: null, scope_tag: null }));
  }

  async savePrompt(prompt: {
    id?: string;
    name: string;
    content: string;
    category?: string;
    scope_instance_id?: string | null;
    scope_tag?: string | null;
  }) {
    let hasScopes = await this.supportsPromptScopes();
    if (!hasScopes) {
      hasScopes = await this.ensurePromptScopeColumns();
    }
    const scopeTag = (prompt.scope_tag || "").trim().toLowerCase() || null;
    const scopeInstanceId = (prompt.scope_instance_id || "").trim() || null;
    if (prompt.id) {
      if (!hasScopes) {
        return this.db
          .prepare("UPDATE prompts_library SET name = ?, content = ?, category = ? WHERE id = ?")
          .bind(prompt.name, prompt.content, prompt.category ?? "sales", prompt.id)
          .run();
      }
      return this.db
        .prepare(
          "UPDATE prompts_library SET name = ?, content = ?, category = ?, scope_instance_id = ?, scope_tag = ? WHERE id = ?",
        )
        .bind(
          prompt.name,
          prompt.content,
          prompt.category ?? "sales",
          scopeInstanceId,
          scopeTag,
          prompt.id,
        )
        .run();
    }
    const id = prompt.id || `prompt_${Date.now()}`;
    if (!hasScopes) {
      return this.db
        .prepare("INSERT INTO prompts_library (id, name, content, category) VALUES (?, ?, ?, ?)")
        .bind(id, prompt.name, prompt.content, prompt.category ?? "sales")
        .run();
    }
    return this.db
      .prepare(
        "INSERT INTO prompts_library (id, name, content, category, scope_instance_id, scope_tag) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .bind(id, prompt.name, prompt.content, prompt.category ?? "sales", scopeInstanceId, scopeTag)
      .run();
  }

  async updateContactStatus(jid: string, status: string) {
    const contact = await this.getContact(jid);
    if (!contact) return { ok: false, error: "not_found" };
    return this.db
      .prepare("UPDATE contacts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE jid = ?")
      .bind(status, contact.jid)
      .run();
  }

  async getPrompt(id: string) {
    const hasScopes = await this.supportsPromptScopes();
    if (hasScopes) {
      return this.db
        .prepare(
          "SELECT id, name, content, category, scope_instance_id, scope_tag FROM prompts_library WHERE id = ?",
        )
        .bind(id)
        .first<D1Prompt>();
    }
    const base = await this.db
      .prepare("SELECT id, name, content, category FROM prompts_library WHERE id = ?")
      .bind(id)
      .first<D1Prompt>();
    if (!base) return null;
    return { ...base, scope_instance_id: null, scope_tag: null };
  }

  private normalizeTags(raw: unknown): string[] {
    if (!Array.isArray(raw)) return [];
    return raw.map((t) => (typeof t === "string" ? t.trim().toLowerCase() : "")).filter(Boolean);
  }

  async resolvePromptForContact(contact: D1Contact): Promise<D1Prompt | null> {
    if (contact.prompt_id) {
      const explicit = await this.getPrompt(contact.prompt_id);
      if (explicit) return explicit;
    }

    let tags: string[] = [];
    try {
      const parsed = contact.metadata ? JSON.parse(contact.metadata) : {};
      tags = this.normalizeTags(parsed?.tags);
    } catch {
      tags = [];
    }

    const promptRows = await this.getPrompts();

    // 1) instance + tag
    const byInstanceAndTag = promptRows.find(
      (p: any) =>
        p.scope_instance_id === contact.instance_id &&
        !!p.scope_tag &&
        tags.includes((p.scope_tag || "").toLowerCase()),
    );
    if (byInstanceAndTag) return byInstanceAndTag;

    // 2) instance-only
    const byInstance = promptRows.find(
      (p: any) => p.scope_instance_id === contact.instance_id && !p.scope_tag,
    );
    if (byInstance) return byInstance;

    // 3) tag-only (global by tag)
    const byTagGlobal = promptRows.find(
      (p: any) =>
        !p.scope_instance_id && !!p.scope_tag && tags.includes((p.scope_tag || "").toLowerCase()),
    );
    if (byTagGlobal) return byTagGlobal;

    // 4) pure global
    const globalPrompt = promptRows.find((p: any) => !p.scope_instance_id && !p.scope_tag);
    if (globalPrompt) return globalPrompt;

    return null;
  }

  async setAiEnabledForInstance(instanceId: string, enabled: number) {
    return this.db
      .prepare(
        `
        UPDATE contacts
        SET ai_enabled = ?, updated_at = CURRENT_TIMESTAMP
        WHERE instance_id = ?
          AND type IN ('lead', 'personal', 'business')
      `,
      )
      .bind(enabled ? 1 : 0, instanceId)
      .run();
  }

  async setAiEnabledForJids(
    instanceId: string,
    jids: string[],
    enabled: number,
  ): Promise<{ success: boolean; updated: number }> {
    const unique = Array.from(new Set((jids || []).filter(Boolean)));
    if (unique.length === 0) return { success: true, updated: 0 };

    const placeholders = unique.map(() => "?").join(", ");
    const result = await this.db
      .prepare(
        `
        UPDATE contacts
        SET ai_enabled = ?, updated_at = CURRENT_TIMESTAMP
        WHERE instance_id = ?
          AND jid IN (${placeholders})
      `,
      )
      .bind(enabled ? 1 : 0, instanceId, ...unique)
      .run();

    return { success: true, updated: (result.meta as any)?.changes ?? 0 };
  }

  async getAppSetting<T>(key: string, fallback: T): Promise<T> {
    await this.ensureAppSettingsTable();
    const row = await this.db
      .prepare("SELECT value FROM app_settings WHERE key = ?")
      .bind(key)
      .first<{ value?: string }>();
    if (!row?.value) return fallback;
    try {
      return JSON.parse(row.value) as T;
    } catch {
      return fallback;
    }
  }

  async setAppSetting(key: string, value: unknown): Promise<void> {
    await this.ensureAppSettingsTable();
    await this.db
      .prepare(
        `INSERT INTO app_settings (key, value, updated_at)
         VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
      )
      .bind(key, JSON.stringify(value))
      .run();
  }

  async getDispatchSettings(): Promise<DispatchSettings> {
    return this.getAppSetting<DispatchSettings>(DISPATCH_SETTINGS_KEY, {
      secretaria: "",
      comercial: "",
      followupNotify: "",
    });
  }

  async setDispatchSettings(settings: DispatchSettings): Promise<DispatchSettings> {
    const next = {
      secretaria: String(settings.secretaria || "").replace(/\D/g, ""),
      comercial: String(settings.comercial || "").replace(/\D/g, ""),
      followupNotify: String(settings.followupNotify || "").replace(/\D/g, ""),
    };
    await this.setAppSetting(DISPATCH_SETTINGS_KEY, next);
    return next;
  }

  async appendContactTimeline(
    jid: string,
    entry: { type: string; at: string; target: string; preview: string },
  ) {
    const contact = await this.getContact(jid);
    if (!contact) return { ok: false, error: "not_found" };
    let metadata: Record<string, unknown> = {};
    if (contact.metadata) {
      try {
        metadata = JSON.parse(contact.metadata);
      } catch {
        metadata = {};
      }
    }
    const timeline = Array.isArray(metadata.timeline) ? [...metadata.timeline] : [];
    timeline.push(entry);
    metadata.timeline = timeline.slice(-50);
    return this.updateContact(jid, { metadata: JSON.stringify(metadata) }, contact.instance_id);
  }

  async getConversationCategorySettings(): Promise<ConversationCategorySettings> {
    await this.ensureAppSettingsTable();
    const defaults: ConversationCategorySettings = {
      categories: [...DEFAULT_CONVERSATION_CATEGORIES],
      visibleCategories: ["lead", "group"],
    };

    const row = await this.db
      .prepare("SELECT value FROM app_settings WHERE key = ?")
      .bind("conversation_categories")
      .first<{ value?: string }>();

    if (!row?.value) return defaults;

    try {
      const parsed = JSON.parse(row.value);
      const categories = this.sanitizeCategoryList(parsed?.categories, defaults.categories);
      const visibleRaw = this.sanitizeCategoryList(
        parsed?.visibleCategories,
        defaults.visibleCategories,
      );
      const visible = visibleRaw.filter((c) => categories.includes(c));
      return {
        categories,
        visibleCategories: visible.length > 0 ? visible : defaults.visibleCategories,
      };
    } catch {
      return defaults;
    }
  }

  async setConversationCategorySettings(
    settings: ConversationCategorySettings,
  ): Promise<ConversationCategorySettings> {
    await this.ensureAppSettingsTable();
    const defaults = await this.getConversationCategorySettings();
    const categories = this.sanitizeCategoryList(settings.categories, defaults.categories);
    const visibleRaw = this.sanitizeCategoryList(
      settings.visibleCategories,
      defaults.visibleCategories,
    );
    const visibleCategories = visibleRaw.filter((c) => categories.includes(c));
    const next: ConversationCategorySettings = {
      categories,
      visibleCategories:
        visibleCategories.length > 0 ? visibleCategories : defaults.visibleCategories,
    };

    await this.db
      .prepare(
        `INSERT INTO app_settings (key, value, updated_at)
         VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
      )
      .bind("conversation_categories", JSON.stringify(next))
      .run();

    return next;
  }
}
