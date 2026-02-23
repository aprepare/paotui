# Requirements Document

## Introduction

本检测计划旨在系统性地排查校园跑腿小程序中存在的 Bug 和数据校验缺陷。通过对前端表单校验、后端数据验证、状态流转守卫、前后端数据一致性等方面的全面审查，发现并修复潜在问题，提升系统的健壮性和安全性。

## Glossary

- **Express_Module**: 快递代取模块，包含前端页面 (`src/pages/express/`) 和后端云函数 (`cloudfunctions/express/`)
- **Errand_Module**: 万能跑腿模块，包含前端页面 (`src/pages/errand/`) 和后端云函数 (`cloudfunctions/errand/`)
- **Market_Module**: 二手市场模块，包含前端页面 (`src/pages/market/`) 和后端云函数 (`cloudfunctions/market/`)
- **Forum_Module**: 校园论坛模块，包含前端页面 (`src/pages/forum/`) 和后端云函数 (`cloudfunctions/forum/`)
- **Carpool_Module**: 拼车模块，包含前端页面 (`src/pages/carpool/`) 和后端云函数 (`cloudfunctions/carpool/`)
- **Team_Module**: 组队模块，包含前端页面 (`src/pages/team/`) 和后端云函数 (`cloudfunctions/team/`)
- **Skill_Module**: 技能出租模块，包含前端页面 (`src/pages/skill/`) 和后端云函数 (`cloudfunctions/skill/`)
- **User_Module**: 用户/认证模块，包含登录页面 (`src/pages/login/`) 和后端云函数 (`cloudfunctions/user/`)
- **Validator**: 前端或后端中负责校验输入数据的逻辑
- **Guard_Condition**: 状态转换前必须满足的前置条件检查
- **Status_Flow**: 订单/任务从创建到完成的状态转换链路

## Requirements

### Requirement 1: 快递订单送达照片守卫

**User Story:** As a 平台运营者, I want 骑手必须上传送达照片才能标记订单为已送达, so that 防止骑手未实际送达就完成订单造成欺诈。

#### Acceptance Criteria

1. WHEN 骑手在配送中状态点击"已送达"按钮, THE Express_Module SHALL 检查 deliverPhoto 字段是否存在，若不存在则阻止状态更新
2. WHEN 骑手在已接单状态点击"已取件，开始配送", THE Express_Module SHALL 检查 pickupPhoto 字段是否存在，若不存在则阻止状态更新
3. WHEN 后端收到 updateStatus 请求且目标状态为配送中(2), THE Express_Module 后端 SHALL 验证该订单已上传取件照片
4. WHEN 后端收到 updateStatus 请求且目标状态为已完成(3), THE Express_Module 后端 SHALL 验证该订单已上传送达照片

### Requirement 2: 跑腿任务完成照片守卫

**User Story:** As a 平台运营者, I want 跑腿员必须上传凭证照片才能提交完成, so that 确保任务确实被执行。

#### Acceptance Criteria

1. WHEN 跑腿员点击"提交完成"按钮, THE Errand_Module SHALL 检查 deliverPhoto 字段是否存在，若不存在则阻止状态更新
2. WHEN 后端收到 updateStatus 请求且目标状态为待确认(4), THE Errand_Module 后端 SHALL 验证该任务已上传送达照片

### Requirement 3: 手机号输入校验

**User Story:** As a 用户, I want 系统对手机号进行严格校验, so that 确保联系方式有效可用。

#### Acceptance Criteria

1. WHEN 用户在登录页输入手机号, THE User_Module SHALL 使用正则 `/^1[3-9]\d{9}$/` 验证格式
2. WHEN 用户在快递下单页输入联系电话, THE Express_Module SHALL 验证手机号格式为11位有效手机号
3. WHEN 用户在跑腿下单页输入手机号, THE Errand_Module SHALL 验证手机号格式为11位有效手机号
4. WHEN 后端收到包含手机号的请求, THE User_Module 后端 SHALL 使用相同正则验证手机号格式

### Requirement 4: 短信验证码安全

**User Story:** As a 平台运营者, I want 短信验证码有频率限制和尝试次数限制, so that 防止暴力破解和短信轰炸。

#### Acceptance Criteria

1. WHEN 同一手机号在5分钟内重复请求验证码, THE User_Module 后端 SHALL 拒绝请求并返回"请稍后再试"
2. WHEN 同一手机号验证码校验失败超过5次, THE User_Module 后端 SHALL 锁定该手机号15分钟内不可再验证
3. WHEN 验证码已过期（超过5分钟）, THE User_Module 后端 SHALL 拒绝验证并提示重新获取

### Requirement 5: 价格和金额校验

**User Story:** As a 用户, I want 系统对所有价格输入进行合理范围校验, so that 防止异常金额导致的财务问题。

#### Acceptance Criteria

1. WHEN 用户在跑腿下单页输入报酬, THE Errand_Module SHALL 验证金额大于0且不超过999
2. WHEN 用户在快递下单页输入自定义小费, THE Express_Module SHALL 验证小费金额在0到99之间
3. WHEN 用户在二手市场发布商品价格, THE Market_Module SHALL 验证价格大于0且不超过99999
4. WHEN 后端收到创建订单请求, THE Express_Module 后端 SHALL 验证 price 大于0且 tip 在合理范围内
5. WHEN 后端收到创建跑腿任务请求, THE Errand_Module 后端 SHALL 验证 price 大于0
6. WHEN 后端收到创建商品请求, THE Market_Module 后端 SHALL 验证 price 大于0

### Requirement 6: 订单状态流转守卫

**User Story:** As a 平台运营者, I want 订单状态只能按照合法路径转换, so that 防止状态被跳跃或回退导致数据混乱。

#### Acceptance Criteria

1. WHEN 后端收到 updateStatus 请求, THE Express_Module 后端 SHALL 验证状态转换合法性（0→1→2→3，仅允许正向转换）
2. WHEN 后端收到 updateStatus 请求, THE Errand_Module 后端 SHALL 验证状态转换合法性（0→1→4→2，仅允许正向转换）
3. WHEN 后端收到已完成或已取消状态的订单的 updateStatus 请求, THE Express_Module 后端 SHALL 拒绝任何状态变更
4. IF 请求的目标状态与当前状态相同, THEN THE Express_Module 后端 SHALL 拒绝重复的状态更新

### Requirement 7: 拼车时间校验

**User Story:** As a 用户, I want 拼车发布时系统校验时间合理性, so that 防止发布过期或时间矛盾的拼车信息。

#### Acceptance Criteria

1. WHEN 用户设置出发时间, THE Carpool_Module SHALL 验证出发时间晚于当前时间
2. WHEN 用户设置截止时间, THE Carpool_Module SHALL 验证截止时间早于出发时间
3. WHEN 后端收到创建拼车请求, THE Carpool_Module 后端 SHALL 验证 departTime 晚于当前服务器时间

### Requirement 8: 组队活动人数校验

**User Story:** As a 用户, I want 组队活动的人数设置有合理限制, so that 防止无效的活动信息。

#### Acceptance Criteria

1. WHEN 用户在创建组队页输入最大人数, THE Team_Module SHALL 验证人数为2到100之间的正整数
2. WHEN 后端收到创建组队请求, THE Team_Module 后端 SHALL 验证 max 为大于1的正整数

### Requirement 9: 二手市场联系方式校验

**User Story:** As a 买家, I want 二手商品必须有有效的联系方式, so that 能够联系到卖家完成交易。

#### Acceptance Criteria

1. WHEN 用户发布二手商品但未填写联系方式, THE Market_Module SHALL 阻止发布并提示填写联系方式
2. WHEN 后端收到创建商品请求且 contact 为空, THE Market_Module 后端 SHALL 拒绝创建

### Requirement 10: 技能出租数据校验

**User Story:** As a 用户, I want 技能发布时所有必填字段都经过校验, so that 确保技能信息完整有效。

#### Acceptance Criteria

1. WHEN 用户发布技能但价格为0或负数, THE Skill_Module SHALL 阻止发布并提示设置有效价格
2. WHEN 用户发布技能但描述为空, THE Skill_Module SHALL 阻止发布并提示填写描述
3. WHEN 后端收到创建技能请求, THE Skill_Module 后端 SHALL 验证 title、price、contact 均非空

### Requirement 11: 快递下单房间号校验

**User Story:** As a 骑手, I want 下单时房间号格式正确, so that 能准确找到收件人。

#### Acceptance Criteria

1. WHEN 用户在快递下单页输入房间号, THE Express_Module SHALL 验证房间号非空且长度在1到10个字符之间
2. WHEN 后端收到创建快递订单请求, THE Express_Module 后端 SHALL 验证 room 字段非空且为合理格式

### Requirement 12: 前后端数据一致性

**User Story:** As a 平台运营者, I want 前端展示的字段在后端都有对应存储和统计, so that 数据完整可追溯。

#### Acceptance Criteria

1. WHEN 快递订单创建时前端传递了 phone 字段, THE Express_Module 后端 SHALL 将 phone 字段持久化到数据库记录中
2. WHEN 跑腿任务创建时前端传递了 remark 和 timeRequire 字段, THE Errand_Module 后端 SHALL 将这些字段持久化到数据库记录中
3. WHEN 骑手注册时前端传递了 school 和 studentCardFileID 字段, THE User_Module 后端 SHALL 将这些字段持久化到用户记录中

### Requirement 13: 论坛内容长度校验

**User Story:** As a 平台运营者, I want 论坛帖子和评论有长度限制, so that 防止超长内容影响展示和存储。

#### Acceptance Criteria

1. WHEN 用户发布论坛帖子, THE Forum_Module SHALL 验证内容长度在1到1000个字符之间
2. WHEN 后端收到创建帖子请求, THE Forum_Module 后端 SHALL 验证 content 长度不超过1000个字符
3. WHEN 后端收到创建评论请求, THE Forum_Module 后端 SHALL 验证 content 长度不超过500个字符

### Requirement 14: 提现金额校验

**User Story:** As a 骑手, I want 提现金额有合理限制, so that 防止异常提现操作。

#### Acceptance Criteria

1. WHEN 用户申请提现, THE User_Module 后端 SHALL 验证提现金额大于等于1元且不超过可用余额
2. WHEN 用户申请提现且有待审核的提现记录, THE User_Module 后端 SHALL 将待审核金额从可用余额中扣除

### Requirement 15: 骑手接单权限校验

**User Story:** As a 平台运营者, I want 只有注册骑手才能接单, so that 确保配送服务质量。

#### Acceptance Criteria

1. WHEN 非骑手用户尝试接快递单, THE Express_Module 后端 SHALL 验证用户 isRider 字段为 true
2. WHEN 非骑手用户尝试接跑腿单, THE Errand_Module 后端 SHALL 验证用户 isRider 字段为 true

### Requirement 16: 重复操作防护

**User Story:** As a 用户, I want 系统防止重复提交和重复操作, so that 避免重复下单或重复接单。

#### Acceptance Criteria

1. WHEN 用户快速连续点击发布按钮, THE Express_Module SHALL 通过 submitting 状态锁防止重复提交
2. WHEN 骑手尝试接一个已被接的订单, THE Express_Module 后端 SHALL 返回"订单已被接"错误
3. WHEN 用户尝试加入一个已满员的拼车, THE Carpool_Module 后端 SHALL 返回"已满员"错误
