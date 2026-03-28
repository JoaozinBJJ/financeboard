import { query } from '../../lib/db.js';
import { requireAuth, cors } from '../../lib/auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const payload = requireAuth(req, res);
  if (!payload) return;

  const { id } = req.query;

  const check = await query(
    'SELECT id FROM transactions WHERE id = $1 AND user_id = $2', [id, payload.sub]
  );
  if (check.rows.length === 0)
    return res.status(404).json({ error: 'Transação não encontrada' });

  if (req.method === 'PUT') {
    const { name = '', amount, type, category = 'Outros', date } = req.body || {};

    if (!name.trim() || !amount || !type || !date)
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0)
      return res.status(400).json({ error: 'Valor inválido' });

    await query(
      'UPDATE transactions SET name=$1, amount=$2, type=$3, category=$4, date=$5 WHERE id=$6 AND user_id=$7',
      [name.trim(), parsedAmount, type, category, date, id, payload.sub]
    );

    const updated = await query('SELECT * FROM transactions WHERE id = $1', [id]);
    return res.status(200).json(updated.rows[0]);
  }

  if (req.method === 'DELETE') {
    await query('DELETE FROM transactions WHERE id = $1 AND user_id = $2', [id, payload.sub]);
    return res.status(200).json({ deleted: id });
  }

  return res.status(405).json({ error: 'Método não permitido' });
}