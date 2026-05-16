-- migrations/0000_initial_schema.sql
CREATE TABLE IF NOT EXISTS instances (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    alias TEXT,
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
