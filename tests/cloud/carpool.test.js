import { describe, it, expect, beforeEach } from 'vitest'
import { resetDatabase, createTestEnv, seedDoc } from '../mocks/wx-server-sdk.js'
import fc from 'fast-check'

const { main } = await import('../../cloudfunctions/carpool/index.js')

function setup() {
  resetDatabase()
  seedDoc('users', 'u1', { openid: 'creator', name: 'Creator' })
  seedDoc('users', 'u2', { openid: 'joiner', name: 'Joiner' })
}

async function createCarpool(maxPeople = 4) {
  createTestEnv('creator')
  const res = await main({
    action: 'create',
    data: { from: '学校', to: '火车站', departTime: '2026-03-01 10:00', maxPeople },
  }, {})
  return res.id
}

// ─── 5.1 Unit tests ─────────────────────────────────────────────────

describe('carpool cloud function - unit tests', () => {
  beforeEach(setup)

  it('create with valid fields', async () => {
    const id = await createCarpool()
    expect(id).toBeTruthy()
  })

  it('join increments currentPeople', async () => {
    const id = await createCarpool()
    createTestEnv('joiner')
    const res = await main({ action: 'join', data: { carpoolId: id } }, {})
    expect(res.code).toBe(0)
    const cloud = createTestEnv('joiner')
    const db = cloud.database()
    const cp = await db.collection('carpool').doc(id).get()
    expect(cp.data.currentPeople).toBe(2)
  })

  it('leave decrements currentPeople', async () => {
    const id = await createCarpool()
    createTestEnv('joiner')
    await main({ action: 'join', data: { carpoolId: id } }, {})
    const res = await main({ action: 'leave', data: { carpoolId: id } }, {})
    expect(res.code).toBe(0)
    const cloud = createTestEnv('joiner')
    const db = cloud.database()
    const cp = await db.collection('carpool').doc(id).get()
    expect(cp.data.currentPeople).toBe(1)
  })

  it('creator cannot leave', async () => {
    const id = await createCarpool()
    createTestEnv('creator')
    const res = await main({ action: 'leave', data: { carpoolId: id } }, {})
    expect(res.code).toBe(-1)
    expect(res.msg).toBe('发起人不能退出')
  })

  it('non-creator cannot cancel', async () => {
    const id = await createCarpool()
    createTestEnv('joiner')
    const res = await main({ action: 'cancel', data: { carpoolId: id } }, {})
    expect(res.code).toBe(-1)
    expect(res.msg).toBe('仅发起人可取消')
  })
})


// ─── 5.2 Property 5: join/leave round-trip ──────────────────────────

describe('Feature: comprehensive-testing, Property 5: Carpool join/leave round-trip preserves member count', () => {
  // **Validates: Requirements 4.1, 4.5**
  it('for any non-full carpool, join then leave restores original state', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 10 }),
        async (maxPeople) => {
          setup()
          const id = await createCarpool(maxPeople)
          const cloud = createTestEnv('joiner')
          const db = cloud.database()
          const before = await db.collection('carpool').doc(id).get()
          const beforeCount = before.data.currentPeople
          const beforeMembers = [...before.data.members]

          await main({ action: 'join', data: { carpoolId: id } }, {})
          await main({ action: 'leave', data: { carpoolId: id } }, {})

          const after = await db.collection('carpool').doc(id).get()
          expect(after.data.currentPeople).toBe(beforeCount)
          expect(after.data.members).toEqual(beforeMembers)
        }
      ),
      { numRuns: 100 }
    )
  })
})

// ─── 5.3 Property 6: full capacity rejection ───────────────────────

describe('Feature: comprehensive-testing, Property 6: Carpool full capacity rejection', () => {
  // **Validates: Requirements 4.2**
  it('for any full carpool, join returns error and count unchanged', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }),
        async (maxPeople) => {
          setup()
          const id = await createCarpool(maxPeople)
          const cloud = createTestEnv('creator')
          const db = cloud.database()
          // Fill to capacity
          await db.collection('carpool').doc(id).update({
            data: { currentPeople: maxPeople }
          })

          createTestEnv('joiner')
          const res = await main({ action: 'join', data: { carpoolId: id } }, {})
          expect(res.code).toBe(-1)
          expect(res.msg).toBe('已满员')

          const cp = await db.collection('carpool').doc(id).get()
          expect(cp.data.currentPeople).toBe(maxPeople)
        }
      ),
      { numRuns: 100 }
    )
  })
})

// ─── 5.4 Property 7: duplicate join rejection ──────────────────────

describe('Feature: comprehensive-testing, Property 7: Carpool duplicate join rejection', () => {
  // **Validates: Requirements 4.3**
  it('for any carpool, joining twice returns error and count unchanged', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 3, max: 10 }),
        async (maxPeople) => {
          setup()
          const id = await createCarpool(maxPeople)
          createTestEnv('joiner')
          await main({ action: 'join', data: { carpoolId: id } }, {})

          const cloud = createTestEnv('joiner')
          const db = cloud.database()
          const before = await db.collection('carpool').doc(id).get()

          const res = await main({ action: 'join', data: { carpoolId: id } }, {})
          expect(res.code).toBe(-1)
          expect(res.msg).toBe('已加入')

          const after = await db.collection('carpool').doc(id).get()
          expect(after.data.currentPeople).toBe(before.data.currentPeople)
        }
      ),
      { numRuns: 100 }
    )
  })
})
