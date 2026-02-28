# Implementation Plan: Bug Detection & Fix

## Overview

按照"后端优先"策略，先修复后端云函数的校验缺陷，再补充前端校验。每个模块修复后配套编写测试验证。使用 JavaScript + Vitest + fast-check 进行测试。

## Tasks

- [x] 1. 安装 fast-check 并创建校验工具函数
  - 安装 `fast-check` 作为 devDependency
  - 创建 `tests/helpers/validators.js` 提取通用校验函数（手机号、价格范围、状态转换）供云函数和测试共用
  - _Requirements: 3.1, 5.1, 6.1_

- [x] 2. 修复快递模块后端校验
  - [x] 2.1 修复 `cloudfunctions/express/index.js` create action
    - 添加 phone 字段持久化（当前未存储）
    - 添加 phone 格式校验（`/^1[3-9]\d{9}$/`）
    - 添加 tip 范围校验（0-99）
    - 添加 room 非空且长度 1-10 校验
    - _Requirements: 3.2, 5.2, 5.4, 11.2, 12.1_

  - [x] 2.2 修复 `cloudfunctions/express/index.js` updateStatus action
    - 添加状态流转合法性校验（仅允许 0→1, 1→2, 2→3）
    - 添加照片守卫：status 1→2 需要 pickupPhoto，status 2→3 需要 deliverPhoto
    - 拒绝终态（3, 4）的任何状态变更
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 6.1, 6.3, 6.4_

  - [x] 2.3 修复 `cloudfunctions/express/index.js` accept action
    - 添加骑手身份校验（查询 users 表验证 isRider === true）
    - _Requirements: 15.1_

  - [ ]* 2.4 编写快递模块属性测试
    - **Property 1: Express photo guard**
    - **Property 5: Express order state machine**
    - **Property 12: Express room number validation**
    - **Property 13: Express order data persistence round-trip**
    - **Validates: Requirements 1.1-1.4, 6.1, 6.3, 6.4, 11.1-11.2, 12.1**

- [x] 3. 修复跑腿模块后端校验
  - [x] 3.1 修复 `cloudfunctions/errand/index.js` create action
    - 添加 price 范围校验（1-999）
    - 添加 remark 和 timeRequire 字段持久化（当前未存储）
    - _Requirements: 5.5, 12.2_

  - [x] 3.2 修复 `cloudfunctions/errand/index.js` updateStatus action
    - 添加状态流转合法性校验（仅允许 0→1, 1→4, 4→2）
    - 添加照片守卫：status 1→4 需要 pickupPhoto + deliverPhoto
    - _Requirements: 2.1, 2.2, 6.2_

  - [x] 3.3 修复 `cloudfunctions/errand/index.js` accept action
    - 添加骑手身份校验
    - _Requirements: 15.2_

  - [ ]* 3.4 编写跑腿模块属性测试
    - **Property 2: Errand photo guard**
    - **Property 6: Errand task state machine**
    - **Property 14: Errand task data persistence round-trip**
    - **Validates: Requirements 2.1-2.2, 6.2, 12.2**

- [x] 4. Checkpoint - 确保核心模块测试通过
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. 修复用户模块后端校验
  - [x] 5.1 修复 `cloudfunctions/user/index.js` sendSmsCode action
    - 添加频率限制：同一手机号 60 秒内不可重复发送
    - 查询 sms_codes 表最近一条记录的 createTime 判断间隔
    - _Requirements: 4.1_

  - [x] 5.2 修复 `cloudfunctions/user/index.js` verifySmsCode action
    - 添加尝试次数限制：每条验证码最多验证 5 次
    - 失败时递增 attempts 字段，超过 5 次返回"验证码已失效"
    - _Requirements: 4.2, 4.3_

  - [x] 5.3 修复 `cloudfunctions/user/index.js` registerRider action
    - 添加 school 和 studentCardFileID 字段持久化到 riderInfo
    - _Requirements: 12.3_

  - [ ]* 5.4 编写用户模块属性测试
    - **Property 3: Phone number validation**
    - **Property 15: Rider registration data persistence round-trip**
    - **Validates: Requirements 3.1-3.4, 12.3**

- [x] 6. 修复二手市场模块后端校验
  - [x] 6.1 修复 `cloudfunctions/market/index.js` create action
    - 添加 price > 0 校验
    - 添加 contact 非空校验
    - _Requirements: 5.6, 9.2_

  - [ ]* 6.2 编写二手市场属性测试
    - **Property 4: Price range validation (market portion)**
    - **Property 10: Market contact required**
    - **Validates: Requirements 5.3, 5.6, 9.1-9.2**

- [x] 7. 修复拼车模块后端校验
  - [x] 7.1 修复 `cloudfunctions/carpool/index.js` create action
    - 添加 departTime 必须晚于当前时间的校验
    - 添加 deadline 必须早于 departTime 的校验（如果 deadline 非空）
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ]* 7.2 编写拼车模块属性测试
    - **Property 7: Carpool departure time must be in the future**
    - **Property 8: Carpool deadline before departure**
    - **Validates: Requirements 7.1-7.3**

- [x] 8. 修复组队模块后端校验
  - [x] 8.1 修复 `cloudfunctions/team/index.js` create action
    - 添加 max 人数范围校验（2-100 的正整数）
    - _Requirements: 8.2_

  - [ ]* 8.2 编写组队模块属性测试
    - **Property 9: Team max people range**
    - **Validates: Requirements 8.1-8.2**

- [x] 9. 修复技能出租和论坛模块后端校验
  - [x] 9.1 修复 `cloudfunctions/skill/index.js` create action
    - 添加 title 非空校验
    - 添加 price > 0 校验
    - 添加 contact 非空校验
    - _Requirements: 10.3_

  - [x] 9.2 修复 `cloudfunctions/forum/index.js` create action
    - 添加 content 长度校验（1-1000 字符）
    - _Requirements: 13.2_

  - [x] 9.3 修复 `cloudfunctions/forum/index.js` comment action
    - 添加 content 长度校验（1-500 字符）
    - _Requirements: 13.3_

  - [ ]* 9.4 编写技能和论坛属性测试
    - **Property 11: Skill required fields validation**
    - **Property 16: Forum content length validation**
    - **Validates: Requirements 10.1-10.3, 13.1-13.3**

- [x] 10. Checkpoint - 确保所有后端修复测试通过
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. 修复前端校验
  - [x] 11.1 修复 `src/pages/express/create.vue`
    - 添加 phone 格式校验（提交前验证）
    - 添加 tip 范围校验（自定义小费 0-99）
    - _Requirements: 3.2, 5.2_

  - [x] 11.2 修复 `src/pages/errand/create.vue`
    - 添加 price 上限校验（不超过 999）
    - 添加 phone 格式校验
    - _Requirements: 3.3, 5.1_

  - [x] 11.3 修复 `src/pages/market/create.vue`
    - 添加 price > 0 校验
    - 添加 contact 必填校验
    - _Requirements: 5.3, 9.1_

  - [x] 11.4 修复 `src/pages/carpool/create.vue`
    - 添加出发时间不能为过去时间的校验
    - 添加截止时间必须早于出发时间的校验
    - _Requirements: 7.1, 7.2_

  - [x] 11.5 修复 `src/pages/team/create.vue`
    - 添加 max 人数范围校验（2-100）
    - _Requirements: 8.1_

  - [x] 11.6 修复 `src/pages/skill/create.vue`
    - 添加 price > 0 校验
    - 添加 desc 必填校验
    - _Requirements: 10.1, 10.2_

- [ ] 12. 编写提现余额校验属性测试
  - [ ]* 12.1 编写提现模块属性测试
    - **Property 17: Withdrawal balance validation**
    - **Validates: Requirements 14.1-14.2**

  - [ ]* 12.2 编写骑手权限属性测试
    - **Property 18: Rider permission for accepting orders**
    - **Validates: Requirements 15.1-15.2**

- [x] 13. Final checkpoint - 确保所有测试通过
  - 99 tests across 15 test files all passing.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- 后端修复优先于前端修复，因为后端是安全保障的最后一道防线
