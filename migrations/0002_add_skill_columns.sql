ALTER TABLE skills ADD COLUMN source TEXT;
ALTER TABLE skills ADD COLUMN skill_id TEXT;
ALTER TABLE skills ADD COLUMN installs INTEGER NOT NULL DEFAULT 0;
ALTER TABLE skills ADD COLUMN weekly_installs TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_skills_source_skill_id ON skills (source, skill_id);
