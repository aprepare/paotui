import { describe, it, expect, beforeEach } from 'vitest'
import { resetDatabase, createTestEnv, seedDoc } from '../mocks/wx-server-sdk.js'
import fc from 'fast-check'

const { main } = await import('../../cloudfunctions/team/index.js')

function setup() {
  resetDatabase()
  seedDoc('users', 'u1', { openid: 'creator', name: 'Creator' })
  seedDoc('users', 'u2', { openid: 'joiner', name: 'Joiner' })
}

async function createActivity(max = 5) {
  createTestEnv('creator')
  const res = await main({
    action: 'create',
    data: { title: '打篮球', type: '运动', max, time: '2026-12-01 14:00' },
  }, {})
  return res.id
}

// ─── 6.1 Unit tests ─────────────────────────────────────────────────

describe('team cloud function - unit tests', () => {
  beforeEach(setup)

  it('create with valid fields', async () => {
    const id = await createActivity()
    expect(id).toBeTruthy()
  })

  it('join with capacity check', async () => {
    const id = await createActivity(5)
    createTestEnv('joiner')
    const res = await main({ action: 'join', data: { activityId: id } }, {})
    expect(res.code).toBe(0)
  })

  it('join full activity rejected', async () => {
    const id = await createActivity(2)
    // Creator already occupies 1 spot, joiner fills it
    createTestEnv('joiner')
    await main({ action: 'join', data: { activityId: id } }, {})
    // Third person should be rejected
    seedDoc('users', 'u3', { openid: 'joiner2', name: 'Joiner2' })
    createTestEnv('joiner2')
    const res = await main({ action: 'join', data: { activityId: id } }, {})
    expect(res.code).toBe(-1)
    expect(res.msg).toBe('已满员')
  })

  it('join ended activity rejected', async () => {
    const id = await createActivity(5)
    createTestEnv('creator')
    await main({ action: 'endActivity', data: { activityId: id } }, {})
    createTestEnv('joiner')
    const res = await main({ action: 'join', data: { activityId: id } }, {})
    expect(res.code).toBe(-1)
    expect(res.msg).toBe('活动已结束')
  })

  it('leave for non-creator', async () => {
    const id = await createActivity(5)
    createTestEnv('joiner')
    await main({ action: 'join', data: { activityId: id } }, {})
    const res = await main({ action: 'leave', data: { activityId: id } }, {})
    expect(res.code).toBe(0)
  })

  it('creator cannot leave', async () => {
    const id = await createActivity()
    createTestEnv('creator')
    const res = await main({ action: 'leave', data: { activityId: id } }, {})
    expect(res.code).toBe(-1)
    expect(res.msg).toBe('发起人不能退出')
  })

  it('endActivity permission', async () => {
    const id = await createActivity()
    createTestEnv('joiner')
    const res = await main({ action: 'endActivity', data: { activityId: id } }, {})
    expect(res.code).toBe(-1)
    expect(res.msg).toBe('仅发起人可结束')
  })
})

// ─── 6.2 Property 8: join/capacity invariant ────────────────────────

describe('Feature: comprehensive-testing, Property 8: Team activity join/capacity invariant', () => {
  // **Validates: Requirements 5.1, 5.4**
  it('after join, current equals team_members count; when full, tag is 已满员', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 6 }),
        async (max) => {
          setup()
          const id = await createActivity(max)
          createTestEnv('joiner')
          await main({ action: 'join', data: { activityId: id } }, {})

          const cloud = createTestEnv('joiner')
          const db = cloud.database()
          const activity = await db.collection('team_activities').doc(id).get()
          const members = await db.collection('team_members').where({ activityId: id }).count()
          expect(activity.data.current).toBe(members.total)

          if (activity.data.current >= activity.data.max) {
            expect(activity.data.tag).toBe('已满员')
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
