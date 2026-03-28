// api/transactions/[id].js
import { getDB }             from '../../lib/db.js';
import { requireAuth, cors } from '../../lib/auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const payload = requireAuth(req, res);
  if (!payload) return;

  const { id } = req.query;
  const db     = getDB();

  // Check ownership
  const check = await db.execute(
    'SELECT id FROM transactions WHERE id = ? AND user_id = ?', [id, payload.sub]
  );
  if (check.rows.length === 0)
    return res.status(404).json({ error: 'Transação não encontrada' });

  // ── PUT: update ───────────────────────────────────────────
  if (req.method === 'PUT') {
    const { name = '', amount, type, category = 'Outros', date } = req.body || {};

    if (!name.trim() || !amount || !type || !date)
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0)
      return res.status(400).json({ error: 'Valor inválido' });

    await db.execute(
      'UPDATE transactions SET name=?, amount=?, type=?, category=?, date=? WHERE id=? AND user_id=?',
      [name.trim(), parsedAmount, type, category, date, id, payload.sub]
    );

    const updated = await db.execute('SELECT * FROM transactions WHERE id = ?', [id]);
    return res.status(200).json(updated.rows[0]);
  }

  // ── DELETE ────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    await db.execute(
      'DELETE FROM transactions WHERE id = ? AND user_id = ?', [id, payload.sub]
    );
    return res.status(200).json({ deleted: id });
  }

  return res.status(405).json({ error: 'Método não permitido' });
}