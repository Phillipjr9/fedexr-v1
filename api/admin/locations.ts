import { isAdmin, withDb } from '../lib/db';

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    try {
      const locations = await withDb(async (c) => {
        const r = await c.query(
          `SELECT id, name, address, hours, phone, services, active
           FROM office_locations
           WHERE active = true OR $1 = true
           ORDER BY id DESC`,
          [!!req.query?.all]
        );
        return r.rows;
      });
      return res.status(200).json({ locations });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'DB error' });
    }
  }

  if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    if (req.method === 'POST') {
      const name = String(req.body?.name || '').trim();
      const address = String(req.body?.address || '').trim();
      if (!name || !address) return res.status(400).json({ error: 'Name and address required' });
      await withDb(async (c) => {
        await c.query(
          `INSERT INTO office_locations (name, address, hours, phone, services, active)
           VALUES ($1,$2,$3,$4,$5,true)`,
          [
            name,
            address,
            String(req.body?.hours || ''),
            String(req.body?.phone || ''),
            String(req.body?.services || ''),
          ]
        );
        await c.query('INSERT INTO admin_activity (action, detail) VALUES ($1, $2)', [
          'Location added',
          name,
        ]);
      });
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const id = Number(req.query?.id || req.body?.id);
      if (!id) return res.status(400).json({ error: 'id required' });
      await withDb(async (c) => {
        await c.query('UPDATE office_locations SET active = false WHERE id = $1', [id]);
        await c.query('INSERT INTO admin_activity (action, detail) VALUES ($1, $2)', [
          'Location deactivated',
          `id ${id}`,
        ]);
      });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'DB error' });
  }
}
