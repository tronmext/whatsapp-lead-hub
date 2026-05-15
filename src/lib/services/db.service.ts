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
  type: 'personal' | 'business' | 'lead' | 'group';
  status: 'novo' | 'negociacao' | 'qualificado' | 'perdido';
  score: number;
  ai_enabled: number;
  prompt_id?: string;
  metadata?: string;
  updated_at: string;
}

export interface D1Message {
  id: string;
  contact_id: string;
  from_me: number;
  content: string;
  type: string;
  timestamp: string;
}

export class DatabaseService {
  constructor(private db: D1Database) {}

  // Instances
  async getInstances(): Promise<D1Instance[]> {
    const { results } = await this.db.prepare("SELECT * FROM instances").all<D1Instance>();
    return results;
  }

  async upsertInstance(instance: Partial<D1Instance>) {
    return this.db.prepare(`
      INSERT INTO instances (id, name, alias, api_key, webhook_token, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        alias = excluded.alias,
        api_key = excluded.api_key,
        webhook_token = excluded.webhook_token,
        is_active = excluded.is_active
    `).bind(instance.id, instance.name, instance.alias, instance.api_key, instance.webhook_token, instance.is_active ?? 1).run();
  }

  async updateInstanceAlias(id: string, alias: string) {
    return this.db.prepare(
      `INSERT INTO instances (id, name, alias, api_key, webhook_token, is_active)
       VALUES (?, ?, ?, '', '', 0)
       ON CONFLICT(id) DO UPDATE SET alias = ?`
    ).bind(id, id, alias, alias).run();
  }

  // Contacts
  async getContact(jid: string): Promise<D1Contact | null> {
    let clean = jid.split('@')[0].replace(/\D/g, '');
    let variations = [jid, clean];
    
    if (clean.startsWith('55') && clean.length > 11) {
      variations.push(clean.substring(2));
      variations.push(clean.substring(2) + '@s.whatsapp.net');
    } else {
      variations.push('55' + clean);
      variations.push('55' + clean + '@s.whatsapp.net');
    }

    const placeholders = variations.map(() => "?").join(",");
    return this.db.prepare(`
      SELECT * FROM contacts 
      WHERE jid IN (${placeholders}) 
      LIMIT 1
    `).bind(...variations).first<D1Contact>();
  }

  async getContactByJid(jid: string) {
    return this.getContact(jid);
  }

  async getContacts(instanceId?: string): Promise<D1Contact[]> {
    let query = "SELECT * FROM contacts";
    let params: any[] = [];
    if (instanceId) {
      query += " WHERE instance_id = ?";
      params.push(instanceId);
    }
    const { results } = await this.db.prepare(query).bind(...params).all<D1Contact>();
    return results;
  }

  async upsertContact(contact: Partial<D1Contact>) {
    return this.db.prepare(`
      INSERT INTO contacts (jid, instance_id, name, phone, type, status, score, ai_enabled, prompt_id, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(jid) DO UPDATE SET
        name = COALESCE(excluded.name, contacts.name),
        phone = COALESCE(excluded.phone, contacts.phone),
        type = COALESCE(excluded.type, contacts.type),
        updated_at = CURRENT_TIMESTAMP
    `).bind(
      contact.jid, 
      contact.instance_id, 
      contact.name, 
      contact.phone, 
      contact.type ?? 'lead',
      contact.status ?? 'novo',
      contact.score ?? 0,
      contact.ai_enabled ?? 0,
      contact.prompt_id,
      contact.metadata
    ).run();
  }

  async updateContact(jid: string, updates: Partial<D1Contact>) {
    // Para garantir que atualiza o contato certo mesmo se o jid mudar de formato,
    // buscamos primeiro o contato com a lógica "smart"
    const contact = await this.getContact(jid);
    
    if (!contact) {
      // Se não existe, usamos o upsertContact para criá-lo!
      return this.upsertContact({ jid, ...updates });
    }

    const targetJid = contact.jid;

    const entries = Object.entries(updates);
    const setClause = entries.map(([key]) => `${key} = ?`).join(", ");
    const params = entries.map(([, value]) => value);
    
    return this.db.prepare(`
      UPDATE contacts 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE jid = ?
    `).bind(...params, targetJid).run();
  }

  // Messages
  async saveMessage(msg: Partial<D1Message>) {
    return this.db.prepare(`
      INSERT INTO messages (id, contact_id, from_me, content, type, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO NOTHING
    `).bind(msg.id, msg.contact_id, msg.from_me, msg.content, msg.type ?? 'text', msg.timestamp ?? new Date().toISOString()).run();
  }

  async getMessages(contactId: string, limit = 50): Promise<D1Message[]> {
    const { results } = await this.db.prepare("SELECT * FROM messages WHERE contact_id = ? ORDER BY timestamp DESC LIMIT ?")
      .bind(contactId, limit).all<D1Message>();
    return results.reverse();
  }

  async getMessagesSmart(contactId: string, limit = 50): Promise<D1Message[]> {
    let clean = contactId.split('@')[0].replace(/\D/g, '');
    let variations = [contactId, clean];
    
    if (clean.startsWith('55') && clean.length > 11) {
      variations.push(clean.substring(2));
      variations.push(clean.substring(2) + '@s.whatsapp.net');
    } else {
      variations.push('55' + clean);
      variations.push('55' + clean + '@s.whatsapp.net');
    }

    const placeholders = variations.map(() => "?").join(",");
    const { results } = await this.db.prepare(`
      SELECT * FROM messages 
      WHERE contact_id IN (${placeholders}) 
      ORDER BY timestamp DESC LIMIT ?
    `).bind(...variations, limit).all<D1Message>();
    
    return results.reverse();
  }

  async getMessagesByContact(contactId: string, limit = 50) {
    return this.getMessagesSmart(contactId, limit);
  }

  // Analytics
  async getAnalyticsMetrics() {
    const totalContacts = await this.db.prepare("SELECT COUNT(*) as count FROM contacts").first<{ count: number }>();
    
    const newToday = await this.db.prepare(
      "SELECT COUNT(*) as count FROM contacts WHERE date(updated_at) = date('now')"
    ).first<{ count: number }>();
    
    const inNegotiation = await this.db.prepare(
      "SELECT COUNT(*) as count FROM contacts WHERE status = 'negociacao'"
    ).first<{ count: number }>();
    
    const avgResponse = await this.db.prepare(
      `SELECT AVG(diff) as avg_ms FROM (
        SELECT (julianday(timestamp) - julianday(LAG(timestamp) OVER (PARTITION BY contact_id ORDER BY timestamp))) * 86400000 as diff
        FROM messages
      ) WHERE diff IS NOT NULL AND diff > 0`
    ).first<{ avg_ms: number | null }>();
    
    const conversion = await this.db.prepare(
      `SELECT 
        SUM(CASE WHEN status = 'qualificado' THEN 1 ELSE 0 END) as qualified,
        SUM(CASE WHEN status = 'perdido' THEN 1 ELSE 0 END) as lost,
        SUM(CASE WHEN status IN ('qualificado', 'perdido') THEN 1 ELSE 0 END) as total
      FROM contacts`
    ).first<{ qualified: number; lost: number; total: number }>();
    
    const aiAutomations = await this.db.prepare(
      `SELECT COUNT(*) as count FROM messages m 
       JOIN contacts c ON m.contact_id = c.jid 
       WHERE m.from_me = 1 AND c.ai_enabled = 1`
    ).first<{ count: number }>();

    const weeklyQualified = await this.db.prepare(
      `SELECT date(updated_at, 'weekday 0', '-17 weeks') as week_start, COUNT(*) as count
       FROM contacts 
       WHERE status = 'qualificado' AND updated_at >= date('now', '-17 weeks')
       GROUP BY week_start
       ORDER BY week_start`
    ).all<{ week_start: string; count: number }>();

    return {
      totalContacts: totalContacts?.count ?? 0,
      newToday: newToday?.count ?? 0,
      inNegotiation: inNegotiation?.count ?? 0,
      avgResponseMs: avgResponse?.avg_ms ?? 0,
      conversionRate: conversion?.total ? (conversion.qualified / conversion.total) * 100 : 0,
      aiAutomations: aiAutomations?.count ?? 0,
      weeklyQualified: weeklyQualified.results ?? [],
    };
  }

  // Prompts (getPrompt already exists below)

  async getPrompts() {
    const { results } = await this.db.prepare("SELECT * FROM prompts_library ORDER BY name").all<{ id: string; name: string; content: string; category: string }>();
    return results;
  }

  async savePrompt(prompt: { id?: string; name: string; content: string; category?: string }) {
    if (prompt.id) {
      return this.db.prepare(
        "UPDATE prompts_library SET name = ?, content = ?, category = ? WHERE id = ?"
      ).bind(prompt.name, prompt.content, prompt.category ?? 'sales', prompt.id).run();
    }
    const id = prompt.id || `prompt_${Date.now()}`;
    return this.db.prepare(
      "INSERT INTO prompts_library (id, name, content, category) VALUES (?, ?, ?, ?)"
    ).bind(id, prompt.name, prompt.content, prompt.category ?? 'sales').run();
  }

  async updateContactStatus(jid: string, status: string) {
    const contact = await this.getContact(jid);
    if (!contact) return { ok: false, error: 'not_found' };
    return this.db.prepare(
      "UPDATE contacts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE jid = ?"
    ).bind(status, contact.jid).run();
  }

  async getPrompt(id: string) {
    return this.db.prepare("SELECT * FROM prompts_library WHERE id = ?").bind(id).first<{ id: string; name: string; content: string; category: string }>();
  }
}
