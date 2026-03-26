import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '..', 'db', 'data.sqlite');
const SCHEMA_PATH = path.join(__dirname, '..', 'db', 'schema.sql');

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new DatabaseSync(DB_PATH);

db.exec('PRAGMA foreign_keys = ON');

if (fs.existsSync(SCHEMA_PATH)) {
  const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf8');
  if (schemaSql.trim()) {
    db.exec(schemaSql);
  }
}

export { db };
