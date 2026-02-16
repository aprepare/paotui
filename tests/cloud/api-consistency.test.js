import { describe, it, expect, beforeEach } from 'vitest'
import { resetDatabase, createTestEnv } from '../mocks/wx-server-sdk.js'
import fc from 'fast-check'

// Import all cloud functions
const express = await import('../../cloudfunctions/express/index.js')
const errand = await import('../../cloudfunctions/errand/index.js')
const carpool = await import('../../cloudfunctions/carpool/index.js')
const team = await import('../../cloudfunctions/team/index.js')
const forum = await import('../../cloudfunctions/forum/index.js')
const message = await import('../../cloudfunctions/message/index.js')
const user = await import('../../cloudfunctions/user/index.js')
const market = await import('../../cloudfunctions/market/index.js')
const order = await import('../../cloudfunctions/order/index.js')
const home = await import('../../cloudfunctions/home/index.js')
const skill = await import('../../cloudfunctions/skill/index.js')

const standardFunctions = [
  { name: 'express', fn: express.main },
  { name: 'errand', fn: errand.main },
  { name: 'carpool', fn: carpool.main },
  { name: 'team', fn: team.main },
  { name: 'forum', fn: forum.main },
  { name: 'message', fn: message.main },
  { name: 'user', fn: user.main },
  { name: 'market', fn: market.main },
  { name: 'order', fn: order.main },
  { name: 'home', fn: home.main },
]

function setup() {
  resetDatabase()
  createTestEnv('test_user')
}

// ─── 16.1 Property 1: unknown action handling ──────────────────────

describe('Feature: comprehensive-testing, Property 1: Unknown action returns error with code -1', () => {
  // **Validates: Requirements 1.2, 1.4**
  beforeEach(setup)

  it('for any random unknown action, all standard cloud functions return code -1 with msg containing the action', async () => {
    // Known actions to exclude per function
    const knownActions = {
      express: ['create', 'list', 'detail', 'accept', 'cancel', 'updateStatus', 'updateLocation', 'getLocation', 'buildingStats', 'myOrders'],
      errand: ['create', 'list', 'detail', 'accept', 'cancel', 'updateStatus', 'myTasks'],
      carpool: ['create', 'list', 'detail', 'join', 'leave', 'cancel'],
      team: ['create', 'list', 'detail', 'join', 'leave', 'endActivity', 'uploadPhotos', 'myActivities'],
      forum: ['list', 'detail', 'create', 'like', 'comment', 'myPosts', 'delete', 'likeComment', 'deleteComment'],
      message: ['list', 'unreadCount', 'markRead', 'markAllRead', 'delete', 'deleteAll', 'send'],
      user: ['login', 'getProfile', 'updateProfile', 'registerRider', 'getStats', 'toggleFavorite', 'checkFavorite', 'myFavorites', 'sendSmsCode', 'verifySmsCode'],
      market: ['create', 'list', 'detail', 'want', 'delete', 'myGoods'],
      order: ['myPublished', 'myAccepted', 'myCarpool'],
      home: ['getLiveData', 'getLatestOrders', 'getSchools'],
    }

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => {
          // Filter out any string that could be a known action for any function
          const allKnown = Object.values(knownActions).flat()
          return !allKnown.includes(s)
        }),
        async (action) => {
          for (const { name, fn } of standardFunctions) {
            setup()
            const res = await fn({ action, data: {} }, {})
            expect(res.code).toBe(-1)
            expect(res.msg).toContain(action)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})

// ─── 16.2 Skill module parameter inconsistency ─────────────────────

describe('Skill module parameter inconsistency', () => {
  beforeEach(setup)

  it('skill reads parameters from event directly, not event.data', async () => {
    // When callCloud sends { action: 'create', data: { title: '...', ... } }
    // skill reads event.title (undefined), not event.data.title
    // This documents the inconsistency
    const res = await skill.main({
      action: 'create',
      data: { title: 'Test Skill', category: '设计', desc: 'desc', price: 50 },
    }, {})

    // The skill function reads from event directly, so event.title is undefined
    // but it still creates a record (with undefined fields)
    // This is the inconsistency: it should read from event.data but reads from event
    expect(res.code).toBe(0)

    // Verify the created skill has undefined title because skill reads event.title not event.data.title
    const cloud = createTestEnv('test_user')
    const db = cloud.database()
    const skills = await db.collection('skills').where({ _openid: 'test_user' }).get()
    expect(skills.data.length).toBe(1)
    // title is undefined because skill reads from event.title, not event.data.title
    expect(skills.data[0].title).toBeUndefined()
  })

  it('skill uses _openid field instead of openid', async () => {
    // Create a skill directly to verify the field name
    const res = await skill.main({ action: 'create', title: 'Direct', category: '其他' }, {})
    expect(res.code).toBe(0)

    const cloud = createTestEnv('test_user')
    const db = cloud.database()
    const skills = await db.collection('skills').where({ _openid: 'test_user' }).get()
    expect(skills.data.length).toBe(1)
    // skill uses _openid, other functions use openid
    expect(skills.data[0]._openid).toBe('test_user')
  })

  it('skill default case returns 未知操作 instead of unknown action: <action>', async () => {
    const res = await skill.main({ action: 'nonexistent' }, {})
    expect(res.code).toBe(-1)
    // Skill uses Chinese message, not the standard 'unknown action: ...' pattern
    expect(res.msg).toBe('未知操作')
    // This differs from all other cloud functions which use 'unknown action: ' + action
  })
})
