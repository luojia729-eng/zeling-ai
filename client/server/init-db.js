import { initDb, db } from './db.js'

async function main() {
  await initDb()

  // 用户表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      nickname TEXT NOT NULL,
      avatar TEXT DEFAULT '',
      credits REAL DEFAULT 0,
      watermark_enabled INTEGER DEFAULT 0,
      notify_system INTEGER DEFAULT 1,
      notify_task INTEGER DEFAULT 1,
      notify_marketing INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `)

  // 积分流水表
  db.exec(`
    CREATE TABLE IF NOT EXISTS credit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      description TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `)

  // 任务表
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      model TEXT NOT NULL,
      prompt TEXT NOT NULL,
      params TEXT DEFAULT '{}',
      status TEXT DEFAULT 'queued',
      progress INTEGER DEFAULT 0,
      media_url TEXT DEFAULT '',
      credits_charged REAL DEFAULT 0,
      error TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      completed_at TEXT DEFAULT ''
    )
  `)

  // 作品表
  db.exec(`
    CREATE TABLE IF NOT EXISTS works (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      task_id TEXT DEFAULT '',
      type TEXT NOT NULL,
      media_url TEXT NOT NULL,
      prompt TEXT DEFAULT '',
      is_public INTEGER DEFAULT 1,
      status TEXT DEFAULT 'approved',
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `)

  // API Key 表
  db.exec(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      api_key TEXT UNIQUE NOT NULL,
      name TEXT DEFAULT '默认密钥',
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `)

  console.log('数据库初始化完成')
  console.log('表: users, credit_logs, tasks, works, api_keys')
}

main()
