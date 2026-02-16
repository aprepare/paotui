import { describe, it, expect, beforeEach } from 'vitest'
import { createTestEnv, resetDatabase, seedDoc, getRawStore } from './wx-server-sdk.js'

describe('wx-server-sdk mock layer', () => {
  let cloud, db, _

  beforeEach(() => {
    resetDatabase()
    cloud = createTestEnv('user_001')
    db = cloud.database()
    _ = db.command
  })

  it('add and get a document', async () => {
    const res = await db.collection('test').add({ data: { name: 'Alice' } })
    expect(res._id).toBeTruthy()
    const doc = await db.collection('test').doc(res._id).get()
    expect(doc.data.name).toBe('Alice')
  })

  it('where query filters correctly', async () => {
    await db.collection('items').add({ data: { status: 0, title: 'a' } })
    await db.collection('items').add({ data: { status: 1, title: 'b' } })
    await db.collection('items').add({ data: { status: 0, title: 'c' } })
    const res = await db.collection('items').where({ status: 0 }).get()
    expect(res.data).toHaveLength(2)
    expect(res.data.every(d => d.status === 0)).toBe(true)
  })

  it('count returns correct total', async () => {
    await db.collection('items').add({ data: { x: 1 } })
    await db.collection('items').add({ data: { x: 2 } })
    const res = await db.collection('items').count()
    expect(res.total).toBe(2)
  })

  it('update with inc command', async () => {
    const { _id } = await db.collection('counters').add({ data: { val: 10 } })
    await db.collection('counters').doc(_id).update({ data: { val: _.inc(5) } })
    const doc = await db.collection('counters').doc(_id).get()
    expect(doc.data.val).toBe(15)
  })

  it('update with push and pull commands', async () => {
    const { _id } = await db.collection('lists').add({ data: { members: ['a'] } })
    await db.collection('lists').doc(_id).update({ data: { members: _.push('b') } })
    let doc = await db.collection('lists').doc(_id).get()
    expect(doc.data.members).toEqual(['a', 'b'])

    await db.collection('lists').doc(_id).update({ data: { members: _.pull('a') } })
    doc = await db.collection('lists').doc(_id).get()
    expect(doc.data.members).toEqual(['b'])
  })

  it('neq query', async () => {
    await db.collection('orders').add({ data: { status: 0 } })
    await db.collection('orders').add({ data: { status: 4 } })
    await db.collection('orders').add({ data: { status: 1 } })
    const res = await db.collection('orders').where({ status: _.neq(4) }).get()
    expect(res.data).toHaveLength(2)
  })

  it('remove a document', async () => {
    const { _id } = await db.collection('test').add({ data: { x: 1 } })
    await db.collection('test').doc(_id).remove()
    const res = await db.collection('test').count()
    expect(res.total).toBe(0)
  })

  it('where-based remove', async () => {
    await db.collection('msgs').add({ data: { user: 'a', read: false } })
    await db.collection('msgs').add({ data: { user: 'a', read: true } })
    await db.collection('msgs').add({ data: { user: 'b', read: false } })
    await db.collection('msgs').where({ user: 'a' }).remove()
    const res = await db.collection('msgs').count()
    expect(res.total).toBe(1)
  })

  it('orderBy, skip, limit', async () => {
    await db.collection('items').add({ data: { val: 3 } })
    await db.collection('items').add({ data: { val: 1 } })
    await db.collection('items').add({ data: { val: 2 } })
    const res = await db.collection('items')
      .orderBy('val', 'asc')
      .skip(1)
      .limit(1)
      .get()
    expect(res.data).toHaveLength(1)
    expect(res.data[0].val).toBe(2)
  })

  it('getWXContext returns configured openid', () => {
    expect(cloud.getWXContext().OPENID).toBe('user_001')
    createTestEnv('user_002')
    expect(cloud.getWXContext().OPENID).toBe('user_002')
  })

  it('serverDate returns a Date', () => {
    expect(db.serverDate()).toBeInstanceOf(Date)
  })

  it('getTempFileURL returns mock URLs', async () => {
    const res = await cloud.getTempFileURL({ fileList: ['file1', 'file2'] })
    expect(res.fileList).toHaveLength(2)
    expect(res.fileList[0].tempFileURL).toContain('file1')
  })

  it('seedDoc inserts directly for test setup', async () => {
    seedDoc('users', 'u1', { openid: 'user_001', name: 'Test' })
    const doc = await db.collection('users').doc('u1').get()
    expect(doc.data.name).toBe('Test')
  })

  it('RegExp query works', async () => {
    await db.collection('posts').add({ data: { content: 'Hello World' } })
    await db.collection('posts').add({ data: { content: 'Goodbye' } })
    const res = await db.collection('posts')
      .where({ content: db.RegExp({ regexp: 'hello', options: 'i' }) })
      .get()
    expect(res.data).toHaveLength(1)
    expect(res.data[0].content).toBe('Hello World')
  })

  it('where-based update', async () => {
    await db.collection('msgs').add({ data: { user: 'a', read: false } })
    await db.collection('msgs').add({ data: { user: 'a', read: false } })
    await db.collection('msgs').add({ data: { user: 'b', read: false } })
    await db.collection('msgs').where({ user: 'a' }).update({ data: { read: true } })
    const res = await db.collection('msgs').where({ user: 'a', read: true }).count()
    expect(res.total).toBe(2)
  })
})
