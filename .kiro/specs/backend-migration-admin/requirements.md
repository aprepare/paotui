# Requirements Document

## Introduction

将校园跑腿小程序的后端从微信云开发迁移到自建阿里云服务器，包括：将12个云函数转为 Node.js HTTP API 服务，数据库从微信云数据库迁移到 MongoDB，图片存储从微信云存储迁移到七牛云 OSS，并新建一个 Web 后台管理系统，提供对小程序所有数据和内容的完整管理能力。

## Glossary

- **API_Server**: 运行在阿里云服务器上的 Node.js HTTP 后端服务，替代原有微信云函数
- **Admin_Panel**: 运行在阿里云服务器上的 Web 后台管理系统
- **Mini_Program**: 微信小程序前端（uni-app）
- **MongoDB**: 自建服务器上的 MongoDB 数据库，替代微信云数据库
- **Qiniu_OSS**: 七牛云对象存储服务，替代微信云存储
- **Collection**: MongoDB 中的数据集合（users, express_orders, errand_tasks, carpool, forum_posts, forum_comments, market_goods, team_activities, team_members, messages, user_favorites, sms_codes, stats, skills）
- **Admin**: 后台管理系统的管理员用户
- **Rider**: 注册为骑手的小程序用户，可接单配送

## Requirements

### Requirement 1: API 服务搭建

**User Story:** As a developer, I want to set up a Node.js API server on my Alibaba Cloud server, so that all mini program backend logic runs on my own infrastructure instead of WeChat Cloud.

#### Acceptance Criteria

1. THE API_Server SHALL expose RESTful HTTP endpoints that replicate all 12 cloud function modules (user, express, errand, carpool, market, forum, team, message, order, home, skill, seed)
2. THE API_Server SHALL use the same action-based routing pattern, mapping each cloud function action to a dedicated API endpoint
3. THE API_Server SHALL return responses in the same format as the original cloud functions: `{ code: 0, data: ... }` for success and `{ code: -1, msg: '...' }` for errors
4. THE API_Server SHALL connect to a local MongoDB instance for all database operations
5. THE API_Server SHALL read all sensitive configuration (database URI, Qiniu keys, JWT secret) from environment variables or a config file not committed to version control

### Requirement 2: 微信登录与鉴权

**User Story:** As a mini program user, I want to log in with my WeChat account seamlessly, so that I can use the app without creating a separate account.

#### Acceptance Criteria

1. WHEN the Mini_Program sends a WeChat login code, THE API_Server SHALL exchange it with WeChat servers to obtain the user's openid and session_key
2. WHEN a valid openid is obtained, THE API_Server SHALL issue a JWT token to the Mini_Program for subsequent authenticated requests
3. WHEN an API request includes a valid JWT token, THE API_Server SHALL extract the openid from the token and use it for user identification
4. IF an API request has an invalid or expired JWT token, THEN THE API_Server SHALL return a 401 status code with an error message
5. WHEN a new openid is encountered during login, THE API_Server SHALL auto-create a user record in the users Collection

### Requirement 3: 数据库迁移

**User Story:** As a developer, I want to migrate all data from WeChat Cloud Database to MongoDB, so that I have full control over my data.

#### Acceptance Criteria

1. THE API_Server SHALL create MongoDB collections matching all 14 original cloud database collections with equivalent document schemas
2. THE API_Server SHALL replicate all query patterns including filtering, sorting, pagination, keyword search, and regex search
3. THE API_Server SHALL replicate all atomic operations (increment, push to array, pull from array) using MongoDB equivalents
4. WHEN a document is created, THE API_Server SHALL generate server-side timestamps equivalent to the original `db.serverDate()`
5. THE API_Server SHALL support the same 24-hour auto-confirm logic for express orders and errand tasks

### Requirement 4: 图片存储迁移到七牛云

**User Story:** As a user, I want to upload and view images reliably, so that my avatars, order photos, and marketplace images work correctly.

#### Acceptance Criteria

1. WHEN the Mini_Program uploads an image, THE API_Server SHALL receive the file and upload it to Qiniu_OSS, returning a public access URL
2. THE API_Server SHALL organize uploaded files into folders by type (avatars, images, team-photos)
3. WHEN an image URL is requested, THE API_Server SHALL return a direct Qiniu_OSS URL accessible without additional token exchange
4. THE API_Server SHALL support batch image uploads for marketplace goods, forum posts, and team activity photos

### Requirement 5: 小程序前端适配

**User Story:** As a developer, I want to update the mini program frontend to call my own server API instead of WeChat Cloud Functions, so that the app works with the new backend.

#### Acceptance Criteria

1. WHEN the Mini_Program makes an API call, THE `callCloud` utility SHALL send HTTP requests to the API_Server instead of calling `wx.cloud.callFunction`
2. THE Mini_Program SHALL attach the JWT token to every authenticated API request via an Authorization header
3. WHEN uploading images, THE Mini_Program SHALL upload files to the API_Server's upload endpoint instead of `wx.cloud.uploadFile`
4. THE Mini_Program SHALL remove all `wx.cloud.init()` calls and cloud-related initialization code
5. WHEN the JWT token expires or is invalid, THE Mini_Program SHALL automatically re-trigger the WeChat login flow to obtain a new token

### Requirement 6: 后台管理系统 - 认证与权限

**User Story:** As an administrator, I want to log in to a secure admin panel, so that I can manage all mini program data.

#### Acceptance Criteria

1. WHEN an Admin accesses the Admin_Panel, THE Admin_Panel SHALL require username and password authentication
2. THE API_Server SHALL store admin credentials with bcrypt-hashed passwords in a dedicated admin_users Collection
3. WHEN an Admin logs in successfully, THE API_Server SHALL issue a separate admin JWT token with an admin role claim
4. IF a non-admin user attempts to access admin API endpoints, THEN THE API_Server SHALL return a 403 status code

### Requirement 7: 后台管理系统 - 用户管理

**User Story:** As an administrator, I want to manage all mini program users, so that I can view, edit, and remove user accounts.

#### Acceptance Criteria

1. THE Admin_Panel SHALL display a paginated, searchable list of all users with their profile information
2. WHEN an Admin edits a user record, THE Admin_Panel SHALL allow modification of name, phone, avatar, rider status, and level fields
3. WHEN an Admin deletes a user, THE API_Server SHALL remove the user record and associated data (favorites, messages)
4. WHEN an Admin searches for users, THE Admin_Panel SHALL support filtering by name, phone, openid, and rider status

### Requirement 8: 后台管理系统 - 订单管理

**User Story:** As an administrator, I want to manage all orders (express and errand), so that I can monitor operations and handle issues.

#### Acceptance Criteria

1. THE Admin_Panel SHALL display a paginated list of all express orders and errand tasks with status filtering
2. WHEN an Admin views an order, THE Admin_Panel SHALL show all order details including photos, rider info, and status history
3. WHEN an Admin edits an order, THE Admin_Panel SHALL allow modification of status, price, tip, and assignment fields
4. WHEN an Admin creates a virtual order, THE API_Server SHALL insert a new order record with admin-specified data
5. WHEN an Admin deletes an order, THE API_Server SHALL remove the order record from the Collection

### Requirement 9: 后台管理系统 - 内容管理

**User Story:** As an administrator, I want to manage all user-generated content (forum posts, market goods, team activities, carpool, skills), so that I can moderate and maintain content quality.

#### Acceptance Criteria

1. THE Admin_Panel SHALL display paginated lists for forum posts, market goods, team activities, carpool entries, and skill listings
2. WHEN an Admin deletes content, THE API_Server SHALL remove the content record and its associated data (comments, members)
3. WHEN an Admin edits content, THE Admin_Panel SHALL allow modification of all text fields, images, and status
4. WHEN an Admin replaces an image in content, THE Admin_Panel SHALL upload the new image to Qiniu_OSS and update the record

### Requirement 10: 后台管理系统 - 首页配置

**User Story:** As an administrator, I want to edit the mini program home page content, so that I can update text, reorder sections, and replace images without modifying code.

#### Acceptance Criteria

1. THE Admin_Panel SHALL display an editable preview of the mini program home page layout
2. WHEN an Admin edits text on the home page, THE Admin_Panel SHALL save the changes to a page_config Collection
3. WHEN an Admin drags to reorder sections, THE Admin_Panel SHALL persist the new order to the page_config Collection
4. WHEN an Admin replaces a banner image, THE Admin_Panel SHALL upload the new image to Qiniu_OSS and update the config
5. WHEN the Mini_Program loads the home page, THE API_Server SHALL return the latest page configuration from the page_config Collection

### Requirement 11: 后台管理系统 - 消息管理

**User Story:** As an administrator, I want to manage the messaging system, so that I can view, send, and delete messages.

#### Acceptance Criteria

1. THE Admin_Panel SHALL display a paginated list of all messages with sender, receiver, and read status
2. WHEN an Admin sends a system message, THE API_Server SHALL create a message record targeting a specific user or all users
3. WHEN an Admin deletes a message, THE API_Server SHALL remove the message record from the Collection

### Requirement 12: 后台管理系统 - 数据统计

**User Story:** As an administrator, I want to view platform statistics, so that I can monitor platform health and activity.

#### Acceptance Criteria

1. THE Admin_Panel SHALL display a dashboard with total users, total orders, today's deliveries, and total revenue
2. WHEN the dashboard loads, THE API_Server SHALL aggregate real-time statistics from the relevant Collections
3. THE Admin_Panel SHALL allow the Admin to manually update the stats Collection values (e.g., todayDelivered, totalOrders)

### Requirement 13: 后台管理系统 - UI 框架

**User Story:** As an administrator, I want a clean, responsive web interface, so that I can manage the platform efficiently from any browser.

#### Acceptance Criteria

1. THE Admin_Panel SHALL provide a responsive web interface accessible via standard browsers
2. THE Admin_Panel SHALL include a sidebar navigation matching the mini program's feature modules
3. THE Admin_Panel SHALL support inline text editing for content fields
4. THE Admin_Panel SHALL support drag-and-drop reordering for list items and page sections
5. THE Admin_Panel SHALL support image upload with preview for replacing existing images
