import { describe, it, expect, beforeEach } from 'vitest'
import { resetDatabase, createTestEnv, seedDoc } from '../mocks/wx-server-sdk.js'
import fc from 'fast-check'

const { main } = await import('../../cloudfunctions/user/index.js')

function setup() {
  resetDatabase()
}

// ─── 15.1 Property 27: favorite toggle round-trip ───────────────────

describe('Feature: comprehensive-testing, Property 27: Favorite toggle round-trip', () => {
  // **Validates: Requirements 14.1, 14.2, 14.3**
  it('toggling favorite twice results in favorited=false, checkFavorite confirms', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 3, maxLength: 15 }),
        fc.string({ minLength: 3, maxLength: 15 }),
        fc.constantFrom('post', 'goods'),
        async (openid, targetId, targetType) => {
          setup()
          createTestEnv(openid)

          // First toggle: should favorite
          const r1 = await main({ action: 'toggleFavorite', data: { targetId, targetType } }, {})
          expect(r1.code).toBe(0)
          expect(r1.favorited).toBe(true)

          // Check: should be favorited
          const c1 = await main({ action: 'checkFavorite', data: { targetId, targetType } }, {})
          expect(c1.code).toBe(0)
          expect(c1.favorited).toBe(true)

          // Second toggle: should unfavorite
          const r2 = await main({ action: 'toggleFavorite', data: { targetId, targetType } }, {})
          expect(r2.code).toBe(0)
          expect(r2.favorited).toBe(false)

          // Check: should not be favorited
          const c2 = await main({ action: 'checkFavorite', data: { targetId, targetType } }, {})
          expect(c2.code).toBe(0)
          expect(c2.favorited).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })
})
