// api/setup.js — chame UMA VEZ após o deploy para criar as tabelas
// Acesse: https://seu-app.vercel.app/api/setup?key=SETUP_SECRET
import { initDB } from '../lib/db.js';

export default async function handler(req, res) {
  const key = req.query.key || '';
  if (key !== (process.env.SETUP_SECRET || 'financeboard-setup')) {
    return res.status(403).json({ error: 'Proibido' });
  }
  try {
    await initDB();
    return res.status(200).json({ ok: true, message: 'Tabelas criadas com sucesso!' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}