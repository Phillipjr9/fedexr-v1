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
  if (s.includes('payment')) return 'Shipping fee paid';
  return '';
}

const NOT_FOUND =
  'Sorry, we could not find tracking information for this number. Please check the number and try again, or contact support if you need help.';

async function neonLookup(trackingNumber: string) {
  if (!dbUrl()) return null;
  try {
    return await withDb(async (c) => {
      try {
        await c.query('ALTER TABLE shipments ADD COLUMN IF NOT EXISTS shipping_fee numeric');
        await c.query('ALTER TABLE shipments ADD COLUMN IF NOT EXISTS package_size text');
        await c.query('ALTER TABLE shipments ADD COLUMN IF NOT EXISTS fee_paid BOOLEAN DEFAULT false');
        await c.query('ALTER TABLE shipments ADD COLUMN IF NOT EXISTS collect_payment BOOLEAN DEFAULT false');
        await c.query('ALTER TABLE shipments ADD COLUMN IF NOT EXISTS payment_instructions TEXT');
        await c.query('ALTER TABLE shipments ADD COLUMN IF NOT EXISTS hold_reason TEXT');
        await c.query('ALTER TABLE shipments ADD COLUMN IF NOT EXISTS hold_location TEXT');
      } catch {
        /* ok */
      }
      const ship = await c.query(
        `SELECT tracking_number, status, origin, destination, service, service_id,
                current_location, estimated_delivery, estimated_delivery_text,
                shipping_fee, package_size, fee_paid, collect_payment, payment_instructions, hold_reason, hold_location
         FROM shipments WHERE lower(tracking_number) = lower($1) LIMIT 1`,
        [trackingNumber]
      );
      if (!ship.rowCount) return null;
      let eventRows: any[] = [];
      try {
        const events = await c.query(
          `SELECT location, status, details, event_time, created_at
           FROM shipment_events WHERE lower(tracking_number) = lower($1)
           ORDER BY COALESCE(event_time, created_at) ASC LIMIT 50`,
          [trackingNumber]
        );
        eventRows = events.rows || [];
      } catch {
        eventRows = [];
      }
      const row = ship.rows[0];
      const shippingFee = row.shipping_fee != null ? Number(row.shipping_fee) : null;
      const feePaid = !!row.fee_paid;
      const collectPayment = !!row.collect_payment;
      const paymentRequired = !!(collectPayment && shippingFee && shippingFee > 0 && !feePaid);
      const history = eventRows.map((ev: any) => {
        const when = ev.event_time || ev.created_at;
        return {
          date: when ? new Date(when).toLocaleDateString() : '',
          time: when ? new Date(when).toLocaleTimeString() : '',
          location: ev.location || '',
          status: ev.status || row.status,
          completed: true,
          details: publicEventDetails(ev.status || '', ev.details || ''),
          detail: publicEventDetails(ev.status || '', ev.details || ''),
        };
      });
      if (!history.length) {
        history.push({
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString(),
          location: row.origin || row.current_location || '',
          status: row.status || 'Label created',
          completed: true,
          details: 'Shipping label created',
          detail: 'Shipping label created',
        });
      }
      return {
        found: true,
        source: 'neon',
        number: row.tracking_number,
        status: row.status || 'Label created',
        origin: row.origin || '',
        destination: row.destination || '',
        service: row.service || row.service_id || '',
        location: row.current_location || '',
        currentLocation: row.current_location || '',
        estimatedDelivery:
          row.estimated_delivery_text ||
          (row.estimated_delivery ? String(row.estimated_delivery) : ''),
        shippingFee,
        packageSize: row.package_size || '',
        feePaid,
        collectPayment,
        paymentInstructions: row.payment_instructions || '',
        holdReason: row.hold_reason || '',
        holdLocation: row.hold_location || row.current_location || '',
        paymentRequired,
        history,
        events: history,
      };
    });
  } catch (err) {
    console.error('neonLookup error', err);
    return null;
  }
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ found: false, error: 'Method not allowed' });
    }
    const number = req.query?.number || req.query?.trackingNumber || '';
    const trackingNumber = String(number || '').trim();
    if (!trackingNumber) {
      return res.status(400).json({ found: false, error: 'Please enter a tracking number.' });
    }

    const local = await neonLookup(trackingNumber);
    if (local) {
      return res.status(200).json(local);
    }

    const clientId = process.env.FEDEX_CLIENT_ID;
    const clientSecret = process.env.FEDEX_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return res.status(404).json({
        found: false,
        error: NOT_FOUND,
        source: 'neon',
      });
    }

    try {
      const { getFedExAccessToken, mapFedExTrackResponse } = await import('./lib/fedexTrack');
      const useSandbox = process.env.FEDEX_API_ENV !== 'production';
      const host = useSandbox ? 'https://apis-sandbox.fedex.com' : 'https://apis.fedex.com';
      const token = await getFedExAccessToken(host, clientId, clientSecret);
      const trackRes = await fetch(`${host}/track/v1/trackingnumbers`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-locale': 'en_US',
        },
        body: JSON.stringify({
          includeDetailedScans: true,
          trackingInfo: [{ trackingNumberInfo: { trackingNumber } }],
        }),
      });
      const json: any = await trackRes.json();
      if (!trackRes.ok) {
        return res.status(404).json({
          found: false,
          error: NOT_FOUND,
          source: 'fedex',
        });
      }
      const mapped = mapFedExTrackResponse(json, trackingNumber);
      if (!mapped) {
        return res.status(404).json({ found: false, error: NOT_FOUND, source: 'fedex' });
      }
      const timeline = mapped.history || [];
      return res.status(200).json({
        found: true,
        source: 'fedex',
        ...mapped,
        events: timeline,
        history: timeline,
        shippingFee: null,
        packageSize: '',
        feePaid: true,
        collectPayment: false,
        paymentInstructions: '',
        holdReason: '',
        holdLocation: '',
        paymentRequired: false,
      });
    } catch (err: any) {
      console.error('fedex track error', err);
      return res.status(404).json({
        found: false,
        error: NOT_FOUND,
        source: 'fedex',
      });
    }
  } catch (err: any) {
    console.error('track handler error', err);
    return res.status(500).json({
      found: false,
      error: 'We could not look up this shipment right now. Please try again in a moment.',
    });
  }
}
