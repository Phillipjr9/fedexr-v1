import { withDb } from './lib/db';

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

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = parseBody(req);
  const number = String(body.number || body.trackingNumber || '').trim();
  if (!number) return res.status(400).json({ error: 'Tracking number required' });

  // Minimal checkout fields (demo / offline capture — no card data stored)
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim();
  if (!name || !email || !email.includes('@')) {
    return res.status(400).json({ error: 'Enter payer name and a valid email' });
  }

  try {
    const result = await withDb(async (c) => {
      await c.query('ALTER TABLE shipments ADD COLUMN IF NOT EXISTS shipping_fee numeric');
      await c.query('ALTER TABLE shipments ADD COLUMN IF NOT EXISTS package_size text');
      await c.query('ALTER TABLE shipments ADD COLUMN IF NOT EXISTS fee_paid BOOLEAN DEFAULT false');
      await c.query('ALTER TABLE shipments ADD COLUMN IF NOT EXISTS fee_paid_at TIMESTAMPTZ');
      await c.query('ALTER TABLE shipments ADD COLUMN IF NOT EXISTS fee_payer_email TEXT');
      await c.query('ALTER TABLE shipments ADD COLUMN IF NOT EXISTS fee_payer_name TEXT');

      const ship = await c.query(
        `SELECT tracking_number, shipping_fee, fee_paid FROM shipments
         WHERE lower(tracking_number) = lower($1) LIMIT 1`,
        [number]
      );
      if (!ship.rowCount) throw new Error('Shipment not found');
      const row = ship.rows[0];
      const fee = row.shipping_fee != null ? Number(row.shipping_fee) : 0;

      if (!fee || fee <= 0) {
        return { ok: true, alreadyPaid: true, shippingFee: 0, message: 'No shipping fee due for this package.' };
      }
      if (row.fee_paid) {
        return { ok: true, alreadyPaid: true, shippingFee: fee, message: 'Shipping fee already paid.' };
      }

      await c.query(
        `UPDATE shipments
         SET fee_paid = true, fee_paid_at = now(), fee_payer_email = $2, fee_payer_name = $3, updated_at = now()
         WHERE lower(tracking_number) = lower($1)`,
        [number, email, name]
      );

      try {
        await c.query(
          `INSERT INTO shipment_events (tracking_number, location, status, details)
           VALUES ($1, $2, $3, $4)`,
          [
            row.tracking_number,
            'Online',
            'Payment received',
            `Shipping fee of $${fee.toFixed(2)} paid by ${name}`,
          ]
        );
      } catch {
        /* events optional */
      }

      return {
        ok: true,
        alreadyPaid: false,
        shippingFee: fee,
        paid: true,
        message: 'Payment successful. Tracking can now continue.',
      };
    });

    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'Payment failed' });
  }
}
