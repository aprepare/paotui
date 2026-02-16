import { describe, it, expect, beforeEach } from 'vitest'
import { resetDatabase, createTestEnv, seedDoc } from '../mocks/wx-server-sdk.js'

const expressModule = await import('../../cloudfunctions/express/index.js')
const expressMain = expressModule.main

describe('smoke test: express cloud function with mock', () => {
  beforeEach(() => {
    resetDatabase()
    createTestEnv('user_001')
    seedDoc('users', 'u1', { openid: 'user_001', name: 'Alice' })
    seedDoc('stats', 's1', { key: 'global', totalOrders: 0, todayDelivered: 0 })
  })

  it('create returns code 0 and an id', async () => {
    const result = await expressMain({
      action: 'create',
      data: { pickupPoint: '菜鸟驿站', building: '1号楼', room: '101', price: 3 },
    }, {})
    expect(result.code).toBe(0)
    expect(result.id).toBeTruthy()
  })

  it('unknown action returns code -1', async () => {
    const result = await expressMain({ action: 'nonexistent', data: {} }, {})
    expect(result.code).toBe(-1)
    expect(result.msg).toContain('unknown action')
  })
})
