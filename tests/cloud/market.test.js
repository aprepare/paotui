import { describe, it, expect, beforeEach } from 'vitest'
import { resetDatabase, createTestEnv, seedDoc } from '../mocks/wx-server-sdk.js'
import fc from 'fast-check'

const { main } = await import('../../cloudfunctions/market/index.js')

function setup() {
  resetDatabase()
  seedDoc('users', 'u1', { openid: 'seller', name: 'Seller' })
  seedDoc('users', 'u2', { openid: 'buyer', name: 'Buyer' })
}

async function createGoods(title = '二手书', price = 15) {
  createTestEnv('seller')
  const res = await main({ action: 'create', data: { title, price, category: '书籍' } }, {})
  return res.id
}

// ─── 10.1 Unit tests ────────────────────────────────────────────────

describe('market cloud function - unit tests', () => {
  beforeEach(setup)

  it('create with valid fields', async () => {
    const id = await createGoods()
    expect(id).toBeTruthy()
  })

  it('detail increments views', async () => {
    const id = await createGoods()
    createTestEnv('buyer')
    await main({ action: 'detail', data: { id } }, {})
    const cloud = createTestEnv('buyer')
    const db = cloud.database()
    const g = await db.collection('market_goods').doc(id).get()
    expect(g.data.views).toBe(1)
  })

  it('want increments wants', async () => {
    const id = await createGoods()
    createTestEnv('buyer')
    await main({ action: 'want', data: { goodsId: id } }, {})
    const cloud = createTestEnv('buyer')
    const db = cloud.database()
    const g = await db.collection('market_goods').doc(id).get()
    expect(g.data.wants).toBe(1)
  })

  it('delete permission', async () => {
    const id = await createGoods()
    createTestEnv('buyer')
    const res = await main({ action: 'delete', data: { goodsId: id } }, {})
    expect(res.code).toBe(-1)
    expect(res.msg).toBe('仅发布者可删除')
  })
})

// ─── 10.2 Property 24: views increment ──────────────────────────────

describe('Feature: comprehensive-testing, Property 24: Market views increment', () => {
  // **Validates: Requirements 12.2**
  it('calling detail N times increments views by N', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }),
        async (n) => {
          setup()
          const id = await createGoods()
          createTestEnv('buyer')
          for (let i = 0; i < n; i++) {
            await main({ action: 'detail', data: { id } }, {})
          }
          const cloud = createTestEnv('buyer')
          const db = cloud.database()
          const g = await db.collection('market_goods').doc(id).get()
          expect(g.data.views).toBe(n)
        }
      ),
      { numRuns: 100 }
    )
  })
})

// ─── 10.3 Property 25: search results contain keyword ───────────────

describe('Feature: comprehensive-testing, Property 25: Search results contain keyword', () => {
  // **Validates: Requirements 13.1, 13.2**
  it('for any keyword search, all returned items contain the keyword', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 5 }),
        async (keyword) => {
          setup()
          // Seed some goods with and without the keyword
          seedDoc('market_goods', 'g1', { openid: 'seller', title: keyword + '手机', category: '电子', views: 0, wants: 0, createTime: new Date() })
          seedDoc('market_goods', 'g2', { openid: 'seller', title: '完全不相关', category: '其他', views: 0, wants: 0, createTime: new Date() })
          seedDoc('market_goods', 'g3', { openid: 'seller', title: '另一个' + keyword, category: '电子', views: 0, wants: 0, createTime: new Date() })

          createTestEnv('buyer')
          const res = await main({ action: 'list', data: { keyword } }, {})
          expect(res.code).toBe(0)
          for (const item of res.data) {
            expect(item.title.toLowerCase()).toContain(keyword.toLowerCase())
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})

// ─── 10.4 Property 26: category filter correctness ──────────────────

describe('Feature: comprehensive-testing, Property 26: Category filter correctness', () => {
  // **Validates: Requirements 13.3**
  it('for any category filter, all returned items match that category', async () => {
    const categories = ['书籍', '电子', '服饰', '其他']
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...categories),
        async (category) => {
          setup()
          seedDoc('market_goods', 'g1', { openid: 'seller', title: '物品A', category: '书籍', createTime: new Date() })
          seedDoc('market_goods', 'g2', { openid: 'seller', title: '物品B', category: '电子', createTime: new Date() })
          seedDoc('market_goods', 'g3', { openid: 'seller', title: '物品C', category: '服饰', createTime: new Date() })
          seedDoc('market_goods', 'g4', { openid: 'seller', title: '物品D', category: '其他', createTime: new Date() })

          createTestEnv('buyer')
          const res = await main({ action: 'list', data: { category } }, {})
          expect(res.code).toBe(0)
          for (const item of res.data) {
            expect(item.category).toBe(category)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
