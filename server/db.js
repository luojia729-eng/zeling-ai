import initSqlJs from 'sql.js'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dbPath = join(__dirname, 'data', 'zeling.db')

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
    // 执行语句（INSERT/UPDATE/DELETE 没有结果行，step 返回 false 但已执行）
    this.stmt.step()
    // 在 free 之前获取 lastInsertRowid
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
  const data = realDb.export()
  fs.writeFileSync(dbPath, Buffer.from(data))
}

export async function initDb() {
  if (realDb) return

  SQL = await initSqlJs()

  const dataDir = join(__dirname, 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath)
    realDb = new SQL.Database(fileBuffer)
  } else {
    realDb = new SQL.Database()
  }
}

// 代理对象：路由中 import { db } 无需修改
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
