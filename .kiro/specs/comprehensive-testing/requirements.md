# Requirements Document

## Introduction

对校园跑腿（Campus Errand Runner）微信小程序进行全面测试，覆盖后端云函数接口逻辑、前端业务逻辑、前后端对接一致性，以及业务操作合理性验证。目标是发现潜在 bug、逻辑漏洞和不合理的业务流程。

## Glossary

- **Cloud_Function**: 微信云函数，位于 `cloudfunctions/` 目录下的 Node.js 无服务器函数
- **Action_Dispatcher**: 云函数内部基于 `event.action` 的 switch/case 路由模式
- **callCloud**: 前端封装的云函数调用工具函数 (`src/utils/cloud.js`)
- **Order_Status_Flow**: 订单状态流转机制（快递: 0→1→2→3/4，跑腿: 0→1→4→2/3）
- **Express_Order**: 代取快递订单，存储在 `express_orders` 集合
- **Errand_Task**: 万能跑腿任务，存储在 `errand_tasks` 集合
- **Rider**: 注册骑手用户，可接单配送
- **Owner**: 订单/任务的发布者
- **SMS_Parser**: 快递短信智能识别模块，解析取件点和取件码

## Requirements

### Requirement 1: 云函数 Action 路由与错误处理

**User Story:** 作为开发者，我希望所有云函数都能正确路由 action 并处理未知 action，以确保 API 的健壮性。

#### Acceptance Criteria

1. WHEN a valid action is dispatched to a Cloud_Function, THE Action_Dispatcher SHALL route to the correct handler and return `{ code: 0, ... }`
2. WHEN an unknown action is dispatched to a Cloud_Function, THE Action_Dispatcher SHALL return `{ code: -1, msg: 'unknown action: ...' }`
3. WHEN required fields are missing in a create action, THE Cloud_Function SHALL return `{ code: -1, msg: 'missing fields' }` or equivalent error message
4. THE Cloud_Function SHALL always return a response object containing a `code` field

### Requirement 2: 快递订单生命周期

**User Story:** 作为用户，我希望快递订单能按照正确的状态流转，以确保配送流程的完整性。

#### Acceptance Criteria

1. WHEN a user creates an Express_Order with valid fields, THE express Cloud_Function SHALL create a record with status=0 and return the new order ID
2. WHEN a Rider accepts an Express_Order, THE express Cloud_Function SHALL update status to 1, set riderId, and send a notification message to the Owner
3. WHEN a Rider attempts to accept an Express_Order that is not in status 0, THE express Cloud_Function SHALL reject with error message '订单已被接'
4. WHEN a user attempts to accept their own Express_Order, THE express Cloud_Function SHALL reject with error message '不能接自己发布的单'
5. WHEN an Express_Order status is updated to 3 (completed), THE express Cloud_Function SHALL increment the global todayDelivered stat
6. WHEN the Owner cancels an Express_Order in status 2 (delivering), THE express Cloud_Function SHALL reject with error message '骑手正在配送中，无法取消订单'
7. WHEN a user who is neither Owner nor Rider attempts to cancel an Express_Order, THE express Cloud_Function SHALL reject with error message '无权取消该订单'

### Requirement 3: 跑腿任务生命周期

**User Story:** 作为用户，我希望跑腿任务能按照正确的状态流转（含待确认环节），以确保任务完成的可靠性。

#### Acceptance Criteria

1. WHEN a user creates an Errand_Task with valid title and desc, THE errand Cloud_Function SHALL create a record with status=0 and return the new task ID
2. WHEN a Rider accepts an Errand_Task, THE errand Cloud_Function SHALL update status to 1, set riderId, and send a notification to the Owner
3. WHEN a Rider attempts to accept an Errand_Task that is not in status 0, THE errand Cloud_Function SHALL reject with error message '任务已被接'
4. WHEN a user attempts to accept their own Errand_Task, THE errand Cloud_Function SHALL reject with error message '不能接自己发布的单'
5. WHEN the Owner cancels an Errand_Task in status 1 (in progress), THE errand Cloud_Function SHALL reject with error message '接单人正在执行任务，无法取消'
6. WHEN a Rider submits completion (status→4), THE errand Cloud_Function SHALL update status to 4 (pending confirmation) and notify the Owner
7. WHEN the Owner confirms completion (status→2), THE errand Cloud_Function SHALL update status to 2 (completed)

### Requirement 4: 拼车加入与退出

**User Story:** 作为用户，我希望拼车的加入和退出逻辑正确，以确保人数管理的准确性。

#### Acceptance Criteria

1. WHEN a user joins a carpool that is not full, THE carpool Cloud_Function SHALL increment currentPeople by 1 and add the user's openid to members array
2. WHEN a user joins a carpool that is already full, THE carpool Cloud_Function SHALL reject with error message '已满员'
3. WHEN a user who has already joined attempts to join again, THE carpool Cloud_Function SHALL reject with error message '已加入'
4. WHEN the carpool creator attempts to leave, THE carpool Cloud_Function SHALL reject with error message '发起人不能退出'
5. WHEN a member leaves a carpool, THE carpool Cloud_Function SHALL decrement currentPeople by 1 and remove the user's openid from members array
6. WHEN a non-creator attempts to cancel a carpool, THE carpool Cloud_Function SHALL reject with error message '仅发起人可取消'

### Requirement 5: 组队活动加入与退出

**User Story:** 作为用户，我希望组队活动的加入和退出逻辑正确，以确保活动管理的准确性。

#### Acceptance Criteria

1. WHEN a user joins a team activity that is not full and not ended, THE team Cloud_Function SHALL increment current by 1 and add a team_members record
2. WHEN a user joins a team activity that is already full, THE team Cloud_Function SHALL reject with error message '已满员'
3. WHEN a user who has already joined attempts to join again, THE team Cloud_Function SHALL reject with error message '已加入'
4. WHEN a team activity reaches max capacity after a join, THE team Cloud_Function SHALL update the tag to '已满员'
5. WHEN the activity creator attempts to leave, THE team Cloud_Function SHALL reject with error message '发起人不能退出'
6. WHEN a user joins a team activity that has ended, THE team Cloud_Function SHALL reject with error message '活动已结束'
7. WHEN a user joins a team activity whose time has passed, THE team Cloud_Function SHALL reject with error message '活动已过期'

### Requirement 6: 论坛点赞与评论

**User Story:** 作为用户，我希望论坛的点赞和评论功能正确运作，以确保社交互动的准确性。

#### Acceptance Criteria

1. WHEN a user likes a post they have not liked, THE forum Cloud_Function SHALL increment likes by 1, add openid to likedBy, and send a notification to the post author
2. WHEN a user likes a post they have already liked, THE forum Cloud_Function SHALL decrement likes by 1 and remove openid from likedBy (toggle behavior)
3. WHEN a user likes their own post, THE forum Cloud_Function SHALL update likes but not send a self-notification
4. WHEN a user comments on a post, THE forum Cloud_Function SHALL create a comment record, increment the post's comments count by 1, and notify the post author
5. WHEN a user replies to another user's comment, THE forum Cloud_Function SHALL create a comment with replyTo and replyName fields, and notify both the post author and the replied-to user
6. WHEN a user deletes their own post, THE forum Cloud_Function SHALL remove the post and all associated comments
7. WHEN a non-author attempts to delete a post, THE forum Cloud_Function SHALL reject with error message '仅发布者可删除'

### Requirement 7: 消息系统

**User Story:** 作为用户，我希望消息系统能正确管理通知的读取和删除，以确保消息状态的准确性。

#### Acceptance Criteria

1. WHEN a message is marked as read, THE message Cloud_Function SHALL update the read field to true
2. WHEN all messages are marked as read, THE message Cloud_Function SHALL update all unread messages for the user to read=true
3. WHEN a message is deleted, THE message Cloud_Function SHALL remove the message record
4. WHEN all messages are deleted, THE message Cloud_Function SHALL remove all messages for the user
5. WHEN a message is sent to the same user (toOpenid === fromOpenid), THE message Cloud_Function SHALL skip sending and return `{ code: 0, msg: 'skip self' }`

### Requirement 8: 用户认证与骑手注册

**User Story:** 作为用户，我希望登录和骑手注册流程正确，以确保身份管理的可靠性。

#### Acceptance Criteria

1. WHEN a new user logs in for the first time, THE user Cloud_Function SHALL create a new user record with empty name and return isNew=true
2. WHEN an existing user logs in, THE user Cloud_Function SHALL return the existing user data
3. WHEN a user registers as a Rider with valid fields, THE user Cloud_Function SHALL set isRider=true and generate a riderId
4. WHEN a user registers as a Rider with missing required fields, THE user Cloud_Function SHALL reject with error message 'missing fields'
5. WHEN a phone number with invalid format is provided for SMS, THE user Cloud_Function SHALL reject with error message '手机号格式不正确'
6. WHEN a correct SMS code is verified, THE user Cloud_Function SHALL return success and delete the used code
7. WHEN an expired SMS code is verified, THE user Cloud_Function SHALL reject with error message '验证码已过期，请重新获取'
8. WHEN an incorrect SMS code is verified, THE user Cloud_Function SHALL reject with error message '验证码错误'

### Requirement 9: 前端 callCloud 封装

**User Story:** 作为开发者，我希望 callCloud 工具函数能正确处理成功和失败响应，以确保前端调用的一致性。

#### Acceptance Criteria

1. WHEN a cloud function returns `{ code: 0, ... }`, THE callCloud function SHALL return the full result object
2. WHEN a cloud function returns `{ code: -1, msg: '...' }`, THE callCloud function SHALL log the error, show a toast with the error message, and return the result
3. WHEN a cloud function call throws a network error, THE callCloud function SHALL show a toast with '网络异常，请重试' and return `{ code: -1, msg: error.message }`

### Requirement 10: 快递短信智能识别

**User Story:** 作为用户，我希望粘贴快递短信后能自动识别取件点和取件码，以减少手动输入。

#### Acceptance Criteria

1. WHEN a valid express SMS containing a pickup code in X-X-XXXX format is pasted, THE SMS_Parser SHALL extract the pickup code correctly
2. WHEN a valid express SMS containing a pickup point name (e.g. 菜鸟驿站, 丰巢) is pasted, THE SMS_Parser SHALL extract the pickup point correctly
3. WHEN a valid express SMS containing a company name is pasted, THE SMS_Parser SHALL extract the express company correctly
4. WHEN the SMS text is shorter than 6 characters, THE SMS_Parser SHALL not attempt recognition and set recognized to false
5. WHEN a valid SMS is parsed, THE SMS_Parser SHALL produce a pickup code that matches the original SMS content (round-trip: the extracted code appears in the original text)

### Requirement 11: 前端订单排序逻辑

**User Story:** 作为用户，我希望首页订单按照合理的优先级排序，以便骑手能快速找到高优先级订单。

#### Acceptance Criteria

1. THE home page order sorting SHALL place pending orders (status=0) before all other statuses
2. THE home page order sorting SHALL place delivering/in-progress orders before completed and cancelled orders
3. WHEN two orders have the same status priority, THE home page order sorting SHALL place the order with higher tip first
4. THE building filter SHALL correctly group orders by building name and show accurate counts

### Requirement 12: 二手市场商品管理

**User Story:** 作为用户，我希望二手市场的商品发布和管理功能正确，以确保交易的可靠性。

#### Acceptance Criteria

1. WHEN a user creates a market goods item with valid title and price, THE market Cloud_Function SHALL create a record with status='active' and return the new goods ID
2. WHEN a user views a goods detail, THE market Cloud_Function SHALL increment the views count by 1
3. WHEN a user marks "want" on a goods item, THE market Cloud_Function SHALL increment the wants count by 1
4. WHEN the goods owner deletes their item, THE market Cloud_Function SHALL remove the record
5. WHEN a non-owner attempts to delete a goods item, THE market Cloud_Function SHALL reject with error message '仅发布者可删除'

### Requirement 13: 论坛搜索与市场搜索的客户端过滤

**User Story:** 作为开发者，我希望搜索过滤逻辑正确，以确保用户能找到相关内容。

#### Acceptance Criteria

1. WHEN a keyword is provided to forum list, THE forum Cloud_Function SHALL filter posts where content contains the keyword (case-insensitive)
2. WHEN a keyword is provided to market list, THE market Cloud_Function SHALL filter goods where title contains the keyword (case-insensitive)
3. WHEN a category filter is provided to market list, THE market Cloud_Function SHALL only return goods matching that category

### Requirement 14: 收藏功能

**User Story:** 作为用户，我希望收藏功能能正确切换状态，以确保收藏管理的准确性。

#### Acceptance Criteria

1. WHEN a user toggles favorite on an item they have not favorited, THE user Cloud_Function SHALL create a favorite record and return `{ favorited: true }`
2. WHEN a user toggles favorite on an item they have already favorited, THE user Cloud_Function SHALL remove the favorite record and return `{ favorited: false }`
3. WHEN checking favorite status, THE user Cloud_Function SHALL return the correct boolean based on whether a favorite record exists

### Requirement 15: 技能模块 Action 参数差异

**User Story:** 作为开发者，我希望技能模块的参数传递方式与其他模块保持一致，以避免前后端对接问题。

#### Acceptance Criteria

1. WHEN the skill Cloud_Function receives parameters, THE skill Cloud_Function SHALL read them from `event` directly (not from `event.data`) — this differs from other cloud functions
2. WHEN the skill Cloud_Function creates a skill, THE skill Cloud_Function SHALL use `_openid` field (not `openid`) for user identification — this differs from other cloud functions
