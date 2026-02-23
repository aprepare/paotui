const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 批量清空集合
async function clearCollection(name) {
  try {
    const res = await db.collection(name).limit(100).get()
    const tasks = res.data.map(doc => db.collection(name).doc(doc._id).remove())
    await Promise.all(tasks)
    return res.data.length
  } catch (e) { return 0 }
}

// 批量写入集合
async function batchAdd(name, list) {
  const tasks = list.map(item => db.collection(name).add({ data: item }))
  return Promise.all(tasks)
}

exports.main = async (event, context) => {
  const openid = cloud.getWXContext().OPENID
  const now = Date.now()

  // 清空旧数据
  const cols = ['express_orders', 'errand_tasks', 'carpool', 'forum_posts', 'forum_comments', 'market_goods', 'team_activities', 'team_members', 'experience_posts', 'experience_comments']
  await Promise.all(cols.map(c => clearCollection(c)))

  // 1. express_orders
  const expressOrders = [
    { openid, pickupPoint: '菜鸟驿站A区', pickupCode: '5-2-1234', expressCompany: '顺丰', sizeType: 0, sizeText: '小件', sizeClass: 'small', building: '6号宿舍楼', room: '302', price: 2, tip: 1, remark: '放门口就行', status: 0, statusText: '待接单', statusColor: '#DD6B20', riderId: null, createTime: new Date(now - 3600000) },
    { openid, pickupPoint: '京东快递柜B区', pickupCode: '3-1-5678', expressCompany: '京东', sizeType: 1, sizeText: '大件', sizeClass: 'large', building: '3号宿舍楼', room: '501', price: 5, tip: 2, remark: '两个箱子', status: 0, statusText: '待接单', statusColor: '#DD6B20', riderId: null, createTime: new Date(now - 7200000) },
    { openid, pickupPoint: '菜鸟驿站C区', pickupCode: '8-3-9012', expressCompany: '中通', sizeType: 0, sizeText: '小件', sizeClass: 'small', building: '1号宿舍楼', room: '203', price: 2, tip: 3, remark: '轻拿轻放', status: 1, statusText: '已接单', statusColor: '#2B6CB0', riderId: openid, createTime: new Date(now - 10800000) },
    { openid, pickupPoint: '丰巢快递柜', pickupCode: '12-5-3456', expressCompany: '圆通', sizeType: 2, sizeText: '超大件', sizeClass: 'xlarge', building: '8号宿舍楼', room: '618', price: 20, tip: 5, remark: '很重需要小推车', status: 0, statusText: '待接单', statusColor: '#DD6B20', riderId: null, createTime: new Date(now - 1800000) },
    { openid, pickupPoint: '菜鸟驿站A区', pickupCode: '2-4-7890', expressCompany: '韵达', sizeType: 0, sizeText: '小件', sizeClass: 'small', building: '5号宿舍楼', room: '105', price: 2, tip: 0, remark: '', status: 2, statusText: '配送中', statusColor: '#38A169', riderId: openid, createTime: new Date(now - 14400000) },
    { openid, pickupPoint: '京东快递柜A区', pickupCode: '6-2-1111', expressCompany: '极兔', sizeType: 1, sizeText: '大件', sizeClass: 'large', building: '10号宿舍楼', room: '412', price: 5, tip: 1, remark: '易碎品', status: 3, statusText: '已完成', statusColor: '#A0AEC0', riderId: openid, createTime: new Date(now - 86400000) }
  ]

  // 2. errand_tasks
  const errandTasks = [
    { openid, title: '帮我去图书馆还书', desc: '3本书在6号楼门口取，还到图书馆2楼', fromAddr: '6号宿舍楼门口', toAddr: '图书馆2楼', price: 8, tip: 0, status: 0, statusText: '待接单', statusColor: '#DD6B20', riderId: null, createTime: new Date(now - 5400000) },
    { openid, title: '代买一杯奶茶', desc: '蜜雪冰城柠檬水少糖去冰', fromAddr: '蜜雪冰城南门店', toAddr: '3号宿舍楼201', price: 5, tip: 2, status: 0, statusText: '待接单', statusColor: '#DD6B20', riderId: null, createTime: new Date(now - 2700000) },
    { openid, title: '帮打印论文', desc: '30页论文双面打印A4纸', fromAddr: '打印店教学楼B座', toAddr: '2号宿舍楼108', price: 5, tip: 1, status: 1, statusText: '进行中', statusColor: '#38A169', riderId: openid, createTime: new Date(now - 9000000) },
    { openid, title: '代取外卖', desc: '美团外卖取餐码8832', fromAddr: '学校南门外卖柜', toAddr: '12号宿舍楼303', price: 3, tip: 0, status: 0, statusText: '待接单', statusColor: '#DD6B20', riderId: null, createTime: new Date(now - 1200000) }
  ]

  // 3. carpool
  const carpools = [
    { openid, from: '学校南门', to: '火车站', departTime: '2026-02-16 08:00', pickupLocation: '南门星巴克门口', maxPeople: 4, currentPeople: 2, deadline: '2026-02-15 22:00', publisher: '小王', members: [openid, 'u1'], createTime: new Date(now - 3600000) },
    { openid, from: '学校北门', to: '机场T2', departTime: '2026-02-17 06:30', pickupLocation: '北门公交站', maxPeople: 3, currentPeople: 1, deadline: '2026-02-16 20:00', publisher: '小陈', members: [openid], createTime: new Date(now - 7200000) },
    { openid, from: '学校西门', to: '高铁站', departTime: '2026-02-15 14:00', pickupLocation: '西门快递站旁', maxPeople: 4, currentPeople: 4, deadline: '2026-02-15 12:00', publisher: '老张', members: [openid, 'u2', 'u3', 'u4'], createTime: new Date(now - 10800000) },
    { openid, from: '市中心万达', to: '学校东门', departTime: '2026-02-18 18:00', pickupLocation: '万达广场正门', maxPeople: 3, currentPeople: 1, deadline: '2026-02-18 16:00', publisher: '小李', members: [openid], createTime: new Date(now - 5400000) }
  ]

  // 4. forum_posts
  const forumPosts = [
    { openid, nickname: '学霸小王', avatar: '🧑‍🎓', content: '图书馆三楼靠窗的位置真的绝了，安静又有阳光，考研党冲！', images: [], likes: 32, comments: 2, likedBy: [], createTime: new Date(now - 1800000) },
    { openid, nickname: '美食达人', avatar: '👩‍🍳', content: '食堂二楼新出的麻辣香锅也太好吃了！强烈推荐加芝士年糕和午餐肉', images: [], likes: 89, comments: 1, likedBy: [openid], createTime: new Date(now - 5400000) },
    { openid, nickname: '跑步达人', avatar: '🏃', content: '有没有人一起晨跑？每天早上6:30操场集合，已经坚持30天了', images: [], likes: 45, comments: 0, likedBy: [], createTime: new Date(now - 10800000) },
    { openid, nickname: '吉他社社长', avatar: '🎸', content: '校园歌手大赛报名开始啦！不管你是唱歌还是乐器都可以来', images: [], likes: 128, comments: 1, likedBy: [], createTime: new Date(now - 14400000) },
    { openid, nickname: '摄影爱好者', avatar: '📸', content: '今天的晚霞太美了！在教学楼天台拍的，分享给大家~', images: [], likes: 256, comments: 0, likedBy: [openid], createTime: new Date(now - 21600000) }
  ]

  // 5. market_goods
  const marketGoods = [
    { openid, title: '九成新iPad Air 5 64G WiFi版', desc: '去年9月买的贴膜戴壳电池98%', price: 2800, category: '数码', images: [], views: 23, wants: 5, publisher: '学长小李', status: 'active', createTime: new Date(now - 3600000) },
    { openid, title: '高等数学同济第七版上下册', desc: '有少量笔记标注不影响使用', price: 15, category: '书籍', images: [], views: 45, wants: 12, publisher: '大四学姐', status: 'active', createTime: new Date(now - 7200000) },
    { openid, title: 'AirPods Pro 2 带保修', desc: '买了半年降噪效果很好', price: 980, category: '数码', images: [], views: 18, wants: 3, publisher: '数码控', status: 'active', createTime: new Date(now - 10800000) },
    { openid, title: '宜家台灯护眼款', desc: '搬宿舍不方便带走便宜出', price: 35, category: '生活', images: [], views: 12, wants: 2, publisher: '毕业生', status: 'active', createTime: new Date(now - 14400000) },
    { openid, title: 'Nike Air Force 1 白色42码', desc: '穿了两次码数不合适', price: 199, category: '服饰', images: [], views: 31, wants: 8, publisher: '运动少年', status: 'active', createTime: new Date(now - 18000000) },
    { openid, title: '考研政治全套资料', desc: '肖四肖八+徐涛核心考案全新未拆', price: 25, category: '书籍', images: [], views: 56, wants: 15, publisher: '上岸学长', status: 'active', createTime: new Date(now - 21600000) }
  ]

  // 6. experience_posts 考研经验帖
  const experiencePosts = [
    { openid, nickname: '学姐小王', avatar: '', title: '三跨上岸985，我的考研400+经验分享', content: '本科双非，跨专业跨学校跨地区，从3月开始备考，最终初试410分上岸。\n\n一、时间规划\n3-6月：打基础，数学高数+线代过一遍，英语每天背单词200个\n7-9月：强化阶段，数学刷题+英语阅读真题精读\n10-12月：冲刺阶段，政治背诵+模拟考试\n\n二、各科方法\n数学：张宇基础+李永乐线代，一定要多刷题\n英语：单词用墨墨背，阅读用唐迟方法论\n政治：9月开始不晚，跟徐涛强化+肖四肖八\n\n三、心态\n最难的不是学习本身，而是坚持。找到自己的节奏最重要。', category: '初试经验', school: '北京大学', admitted: true, images: [], likes: 186, comments: 3, likedBy: [], createTime: new Date(now - 86400000) },
    { openid, nickname: '英语达人', avatar: '', title: '考研英语一85分复习全攻略', content: '从四级刚过到考研英语85分，分享我的方法：\n\n1. 单词：用艾宾浩斯遗忘曲线，每天新词+复习，坚持到考前\n2. 阅读：每天精读一篇真题，分析每个选项为什么对为什么错\n3. 作文：整理自己的模板，不要背万能模板，考场上一眼就能看出来\n4. 翻译：每天练一句长难句翻译\n5. 完形：放到最后做，性价比最低\n\n最重要的是：真题至少刷3遍，每遍都有新收获。', category: '学习方法', school: '复旦大学', admitted: true, images: [], likes: 152, comments: 2, likedBy: [], createTime: new Date(now - 172800000) },
    { openid, nickname: '逆袭学长', avatar: '', title: '复试逆袭：初试倒数第三到最终录取', content: '初试擦线进复试，排名倒数第三，但复试表现优异最终被录取。\n\n复试准备：\n1. 专业课：把本科教材重新过一遍，重点章节做笔记\n2. 英语口语：每天练30分钟，准备自我介绍和常见问题\n3. 综合面试：了解导师研究方向，准备2-3个相关问题\n4. 联系导师：提前发邮件，附上简历和研究计划\n\n面试技巧：\n- 不会的问题诚实说不会，但要说出自己的思考方向\n- 保持微笑和自信，眼神交流很重要\n- 回答要有逻辑，先总后分', category: '复试经验', school: '浙江大学', admitted: true, images: [], likes: 234, comments: 1, likedBy: [], createTime: new Date(now - 259200000) },
    { openid, nickname: '二战勇士', avatar: '', title: '二战上岸，给一战失败同学的建议', content: '一战差10分落榜，二战成功上岸。\n\n一战失败的教训：\n- 开始太晚，7月才正式复习\n- 没有系统规划，东一榔头西一棒子\n- 心态崩了好几次，浪费了很多时间\n\n二战调整：\n1. 3月就开始，给自己充足的时间\n2. 制定详细的月计划和周计划\n3. 找了一个研友互相监督\n4. 每周给自己放半天假，调节心态\n\n给一战失败的同学：失败不可怕，可怕的是不敢再来。', category: '心态调整', school: '南京大学', admitted: true, images: [], likes: 128, comments: 2, likedBy: [], createTime: new Date(now - 345600000) },
    { openid, nickname: '数据分析师', avatar: '', title: '如何选择目标院校？这些数据你必须看', content: '择校不能只看排名，还要综合考虑：\n\n1. 报录比：低于5:1的相对好考\n2. 复试线趋势：看近3年的变化，稳定的比较好预测\n3. 专业课难度：自命题vs统考，难度差异很大\n4. 地理位置：考虑未来就业城市\n5. 导师情况：看导师的研究方向和招生名额\n\n推荐工具：\n- 研招网：官方数据最准确\n- 各校研究生院官网：看历年分数线\n- 考研帮：看学长学姐的经验\n\n记住：选择比努力更重要，但选好了就别犹豫。', category: '择校建议', school: '', admitted: false, images: [], likes: 198, comments: 1, likedBy: [], createTime: new Date(now - 432000000) }
  ]

  // 7. team_activities 组队（匹配 team 云函数的集合名）
  const teams = [
    { openid, title: '王者荣耀五排', desc: '冲星耀，需要辅助和打野', type: '校园开黑', place: '线上', time: '每晚8点', max: 5, current: 3, tag: '招募中', owner: '峡谷之巅', status: 'active', images: [], photos: [], createTime: new Date(now - 3600000) },
    { openid, title: '英雄联盟排位', desc: '黄金段位一起上铂金', type: '校园开黑', place: '线上', time: '周末下午', max: 5, current: 2, tag: '招募中', owner: '召唤师', status: 'active', images: [], photos: [], createTime: new Date(now - 7200000) },
    { openid, title: '周末篮球3v3', desc: '周六下午3点篮球场水平不限', type: '球类竞技', place: '东区篮球场', time: '周六 15:00', max: 6, current: 4, tag: '热门', owner: '灌篮高手', status: 'active', images: [], photos: [], createTime: new Date(now - 10800000) },
    { openid, title: '羽毛球双打约战', desc: '找一个搭档打双打', type: '球类竞技', place: '体育馆羽毛球场', time: '周日 10:00', max: 4, current: 2, tag: '招募中', owner: '羽球少年', status: 'active', images: [], photos: [], createTime: new Date(now - 14400000) },
    { openid, title: '晨跑打卡团', desc: '每天6:30操场集合坚持30天', type: '校园陪跑', place: '操场', time: '每天 06:30', max: 10, current: 6, tag: '热门', owner: '跑步达人', status: 'active', images: [], photos: [], createTime: new Date(now - 18000000) },
    { openid, title: '健身房撸铁搭子', desc: '找个一起练胸和背的搭子', type: '撸铁健身', place: '校内健身房', time: '周一三五 18:00', max: 3, current: 1, tag: '招募中', owner: '铁人', status: 'active', images: [], photos: [], createTime: new Date(now - 21600000) }
  ]

  // 并行写入所有集合
  const [exIds, erIds, cpIds, fpIds, expIds] = await Promise.all([
    batchAdd('express_orders', expressOrders),
    batchAdd('errand_tasks', errandTasks),
    batchAdd('carpool', carpools),
    batchAdd('forum_posts', forumPosts),
    batchAdd('experience_posts', experiencePosts)
  ])

  // 论坛评论需要 postId
  const postIds = fpIds.map(r => r._id)
  const commentData = [
    { postId: postIds[0], openid, nickname: '代码少女', avatar: '👩‍💻', content: '我也在三楼！靠窗第二排下次可以一起~', createTime: new Date(now - 600000) },
    { postId: postIds[0], openid, nickname: '跑步达人', avatar: '🏃', content: '考研加油！去年也是泡了一年图书馆最后上岸了', createTime: new Date(now - 1200000) },
    { postId: postIds[1], openid, nickname: '吃货同学', avatar: '🍜', content: '确实好吃！我每天都去', createTime: new Date(now - 3000000) },
    { postId: postIds[3], openid, nickname: '音乐爱好者', avatar: '🎵', content: '报名了！唱一首周杰伦的', createTime: new Date(now - 8000000) }
  ]

  // 经验帖评论
  const expPostIds = expIds.map(r => r._id)
  const expCommentData = [
    { postId: expPostIds[0], openid, nickname: '考研小白', avatar: '', content: '学姐太厉害了！请问数学基础差的话3月开始来得及吗？', likes: 0, likedBy: [], createTime: new Date(now - 80000000) },
    { postId: expPostIds[0], openid, nickname: '备考中', avatar: '', content: '同三跨，看到你的帖子很受鼓舞，加油！', likes: 0, likedBy: [], createTime: new Date(now - 75000000) },
    { postId: expPostIds[0], openid, nickname: '数学渣', avatar: '', content: '张宇的课确实好，跟着学了一个月感觉开窍了', likes: 0, likedBy: [], createTime: new Date(now - 70000000) },
    { postId: expPostIds[1], openid, nickname: '英语苦手', avatar: '', content: '真题刷3遍这个建议太好了，我第二遍的时候确实发现了很多之前没注意的点', likes: 0, likedBy: [], createTime: new Date(now - 160000000) },
    { postId: expPostIds[1], openid, nickname: '单词困难户', avatar: '', content: '墨墨背单词确实好用，推荐！', likes: 0, likedBy: [], createTime: new Date(now - 155000000) },
    { postId: expPostIds[2], openid, nickname: '准备复试中', avatar: '', content: '联系导师的邮件模板能分享一下吗？', likes: 0, likedBy: [], createTime: new Date(now - 250000000) },
    { postId: expPostIds[3], openid, nickname: '一战失败', avatar: '', content: '谢谢学长，看完决定二战了', likes: 0, likedBy: [], createTime: new Date(now - 340000000) },
    { postId: expPostIds[3], openid, nickname: '同是二战', avatar: '', content: '找研友真的很重要，一个人太容易放弃了', likes: 0, likedBy: [], createTime: new Date(now - 335000000) },
    { postId: expPostIds[4], openid, nickname: '择校纠结中', avatar: '', content: '报录比这个数据在哪里查比较准确？', likes: 0, likedBy: [], createTime: new Date(now - 420000000) }
  ]

  await Promise.all([
    batchAdd('forum_comments', commentData),
    batchAdd('market_goods', marketGoods),
    batchAdd('team_activities', teams),
    batchAdd('experience_comments', expCommentData)
  ])

  // 更新 stats
  try {
    await db.collection('stats').where({ key: 'global' }).update({ data: { todayDelivered: 6, totalOrders: 10 } })
  } catch (e) {
    await db.collection('stats').add({ data: { key: 'global', todayDelivered: 6, totalOrders: 10 } })
  }

  return {
    code: 0,
    msg: 'seed done',
    data: {
      express_orders: expressOrders.length,
      errand_tasks: errandTasks.length,
      carpool: carpools.length,
      forum_posts: forumPosts.length,
      forum_comments: commentData.length,
      market_goods: marketGoods.length,
      team_activities: teams.length,
      experience_posts: experiencePosts.length,
      experience_comments: expCommentData.length
    }
  }
}
