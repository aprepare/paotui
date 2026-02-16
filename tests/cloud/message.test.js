import { describe, it, expect, beforeEach } from 'vitest'
import { resetDatabase, createTestEnv, seedDoc } from '../mocks/wx-server-sdk.js'
import fc from 'fast-check'

const { main } = await import('../../cloudfunctions/message/index.js')

function setup() {
  resetDatabase()
}

function addMsg(id, toOpenid, read = false) {
  seedDoc('messages', id, {
    toOpenid, fromOpenid: 'system', fromName: '系统',
    type: 'info', title: 'Test', content: 'msg', read, createTime: new Date(),
  })
}

// ─── 8.1 Unit tests ─────────────────────────────────────────────────

describe('message cloud function - unit tests', () => {
  beforeEach(setup)

  it('list returns messages for user', async () => {
    addMsg('m1', 'userA')
    addMsg('m2', 'userA')
    addMsg('m3', 'userB')
    createTestEnv('userA')
    const res = await main({ action: 'list', data: {} }, {})
    expect(res.code).toBe(0)
    expect(res.data).toHaveLength(2)
  })

  it('markRead updates single message', async () => {
    addMsg('m1', 'userA', false)
    createTestEnv('userA')
    await main({ action: 'markRead', data: { msgId: 'm1' } }, {})
    const cloud = createTestEnv('userA')
    const db = cloud.database()
    const msg = await db.collection('messages').doc('m1').get()
    expect(msg.data.read).toBe(true)
  })

  it('send skips self-notification', async () => {
    createTestEnv('userA')
    const res = await main({
      action: 'send',
      data: { toOpenid: 'userA', fromOpenid: 'userA', type: 'info', title: 'Test' },
    }, {})
    expect(res.code).toBe(0)
    expect(res.msg).toBe('skip self')
  })
})

// ─── 8.2 Property 13: markAllRead leaves no unread ──────────────────

describe('Feature: comprehensive-testing, Property 13: Mark all read leaves no unread messages', () => {
  // **Validates: Requirements 7.2**
  it('for any user with unread messages, markAllRead sets all to read', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }),
        async (count) => {
          setup()
          for (let i = 0; i < count; i++) {
            addMsg('m' + i, 'userA', false)
          }
          createTestEnv('userA')
          await main({ action: 'markAllRead', data: {} }, {})

          const cloud = createTestEnv('userA')
          const db = cloud.database()
          const unread = await db.collection('messages').where({ toOpenid: 'userA', read: false }).count()
          expect(unread.total).toBe(0)
        }
      ),
      { numRuns: 100 }
    )
  })
})

// ─── 8.3 Property 14: deleteAll leaves no messages ──────────────────

describe('Feature: comprehensive-testing, Property 14: Delete all messages leaves no messages', () => {
  // **Validates: Requirements 7.4**
  it('for any user with messages, deleteAll removes all', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }),
        async (count) => {
          setup()
          for (let i = 0; i < count; i++) {
            addMsg('m' + i, 'userA', i % 2 === 0)
          }
          createTestEnv('userA')
          await main({ action: 'deleteAll', data: {} }, {})

          const cloud = createTestEnv('userA')
          const db = cloud.database()
          const remaining = await db.collection('messages').where({ toOpenid: 'userA' }).count()
          expect(remaining.total).toBe(0)
        }
      ),
      { numRuns: 100 }
    )
  })
})
