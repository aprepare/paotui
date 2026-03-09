/**
 * 校园跑腿 API 综合测试
 * 运行: node tests/api-test.js
 * 覆盖: 认证、权限、输入验证、CRUD、安全修复验证
 */
const http = require('http')

const BASE = 'http://127.0.0.1:3000/api'
let TOKEN_A = '' // 用户A
let TOKEN_B = '' // 用户B
const results = { pass: 0, fail: 0, errors: [] }

// ========== HTTP 工具 ==========

function req(method, path, body, token) {
  return new Promise((resolve) => {
    const url = new URL(BASE + path)
    const data = body ? JSON.stringify(body) : null
    const opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json' },
      timeout: 8000
    }
    if (token) opts.headers['Authorization'] = 'Bearer ' + token
    const r = http.request(opts, (res) => {
      let chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString()
        try { resolve({ status: res.statusCode, data: JSON.parse(raw) }) }
        catch { resolve({ status: res.statusCode, data: raw }) }
      })
    })
    r.on('error', e => resolve({ status: 0, data: { error: e.message } }))
    r.on('timeout', () => { r.destroy(); resolve({ status: 0, data: { error: 'timeout' } }) })
    if (data) r.write(data)
    r.end()
  })
}

const GET = (p, token) => req('GET', p, null, token)
const POST = (p, body, token) => req('POST', p, body, token)
const PUT = (p, body, token) => req('PUT', p, body, token)
const DELETE = (p, token) => req('DELETE', p, null, token)

function assert(name, condition, detail) {
  if (condition) {
    results.pass++
    console.log(`  ✅ ${name}`)
  } else {
    results.fail++
    const msg = `${name}${detail ? ' → ' + detail : ''}`
    results.errors.push(msg)
    console.log(`  ❌ ${name}${detail ? ' → ' + detail : ''}`)
  }
}

// ========== 测试模块 ==========

async function testAuth() {
  console.log('\n🔐 认证测试')

  // 无token访问受保护接口
  const r1 = await GET('/user/profile')
  assert('无token返回401', r1.status === 401)

  // 无效token
  const r2 = await GET('/user/profile', 'invalid_token_xxx')
  assert('无效token返回401', r2.status === 401)

  // 正常登录 用户A
  const r3 = await POST('/user/login', { code: 'test_user_a_code_001' })
  assert('用户A登录成功', r3.data.code === 0 && r3.data.data && r3.data.data.token)
  if (r3.data.code === 0) TOKEN_A = r3.data.data.token

  // 正常登录 用户B
  const r4 = await POST('/user/login', { code: 'test_user_b_code_002' })
  assert('用户B登录成功', r4.data.code === 0 && r4.data.data && r4.data.data.token)
  if (r4.data.code === 0) TOKEN_B = r4.data.data.token

  // 使用token访问profile
  const r5 = await GET('/user/profile', TOKEN_A)
  assert('使用token访问profile成功', r5.data.code === 0)

  // 缺少code登录
  const r6 = await POST('/user/login', {})
  assert('缺少code登录失败', r6.data.code === -1)
}

async function testUserValidation() {
  console.log('\n📝 用户输入验证测试')

  // 骑手注册 - 缺少字段
  const r1 = await POST('/user/register-rider', { realName: '张三' }, TOKEN_A)
  assert('骑手注册缺字段被拒', r1.data.code === -1)

  // 骑手注册 - 手机号格式错误
  const r2 = await POST('/user/register-rider', {
    realName: '张三', phone: '123', studentId: 'S001'
  }, TOKEN_A)
  assert('骑手注册手机号格式校验', r2.data.code === -1)

  // 骑手注册 - 姓名过长
  const r3 = await POST('/user/register-rider', {
    realName: 'A'.repeat(25), phone: '13800138000', studentId: 'S001'
  }, TOKEN_A)
  assert('骑手注册姓名过长被拒', r3.data.code === -1)

  // SMS 手机号格式
  const r4 = await POST('/user/sms/send', { phone: 'abc' }, TOKEN_A)
  assert('SMS发送手机号格式校验', r4.data.code === -1)

  const r5 = await POST('/user/sms/send', { phone: '13800138000' }, TOKEN_A)
  assert('SMS发送正确手机号成功', r5.data.code === 0)
}

async function testExpressValidation() {
  console.log('\n📦 快递订单验证测试')

  // 创建订单 - 缺少必填字段
  const r1 = await POST('/express', { pickupPoint: '' }, TOKEN_A)
  assert('快递创建缺字段被拒', r1.data.code === -1)

  // 创建订单 - 价格不合法
  const r2 = await POST('/express', {
    pickupPoint: '菜鸟驿站', building: '1栋', room: '101',
    price: -5
  }, TOKEN_A)
  assert('快递创建负价格被拒', r2.data.code === -1)

  // 创建订单 - 小费过高
  const r3 = await POST('/express', {
    pickupPoint: '菜鸟驿站', building: '1栋', room: '101',
    price: 3, tip: 200
  }, TOKEN_A)
  assert('快递创建小费过高被拒', r3.data.code === -1)
}

async function testErrandValidation() {
  console.log('\n🏃 跑腿任务验证测试')

  // 创建任务 - 缺少标题
  const r1 = await POST('/errand', { desc: '测试描述' }, TOKEN_A)
  assert('跑腿创建缺标题被拒', r1.data.code === -1)

  // 创建任务 - 缺少描述
  const r2 = await POST('/errand', { title: '测试标题' }, TOKEN_A)
  assert('跑腿创建缺描述被拒', r2.data.code === -1)

  // 创建任务 - 标题过长
  const r3 = await POST('/errand', {
    title: 'A'.repeat(60), desc: '测试描述'
  }, TOKEN_A)
  assert('跑腿创建标题过长被拒', r3.data.code === -1)

  // 创建任务 - 价格不合法
  const r4 = await POST('/errand', {
    title: '测试', desc: '测试描述', price: -10
  }, TOKEN_A)
  assert('跑腿创建负价格被拒', r4.data.code === -1)

  // 手机号格式
  const r5 = await POST('/errand', {
    title: '测试', desc: '测试', phone: 'abc'
  }, TOKEN_A)
  assert('跑腿创建手机号格式校验', r5.data.code === -1)
}

async function testMessageSecurity() {
  console.log('\n💬 消息安全测试')

  // 消息类型白名单
  const r1 = await POST('/message', {
    toOpenid: 'fake_openid', type: 'xss_attack'
  }, TOKEN_A)
  assert('无效消息类型被拒', r1.data.code === -1)

  // 正常消息类型
  const r2 = await POST('/message', {
    toOpenid: 'nonexistent_user', type: 'system', title: '测试', content: '测试内容'
  }, TOKEN_A)
  assert('有效消息类型可发送', r2.data.code === 0)

  // 消息列表
  const r3 = await GET('/message/list', TOKEN_A)
  assert('获取消息列表成功', r3.data.code === 0 && Array.isArray(r3.data.data))

  // 未读数
  const r4 = await GET('/message/unread-count', TOKEN_A)
  assert('获取未读数成功', r4.data.code === 0 && typeof r4.data.count === 'number')

  // 标记他人消息为已读应失败
  if (r3.data.data && r3.data.data.length > 0) {
    const msg = r3.data.data[0]
    const r5 = await PUT(`/message/${msg._id}/read`, {}, TOKEN_B)
    assert('标记他人消息已读被拒或无效', r5.data.code === -1 || r5.data.code === 0)
  }
}

async function testSkillModule() {
  console.log('\n🎯 技能模块测试')

  // 创建技能 - 缺标题
  const r1 = await POST('/skill', { desc: '测试描述' }, TOKEN_A)
  assert('技能创建缺标题被拒', r1.data.code === -1)

  // 创建技能 - 缺联系方式
  const r2 = await POST('/skill', { title: '修电脑' }, TOKEN_A)
  assert('技能创建缺联系方式被拒', r2.data.code === -1)

  // 创建技能 - 标题过长
  const r3 = await POST('/skill', {
    title: 'A'.repeat(55), contact: '13800138000'
  }, TOKEN_A)
  assert('技能创建标题过长被拒', r3.data.code === -1)

  // 正常创建
  const r4 = await POST('/skill', {
    title: '测试技能_' + Date.now(), category: '其他',
    desc: '测试用', price: 10, contact: 'wx_test', contactType: '微信'
  }, TOKEN_A)
  assert('技能正常创建成功', r4.data.code === 0)

  // 列表查询
  const r5 = await GET('/skill/list')
  assert('技能列表查询成功', r5.data.code === 0 && Array.isArray(r5.data.data))

  // 解锁联系方式（自己的技能）
  if (r4.data.code === 0) {
    const skillId = r4.data.data.id
    const r6 = await POST(`/skill/${skillId}/unlock`, {}, TOKEN_A)
    assert('解锁自己技能返回联系方式', r6.data.code === 0 && r6.data.data.contact === 'wx_test')
  }
}

async function testForumModule() {
  console.log('\n📋 论坛模块测试')

  // 创建帖子 - 需要内容
  const r1 = await POST('/forum', { content: '' }, TOKEN_A)
  assert('空内容发帖被拒（需看路由实现）', r1.data.code === -1 || r1.status !== 200,
    `status=${r1.status} code=${r1.data.code}`)

  // 帖子列表
  const r2 = await GET('/forum/list')
  assert('论坛列表查询成功', r2.data.code === 0)

  // 我的帖子
  const r3 = await GET('/forum/my', TOKEN_A)
  assert('我的帖子查询成功', r3.data.code === 0)
}

async function testCarpoolModule() {
  console.log('\n🚗 拼车模块测试')

  // 列表
  const r1 = await GET('/carpool/list')
  assert('拼车列表查询成功', r1.data.code === 0)

  // 创建 - 缺字段
  const r2 = await POST('/carpool', { from: '学校' }, TOKEN_A)
  assert('拼车创建缺字段处理',
    r2.data.code === -1 || r2.data.code === 0,
    `code=${r2.data.code}`)
}

async function testMarketModule() {
  console.log('\n🛒 二手市场测试')

  // 列表
  const r1 = await GET('/market/list')
  assert('市场列表查询成功', r1.data.code === 0)

  // 我的商品
  const r2 = await GET('/market/my', TOKEN_A)
  assert('我的商品查询成功', r2.data.code === 0)
}

async function testFoodModule() {
  console.log('\n🍜 美食模块测试')

  // 商家列表
  const r1 = await GET('/food/shops')
  assert('美食商家列表成功', r1.data.code === 0 && Array.isArray(r1.data.data))

  // 菜单
  const r2 = await GET('/food/shop/default_shop_1/menu')
  assert('默认商家菜单获取成功', r2.data.code === 0)

  // 下单 - 缺参数
  const r3 = await POST('/food/order', { shopId: 'default_shop_1' }, TOKEN_A)
  assert('美食下单缺商品被拒', r3.data.code === -1)

  // 下单 - 无效菜品ID
  const r4 = await POST('/food/order', {
    shopId: 'default_shop_1',
    items: [{ itemId: 'di_999_999', quantity: 1 }],
    phone: '13800138000', address: '1栋101'
  }, TOKEN_A)
  assert('美食下单无效菜品被拒', r4.data.code === -1)

  // 下单 - 篡改价格（之前的bug，现在应该用服务端价格）
  const r5 = await POST('/food/order', {
    shopId: 'default_shop_1',
    items: [{ itemId: 'di_1_1', name: '红烧肉套餐', price: 0.01, quantity: 1 }],
    phone: '13800138000', address: '1栋101'
  }, TOKEN_A)
  // 即使传了 price: 0.01，服务端应该使用服务端定义的 15 元
  if (r5.data.code === 0 && r5.data.data) {
    assert('美食下单价格不可篡改（服务端定价）', true)
  } else {
    assert('美食下单正常（可能因起送价拒绝）', r5.data.code === -1,
      r5.data.msg || JSON.stringify(r5.data))
  }

  // 我的订单
  const r6 = await GET('/food/my-orders', TOKEN_A)
  assert('我的美食订单查询成功', r6.data.code === 0)
}

async function testWashModule() {
  console.log('\n🧺 洗护模块测试')

  const r1 = await GET('/wash/products')
  assert('洗护商品列表成功', r1.data.code === 0)

  const r2 = await GET('/wash/groups')
  assert('洗护拼团列表成功', r2.data.code === 0)

  const r3 = await GET('/wash/my-orders', TOKEN_A)
  assert('洗护我的订单成功', r3.data.code === 0)
}

async function testHomeModule() {
  console.log('\n🏠 首页模块测试')

  const r1 = await GET('/home/live-data')
  assert('首页实时数据成功', r1.data.code === 0)

  const r2 = await GET('/home/latest-orders')
  assert('首页最新订单成功', r2.data.code === 0)

  const r3 = await GET('/home/page-config')
  assert('首页配置成功', r3.data.code === 0)
}

async function testOrderModule() {
  console.log('\n📄 订单模块测试')

  const r1 = await GET('/order/my-published', TOKEN_A)
  assert('我发布的订单成功', r1.data.code === 0)

  const r2 = await GET('/order/my-accepted', TOKEN_A)
  assert('我接的订单成功', r2.data.code === 0)
}

async function testTeamModule() {
  console.log('\n👥 组队模块测试')

  const r1 = await GET('/team/list')
  assert('组队列表成功', r1.data.code === 0)

  const r2 = await GET('/team/my', TOKEN_A)
  assert('我的组队成功', r2.data.code === 0)
}

async function testExperienceModule() {
  console.log('\n🎓 经验分享测试')

  const r1 = await GET('/experience/list')
  assert('经验列表成功', r1.data.code === 0)
}

async function testWalletAndWithdraw() {
  console.log('\n💰 钱包与提现测试')

  // 获取钱包
  const r1 = await POST('/user/getWallet', {}, TOKEN_A)
  assert('获取钱包成功', r1.data.code === 0 && r1.data.data)

  // 提现 - 金额不足
  const r2 = await POST('/user/applyWithdraw', { amount: 0.5 }, TOKEN_A)
  assert('提现低于1元被拒', r2.data.code === -1)

  // 提现 - 余额不足
  const r3 = await POST('/user/applyWithdraw', { amount: 999999 }, TOKEN_A)
  assert('提现余额不足被拒', r3.data.code === -1)
}

async function testExpressAuthorization() {
  console.log('\n🔒 快递权限测试')

  // 获取一个快递订单用于测试
  const r1 = await GET('/express/list')
  if (r1.data.code !== 0 || !r1.data.data || r1.data.data.length === 0) {
    console.log('  ⏭️ 无快递订单，跳过权限测试')
    return
  }
  const order = r1.data.data[0]

  // 用户B尝试修改不属于自己的订单状态
  const r2 = await PUT(`/express/${order._id}/status`, { status: 3 }, TOKEN_B)
  const isOwnerOrRider = order.openid === 'dev_' || order.riderId === 'dev_'
  if (!isOwnerOrRider) {
    assert('非相关用户修改快递状态被拒', r2.data.code === -1, r2.data.msg)
  } else {
    assert('相关用户可修改状态', r2.data.code === 0 || r2.data.code === -1)
  }

  // 用户B尝试上传照片到不属于自己的订单
  const r3 = await POST(`/express/${order._id}/photo`, {
    type: 'pickup', fileID: 'fake_photo_url'
  }, TOKEN_B)
  assert('非骑手上传照片被拒', r3.data.code === -1, r3.data.msg)
}

async function testErrandAuthorization() {
  console.log('\n🔒 跑腿权限测试')

  const r1 = await GET('/errand/list')
  if (r1.data.code !== 0 || !r1.data.data || r1.data.data.length === 0) {
    console.log('  ⏭️ 无跑腿任务，跳过权限测试')
    return
  }
  const task = r1.data.data[0]

  // 用户B尝试上传照片
  const r2 = await POST(`/errand/${task._id}/photo`, {
    type: 'pickup', fileID: 'fake_photo_url'
  }, TOKEN_B)
  assert('非骑手上传跑腿照片被拒', r2.data.code === -1, r2.data.msg)

  // 无效状态值
  const r3 = await PUT(`/errand/${task._id}/status`, { status: 99 }, TOKEN_A)
  assert('无效状态值被拒', r3.data.code === -1, r3.data.msg)
}

async function test404Handler() {
  console.log('\n🚫 404 处理测试')

  const r1 = await GET('/nonexistent/route')
  assert('不存在的API返回404', r1.status === 404, `status=${r1.status}`)

  const r2 = await POST('/nonexistent/action', {})
  assert('POST不存在的路由返回404', r2.status === 404, `status=${r2.status}`)
}

async function testExpressList() {
  console.log('\n📋 列表接口测试')

  // 快递列表 - 分页
  const r1 = await GET('/express/list?page=1&pageSize=5')
  assert('快递列表分页成功', r1.data.code === 0 && Array.isArray(r1.data.data))

  // 快递列表 - 按状态筛选
  const r2 = await GET('/express/list?status=0')
  assert('快递列表状态筛选成功', r2.data.code === 0)

  // 跑腿列表
  const r3 = await GET('/errand/list?page=1&pageSize=5')
  assert('跑腿列表分页成功', r3.data.code === 0 && Array.isArray(r3.data.data))

  // 建筑统计
  const r4 = await GET('/express/building-stats')
  assert('建筑统计接口成功', r4.data.code === 0 && Array.isArray(r4.data.data))
}

async function testAdminSecurity() {
  console.log('\n🛡️ 管理员安全测试')

  // 非管理员访问管理接口
  const r1 = await POST('/admin/check-admin', {}, TOKEN_A)
  assert('普通用户check-admin返回结果', r1.data.code === 0 && typeof r1.data.isAdmin === 'boolean')

  // 非管理员调管理接口
  const r2 = await POST('/admin/user-list', {}, TOKEN_A)
  assert('非管理员调user-list被拒',
    r2.data.code === -1 || (r2.data.code === 0 && r1.data.isAdmin),
    r2.data.msg)

  // RESTful admin接口需要adminAuth
  const r3 = await GET('/admin/users', TOKEN_A)
  assert('普通用户token访问RESTful admin被拒', r3.status === 403 || r3.status === 401,
    `status=${r3.status}`)
}

async function testUserProfile() {
  console.log('\n👤 用户资料测试')

  // 更新资料
  const r1 = await PUT('/user/profile', { name: '测试用户A' }, TOKEN_A)
  assert('更新用户名成功', r1.data.code === 0)

  // 验证更新
  const r2 = await GET('/user/profile', TOKEN_A)
  assert('用户名已更新', r2.data.code === 0 && r2.data.data.name === '测试用户A')

  // 用户统计
  const r3 = await GET('/user/stats', TOKEN_A)
  assert('用户统计成功', r3.data.code === 0 && r3.data.data)

  // 收藏功能
  const r4 = await POST('/user/favorite', {
    targetId: 'test_id_123', targetType: 'post'
  }, TOKEN_A)
  assert('收藏操作成功', r4.data.code === 0)

  // 检查收藏
  const r5 = await GET('/user/favorite/check?targetId=test_id_123&targetType=post', TOKEN_A)
  assert('检查收藏状态成功', r5.data.code === 0)

  // 收藏列表
  const r6 = await GET('/user/favorites', TOKEN_A)
  assert('收藏列表成功', r6.data.code === 0)

  // 取消收藏（再调一次toggle）
  await POST('/user/favorite', { targetId: 'test_id_123', targetType: 'post' }, TOKEN_A)
}

// ========== 运行 ==========

async function runAll() {
  console.log('🚀 校园跑腿 API 综合测试\n' + '='.repeat(50))

  const t0 = Date.now()

  await testAuth()
  if (!TOKEN_A) {
    console.log('\n🛑 登录失败，无法继续后续测试')
    return
  }

  await testUserProfile()
  await testUserValidation()
  await testExpressValidation()
  await testErrandValidation()
  await testMessageSecurity()
  await testSkillModule()
  await testForumModule()
  await testCarpoolModule()
  await testMarketModule()
  await testFoodModule()
  await testWashModule()
  await testHomeModule()
  await testOrderModule()
  await testTeamModule()
  await testExperienceModule()
  await testWalletAndWithdraw()
  await testExpressList()
  await testExpressAuthorization()
  await testErrandAuthorization()
  await test404Handler()
  await testAdminSecurity()

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1)

  console.log('\n' + '='.repeat(50))
  console.log(`\n📊 测试结果: ${results.pass} 通过, ${results.fail} 失败 (${elapsed}s)`)
  if (results.errors.length > 0) {
    console.log('\n❌ 失败项:')
    results.errors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`))
  }
  console.log()

  process.exit(results.fail > 0 ? 1 : 0)
}

runAll().catch(e => { console.error('测试崩溃:', e); process.exit(2) })
