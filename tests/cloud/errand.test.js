import { describe, it, expect, beforeEach } from 'vitest'
import { resetDatabase, createTestEnv, seedDoc } from '../mocks/wx-server-sdk.js'
import fc from 'fast-check'

const { main } = await import('../../cloudfunctions/errand/index.js')

function setup() {
  resetDatabase()
  seedDoc('users', 'u1', { openid: 'owner', name: 'Owner' })
  seedDoc('users', 'u2', { openid: 'rider', name: 'Rider' })
}

async function createTask(openid = 'owner') {
  createTestEnv(openid)
  const res = await main({ action: 'create', data: { title: '帮取快递', desc: '菜鸟驿站取件' } }, {})
  return res.id
}

// ─── 4.1 Unit tests ─────────────────────────────────────────────────

describe('errand cloud function - unit tests', () => {
  beforeEach(setup)

  it('create with valid fields returns code 0', async () => {
    createTestEnv('owner')
    const res = await main({ action: 'create', data: { title: '帮买咖啡', desc: '星巴克美式' } }, {})
    expect(res.code).toBe(0)
    expect(res.id).toBeTruthy()
  })

  it('create with missing fields returns code -1', async () => {
    createTestEnv('owner')
    const res = await main({ action: 'create', data: { title: '' } }, {})
    expect(res.code).toBe(-1)
  })

  it('accept updates status to 1', async () => {
    const taskId = await createTask('owner')
    createTestEnv('rider')
    const res = await main({ action: 'accept', data: { taskId } }, {})
    expect(res.code).toBe(0)
  })

  it('cancel rejects during in-progress (status=1) by owner', async () => {
    const taskId = await createTask('owner')
    createTestEnv('rider')
    await main({ action: 'accept', data: { taskId } }, {})
    createTestEnv('owner')
    const res = await main({ action: 'cancel', data: { taskId } }, {})
    expect(res.code).toBe(-1)
    expect(res.msg).toBe('接单人正在执行任务，无法取消')
  })

  it('status flow: 0→1→4→2', async () => {
    const taskId = await createTask('owner')
    createTestEnv('rider')
    await main({ action: 'accept', data: { taskId } }, {})
    // Rider submits completion (status 4)
    await main({ action: 'updateStatus', data: { taskId, status: 4 } }, {})
    // Owner confirms (status 2)
    createTestEnv('owner')
    const res = await main({ action: 'updateStatus', data: { taskId, status: 2 } }, {})
    expect(res.code).toBe(0)
  })
})

// ─── 4.2 Property test: accept rejects non-pending tasks (Property 4) ──

describe('Feature: comprehensive-testing, Property 4: Errand task accept rejects non-pending tasks', () => {
  // **Validates: Requirements 3.3**
  it('for any errand task with status !== 0, accept returns error and leaves task unchanged', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 4 }),
        async (status) => {
          setup()
          const taskId = await createTask('owner')
          const cloud = createTestEnv('rider')
          const db = cloud.database()
          await db.collection('errand_tasks').doc(taskId).update({ data: { status } })

          createTestEnv('rider')
          const res = await main({ action: 'accept', data: { taskId } }, {})
          expect(res.code).toBe(-1)
          expect(res.msg).toBe('任务已被接')

          const task = await db.collection('errand_tasks').doc(taskId).get()
          expect(task.data.status).toBe(status)
        }
      ),
      { numRuns: 100 }
    )
  })
})
