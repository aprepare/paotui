import { describe, it, expect, beforeEach } from 'vitest'
import { resetDatabase, createTestEnv, seedDoc } from '../mocks/wx-server-sdk.js'
import fc from 'fast-check'

const { main } = await import('../../cloudfunctions/express/index.js')

function setupBase() {
  resetDatabase()
  seedDoc('users', 'u1', { openid: 'owner', name: 'Owner' })
  seedDoc('users', 'u2', { openid: 'rider', name: 'Rider' })
  seedDoc('stats', 's1', { key: 'global', totalOrders: 0, todayDelivered: 0 })
}

async function createOrder(openid = 'owner') {
  createTestEnv(openid)
  const res = await main({
    action: 'create',
    data: { pickupPoint: '菜鸟驿站', pickupCode: '1-2-3456', building: '1号楼', room: '101', price: 3, tip: 1 },
  }, {})
  return res.id
}

// ─── 3.1 Unit tests ─────────────────────────────────────────────────

describe('express cloud function - unit tests', () => {
  beforeEach(setupBase)

  it('create with valid fields returns code 0 and new ID', async () => {
    createTestEnv('owner')
    const res = await main({
      action: 'create',
      data: { pickupPoint: '菜鸟驿站', building: '1号楼', room: '101', price: 3 },
    }, {})
    expect(res.code).toBe(0)
    expect(res.id).toBeTruthy()
  })

  it('create with missing fields returns code -1', async () => {
    createTestEnv('owner')
    const res = await main({ action: 'create', data: { pickupPoint: '菜鸟' } }, {})
    expect(res.code).toBe(-1)
  })

  it('accept updates status to 1 and sets riderId', async () => {
    const orderId = await createOrder('owner')
    createTestEnv('rider')
    const res = await main({ action: 'accept', data: { orderId } }, {})
    expect(res.code).toBe(0)
  })

  it('accept own order is rejected', async () => {
    const orderId = await createOrder('owner')
    createTestEnv('owner')
    const res = await main({ action: 'accept', data: { orderId } }, {})
    expect(res.code).toBe(-1)
    expect(res.msg).toBe('不能接自己发布的单')
  })

  it('cancel by owner succeeds for pending order', async () => {
    const orderId = await createOrder('owner')
    createTestEnv('owner')
    const res = await main({ action: 'cancel', data: { orderId } }, {})
    expect(res.code).toBe(0)
  })

  it('cancel during delivery (status=2) by owner is rejected', async () => {
    const orderId = await createOrder('owner')
    createTestEnv('rider')
    await main({ action: 'accept', data: { orderId } }, {})
    // Move to delivering
    await main({ action: 'updateStatus', data: { orderId, status: 2 } }, {})
    createTestEnv('owner')
    const res = await main({ action: 'cancel', data: { orderId } }, {})
    expect(res.code).toBe(-1)
    expect(res.msg).toBe('骑手正在配送中，无法取消订单')
  })

  it('cancel by unrelated user is rejected', async () => {
    const orderId = await createOrder('owner')
    createTestEnv('stranger')
    seedDoc('users', 'u3', { openid: 'stranger', name: 'Stranger' })
    const res = await main({ action: 'cancel', data: { orderId } }, {})
    expect(res.code).toBe(-1)
    expect(res.msg).toBe('无权取消该订单')
  })

  it('updateStatus to 3 (completed) increments todayDelivered', async () => {
    const orderId = await createOrder('owner')
    createTestEnv('rider')
    await main({ action: 'accept', data: { orderId } }, {})
    await main({ action: 'updateStatus', data: { orderId, status: 2 } }, {})
    await main({ action: 'updateStatus', data: { orderId, status: 3 } }, {})
    // todayDelivered should have been incremented
    const cloud = createTestEnv('rider')
    const db = cloud.database()
    const stats = await db.collection('stats').where({ key: 'global' }).get()
    expect(stats.data[0].todayDelivered).toBeGreaterThan(0)
  })
})


// ─── 3.2 Property test: accept rejects non-pending orders (Property 2) ──

describe('Feature: comprehensive-testing, Property 2: Express order accept rejects non-pending orders', () => {
  // **Validates: Requirements 2.3**
  it('for any express order with status !== 0, accept returns error and leaves order unchanged', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 4 }),
        async (status) => {
          setupBase()
          const orderId = await createOrder('owner')
          // Manually set status to non-zero
          const cloud = createTestEnv('rider')
          const db = cloud.database()
          await db.collection('express_orders').doc(orderId).update({ data: { status } })

          createTestEnv('rider')
          const res = await main({ action: 'accept', data: { orderId } }, {})
          expect(res.code).toBe(-1)
          expect(res.msg).toBe('订单已被接')

          // Verify status unchanged
          const order = await db.collection('express_orders').doc(orderId).get()
          expect(order.data.status).toBe(status)
        }
      ),
      { numRuns: 100 }
    )
  })
})

// ─── 3.3 Property test: cancel permission check (Property 3) ───────

describe('Feature: comprehensive-testing, Property 3: Express order cancel permission check', () => {
  // **Validates: Requirements 2.7**
  it('for any user who is neither owner nor rider, cancel returns permission error', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 5, maxLength: 20 }).filter(s => s !== 'owner' && s !== 'rider'),
        async (strangerId) => {
          setupBase()
          const orderId = await createOrder('owner')
          // Accept the order as rider
          createTestEnv('rider')
          await main({ action: 'accept', data: { orderId } }, {})

          // Try cancel as stranger
          seedDoc('users', 'u_stranger', { openid: strangerId, name: 'Stranger' })
          createTestEnv(strangerId)
          const res = await main({ action: 'cancel', data: { orderId } }, {})
          expect(res.code).toBe(-1)
          expect(res.msg).toBe('无权取消该订单')
        }
      ),
      { numRuns: 100 }
    )
  })
})
