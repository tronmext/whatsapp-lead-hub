-- Prompt scoping for multi-instance + tag-based routing
ALTER TABLE prompts_library ADD COLUMN scope_instance_id TEXT;
ALTER TABLE prompts_library ADD COLUMN scope_tag TEXT;

CREATE INDEX IF NOT EXISTS idx_prompts_scope_instance ON prompts_library(scope_instance_id);
CREATE INDEX IF NOT EXISTS idx_prompts_scope_tag ON prompts_library(scope_tag);
CREATE INDEX IF NOT EXISTS idx_prompts_scope_instance_tag
  ON prompts_library(scope_instance_id, scope_tag);
