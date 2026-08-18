ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS disabled BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS site_banner (
  id INTEGER PRIMARY KEY DEFAULT 1,
  enabled BOOLEAN DEFAULT true,
  message TEXT,
  link_text TEXT,
  link_href TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT site_banner_singleton CHECK (id = 1)
);

INSERT INTO site_banner (id, enabled, message, link_text, link_href)
VALUES (1, true, 'US Supreme Court Tariff Update.', 'See how this may impact you', '/support')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS admin_activity (
  id SERIAL PRIMARY KEY,
  action TEXT NOT NULL,
  detail TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS office_locations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  hours TEXT,
  phone TEXT,
  services TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
