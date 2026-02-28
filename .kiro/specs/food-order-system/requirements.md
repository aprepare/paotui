# Requirements Document

## Introduction

将福利外卖的订单系统从跑腿（errand_tasks）中独立出来，建立专属的外卖订单集合（food_orders）和独立的订单管理流程。支持骑手配送和用户自取两种模式，订单状态流更贴合外卖业务场景。

## Glossary

- **Food_Order_System**: 外卖订单系统，负责外卖订单的创建、状态管理、查询等功能
- **Food_Order**: 外卖订单，存储在 `food_orders` 集合中的订单记录
- **Delivery_Mode**: 配送模式，分为"骑手配送"和"用户自取"两种
- **Order_Status**: 订单状态，包括待确认、制作中、配送中/待自取、已完成、已取消
- **Rider**: 骑手，接受配送任务并完成外卖配送的注册用户
- **Shop**: 商家，提供餐品的食堂/店铺
- **Confirm_Page**: 确认订单页面，用户填写收货信息并提交订单的页面
- **Order_Detail_Page**: 外卖订单详情页，展示订单完整信息和状态的页面

## Requirements

### Requirement 1: 独立外卖订单集合

**User Story:** As a developer, I want food orders stored in a dedicated `food_orders` collection, so that food order management is decoupled from the errand task system.

#### Acceptance Criteria

1. WHEN a food order is created, THE Food_Order_System SHALL write the order to the `food_orders` collection instead of `errand_tasks`
2. THE Food_Order SHALL contain fields: openid, shopId, shopName, items, itemsTotal, deliveryFee, totalPrice, deliveryMode, address, phone, userName, remark, status, riderId, createTime
3. WHEN querying food orders, THE Food_Order_System SHALL read from the `food_orders` collection exclusively

### Requirement 2: 配送模式选择

**User Story:** As a user, I want to choose between rider delivery and self-pickup when placing a food order, so that I can get my food in the way that suits me.

#### Acceptance Criteria

1. WHEN a user is on the Confirm_Page, THE Food_Order_System SHALL display a Delivery_Mode selector with options "骑手配送" and "到店自取"
2. WHEN "到店自取" is selected, THE Confirm_Page SHALL hide the delivery address field and set deliveryFee to 0
3. WHEN "骑手配送" is selected, THE Confirm_Page SHALL require the user to fill in a delivery address
4. WHEN a food order is created, THE Food_Order SHALL store the selected Delivery_Mode value

### Requirement 3: 外卖订单状态流

**User Story:** As a user, I want food orders to follow a status flow that matches the takeout experience, so that I can clearly understand my order progress.

#### Acceptance Criteria

1. WHEN a food order is created, THE Food_Order_System SHALL set the initial status to 0 (待确认)
2. WHEN an admin or shop confirms the order, THE Food_Order_System SHALL update the status to 1 (制作中)
3. WHEN the food is ready and Delivery_Mode is "骑手配送", THE Food_Order_System SHALL update the status to 2 (配送中)
4. WHEN the food is ready and Delivery_Mode is "到店自取", THE Food_Order_System SHALL update the status to 2 (待自取)
5. WHEN the order is completed, THE Food_Order_System SHALL update the status to 3 (已完成)
6. WHEN the order is cancelled, THE Food_Order_System SHALL update the status to 4 (已取消)
7. IF a user cancels an order with status greater than 1, THEN THE Food_Order_System SHALL reject the cancellation

### Requirement 4: 外卖订单详情页

**User Story:** As a user, I want a dedicated food order detail page, so that I can view my order information and track its progress without being redirected to the errand detail page.

#### Acceptance Criteria

1. WHEN a user taps a food order in the order list, THE Food_Order_System SHALL navigate to the Order_Detail_Page
2. THE Order_Detail_Page SHALL display: shop name, order items with quantities and prices, delivery mode, delivery address (if applicable), contact phone, remark, order status, total price, and create time
3. WHEN the order status is 0 (待确认), THE Order_Detail_Page SHALL display a "取消订单" button
4. WHEN the order status is 2 and Delivery_Mode is "骑手配送", THE Order_Detail_Page SHALL display rider information if a rider has been assigned

### Requirement 5: 骑手接单配送

**User Story:** As a rider, I want to accept food delivery orders from the food order system, so that I can earn income by delivering food.

#### Acceptance Criteria

1. WHEN a food order has status 2 (配送中) and Delivery_Mode is "骑手配送", THE Food_Order_System SHALL allow a Rider to accept the delivery
2. WHEN a Rider accepts a food delivery, THE Food_Order SHALL store the riderId and rider name
3. WHEN a Rider completes the delivery, THE Food_Order_System SHALL update the order status to 3 (已完成)

### Requirement 6: 管理员外卖订单管理

**User Story:** As an admin, I want to manage food orders independently from errand tasks, so that I can handle food order operations in a dedicated interface.

#### Acceptance Criteria

1. WHEN an admin views the food order management section, THE Food_Order_System SHALL query orders from the `food_orders` collection
2. THE admin panel SHALL allow filtering food orders by status
3. THE admin panel SHALL allow advancing the order status step by step (待确认→制作中→配送中/待自取→已完成)
4. THE admin panel SHALL allow reprinting order receipts for food orders from the `food_orders` collection

### Requirement 7: 下单后跳转

**User Story:** As a user, I want to be redirected to the food order detail page after placing an order, so that I can immediately see my order status.

#### Acceptance Criteria

1. WHEN a food order is successfully submitted, THE Confirm_Page SHALL redirect to the Order_Detail_Page with the new order ID
2. WHEN a food order is successfully submitted, THE Food_Order_System SHALL clear the shopping cart data from local storage
