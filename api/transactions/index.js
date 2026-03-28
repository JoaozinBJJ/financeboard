import { query } from '../../lib/db.js';
import { requireAuth, uid, cors } from '../../lib/auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const payload = requireAuth(req, res);
  if (!payload) return;

  if (req.method === 'GET') {
    const rows = await query(
      'SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC, created_at DESC',
      [payload.sub]
    );
    return res.status(200).json(rows.rows);
  }

  if (req.method === 'POST') {
    const { name = '', amount, type, category = 'Outros', date } = req.body || {};

    if (!name.trim() || !amount || !type || !date)
      return res.status(400).json({ error: 'Campos obrigatórios: name, amount, type, date' });
    if (!['income', 'expense'].includes(type))
      return res.status(400).json({ error: 'type deve ser income ou expense' });

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0)
      return res.status(400).json({ error: 'Valor inválido' });

    const id = uid();
    await query(
      'INSERT INTO transactions (id, user_id, name, amount, type, category, date) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [id, payload.sub, name.trim(), parsedAmount, type, category, date]
    );

    const row = await query('SELECT * FROM transactions WHERE id = $1', [id]);
    return res.status(201).json(row.rows[0]);
  }

  return res.status(405).json({ error: 'Método não permitido' });
}