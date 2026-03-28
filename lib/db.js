// lib/db.js — Neon (PostgreSQL) connection helper
import { neon } from '@neondatabase/serverless';

let _sql = null;

export function getDB() {
  if (!_sql) {
    _sql = neon(process.env.DATABASE_URL);
  }
  return _sql;
}

// Wrapper para manter compatibilidade com o padrão { rows } usado nas rotas
export async function query(sql, params = []) {
  const db   = getDB();
  const rows = await db(sql, params);
  return { rows };
}

// Run once to create tables (call from /api/setup.js)
export async function initDB() {
  const db = getDB();
  await db`
    CREATE TABLE IF NOT EXISTS users (
      id         VARCHAR(32) PRIMARY KEY,
      name       VARCHAR(120) NOT NULL,
      email      VARCHAR(200) UNIQUE NOT NULL,
      password   VARCHAR(200) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await db`
    CREATE TABLE IF NOT EXISTS transactions (
      id         VARCHAR(32) PRIMARY KEY,
      user_id    VARCHAR(32) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name       VARCHAR(200) NOT NULL,
      amount     NUMERIC(12,2) NOT NULL,
      type       VARCHAR(10) NOT NULL CHECK (type IN ('income','expense')),
      category   VARCHAR(60) NOT NULL,
      date       DATE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await db`CREATE INDEX IF NOT EXISTS idx_tx_user ON transactions(user_id)`;
  return { ok: true };
}