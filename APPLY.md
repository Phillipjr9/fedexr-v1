# Apply v1 overlay

1. Set `DATABASE_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`.
2. Run `node scripts/migrate.js` then `migrations/002_shipment_admin_fields.sql`.
3. `cd app && npm i && npm run dev`.
