import { describe, it, expect } from 'vitest'
import { parseSms, COMPANIES } from './sms-parser.js'
import fc from 'fast-check'

// ─── 12.2 Unit tests with real SMS examples ─────────────────────────

describe('SMS parser - unit tests', () => {
  it('菜鸟驿站 SMS', () => {
    const r = parseSms('【菜鸟驿站】您的顺丰快递已到菜鸟驿站A区，请凭5-2-1234到菜鸟驿站A区取件。')
    expect(r.recognized).toBe(true)
    expect(r.pickupCode).toBe('5-2-1234')
    expect(r.expressCompany).toBe('顺丰')
  })

  it('丰巢 SMS', () => {
    const r = parseSms('【丰巢】您的京东快递已到丰巢快递柜，取件码：8234，请及时取件。')
    expect(r.recognized).toBe(true)
    expect(r.pickupCode).toBe('8234')
    expect(r.expressCompany).toBe('京东')
  })

  it('中通 SMS with 提货码', () => {
    const r = parseSms('【中通快递】您的包裹在<中通快递柜A区>，提货码 12345678，请及时取件。')
    expect(r.recognized).toBe(true)
    expect(r.pickupCode).toBe('12345678')
    expect(r.expressCompany).toBe('中通')
  })

  it('short text rejection', () => {
    const r = parseSms('你好')
    expect(r.recognized).toBe(false)
  })

  it('empty text', () => {
    const r = parseSms('')
    expect(r.recognized).toBe(false)
  })
})

// ─── 12.3 Property 20: extracted code is substring of input ─────────

describe('Feature: comprehensive-testing, Property 20: SMS parser extracted code is substring of input', () => {
  // **Validates: Requirements 10.1, 10.5**
  it('for any SMS with a recognizable code, the code is a substring of the input', () => {
    const codeArb = fc.tuple(
      fc.integer({ min: 1, max: 9 }),
      fc.integer({ min: 1, max: 9 }),
      fc.integer({ min: 1000, max: 9999 })
    ).map(([a, b, c]) => `${a}-${b}-${c}`)

    fc.assert(
      fc.property(
        codeArb,
        fc.constantFrom('菜鸟驿站', '丰巢', '近邻宝'),
        (code, point) => {
          const sms = `您的快递已到${point}，请凭${code}到${point}取件。`
          const r = parseSms(sms)
          if (r.pickupCode) {
            expect(sms).toContain(r.pickupCode)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})

// ─── 12.4 Property 21: company extraction ───────────────────────────

describe('Feature: comprehensive-testing, Property 21: SMS parser company extraction', () => {
  // **Validates: Requirements 10.3**
  it('for any SMS containing a known company name, the extracted company matches', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...COMPANIES),
        (company) => {
          const sms = `【${company}】您的${company}快递已到菜鸟驿站，请凭1-2-3456到菜鸟驿站取件。`
          const r = parseSms(sms)
          expect(r.expressCompany).toBe(company)
        }
      ),
      { numRuns: 100 }
    )
  })
})
