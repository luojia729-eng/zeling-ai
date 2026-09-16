const initSqlJs = require('sql.js')
const fs = require('node:fs')
const path = require('node:path')

// 云函数环境用 /tmp，本地用 ./data
const isCloud = process.env.TENCENTCLOUD_REGION || process.env.VERCEL || process.env.NODE_ENV === 'production'
const dbDir = isCloud ? '/tmp' : path.join(__dirname, 'data')
const dbPath = path.join(dbDir, 'zeling.db')
const DB_CLOUD_PATH = 'db/zeling.db'

// 云开发存储（仅云函数环境初始化，使用微信内置 wx-server-sdk）
let cloud = null
let storageInitError = null
try {
  if (process.env.TENCENTCLOUD_REGION || process.env.WX_CONTEXT) {
    const wxCloud = require('wx-server-sdk')
    wxCloud.init({ env: wxCloud.DYNAMIC_CURRENT_ENV })
    cloud = wxCloud
    console.log('云存储初始化成功（wx-server-sdk）')
  } else {
    storageInitError = '非云函数环境（TENCENTCLOUD_REGION not set）'
  }
} catch (e) {
  storageInitError = e.message + '\n' + e.stack
  console.warn('云存储初始化失败:', e.message, e.stack)
}

let realDb = null
let SQL = null
let pendingUpload = null // 待完成的云存储上传 Promise

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
    const buffer = Buffer.from(data)
    fs.writeFileSync(dbPath, buffer)
    // 上传到云存储，Promise 存到 pendingUpload 供云函数入口等待
    if (cloud) {
      pendingUpload = cloud.uploadFile({
        cloudPath: DB_CLOUD_PATH,
        fileContent: buffer
      }).then(() => console.log('数据库已同步到云存储'))
        .catch(e => console.warn('数据库上传云存储失败:', e.message))
    }
  } catch (e) {
    console.error('保存数据库失败:', e.message)
  }
}

// 云函数入口调用：等待所有待完成的上传
async function waitForUpload() {
  if (pendingUpload) {
    await pendingUpload
    pendingUpload = null
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

async function initDb() {
  if (realDb) return

  // 指定本地 wasm 文件路径（云函数环境无法访问外部 CDN）
  const wasmPath = path.join(__dirname, 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')
  SQL = await initSqlJs({ locateFile: () => wasmPath })

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }

  // 优先从云存储下载数据库文件（实现持久化）
  if (cloud && !fs.existsSync(dbPath)) {
    try {
      const fileID = `cloud://${process.env.TCB_ENV || 'cloudbase-d0g6m2os72e34187f'}/${DB_CLOUD_PATH}`
      const result = await cloud.downloadFile({ fileID })
      if (result.fileContent && result.fileContent.length > 0) {
        fs.writeFileSync(dbPath, result.fileContent)
        console.log('数据库已从云存储恢复')
      }
    } catch (e) {
      console.log('云存储无数据库文件，将创建新数据库:', e.message)
    }
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

const db = new Proxy(
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

module.exports = { initDb, db, waitForUpload, cloud, storageInitError }
