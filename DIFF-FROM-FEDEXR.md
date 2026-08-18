# How fedexr-v1 differs from Phillipjr9/fedexr

Original repo is the public FedEx-look site.
This repo is that site **plus** the operational backend we added.

## New in v1 (not in original fedexr)

- `api/admin/login.ts` — username + password from env (`ADMIN_USERNAME`, `ADMIN_PASSWORD`)
- `api/admin/shipments.ts` — create/update/delete shipments on Neon
- `api/lib/db.ts` — Postgres helper + admin auth check
- `api/track.ts` + `api/lib/fedexTrack.ts` — official Track API with admin fallback
- `api/upload-tracking-image.ts` / `api/get-tracking-image.ts` — setup vs delivered photos per tracking number
- `app/src/lib/adminApi.ts` — admin UI talks to Neon, not only localStorage
- `app/src/lib/publicTracking.ts` — public track looks up FedEx API then Neon
- `app/src/pages/admin/*` — dashboard, shipments, banner, settings
- `app/src/pages/AdminLogin.tsx` — username + password form
- `migrations/002_shipment_admin_fields.sql` — extra shipment columns + event_type images
- Isolated admin chrome (`AdminLayout`) not shown on the public header

## Unchanged from original

Homepage section order, FedEx images in `app/public/images`, shipping/locations/login pages.
