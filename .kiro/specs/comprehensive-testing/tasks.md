# Implementation Plan: Comprehensive Testing

## Overview

为校园跑腿微信小程序搭建完整的测试基础设施，包括 mock 层、云函数测试、前端逻辑测试和 API 一致性测试。使用 Vitest 作为测试运行器，fast-check 作为属性测试库。

## Tasks

- [x] 1. Set up test infrastructure
  - [x] 1.1 Install Vitest and fast-check dependencies, create vitest.config.js
    - Add `vitest` and `fast-check` as devDependencies
    - Configure vitest to handle CommonJS cloud functions
    - Add `test` script to package.json
    - _Requirements: All_

  - [x] 1.2 Create wx-server-sdk mock layer (`tests/mocks/wx-server-sdk.js`)
    - Implement in-memory document database with collection/doc/where/add/get/update/remove/count/orderBy/skip/limit
    - Implement `db.command` with `inc`, `push`, `pull`, `neq`, `lt`, `and`, `field`
    - Implement `cloud.getWXContext()` returning configurable OPENID
    - Implement `db.serverDate()` returning current Date
    - Implement `db.RegExp()` for regex queries
    - Implement `cloud.getTempFileURL()` mock
    - Provide `createTestEnv(openid)` and `resetDatabase()` helpers
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Checkpoint - Verify test infrastructure
  - Ensure mock layer works, run a simple smoke test, ask the user if questions arise.

- [x] 3. Cloud function tests - Express
  - [x] 3.1 Write unit tests for express create, accept, cancel, updateStatus actions
    - Test create with valid fields returns code: 0 and new ID
    - Test accept updates status to 1 and sets riderId
    - Test cancel permission checks (owner-only, not during delivery)
    - Test updateStatus transitions
    - _Requirements: 2.1, 2.2, 2.5, 2.6_

  - [x] 3.2 Write property test: accept rejects non-pending orders (Property 2)
    - **Property 2: Express order accept rejects non-pending orders**
    - **Validates: Requirements 2.3**

  - [x] 3.3 Write property test: cancel permission check (Property 3)
    - **Property 3: Express order cancel permission check**
    - **Validates: Requirements 2.7**

- [x] 4. Cloud function tests - Errand
  - [x] 4.1 Write unit tests for errand create, accept, cancel, updateStatus actions
    - Test create with valid fields returns code: 0
    - Test accept updates status to 1
    - Test cancel rejects during in-progress (status=1)
    - Test status flow: 0→1→4→2 (pending→progress→confirm→complete)
    - _Requirements: 3.1, 3.2, 3.5, 3.6, 3.7_

  - [x] 4.2 Write property test: accept rejects non-pending tasks (Property 4)
    - **Property 4: Errand task accept rejects non-pending tasks**
    - **Validates: Requirements 3.3**

- [x] 5. Cloud function tests - Carpool
  - [x] 5.1 Write unit tests for carpool create, join, leave, cancel actions
    - Test create with valid fields
    - Test join increments currentPeople
    - Test leave decrements currentPeople
    - Test creator cannot leave
    - Test non-creator cannot cancel
    - _Requirements: 4.1, 4.4, 4.5, 4.6_

  - [x] 5.2 Write property test: join/leave round-trip (Property 5)
    - **Property 5: Carpool join/leave round-trip preserves member count**
    - **Validates: Requirements 4.1, 4.5**

  - [x] 5.3 Write property test: full capacity rejection (Property 6)
    - **Property 6: Carpool full capacity rejection**
    - **Validates: Requirements 4.2**

  - [x] 5.4 Write property test: duplicate join rejection (Property 7)
    - **Property 7: Carpool duplicate join rejection**
    - **Validates: Requirements 4.3**

- [x] 6. Cloud function tests - Team
  - [x] 6.1 Write unit tests for team create, join, leave, endActivity actions
    - Test create with valid fields
    - Test join with capacity and ended checks
    - Test leave for non-creator
    - Test endActivity permission
    - _Requirements: 5.1, 5.5, 5.6, 5.7_

  - [x] 6.2 Write property test: join/capacity invariant (Property 8)
    - **Property 8: Team activity join/capacity invariant**
    - **Validates: Requirements 5.1, 5.4**

- [x] 7. Cloud function tests - Forum
  - [x] 7.1 Write unit tests for forum create, like, comment, delete, deleteComment actions
    - Test create with valid content
    - Test like toggle behavior
    - Test comment with reply
    - Test delete cascades to comments
    - Test deleteComment permission (author or post owner)
    - _Requirements: 6.3, 6.5, 6.6, 6.7_

  - [x] 7.2 Write property test: like toggle round-trip (Property 9)
    - **Property 9: Forum like toggle round-trip**
    - **Validates: Requirements 6.1, 6.2**

  - [x] 7.3 Write property test: comment increments count (Property 10)
    - **Property 10: Forum comment increments count**
    - **Validates: Requirements 6.4**

  - [x] 7.4 Write property test: post deletion cascades (Property 11)
    - **Property 11: Forum post deletion cascades to comments**
    - **Validates: Requirements 6.6**

  - [x] 7.5 Write property test: non-owner deletion rejection (Property 12)
    - **Property 12: Forum/Market non-owner deletion rejection**
    - **Validates: Requirements 6.7, 12.5**

- [x] 8. Cloud function tests - Message
  - [x] 8.1 Write unit tests for message list, markRead, markAllRead, delete, deleteAll, send actions
    - Test list returns messages for user
    - Test markRead updates single message
    - Test send skips self-notification
    - _Requirements: 7.1, 7.3, 7.5_

  - [x] 8.2 Write property test: markAllRead leaves no unread (Property 13)
    - **Property 13: Mark all read leaves no unread messages**
    - **Validates: Requirements 7.2**

  - [x] 8.3 Write property test: deleteAll leaves no messages (Property 14)
    - **Property 14: Delete all messages leaves no messages**
    - **Validates: Requirements 7.4**

- [x] 9. Cloud function tests - User
  - [x] 9.1 Write unit tests for user login, updateProfile, registerRider, sendSmsCode, verifySmsCode actions
    - Test first login creates new user with isNew=true
    - Test existing user login returns data
    - Test registerRider with valid/missing fields
    - Test SMS code flow (send, verify correct, verify expired, verify wrong)
    - _Requirements: 8.1, 8.3, 8.4, 8.6, 8.7_

  - [x] 9.2 Write property test: invalid phone rejection (Property 15)
    - **Property 15: Invalid phone number rejection**
    - **Validates: Requirements 8.5**

  - [x] 9.3 Write property test: incorrect SMS code rejection (Property 16)
    - **Property 16: Incorrect SMS code rejection**
    - **Validates: Requirements 8.8**

  - [x] 9.4 Write property test: login idempotence (Property 17)
    - **Property 17: Login idempotence**
    - **Validates: Requirements 8.2**

- [x] 10. Cloud function tests - Market
  - [x] 10.1 Write unit tests for market create, detail, want, delete, myGoods actions
    - Test create with valid fields
    - Test detail increments views
    - Test want increments wants
    - Test delete permission
    - _Requirements: 12.1, 12.4_

  - [x] 10.2 Write property test: views increment (Property 24)
    - **Property 24: Market views increment**
    - **Validates: Requirements 12.2**

  - [x] 10.3 Write property test: search results contain keyword (Property 25)
    - **Property 25: Search results contain keyword**
    - **Validates: Requirements 13.1, 13.2**

  - [x] 10.4 Write property test: category filter correctness (Property 26)
    - **Property 26: Category filter correctness**
    - **Validates: Requirements 13.3**

- [x] 11. Checkpoint - Verify all cloud function tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Frontend logic tests - SMS Parser
  - [x] 12.1 Extract SMS parser logic from express/create.vue into `tests/logic/sms-parser.js`
    - Extract the `onSmsInput` function as a pure function
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [x] 12.2 Write unit tests for SMS parser with real SMS examples
    - Test various SMS formats (菜鸟, 丰巢, 京东, 中通, etc.)
    - Test short text rejection
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [x] 12.3 Write property test: extracted code is substring (Property 20)
    - **Property 20: SMS parser extracted code is substring of input**
    - **Validates: Requirements 10.1, 10.5**

  - [x] 12.4 Write property test: company extraction (Property 21)
    - **Property 21: SMS parser company extraction**
    - **Validates: Requirements 10.3**

- [x] 13. Frontend logic tests - Order Sorting
  - [x] 13.1 Extract order sorting logic from index/index.vue into `tests/logic/order-sort.js`
    - Extract the sorting comparator and building filter computation
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [x] 13.2 Write property test: sorting priority hierarchy (Property 22)
    - **Property 22: Order sorting priority hierarchy**
    - **Validates: Requirements 11.1, 11.2, 11.3**

  - [x] 13.3 Write property test: building filter count accuracy (Property 23)
    - **Property 23: Building filter count accuracy**
    - **Validates: Requirements 11.4**

- [x] 14. Frontend logic tests - callCloud
  - [x] 14.1 Write unit tests for callCloud success and error handling
    - Mock wx.cloud.callFunction
    - Test success pass-through
    - Test error message display
    - Test network error fallback
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 14.2 Write property test: callCloud success pass-through (Property 18)
    - **Property 18: callCloud success pass-through**
    - **Validates: Requirements 9.1**

  - [x] 14.3 Write property test: callCloud error handling (Property 19)
    - **Property 19: callCloud error handling**
    - **Validates: Requirements 9.2**

- [x] 15. Cloud function tests - Favorite toggle
  - [x] 15.1 Write property test: favorite toggle round-trip (Property 27)
    - **Property 27: Favorite toggle round-trip**
    - **Validates: Requirements 14.1, 14.2, 14.3**

- [x] 16. API consistency tests
  - [x] 16.1 Write tests for unknown action handling across all cloud functions (Property 1)
    - Test each cloud function with random unknown action strings
    - Verify all return { code: -1, msg: 'unknown action: ...' }
    - _Requirements: 1.2_

  - [x] 16.2 Write tests for skill module parameter inconsistency
    - Verify skill reads from event directly vs event.data
    - Verify skill uses _openid vs openid
    - Document the inconsistency as a failing test / known issue
    - _Requirements: 15.1, 15.2_

- [x] 17. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks are required (comprehensive coverage from the start)
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The mock layer is the critical foundation — all cloud function tests depend on it
