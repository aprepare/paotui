import { describe, it, expect } from 'vitest'
import { sortOrders, computeBuildingTabs, expressPriority, errandPriority } from './order-sort.js'
import fc from 'fast-check'

// ─── 13.2 Property 22: sorting priority hierarchy ──────────────────

describe('Feature: comprehensive-testing, Property 22: Order sorting priority hierarchy', () => {
  // **Validates: Requirements 11.1, 11.2, 11.3**

  const orderArb = fc.record({
    orderType: fc.constantFrom('express', 'errand'),
    status: fc.constantFrom(0, 1, 2, 3, 4),
    tip: fc.integer({ min: 0, max: 50 }),
    buildingName: fc.constantFrom('1栋', '2栋', '3栋'),
  })

  it('pending orders (status=0) appear before non-pending; same priority sorted by tip desc', () => {
    fc.assert(
      fc.property(
        fc.array(orderArb, { minLength: 2, maxLength: 30 }),
        (orders) => {
          const sorted = sortOrders(orders)

          for (let i = 0; i < sorted.length - 1; i++) {
            const a = sorted[i]
            const b = sorted[i + 1]
            const pmA = a.orderType === 'errand' ? errandPriority : expressPriority
            const pmB = b.orderType === 'errand' ? errandPriority : expressPriority
            const prioA = pmA[a.status] !== undefined ? pmA[a.status] : 5
            const prioB = pmB[b.status] !== undefined ? pmB[b.status] : 5

            // Priority ordering must be non-decreasing
            expect(prioA).toBeLessThanOrEqual(prioB)

            // Within same priority, tip must be non-increasing
            if (prioA === prioB) {
              expect(a.tip || 0).toBeGreaterThanOrEqual(b.tip || 0)
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})

// ─── 13.3 Property 23: building filter count accuracy ───────────────

describe('Feature: comprehensive-testing, Property 23: Building filter count accuracy', () => {
  // **Validates: Requirements 11.4**

  const orderArb = fc.record({
    orderType: fc.constantFrom('express', 'errand'),
    status: fc.constantFrom(0, 1, 2, 3, 4),
    tip: fc.integer({ min: 0, max: 50 }),
    buildingName: fc.constantFrom('1栋', '2栋', '3栋', '4栋'),
  })

  it('building tab counts sum to total and each count matches actual orders', () => {
    fc.assert(
      fc.property(
        fc.array(orderArb, { minLength: 0, maxLength: 30 }),
        (orders) => {
          const sorted = sortOrders(orders)
          const tabs = computeBuildingTabs(sorted)

          // '全部' tab count equals total
          const allTab = tabs.find(t => t.name === '全部')
          expect(allTab).toBeTruthy()
          expect(allTab.count).toBe(sorted.length)

          // Sum of building tabs equals total
          const buildingTabs = tabs.filter(t => t.name !== '全部')
          const sum = buildingTabs.reduce((s, t) => s + t.count, 0)
          expect(sum).toBe(sorted.length)

          // Each building tab count matches actual
          for (const tab of buildingTabs) {
            const actual = sorted.filter(o => (o.buildingName || '未知') === tab.name).length
            expect(tab.count).toBe(actual)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
