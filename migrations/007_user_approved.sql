ALTER TABLE users ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false;
-- Existing accounts stay usable until admin disables them
UPDATE users SET approved = true WHERE approved IS NULL OR approved = false;
