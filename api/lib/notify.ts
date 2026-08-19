function dbUrl() {
  return (
    process.env.DATABASE_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.fedex_DATABASE_URL ||
    process.env.fedex_POSTGRES_URL ||
    ''
  );
}

export async function ensureNotifySchema(c: any) {
  await c.query('ALTER TABLE shipments ADD COLUMN IF NOT EXISTS notify_email TEXT');
  await c.query('ALTER TABLE shipments ADD COLUMN IF NOT EXISTS notify_enabled BOOLEAN DEFAULT false');
  await c.query(`
    CREATE TABLE IF NOT EXISTS notification_log (
      id SERIAL PRIMARY KEY,
      tracking_number TEXT NOT NULL,
      email TEXT,
      status TEXT,
      channel TEXT DEFAULT 'email',
      sent BOOLEAN DEFAULT false,
      detail TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `);
}

export function siteOrigin() {
  return (
    process.env.PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'https://fedexr-v1.vercel.app'
  );
}

export async function sendStatusEmail(opts: {
  to: string;
  number: string;
  status: string;
  location?: string;
  detail?: string;
  estimatedDelivery?: string;
}) {
  const key = process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY || '';
  const from =
    process.env.NOTIFY_FROM_EMAIL ||
    process.env.RESEND_FROM ||
    'FedExr Tracking <onboarding@resend.dev>';
  const trackUrl = `${siteOrigin()}/tracking?number=${encodeURIComponent(opts.number)}`;
  const subject = `Shipment update: ${opts.number} — ${opts.status}`;
  const lines = [
    `Your package ${opts.number} has a new update.`,
    '',
    `Status: ${opts.status}`,
    opts.location ? `Location: ${opts.location}` : '',
    opts.detail ? `Details: ${opts.detail}` : '',
    opts.estimatedDelivery ? `Scheduled delivery: ${opts.estimatedDelivery}` : '',
    '',
    `Track online: ${trackUrl}`,
    '',
    'You received this because you opted in to delivery status notifications.',
  ].filter(Boolean);

  if (!key) {
    console.log('[notify] RESEND_API_KEY not set — email not sent', {
      to: opts.to,
      number: opts.number,
      status: opts.status,
    });
    return { sent: false, reason: 'no_api_key' as const };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [opts.to],
        subject,
        text: lines.join('\n'),
        html: `<div style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
          <p>Your package <strong>${opts.number}</strong> has a new update.</p>
          <p><strong>Status:</strong> ${opts.status}<br/>
          ${opts.location ? `<strong>Location:</strong> ${opts.location}<br/>` : ''}
          ${opts.detail ? `<strong>Details:</strong> ${opts.detail}<br/>` : ''}
          ${opts.estimatedDelivery ? `<strong>Scheduled delivery:</strong> ${opts.estimatedDelivery}<br/>` : ''}
          </p>
          <p><a href="${trackUrl}">View tracking</a></p>
          <p style="color:#666;font-size:12px">You opted in to delivery status notifications.</p>
        </div>`,
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('[notify] Resend error', res.status, errText);
      return { sent: false, reason: 'provider_error' as const };
    }
    return { sent: true as const };
  } catch (e: any) {
    console.error('[notify] send failed', e?.message);
    return { sent: false, reason: 'network' as const };
  }
}

/** After a status change: email notify_email if enabled. Uses its own DB connection. */
export async function notifyShipmentStatus(opts: {
  number: string;
  status: string;
  location?: string;
  detail?: string;
}) {
  const connectionString = dbUrl();
  if (!connectionString) return { sent: false, reason: 'no_db' as const };
  try {
    const { Client } = await import('pg');
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();
    try {
      await ensureNotifySchema(client);
      const r = await client.query(
        `SELECT notify_email, notify_enabled, fee_payer_email, estimated_delivery_text
         FROM shipments WHERE lower(tracking_number) = lower($1) LIMIT 1`,
        [opts.number]
      );
      if (!r.rowCount) return { sent: false, reason: 'not_found' as const };
      const row = r.rows[0];
      const email = String(row.notify_email || row.fee_payer_email || '').trim();
      const enabled = row.notify_enabled === true || !!row.notify_email || !!row.fee_payer_email;
      if (!email || !email.includes('@') || !enabled) {
        return { sent: false, reason: 'no_subscriber' as const };
      }
      const result = await sendStatusEmail({
        to: email,
        number: opts.number,
        status: opts.status,
        location: opts.location,
        detail: opts.detail,
        estimatedDelivery: row.estimated_delivery_text || '',
      });
      await client.query(
        `INSERT INTO notification_log (tracking_number, email, status, channel, sent, detail)
         VALUES ($1,$2,$3,'email',$4,$5)`,
        [
          opts.number,
          email,
          opts.status,
          result.sent,
          result.sent ? 'sent' : result.reason || 'failed',
        ]
      );
      return result;
    } finally {
      await client.end().catch(() => undefined);
    }
  } catch (e: any) {
    console.error('[notify] notifyShipmentStatus', e?.message);
    return { sent: false, reason: 'error' as const };
  }
}
