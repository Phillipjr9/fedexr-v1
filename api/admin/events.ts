import { isAdmin, withDb } from '../lib/db';

export default async function handler(req: any, res: any) {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const number = String(req.body?.number || '').trim();
  const status = String(req.body?.status || '').trim();
  const location = String(req.body?.location || '').trim();
  const details = String(req.body?.details || '').trim();

  if (!number) return res.status(400).json({ error: 'Tracking number required' });
  if (!status) return res.status(400).json({ error: 'Status required' });
  if (!location) return res.status(400).json({ error: 'Location required' });

  try {
    await withDb(async (c) => {
      const exists = await c.query('SELECT 1 FROM shipments WHERE tracking_number = $1', [number]);
      if (!exists.rowCount) throw new Error('Shipment not found');

      await c.query(
        `INSERT INTO shipment_events (tracking_number, location, status, details)
         VALUES ($1, $2, $3, $4)`,
        [number, location, status, details || 'Admin scan']
      );
      await c.query(
        `UPDATE shipments SET status = $2, current_location = $3, updated_at = now()
         WHERE tracking_number = $1`,
        [number, status, location]
      );
      await c.query('INSERT INTO admin_activity (action, detail) VALUES ($1, $2)', [
        'Scan event added',
        `${number}: ${status} @ ${location}`,
      ]);
    });
    return res.status(200).json({ ok: true });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Could not add event' });
  }
}
