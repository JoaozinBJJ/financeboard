import { query } from '../../lib/db.js';
import { requireAuth, cors } from '../../lib/auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const payload = requireAuth(req, res);
  if (!payload) return;

  const rows = await query(
    'SELECT id, name, email, created_at FROM users WHERE id = $1', [payload.sub]
  );
  const user = rows.rows[0];
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

  return res.status(200).json(user);
}