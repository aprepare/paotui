import { describe, it, expect, beforeEach } from 'vitest'
import { resetDatabase, createTestEnv, seedDoc } from '../mocks/wx-server-sdk.js'
import fc from 'fast-check'

const { main } = await import('../../cloudfunctions/user/index.js')

function setup() {
  resetDatabase()
}

// ─── 9.1 Unit tests ─────────────────────────────────────────────────

describe('user cloud function - unit tests', () => {
  beforeEach(setup)

  it('first login creates new user with isNew=true', async () => {
    createTestEnv('new_user')
    const res = await main({ action: 'login', data: {} }, {})
    expect(res.code).toBe(0)
    expect(res.isNew).toBe(true)
    expect(res.data.name).toBe('')
  })

  it('existing user login returns data', async () => {
    seedDoc('users', 'u1', { openid: 'existing', name: 'Alice', avatar: '', phone: '', isRider: false, riderId: '' })
    createTestEnv('existing')
    const res = await main({ action: 'login', data: {} }, {})
    expect(res.code).toBe(0)
    expect(res.data.name).toBe('Alice')
    expect(res.isNew).toBeUndefined()
  })

  it('registerRider with valid fields', async () => {
    seedDoc('users', 'u1', { openid: 'rider', name: 'Bob', isRider: false })
    createTestEnv('rider')
    const res = await main({
      action: 'registerRider',
      data: { realName: 'Bob', phone: '13800138000', studentId: '2024001' },
    }, {})
    expect(res.code).toBe(0)
    expect(res.riderId).toBeTruthy()
  })

  it('registerRider with missing fields rejected', async () => {
    createTestEnv('rider')
    const res = await main({
      action: 'registerRider',
      data: { realName: 'Bob' },
    }, {})
    expect(res.code).toBe(-1)
    expect(res.msg).toBe('missing fields')
  })

  it('SMS code flow: send, verify correct, verify expired, verify wrong', async () => {
    createTestEnv('user1')
    // Send
    const send = await main({ action: 'sendSmsCode', data: { phone: '13800138000' } }, {})
    expect(send.code).toBe(0)

    // Get the code from DB
    const cloud = createTestEnv('user1')
    const db = cloud.database()
    const codes = await db.collection('sms_codes').where({ phone: '13800138000' }).get()
    const code = codes.data[0].code

    // Verify correct
    const verify = await main({ action: 'verifySmsCode', data: { phone: '13800138000', smsCode: code } }, {})
    expect(verify.code).toBe(0)

    // Seed an expired code directly for expired test
    seedDoc('sms_codes', 'expired1', {
      phone: '13800138000', code: '111111',
      expireAt: 0, createTime: new Date(Date.now() - 120000), attempts: 0
    })
    const expired = await main({ action: 'verifySmsCode', data: { phone: '13800138000', smsCode: '111111' } }, {})
    expect(expired.code).toBe(-1)
    expect(expired.msg).toContain('过期')

    // Seed a valid code for wrong code test
    try { await db.collection('sms_codes').where({ phone: '13800138000' }).remove() } catch (e) {}
    seedDoc('sms_codes', 'valid1', {
      phone: '13800138000', code: '222222',
      expireAt: Date.now() + 300000, createTime: new Date(Date.now() - 120000), attempts: 0
    })
    const wrong = await main({ action: 'verifySmsCode', data: { phone: '13800138000', smsCode: '000000' } }, {})
    expect(wrong.code).toBe(-1)
    expect(wrong.msg).toContain('验证码错误')
  })
})


// ─── 9.2 Property 15: invalid phone rejection ──────────────────────

describe('Feature: comprehensive-testing, Property 15: Invalid phone number rejection', () => {
  // **Validates: Requirements 8.5**
  it('for any string not matching /^1[3-9]\\d{9}$/, sendSmsCode returns error', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 0, maxLength: 15 }).filter(s => !/^1[3-9]\d{9}$/.test(s)),
        async (phone) => {
          setup()
          createTestEnv('user1')
          const res = await main({ action: 'sendSmsCode', data: { phone } }, {})
          expect(res.code).toBe(-1)
          expect(res.msg).toBe('手机号格式不正确')
        }
      ),
      { numRuns: 100 }
    )
  })
})

// ─── 9.3 Property 16: incorrect SMS code rejection ─────────────────

describe('Feature: comprehensive-testing, Property 16: Incorrect SMS code rejection', () => {
  // **Validates: Requirements 8.8**
  it('for any stored code and any non-matching attempt, verifySmsCode returns error', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.stringMatching(/^[0-9]{6}$/),
        fc.stringMatching(/^[0-9]{6}$/),
        async (storedCode, attemptCode) => {
          fc.pre(storedCode !== attemptCode)
          setup()
          seedDoc('sms_codes', 'sc1', {
            phone: '13800138000', code: storedCode,
            expireAt: Date.now() + 300000, createTime: new Date(),
          })
          createTestEnv('user1')
          const res = await main({
            action: 'verifySmsCode',
            data: { phone: '13800138000', smsCode: attemptCode },
          }, {})
          expect(res.code).toBe(-1)
          expect(res.msg).toBe('验证码错误')
        }
      ),
      { numRuns: 100 }
    )
  })
})

// ─── 9.4 Property 17: login idempotence ─────────────────────────────

describe('Feature: comprehensive-testing, Property 17: Login idempotence', () => {
  // **Validates: Requirements 8.2**
  it('for any user, calling login multiple times returns same data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 3, maxLength: 20 }),
        async (openid) => {
          setup()
          createTestEnv(openid)
          const r1 = await main({ action: 'login', data: {} }, {})
          const r2 = await main({ action: 'login', data: {} }, {})
          expect(r1.data.openid).toBe(r2.data.openid)
          expect(r1.data._id).toBe(r2.data._id)

          // No duplicate records
          const cloud = createTestEnv(openid)
          const db = cloud.database()
          const users = await db.collection('users').where({ openid }).count()
          expect(users.total).toBe(1)
        }
      ),
      { numRuns: 100 }
    )
  })
})
