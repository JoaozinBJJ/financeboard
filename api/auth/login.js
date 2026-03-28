// api/auth/login.js
import { getDB }                              from '../../lib/db.js';
import { checkPassword, makeToken, cors }     from '../../lib/auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Método não permitido' });

  const { email = '', password = '' } = req.body || {};

  if (!email.trim() || !password)
    return res.status(400).json({ error: 'Preencha todos os campos' });

  const db   = getDB();
  const rows = await db.execute(
    'SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]
  );

  const user = rows.rows[0];
  if (!user || !checkPassword(password, user.password))
    return res.status(401).json({ error: 'E-mail ou senha incorretos' });

  const token = makeToken(user.id, user.email);
  return res.status(200).json({
    token,
    user: { id: user.id, name: user.name, email: user.email }
  });
}