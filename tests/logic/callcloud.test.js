import { describe, it, expect, beforeEach, vi } from 'vitest'
import fc from 'fast-check'

// Mock wx and uni globals before importing callCloud
// callCloudFunction in cloud.js uses callback style: { success, fail }
// so the mock must invoke those callbacks instead of returning a Promise
globalThis.wx = {
  cloud: {
    callFunction: vi.fn(),
  },
}
globalThis.uni = {
  showToast: vi.fn(),
  navigateTo: vi.fn(),
  getStorageSync: vi.fn(),
}

// Helper to set up wx.cloud.callFunction to resolve via success callback
function mockCloudResolve(result) {
  wx.cloud.callFunction.mockImplementation((opts) => {
    if (opts.success) opts.success(result)
    return Promise.resolve(result)
  })
}

// Helper to set up wx.cloud.callFunction to reject via fail callback
function mockCloudReject(err) {
  wx.cloud.callFunction.mockImplementation((opts) => {
    if (opts.fail) opts.fail(err)
    return Promise.reject(err)
  })
}

const { callCloud } = await import('../../src/utils/cloud.js')

// ─── 14.1 Unit tests for callCloud ─────────────────────────────────

describe('callCloud - unit tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('success pass-through: returns full result when code=0', async () => {
    const mockResult = { code: 0, data: { id: '123', name: 'test' } }
    mockCloudResolve({ result: mockResult })

    const res = await callCloud('express', 'list', { status: 0 })
    expect(res).toEqual(mockResult)
  })

  it('error response: returns result and shows toast with error msg', async () => {
    const mockResult = { code: -1, msg: '订单已被接' }
    mockCloudResolve({ result: mockResult })

    const res = await callCloud('express', 'accept', { id: '1' })
    expect(res).toEqual(mockResult)
    expect(uni.showToast).toHaveBeenCalledWith({ title: '订单已被接', icon: 'none' })
  })

  it('network error: returns code -1 and shows 网络异常 toast', async () => {
    mockCloudReject(new Error('timeout'))

    const res = await callCloud('express', 'list', {})
    expect(res.code).toBe(-1)
    expect(uni.showToast).toHaveBeenCalledWith({ title: '网络异常，请重试', icon: 'none' })
  })
})

// ─── 14.2 Property 18: callCloud success pass-through ───────────────

describe('Feature: comprehensive-testing, Property 18: callCloud success pass-through', () => {
  // **Validates: Requirements 9.1**
  it('for any response with code=0, callCloud returns the exact result', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 20 }),
          value: fc.integer(),
        }),
        async (data) => {
          vi.clearAllMocks()
          const mockResult = { code: 0, data }
          mockCloudResolve({ result: mockResult })

          const res = await callCloud('test', 'action', {})
          expect(res).toEqual(mockResult)
          expect(res.code).toBe(0)
          expect(res.data).toEqual(data)
        }
      ),
      { numRuns: 100 }
    )
  })
})

// ─── 14.3 Property 19: callCloud error handling ─────────────────────

describe('Feature: comprehensive-testing, Property 19: callCloud error handling', () => {
  // **Validates: Requirements 9.2**
  it('for any response with code=-1 and msg, callCloud returns both fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        async (msg) => {
          vi.clearAllMocks()
          const mockResult = { code: -1, msg }
          mockCloudResolve({ result: mockResult })

          const res = await callCloud('test', 'action', {})
          expect(res.code).toBe(-1)
          expect(res.msg).toBe(msg)
        }
      ),
      { numRuns: 100 }
    )
  })
})
