-- Gap fill after migrations/create_tables.sql
-- Admin create-shipment + two optional photos (setup vs delivered)

ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS origin TEXT,
  ADD COLUMN IF NOT EXISTS destination TEXT,
  ADD COLUMN IF NOT EXISTS service TEXT,
  ADD COLUMN IF NOT EXISTS current_location TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS estimated_delivery_text TEXT;

ALTER TABLE tracking_images
  ADD COLUMN IF NOT EXISTS caption TEXT;

ALTER TABLE tracking_images ADD COLUMN IF NOT EXISTS event_type TEXT NOT NULL DEFAULT 'setup';

CREATE UNIQUE INDEX IF NOT EXISTS tracking_images_number_event_uidx
  ON tracking_images (tracking_number, event_type);

CREATE TABLE IF NOT EXISTS site_banner (
  id INTEGER PRIMARY KEY DEFAULT 1,
  enabled BOOLEAN DEFAULT true,
  message TEXT,
  link_text TEXT,
  link_href TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT site_banner_singleton CHECK (id = 1)
);

CREATE TABLE IF NOT EXISTS admin_activity (
  id SERIAL PRIMARY KEY,
  action TEXT NOT NULL,
  detail TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
