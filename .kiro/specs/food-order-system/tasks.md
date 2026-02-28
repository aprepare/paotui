# Implementation Plan: Food Order System

## Overview

将福利外卖订单系统从 errand_tasks 中独立出来，建立 food_orders 集合，支持骑手配送和到店自取，拥有独立的状态流和订单详情页。

## Tasks

- [x] 1. 创建核心状态转换逻辑和数据模型
  - [x] 1.1 创建 `src/utils/foodOrder.js` 工具模块
    - 实现 `getStatusInfo(status, deliveryMode)` 函数，返回 statusText 和 color
    - 实现 `canCancel(status)` 函数，status <= 1 时返回 true
    - 实现 `canRiderAccept(status, deliveryMode)` 函数
    - 实现 `calcOrderPrice(items, deliveryFee)` 计算总价函数
    - 实现 `validateOrder(data)` 验证订单数据完整性函数
    - _Requirements: 1.2, 2.2, 2.3, 3.1, 3.7_

  - [ ]* 1.2 编写 foodOrder.js 的属性测试
    - **Property 2: Delivery mode validation**
    - **Property 3: Initial status invariant**
    - **Property 4: Valid status transitions**
    - **Property 5: Invalid cancellation rejection**
    - **Validates: Requirements 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**

  - [ ]* 1.3 编写 foodOrder.js 的单元测试
    - 测试 getStatusInfo 各状态码和配送模式组合
    - 测试 canCancel 边界值
    - 测试 calcOrderPrice 价格计算
    - _Requirements: 3.2, 3.3, 3.4_

- [x] 2. 改造云函数 food/index.js
  - [x] 2.1 改造 `createOrder` action
    - 写入 `food_orders` 集合而非 `errand_tasks`
    - 新增 `deliveryMode` 字段处理
    - 自取模式下 deliveryFee 强制为 0
    - 配送模式下校验 address 非空
    - 初始 status 设为 0，statusText 设为"待确认"
    - 保留异步打印小票逻辑，从 food_orders 读取
    - _Requirements: 1.1, 1.2, 2.2, 2.3, 2.4, 3.1_

  - [x] 2.2 改造 `myOrders` action
    - 从 `food_orders` 集合查询，移除 `type: 'food'` 过滤
    - 返回数据增加 deliveryMode 字段
    - _Requirements: 1.3_

  - [x] 2.3 改造 `orderDetail` action
    - 从 `food_orders` 集合查询
    - 返回完整订单数据包括 deliveryMode、riderId、riderName、riderPhone
    - _Requirements: 1.3, 4.2_

  - [x] 2.4 改造 `cancelOrder` action
    - 从 `food_orders` 集合操作
    - 限制 status <= 1 才可取消，status > 1 返回错误
    - 取消后 status 设为 4，statusText 设为"已取消"
    - _Requirements: 3.6, 3.7_

  - [x] 2.5 新增 `riderAccept` action
    - 校验订单 status === 2 且 deliveryMode === 'delivery'
    - 校验 riderId 为空（未被接单）
    - 写入 riderId、riderName、riderPhone
    - _Requirements: 5.1, 5.2_

  - [x] 2.6 新增 `riderComplete` action
    - 校验订单 status === 2 且 riderId 为当前用户
    - 更新 status 为 3，statusText 为"已完成"
    - _Requirements: 5.3_

  - [x] 2.7 改造 `updateOrderStatus` action
    - 从 `food_orders` 集合操作
    - 根据 deliveryMode 设置正确的 statusText（配送中/待自取）
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 6.3_

  - [x] 2.8 改造 `adminOrderList` 和 `reprintOrder` actions
    - 从 `food_orders` 集合查询和操作
    - _Requirements: 6.1, 6.4_

- [x] 3. Checkpoint - 确保云函数改造完成
  - 确保所有云函数 action 正确读写 food_orders 集合
  - 确保所有 tests pass，如有问题请告知

- [x] 4. 改造确认订单页 confirm.vue
  - [x] 4.1 增加配送模式选择器
    - 新增 deliveryMode ref，默认 'delivery'
    - 添加"骑手配送"和"到店自取"两个选项的 UI
    - 选择"到店自取"时隐藏地址输入框、配送费显示为 0
    - 选择"骑手配送"时恢复地址输入和正常配送费
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 4.2 改造提交逻辑
    - 提交时传递 deliveryMode 参数给云函数
    - 自取模式下不校验地址
    - 下单成功后跳转 `/pages/food/detail?id=xxx`（不再跳 errand/detail）
    - _Requirements: 2.4, 7.1, 7.2_

- [x] 5. 新建外卖订单详情页 detail.vue
  - [x] 5.1 创建 `src/pages/food/detail.vue`
    - 状态 Banner：根据 status 和 deliveryMode 显示对应颜色、emoji、文案
    - 商品明细卡片：展示 items 列表、小计、配送费、总价
    - 配送信息卡片：配送模式显示地址和联系人，自取模式显示商家地址
    - 骑手信息卡片：status >= 2 且 deliveryMode 为 delivery 且有 riderId 时显示
    - 操作按钮：status 0 时显示"取消订单"，骑手在 status 2 时显示"接单"和"完成配送"
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1_

  - [x] 5.2 在 `src/pages.json` 中注册 detail 页面路由
    - 在 food 子包中添加 detail 路由配置
    - _Requirements: 4.1_

- [x] 6. 改造订单列表页 orders.vue
  - [x] 6.1 更新 `src/pages/food/orders.vue`
    - goDetail 跳转改为 `/pages/food/detail?id=xxx`
    - 订单卡片增加配送模式标签（🚴配送 / 🏪自取）
    - _Requirements: 4.1_

- [x] 7. 改造管理后台外卖订单管理
  - [x] 7.1 更新 `src/pages/admin/index.vue` 中外卖订单管理部分
    - 订单列表增加 deliveryMode 显示
    - 推进状态按钮文案根据 deliveryMode 动态变化
    - 确保查询和操作都走 food_orders
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 8. Final checkpoint - 全面验证
  - 确保所有 tests pass，如有问题请告知
  - 验证完整下单流程：选商家→点餐→确认订单（选配送模式）→提交→查看详情
  - 验证管理后台订单管理功能正常

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- 需要在微信开发者工具云控制台手动创建 `food_orders` 集合
- 现有 errand_tasks 中的历史外卖订单不做迁移，新订单走新集合
- 每个属性测试标注对应的设计属性编号
- Checkpoints 确保增量验证
