ALTER TABLE shipments ADD COLUMN IF NOT EXISTS hold_location TEXT;

CREATE TABLE IF NOT EXISTS hold_requests (
  id SERIAL PRIMARY KEY,
  tracking_number TEXT NOT NULL,
  location_name TEXT NOT NULL,
  customer_email TEXT,
  status TEXT NOT NULL DEFAULT 'requested',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
