// api/auth/register.js
import { getDB }                          from '../../lib/db.js';
import { hashPassword, makeToken, uid, cors } from '../../lib/auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Método não permitido' });

  const { name = '', email = '', password = '' } = req.body || {};

  if (!name.trim() || !email.trim() || !password)
    return res.status(400).json({ error: 'Preencha todos os campos' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Senha deve ter ao menos 6 caracteres' });
  if (!email.includes('@'))
    return res.status(400).json({ error: 'E-mail inválido' });

  const db = getDB();

  const existing = await db.execute(
    'SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]
  );
  if (existing.rows.length > 0)
    return res.status(409).json({ error: 'E-mail já cadastrado' });

  const id       = uid();
  const pwdHash  = hashPassword(password);

  await db.execute(
    'INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)',
    [id, name.trim(), email.toLowerCase().trim(), pwdHash]
  );

  const token = makeToken(id, email.toLowerCase().trim());
  return res.status(201).json({
    token,
    user: { id, name: name.trim(), email: email.toLowerCase().trim() }
  });
}