-- Add raw_message column to store original message object for media download
ALTER TABLE messages ADD COLUMN raw_message TEXT;