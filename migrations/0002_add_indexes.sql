-- migrations/0001_add_indexes.sql
-- Performance indexes for message and contact queries

-- Messages: most queries filter by contact_id
CREATE INDEX IF NOT EXISTS idx_messages_contact_id ON messages(contact_id);

-- Messages: ordering by timestamp is common
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);

-- Contacts: filtered by instance_id and status
CREATE INDEX IF NOT EXISTS idx_contacts_instance ON contacts(instance_id);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_updated ON contacts(updated_at DESC);

-- Contacts: composite for analytics (status + updated_at)
CREATE INDEX IF NOT EXISTS idx_contacts_status_updated ON contacts(status, updated_at DESC);
