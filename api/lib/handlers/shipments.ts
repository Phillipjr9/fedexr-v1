import type { Client } from 'pg';
import { isAdmin, withDb } from '../db';

function send(res: any, status: number, body: unknown) {
  res.status(status).json(body);
}

/** Public-safe event detail — never expose internal wording */
function publicEventDetails(status: string, provided?: string) {
  const raw = String(provided || '').trim();
  if (raw && !/admin/i.test(raw)) return raw;
  const s = String(status || '').toLowerCase();
  if (s.includes('label') || s.includes('created')) return 'Shipping label created';
  if (s.includes('pick')) return 'We have your package';
  if (s.includes('out for')) return 'On a local truck';
  if (s.includes('deliver')) return 'Delivered';
  if (s.includes('hold')) return 'Held at location';
  if (s.includes('transit') || s.includes('on the way')) return 'On the way';
  return 'Shipment updated';
}

async function listShipments(client: Client, number?: string) {
  const params: string[] = [];
  let where = '';
  if (number) {
    params.push(number);
    where = 'WHERE lower(s.tracking_number) = lower($1)';
  }
  const { rows } = await client.query(
    `SELECT s.tracking_number, s.user_id, s.service_id, s.status, s.estimated_delivery,
            s.created_at, s.origin, s.destination, s.service, s.current_location,
            s.updated_at, s.estimated_delivery_text,
            EXISTS (SELECT 1 FROM tracking_images i WHERE i.tracking_number = s.tracking_number AND i.event_type = 'setup') AS has_setup_image,
            EXISTS (SELECT 1 FROM tracking_images i WHERE i.tracking_number = s.tracking_number AND i.event_type = 'delivered') AS has_delivered_image
     FROM shipments s ${where}
     ORDER BY s.updated_at DESC NULLS LAST, s.created_at DESC`,
    params
  );
  const eventsByNumber: Record<string, any[]> = {};
  if (rows.length) {
    const nums = rows.map((r) => r.tracking_number);
    const ev = await client.query(
      `SELECT tracking_number, event_time, location, status, details FROM shipment_events WHERE tracking_number = ANY($1) ORDER BY event_time DESC`,
      [nums]
    );
    for (const e of ev.rows) {
      (eventsByNumber[e.tracking_number] ||= []).push({
        date: e.event_time ? new Date(e.event_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
        time: e.event_time ? new Date(e.event_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '',
        location: e.location || '',
        status: e.status || '',
        completed: true,
        details: publicEventDetails(e.status || '', e.details || ''),
      });
    }
  }
  return rows.map((r) => ({
    number: r.tracking_number,
    status: r.status,
    origin: r.origin || '',
    destination: r.destination || '',
    service: r.service || r.service_id || '',
    estimatedDelivery: r.estimated_delivery_text || (r.estimated_delivery ? String(r.estimated_delivery) : ''),
    location: r.current_location || '',
    history: eventsByNumber[r.tracking_number] || [],
    hasSetupImage: r.has_setup_image,
    hasDeliveredImage: r.has_delivered_image,
    updatedAt: r.updated_at,
  }));
}

export default async function handler(req: any, res: any) {
  const listingAll = req.method === 'GET' && !req.query?.number;
  if ((req.method !== 'GET' || listingAll) && !isAdmin(req)) return send(res, 401, { error: 'Unauthorized' });
  try {
    if (req.method === 'GET') {
      const data = await withDb((c) => listShipments(c, req.query?.number as string | undefined));
      return send(res, 200, { shipments: data });
    }
    if (req.method === 'DELETE') {
      const number = (req.query?.number || req.body?.number) as string;
      if (!number) return send(res, 400, { error: 'Tracking number required' });
      await withDb(async (c) => {
        await c.query('DELETE FROM tracking_images WHERE tracking_number = $1', [number]);
        await c.query('DELETE FROM shipment_events WHERE tracking_number = $1', [number]);
        await c.query('DELETE FROM shipments WHERE tracking_number = $1', [number]);
      });
      return send(res, 200, { ok: true });
    }
    if (req.method === 'POST') {
      const b = req.body || {};
      const number = String(b.number || '').trim();
      if (!number) return send(res, 400, { error: 'Tracking number required' });
      const status = b.status || 'In transit';
      const details = publicEventDetails(status, b.details);
      await withDb(async (c) => {
        await c.query(
          `INSERT INTO shipments (tracking_number, status, origin, destination, service, service_id, current_location, estimated_delivery_text, updated_at)
           VALUES ($1,$2,$3,$4,$5,$5,$6,$7,now())
           ON CONFLICT (tracking_number) DO UPDATE SET status = EXCLUDED.status, origin = EXCLUDED.origin, destination = EXCLUDED.destination, service = EXCLUDED.service, service_id = EXCLUDED.service_id, current_location = EXCLUDED.current_location, estimated_delivery_text = EXCLUDED.estimated_delivery_text, updated_at = now()`,
          [number, status, b.origin || '', b.destination || '', b.service || '', b.location || '', b.estimatedDelivery || '']
        );
        await c.query(`INSERT INTO shipment_events (tracking_number, location, status, details) VALUES ($1,$2,$3,$4)`, [number, b.location || b.destination || '', status, details]);
      });
      return send(res, 200, { ok: true, number });
    }
    return send(res, 405, { error: 'Method not allowed' });
  } catch (err: any) {
    return send(res, 500, { error: err?.message || 'DB error' });
  }
}
