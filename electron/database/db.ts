import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import initSqlJs, { Database, SqlJsStatic } from 'sql.js';

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;
let dbFilePath = '';

export async function getDb(): Promise<Database> {
  if (db) return db;

  if (!SQL) {
    const possibleWasmPaths = [
      path.join(__dirname, '../node_modules/sql.js/dist/sql-wasm.wasm'),
      path.join(__dirname, '../../node_modules/sql.js/dist/sql-wasm.wasm'),
      path.join(process.cwd(), 'node_modules/sql.js/dist/sql-wasm.wasm'),
      path.join(__dirname, 'sql-wasm.wasm'),
    ];
    const resolvedWasm = possibleWasmPaths.find((p) => fs.existsSync(p));
    if (resolvedWasm) {
      SQL = await initSqlJs({
        locateFile: () => resolvedWasm,
      });
    } else {
      SQL = await initSqlJs();
    }
  }

  // Get userData path safely
  let userDataDir = '';
  try {
    userDataDir = app ? app.getPath('userData') : path.join(process.cwd(), 'casher_data');
  } catch (e) {
    userDataDir = path.join(process.cwd(), 'casher_data');
  }

  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }

  dbFilePath = path.join(userDataDir, 'casher_pos.sqlite');

  if (fs.existsSync(dbFilePath)) {
    const fileBuffer = fs.readFileSync(dbFilePath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
    persistDb();
  }

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON;');

  return db;
}

export function persistDb() {
  if (!db || !dbFilePath) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbFilePath, buffer);
  } catch (err) {
    console.error('Failed to save SQLite database to disk:', err);
  }
}

export function queryAll<T = any>(sql: string, params: any[] = []): T[] {
  if (!db) throw new Error('Database not initialized');
  const stmt = db.prepare(sql);
  stmt.bind(params);

  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}

export function queryOne<T = any>(sql: string, params: any[] = []): T | null {
  const rows = queryAll<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export function run(sql: string, params: any[] = []): { changes: number; lastInsertRowid: number } {
  if (!db) throw new Error('Database not initialized');
  
  db.run(sql, params);
  
  // Get changes and last row ID
  const lastIdRes = queryOne<{ id: number }>('SELECT last_insert_rowid() as id');
  const lastInsertRowid = lastIdRes ? lastIdRes.id : 0;
  
  persistDb();
  return { changes: 1, lastInsertRowid };
}

export function getDbPath(): string {
  return dbFilePath;
}

export function backupDatabase(targetPath: string): boolean {
  if (!db) return false;
  try {
    persistDb();
    const data = db.export();
    fs.writeFileSync(targetPath, Buffer.from(data));
    return true;
  } catch (e) {
    console.error('Backup error:', e);
    return false;
  }
}

export function restoreDatabase(sourcePath: string): boolean {
  if (!fs.existsSync(sourcePath)) return false;
  try {
    const fileBuffer = fs.readFileSync(sourcePath);
    if (!SQL) return false;
    db = new SQL.Database(fileBuffer);
    persistDb();
    return true;
  } catch (e) {
    console.error('Restore error:', e);
    return false;
  }
}
