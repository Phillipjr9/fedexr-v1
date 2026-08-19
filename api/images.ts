function dbUrl() {
  return (
    process.env.DATABASE_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.fedex_DATABASE_URL ||
    process.env.fedex_POSTGRES_URL ||
    process.env.fedex_POSTGRES_PRISMA_URL ||
    ''
  );
}

async function withDb<T>(fn: (client: any) => Promise<T>): Promise<T> {
  const connectionString = dbUrl();
  if (!connectionString) throw new Error('No database connection configured');
  const { Client } = await import('pg');
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end().catch(() => undefined);
  }
}

function isAdmin(req: any) {
  const expectedPass = String(process.env.ADMIN_PASSWORD || process.env.ADMIN_SECRET || 'admin').trim();
  const header = req.headers?.['x-admin-secret'] || req.headers?.['X-Admin-Secret'];
  const value = Array.isArray(header) ? header[0] : header;
  return String(value || '') === expectedPass;
}

function normalizeEvent(raw: any) {
  const e = String(raw || 'setup').toLowerCase();
  if (e === 'delivered') return 'delivered';
  if (e === 'transit' || e === 'on_the_way' || e === 'ontheway' || e === 'in_transit') return 'transit';
  if (e === 'photo' || e === 'package' || e === 'gallery') return 'setup';
  return 'setup';
}

function parseBody(req: any) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

async function ensureImageTable(c: any) {
  await c.query(`
    CREATE TABLE IF NOT EXISTS tracking_images (
      id SERIAL PRIMARY KEY,
      tracking_number TEXT NOT NULL,
      event_type TEXT NOT NULL DEFAULT 'setup',
      mime TEXT NOT NULL,
      image BYTEA NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `);
  // Allow many photos per tracking number (drop legacy 1-per-type unique if present)
  try {
    await c.query('ALTER TABLE tracking_images DROP CONSTRAINT IF EXISTS tracking_images_tracking_number_event_type_key');
  } catch {
    /* ok */
  }
  try {
    await c.query('CREATE INDEX IF NOT EXISTS tracking_images_number_idx ON tracking_images (lower(tracking_number))');
  } catch {
    /* ok */
  }
}

function rowToDataUrl(row: any) {
  return `data:${row.mime};base64,${Buffer.from(row.image).toString('base64')}`;
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method === 'GET') {
      const trackingNumber = String(req.query?.number || '').trim();
      if (!trackingNumber) return res.status(400).json({ error: 'Missing number' });
      const listAll =
        String(req.query?.list || '') === '1' ||
        String(req.query?.list || '').toLowerCase() === 'true' ||
        String(req.query?.all || '') === '1';

      try {
        if (listAll) {
          const rows = await withDb(async (c) => {
            await ensureImageTable(c);
            const r = await c.query(
              `SELECT id, event_type, mime, image, created_at
               FROM tracking_images
               WHERE lower(tracking_number) = lower($1)
               ORDER BY created_at ASC, id ASC
               LIMIT 40`,
              [trackingNumber]
            );
            return r.rows || [];
          });
          const images = rows.map((row: any) => ({
            id: row.id,
            eventType: row.event_type,
            dataUrl: rowToDataUrl(row),
            createdAt: row.created_at,
          }));
          res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=15');
          return res.status(200).json({ found: images.length > 0, count: images.length, images });
        }

        const event = normalizeEvent(req.query?.event || req.query?.type);
        const row = await withDb(async (c) => {
          await ensureImageTable(c);
          const r = await c.query(
            `SELECT id, mime, image FROM tracking_images
             WHERE lower(tracking_number) = lower($1) AND event_type = $2
             ORDER BY id ASC LIMIT 1`,
            [trackingNumber, event]
          );
          return r.rows[0] || null;
        });
        if (!row) return res.status(200).json({ found: false });
        const dataUrl = rowToDataUrl(row);
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');
        return res.status(200).json({ found: true, dataUrl, eventType: event, id: row.id });
      } catch (err: any) {
        console.error('image GET error', err);
        return res.status(500).json({ error: err?.message || 'DB error reading image' });
      }
    }

    if (req.method === 'DELETE') {
      if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized — sign in again on /admin' });
      const id = Number(req.query?.id || parseBody(req).id);
      if (!id) return res.status(400).json({ error: 'Image id required' });
      try {
        await withDb(async (c) => {
          await ensureImageTable(c);
          await c.query('DELETE FROM tracking_images WHERE id = $1', [id]);
        });
        return res.status(200).json({ ok: true });
      } catch (err: any) {
        return res.status(500).json({ error: err?.message || 'Delete failed' });
      }
    }

    if (req.method === 'POST') {
      if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized — sign in again on /admin' });
      const body = parseBody(req);
      const trackingNumber = String(body.trackingNumber || body.number || '').trim();
      const dataUrl = body.dataUrl;
      if (!trackingNumber || !dataUrl) {
        return res.status(400).json({ error: 'Missing tracking number or image data' });
      }
      const type = normalizeEvent(body.eventType || body.event || body.type);
      const match = String(dataUrl).match(/^data:([^;]+);base64,(.+)$/);
      if (!match) return res.status(400).json({ error: 'Invalid image data (expected data URL)' });

      const mime = match[1];
      const b64 = match[2];
      if (b64.length > 4_000_000) {
        return res.status(413).json({ error: 'Image too large. Use a smaller photo (under ~2 MB).' });
      }

      // append=true (default) adds another photo; replace=true keeps old 1-per-type behavior
      const replace = body.replace === true || body.replace === 'true';

      try {
        const buf = Buffer.from(b64, 'base64');
        const result = await withDb(async (c) => {
          await ensureImageTable(c);
          if (replace) {
            await c.query(
              `DELETE FROM tracking_images
               WHERE lower(tracking_number) = lower($1) AND event_type = $2`,
              [trackingNumber, type]
            );
          }
          const ins = await c.query(
            `INSERT INTO tracking_images (tracking_number, event_type, mime, image)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
            [trackingNumber, type, mime, buf]
          );
          const countR = await c.query(
            `SELECT COUNT(*)::int AS n FROM tracking_images WHERE lower(tracking_number) = lower($1)`,
            [trackingNumber]
          );
          return { id: ins.rows[0]?.id, count: countR.rows[0]?.n || 0 };
        });
        return res.status(200).json({
          ok: true,
          eventType: type,
          id: result.id,
          count: result.count,
          bytes: buf.length,
          minRequired: 5,
          meetsMinimum: result.count >= 5,
        });
      } catch (err: any) {
        console.error('image POST error', err);
        return res.status(500).json({ error: err?.message || 'DB error saving image' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('images handler error', err);
    return res.status(500).json({ error: err?.message || 'Image API error' });
  }
}
