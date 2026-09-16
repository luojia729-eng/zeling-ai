import initSqlJs from 'sql.js'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// 数据库路径：Vercel 用 /tmp，本地用 ./data
const isVercel = process.env.VERCEL || process.env.NODE_ENV === 'production'
const dbDir = isVercel ? '/tmp' : join(__dirname, 'data')
const dbPath = join(dbDir, 'zeling.db')

let realDb = null
let SQL = null

class Statement {
  constructor(stmt) {
    this.stmt = stmt
  }

  _bind(params) {
    if (params.length === 0) return
    if (params.length === 1 && typeof params[0] === 'object' && params[0] !== null) {
      this.stmt.bind(params[0])
    } else {
      this.stmt.bind(params)
    }
  }

  run(...params) {
    this.stmt.reset()
    this._bind(params)
    this.stmt.step()
    const id = lastInsertRowId()
    this.stmt.free()
    save()
    return { lastInsertRowid: id, changes: 0 }
  }

  get(...params) {
    this.stmt.reset()
    this._bind(params)
    if (this.stmt.step()) {
      const row = this.stmt.getAsObject()
      this.stmt.free()
      return row
    }
    this.stmt.free()
    return undefined
  }

  all(...params) {
    this.stmt.reset()
    this._bind(params)
    const rows = []
    while (this.stmt.step()) {
      rows.push(this.stmt.getAsObject())
    }
    this.stmt.free()
    return rows
  }
}

function lastInsertRowId() {
  try {
    const stmt = realDb.prepare('SELECT last_insert_rowid() as id')
    stmt.step()
    const row = stmt.getAsObject()
    stmt.free()
    return row.id || 0
  } catch (e) {
    console.error('lastInsertRowId error:', e)
    return 0
  }
}

function save() {
  if (!realDb) return
  try {
    const data = realDb.export()
    fs.writeFileSync(dbPath, Buffer.from(data))
  } catch (e) {
    console.error('保存数据库失败:', e.message)
  }
}

function initTables() {
  // 用户表
  realDb.run(`
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
  realDb.run(`
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
  realDb.run(`
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
  realDb.run(`
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
  realDb.run(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      api_key TEXT UNIQUE NOT NULL,
      name TEXT DEFAULT '默认密钥',
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `)
}

export async function initDb() {
  if (realDb) return

  SQL = await initSqlJs()

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath)
    realDb = new SQL.Database(fileBuffer)
  } else {
    realDb = new SQL.Database()
    initTables()
    save()
  }
}

export const db = new Proxy(
  {},
  {
    get(target, prop) {
      if (!realDb) {
        throw new Error('数据库未初始化，请先调用 initDb()')
      }
      if (prop === 'exec') {
        return sql => {
          realDb.run(sql)
          save()
        }
      }
      if (prop === 'prepare') {
        return sql => new Statement(realDb.prepare(sql))
      }
      if (prop === 'pragma') {
        return () => {}
      }
      if (prop === 'save') {
        return save
      }
      return realDb[prop]
    }
  }
)

export default { initDb, db }
