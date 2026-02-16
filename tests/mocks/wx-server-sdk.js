/**
 * Mock wx-server-sdk for testing cloud functions in Node.js.
 * Uses globalThis to share state between ESM and CJS module instances.
 */

// ─── Shared state via globalThis ────────────────────────────────────
if (!globalThis.__wxMockState) {
  globalThis.__wxMockState = {
    collections: {},
    autoId: 0,
    currentOpenid: 'test_openid',
  }
}
const _s = globalThis.__wxMockState

function _nextId() { return 'mock_id_' + (++_s.autoId) }

// ─── Command tags ───────────────────────────────────────────────────
// Use string tags instead of Symbols so they work across ESM/CJS boundaries
const CMD_INC = '__cmd_inc'
const CMD_PUSH = '__cmd_push'
const CMD_PULL = '__cmd_pull'
const CMD_NEQ = '__cmd_neq'
const CMD_LT = '__cmd_lt'
const CMD_AND = '__cmd_and'
const CMD_FIELD = '__cmd_field'

const command = {
  inc(val) { return { __cmd: CMD_INC, value: val } },
  push(...args) {
    const vals = args.length === 1 && Array.isArray(args[0]) ? args[0] : args
    return { __cmd: CMD_PUSH, value: vals.length === 1 ? vals[0] : vals }
  },
  pull(val) { return { __cmd: CMD_PULL, value: val } },
  neq(val) { return { __cmd: CMD_NEQ, value: val } },
  lt(val) { return { __cmd: CMD_LT, value: val } },
  and(...conditions) { return { __cmd: CMD_AND, value: conditions } },
  field(name) { return { __cmd: CMD_FIELD, value: name } },
}

// ─── Query matching ─────────────────────────────────────────────────

function _matchValue(docVal, queryVal) {
  if (queryVal && typeof queryVal === 'object' && queryVal.__cmd) {
    switch (queryVal.__cmd) {
      case CMD_NEQ: return docVal !== queryVal.value
      case CMD_LT: {
        const cmp = queryVal.value
        if (cmp && typeof cmp === 'object' && cmp.__cmd === CMD_FIELD) return true
        return docVal < cmp
      }
      case CMD_AND:
        return queryVal.value.every(cond => _matchValue(docVal, cond))
      default:
        return docVal === queryVal
    }
  }
  if (queryVal && typeof queryVal === 'object' && queryVal.__regexp) {
    return new RegExp(queryVal.value, queryVal.flags || '').test(String(docVal))
  }
  return docVal === queryVal
}

function _matchDoc(doc, query) {
  for (const key of Object.keys(query)) {
    const qv = query[key]
    const dv = doc[key]
    if (qv && typeof qv === 'object' && qv.__cmd === CMD_LT) {
      const cmp = qv.value
      if (cmp && typeof cmp === 'object' && cmp.__cmd === CMD_FIELD) {
        if (!(dv < doc[cmp.value])) return false
        continue
      }
    }
    if (!_matchValue(dv, qv)) return false
  }
  return true
}

function _applyUpdate(doc, updateData) {
  for (const key of Object.keys(updateData)) {
    const val = updateData[key]
    if (val && typeof val === 'object' && val.__cmd) {
      switch (val.__cmd) {
        case CMD_INC:
          doc[key] = (doc[key] || 0) + val.value
          break
        case CMD_PUSH:
          if (!Array.isArray(doc[key])) doc[key] = []
          if (Array.isArray(val.value)) doc[key] = doc[key].concat(val.value)
          else doc[key].push(val.value)
          break
        case CMD_PULL:
          if (Array.isArray(doc[key])) doc[key] = doc[key].filter(v => v !== val.value)
          break
        default:
          doc[key] = val
      }
    } else {
      doc[key] = val
    }
  }
}

// ─── MockQuery ──────────────────────────────────────────────────────

class MockQuery {
  constructor(col) {
    this._col = col
    this._where = null
    this._docId = null
    this._orderBys = []
    this._skip = 0
    this._limit = Infinity
  }
  _store() {
    if (!_s.collections[this._col]) _s.collections[this._col] = {}
    return _s.collections[this._col]
  }
  _clone() {
    const q = new MockQuery(this._col)
    q._where = this._where; q._docId = this._docId
    q._orderBys = [...this._orderBys]; q._skip = this._skip; q._limit = this._limit
    return q
  }
  where(query) { const q = this._clone(); q._where = query; return q }
  doc(id) { const q = this._clone(); q._docId = id; return q }
  orderBy(field, order) { const q = this._clone(); q._orderBys.push({ field, order }); return q }
  skip(n) { const q = this._clone(); q._skip = n; return q }
  limit(n) { const q = this._clone(); q._limit = n; return q }

  _resolve() {
    const store = this._store()
    if (this._docId) {
      const doc = store[this._docId]
      if (!doc) throw new Error('document not found: ' + this._docId)
      return [{ ...doc, _id: this._docId }]
    }
    let docs = Object.entries(store).map(([id, d]) => ({ ...d, _id: id }))
    if (this._where) docs = docs.filter(d => _matchDoc(d, this._where))
    for (let i = this._orderBys.length - 1; i >= 0; i--) {
      const { field, order } = this._orderBys[i]
      const dir = order === 'asc' ? 1 : -1
      docs.sort((a, b) => {
        if (a[field] < b[field]) return -1 * dir
        if (a[field] > b[field]) return 1 * dir
        return 0
      })
    }
    return docs.slice(this._skip, this._skip + this._limit)
  }

  async get() {
    return { data: this._docId ? this._resolve()[0] : this._resolve() }
  }
  async count() {
    const store = this._store()
    let docs = Object.entries(store).map(([id, d]) => ({ ...d, _id: id }))
    if (this._where) docs = docs.filter(d => _matchDoc(d, this._where))
    return { total: docs.length }
  }
  async add({ data }) {
    const store = this._store()
    const id = _nextId()
    store[id] = { ...data }
    return { _id: id }
  }
  async update({ data }) {
    const store = this._store()
    if (this._docId) {
      if (!store[this._docId]) throw new Error('document not found: ' + this._docId)
      _applyUpdate(store[this._docId], data)
      return { stats: { updated: 1 } }
    }
    const ids = Object.keys(store).filter(id => {
      const d = { ...store[id], _id: id }
      return this._where ? _matchDoc(d, this._where) : true
    })
    ids.forEach(id => _applyUpdate(store[id], data))
    return { stats: { updated: ids.length } }
  }
  async remove() {
    const store = this._store()
    if (this._docId) {
      if (!store[this._docId]) throw new Error('document not found: ' + this._docId)
      delete store[this._docId]
      return { stats: { removed: 1 } }
    }
    const ids = Object.keys(store).filter(id => {
      const d = { ...store[id], _id: id }
      return this._where ? _matchDoc(d, this._where) : true
    })
    ids.forEach(id => delete store[id])
    return { stats: { removed: ids.length } }
  }
}

// ─── MockDatabase ───────────────────────────────────────────────────

class MockDatabase {
  constructor() { this.command = command }
  collection(name) { return new MockQuery(name) }
  serverDate() { return new Date() }
  RegExp({ regexp, options }) { return { __regexp: true, value: regexp, flags: options || '' } }
}

// ─── Cloud singleton ────────────────────────────────────────────────

const cloud = {
  DYNAMIC_CURRENT_ENV: 'test-env',
  init() {},
  database() { return new MockDatabase() },
  getWXContext() { return { OPENID: _s.currentOpenid } },
  async getTempFileURL({ fileList }) {
    return {
      fileList: fileList.map(fileID => ({
        fileID, tempFileURL: 'https://mock-temp-url/' + fileID, status: 0,
      })),
    }
  },
}

// ─── Test helpers ───────────────────────────────────────────────────

function createTestEnv(openid = 'test_openid') {
  _s.currentOpenid = openid
  return cloud
}

function resetDatabase() {
  _s.collections = {}
  _s.autoId = 0
}

function getRawStore() { return _s.collections }

function seedDoc(collectionName, id, data) {
  if (!_s.collections[collectionName]) _s.collections[collectionName] = {}
  _s.collections[collectionName][id] = { ...data }
}

// ─── Exports ────────────────────────────────────────────────────────

module.exports = cloud
module.exports.createTestEnv = createTestEnv
module.exports.resetDatabase = resetDatabase
module.exports.getRawStore = getRawStore
module.exports.seedDoc = seedDoc
