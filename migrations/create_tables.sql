CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shipments (
  tracking_number TEXT PRIMARY KEY,
  user_id TEXT,
  service_id TEXT,
  status TEXT,
  estimated_delivery TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shipment_events (
  id SERIAL PRIMARY KEY,
  tracking_number TEXT REFERENCES shipments(tracking_number) ON DELETE CASCADE,
  event_time TIMESTAMPTZ DEFAULT now(),
  location TEXT,
  status TEXT,
  details TEXT
);

CREATE TABLE IF NOT EXISTS tracking_images (
  id BIGSERIAL PRIMARY KEY,
  tracking_number TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'default',
  mime TEXT,
  image BYTEA,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (tracking_number, event_type)
);

CREATE INDEX IF NOT EXISTS idx_shipment_events_tracking_time ON shipment_events(tracking_number, event_time);
