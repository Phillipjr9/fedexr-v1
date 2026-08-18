# fedexr-v1

FedEx-look public site plus admin shipment control, wired to Neon Postgres.

## Setup

1. Copy files into the Vite app (see `APPLY.md`).
2. Set env:

```
DATABASE_URL=postgresql://...neon.tech/neondb?sslmode=require
ADMIN_SECRET=admin
```

3. Run `migrations/002_shipment_admin_fields.sql` if columns are missing.

Do not commit real database passwords.

## Admin

- `/admin` — login
- Create/update shipments on Neon
- Optional setup photo and optional delivered photo (Delivered status only)
- Public tracking shows photos only for that tracking number
