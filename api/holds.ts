import { isAdmin, withDb } from './lib/db';

export default async function handler(req: any, res: any) {
  try {
    if (req.method === 'POST') {
      const number = String(req.body?.number || '').trim();
      const location = String(req.body?.location || '').trim();
      const email = String(req.body?.email || '').trim().toLowerCase();
      if (!number) return res.status(400).json({ error: 'Tracking number required' });
      if (!location) return res.status(400).json({ error: 'Hold location required' });

      const result = await withDb(async (c) => {
        const ship = await c.query('SELECT tracking_number, status FROM shipments WHERE lower(tracking_number) = lower($1)', [number]);
        if (!ship.rowCount) throw new Error('No shipment found for that tracking number');
        const inserted = await c.query(
          `INSERT INTO hold_requests (tracking_number, location_name, customer_email, status)
           VALUES ($1,$2,$3,'requested') RETURNING id`,
          [number, location, email || null]
        );
        await c.query('INSERT INTO admin_activity (action, detail) VALUES ($1,$2)', [
          'Hold requested',
          `${number} @ ${location}`,
        ]);
        return inserted.rows[0];
      });
      return res.status(200).json({ ok: true, id: result.id });
    }

    if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });

    if (req.method === 'GET') {
      const holds = await withDb(async (c) => {
        const r = await c.query(
          `SELECT id, tracking_number, location_name, customer_email, status, created_at
           FROM hold_requests ORDER BY created_at DESC LIMIT 200`
        );
        return r.rows;
      });
      return res.status(200).json({ holds });
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      /* handled above for customer POST */
    }

    if (req.method === 'PATCH') {
      const id = Number(req.body?.id);
      const status = String(req.body?.status || '').trim();
      if (!id || !['approved', 'declined', 'released'].includes(status)) {
        return res.status(400).json({ error: 'Valid id and status required' });
      }
      await withDb(async (c) => {
        const row = await c.query('SELECT * FROM hold_requests WHERE id = $1', [id]);
        if (!row.rowCount) throw new Error('Hold request not found');
        const hold = row.rows[0];
        await c.query('UPDATE hold_requests SET status = $2, updated_at = now() WHERE id = $1', [id, status]);
        if (status === 'approved') {
          await c.query(
            `UPDATE shipments SET status = 'Held at location', hold_location = $2, current_location = $2, updated_at = now()
             WHERE lower(tracking_number) = lower($1)`,
            [hold.tracking_number, hold.location_name]
          );
          await c.query(
            `INSERT INTO shipment_events (tracking_number, location, status, details)
             VALUES ($1,$2,'Held at location',$3)`,
            [hold.tracking_number, hold.location_name, 'Hold approved']
          );
        }
        if (status === 'released') {
          await c.query(
            `UPDATE shipments SET status = 'In transit', hold_location = NULL, updated_at = now()
             WHERE lower(tracking_number) = lower($1)`,
            [hold.tracking_number]
          );
          await c.query(
            `INSERT INTO shipment_events (tracking_number, location, status, details)
             VALUES ($1,$2,'In transit','Hold released')`,
            [hold.tracking_number, hold.location_name]
          );
        }
        await c.query('INSERT INTO admin_activity (action, detail) VALUES ($1,$2)', [
          `Hold ${status}`,
          `${hold.tracking_number}`,
        ]);
      });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Hold request failed' });
  }
}
