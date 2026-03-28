// lib/auth.js
import jwt      from 'jsonwebtoken';
import bcrypt   from 'bcryptjs';

const SECRET = process.env.JWT_SECRET || 'financeboard-dev-secret';

export function makeToken(userId, email) {
  return jwt.sign(
    { sub: userId, email },
    SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

export function hashPassword(plain) {
  return bcrypt.hashSync(plain, 10);
}

export function checkPassword(plain, hash) {
  return bcrypt.compareSync(plain, hash);
}

// Extract Bearer token from request
export function extractToken(req) {
  const auth = req.headers['authorization'] || '';
  if (!auth.startsWith('Bearer ')) return null;
  return auth.slice(7);
}

// Middleware-style: returns decoded payload or sends 401
export function requireAuth(req, res) {
  const token   = extractToken(req);
  if (!token) { res.status(401).json({ error: 'Token não fornecido' }); return null; }
  const payload = verifyToken(token);
  if (!payload) { res.status(401).json({ error: 'Token inválido ou expirado' }); return null; }
  return payload;
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function cors(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
}