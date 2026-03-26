import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'db', 'data.sqlite');
const db = new DatabaseSync(dbPath);

function normalizeRow(row) {
  const normalized = { ...row };
  if (normalized.id !== undefined && normalized.ID === undefined) {
    normalized.ID = normalized.id;
  }
  return normalized;
}

export async function query({ sql, values = [] }) {
  if (typeof sql !== 'string' || sql.trim().length === 0) {
    return { error: 'SQL query is required' };
  }

  try {
    const statement = db.prepare(sql);
    const queryType = sql.trim().split(/\s+/)[0].toUpperCase();

    if (queryType === 'SELECT' || queryType === 'WITH' || queryType === 'PRAGMA' || queryType === 'EXPLAIN') {
      const rows = Array.isArray(values) ? statement.all(...values) : statement.all(values);
      return rows.map(normalizeRow);
    }

    const result = Array.isArray(values) ? statement.run(...values) : statement.run(values);
    return {
      insertId: Number(result.lastInsertRowid || 0),
      affectedRows: Number(result.changes || 0),
    };
  } catch (error) {
    console.error('SQL Error:', error.message, '\nSQL:', sql);
    return { error: 'Database query failed' };
  }
};
