/**
 * MongoDB 数据迁移种子脚本（全量版）
 * 用法: node server/scripts/seed.js
 * 包含: express, errand, carpool, forum, market, team, experience, tutor, food, wash
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const mongoose = require('mongoose')
const config = require('../config')

const ExpressOrder = require('../models/ExpressOrder')
const ErrandTask = require('../models/ErrandTask')
const Carpool = require('../models/Carpool')
const ForumPost = require('../models/ForumPost')
const ForumComment = require('../models/ForumComment')
const MarketGoods = require('../models/MarketGoods')
const TeamActivity = require('../models/TeamActivity')
const TeamMember = require('../models/TeamMember')
const Stat = require('../models/Stat')
const ExperiencePost = require('../models/ExperiencePost')
const ExperienceComment = require('../models/ExperienceComment')
const TutorPost = require('../models/TutorPost')
const FoodShop = require('../models/FoodShop')
const FoodItem = require('../models/FoodItem')
const FoodOrder = require('../models/FoodOrder')
const WashProduct = require('../models/WashProduct')
const WashGroup = require('../models/WashGroup')
const WashOrder = require('../models/WashOrder')
const Skill = require('../models/Skill')
const User = require('../models/User')

async function seed() {
  await mongoose.connect(config.mongoUri)
  console.log('MongoDB connected')

  const openid = 'seed_test_user'
  const now = Date.now()

  // 清空旧数据
  console.log('Clearing old data...')
  await Promise.all([
    ExpressOrder.deleteMany({}), ErrandTask.deleteMany({}),
    Carpool.deleteMany({}), ForumPost.deleteMany({}),
    ForumComment.deleteMany({}), MarketGoods.deleteMany({}),
    TeamActivity.deleteMany({}), TeamMember.deleteMany({}),
    ExperiencePost.deleteMany({}), ExperienceComment.deleteMany({}),
    TutorPost.deleteMany({}),
    FoodShop.deleteMany({}), FoodItem.deleteMany({}), FoodOrder.deleteMany({}),
    WashProduct.deleteMany({}), WashGroup.deleteMany({}), WashOrder.deleteMany({})
  ])
  console.log('Collections cleared')

  // ========== 创建测试用户 ==========
  await User.updateOne({ openid }, {
    $set: { openid, name: '测试用户', avatar: '', phone: '13800138000', isRider: true }
  }, { upsert: true })

  // ========== 快递订单 ==========
  const expressOrders = [
    { openid, pickupPoint: '菜鸟驿站A区', pickupCode: '5-2-1234', expressCompany: '顺丰', sizeType: 0, sizeText: '小件', sizeClass: 'small', building: '6号宿舍楼', room: '302', price: 2, tip: 1, remark: '放门口就行', status: 0, statusText: '待接单', statusColor: '#DD6B20', createTime: new Date(now - 3600000) },
    { openid, pickupPoint: '京东快递柜B区', pickupCode: '3-1-5678', expressCompany: '京东', sizeType: 1, sizeText: '大件', sizeClass: 'large', building: '3号宿舍楼', room: '501', price: 5, tip: 2, remark: '两个箱子', status: 0, statusText: '待接单', statusColor: '#DD6B20', createTime: new Date(now - 7200000) },
    { openid, pickupPoint: '菜鸟驿站C区', pickupCode: '8-3-9012', expressCompany: '中通', sizeType: 0, sizeText: '小件', sizeClass: 'small', building: '1号宿舍楼', room: '203', price: 2, tip: 3, remark: '轻拿轻放', status: 1, statusText: '已接单', statusColor: '#2B6CB0', riderId: openid, createTime: new Date(now - 10800000) },
    { openid, pickupPoint: '丰巢快递柜', pickupCode: '12-5-3456', expressCompany: '圆通', sizeType: 2, sizeText: '超大件', sizeClass: 'xlarge', building: '8号宿舍楼', room: '618', price: 20, tip: 5, remark: '很重需要小推车', status: 0, statusText: '待接单', statusColor: '#DD6B20', createTime: new Date(now - 1800000) }
  ]

  // ========== 跑腿任务 ==========
  const errandTasks = [
    { openid, title: '帮我去图书馆还书', desc: '3本书在6号楼门口取，还到图书馆2楼', price: 8, tip: 0, status: 0, statusText: '待接单', statusColor: '#DD6B20', publisher: '小王', createTime: new Date(now - 5400000) },
    { openid, title: '代买一杯奶茶', desc: '蜜雪冰城柠檬水少糖去冰', price: 5, tip: 2, status: 0, statusText: '待接单', statusColor: '#DD6B20', publisher: '小陈', createTime: new Date(now - 2700000) },
    { openid, title: '帮打印论文', desc: '30页论文双面打印A4纸', price: 5, tip: 1, status: 1, statusText: '进行中', statusColor: '#38A169', riderId: openid, publisher: '学姐', createTime: new Date(now - 9000000) }
  ]

  // ========== 拼车 ==========
  const carpools = [
    { openid, from: '学校南门', to: '火车站', departTime: '2026-03-16 08:00', pickupLocation: '南门星巴克门口', maxPeople: 4, currentPeople: 2, publisher: '小王', members: [openid, 'u1'], createTime: new Date(now - 3600000) },
    { openid, from: '学校北门', to: '机场T2', departTime: '2026-03-17 06:30', pickupLocation: '北门公交站', maxPeople: 3, currentPeople: 1, publisher: '小陈', members: [openid], createTime: new Date(now - 7200000) }
  ]

  // ========== 论坛帖子 ==========
  const forumPosts = [
    { openid, nickname: '学霸小王', avatar: '', content: '图书馆三楼靠窗的位置真的绝了，安静又有阳光，考研党冲！', images: [], likes: 32, comments: 2, likedBy: [], createTime: new Date(now - 1800000) },
    { openid, nickname: '美食达人', avatar: '', content: '食堂二楼新出的麻辣香锅也太好吃了！', images: [], likes: 89, comments: 1, likedBy: [openid], createTime: new Date(now - 5400000) },
    { openid, nickname: '吉他社社长', avatar: '', content: '校园歌手大赛报名开始啦！不管你是唱歌还是乐器都可以来', images: [], likes: 128, comments: 1, likedBy: [], createTime: new Date(now - 14400000) }
  ]

  // ========== 二手市场 ==========
  const marketGoods = [
    { openid, title: '九成新iPad Air 5 64G WiFi版', desc: '去年9月买的贴膜戴壳电池98%', price: 2800, category: '数码', images: [], views: 23, wants: 5, publisher: '学长小李', status: 'active', createTime: new Date(now - 3600000) },
    { openid, title: '高等数学同济第七版上下册', desc: '有少量笔记标注不影响使用', price: 15, category: '书籍', images: [], views: 45, wants: 12, publisher: '大四学姐', status: 'active', createTime: new Date(now - 7200000) },
    { openid, title: '考研政治全套资料', desc: '肖四肖八+全新未拆', price: 25, category: '书籍', images: [], views: 56, wants: 15, publisher: '上岸学长', status: 'active', createTime: new Date(now - 21600000) }
  ]

  // ========== 组队 ==========
  const teams = [
    { openid, title: '王者荣耀五排', desc: '冲星耀，需要辅助和打野', type: '校园开黑', place: '线上', time: '每晚8点', max: 5, current: 3, tag: '招募中', owner: '峡谷之巅', status: 'active', images: [], photos: [], createTime: new Date(now - 3600000) },
    { openid, title: '周末篮球3v3', desc: '周六下午3点篮球场', type: '球类竞技', place: '东区篮球场', time: '周六 15:00', max: 6, current: 4, tag: '热门', owner: '灌篮高手', status: 'active', images: [], photos: [], createTime: new Date(now - 10800000) },
    { openid, title: '晨跑打卡团', desc: '每天6:30操场集合坚持30天', type: '校园陪跑', place: '操场', time: '每天 06:30', max: 10, current: 6, tag: '热门', owner: '跑步达人', status: 'active', images: [], photos: [], createTime: new Date(now - 18000000) }
  ]

  // ========== 考研经验帖 ==========
  const experiencePosts = [
    { openid, nickname: '学姐小王', avatar: '', title: '三跨上岸985，考研400+经验分享', content: '本科双非，跨专业跨学校跨地区，最终初试410分上岸。时间规划、各科方法、心态调整全分享。', category: '初试经验', school: '北京大学', admitted: true, images: [], likes: 186, comments: 1, likedBy: [], createTime: new Date(now - 86400000) },
    { openid, nickname: '英语达人', avatar: '', title: '考研英语一85分复习全攻略', content: '从四级刚过到考研英语85分，分享我的单词、阅读、作文、翻译方法。', category: '学习方法', school: '复旦大学', admitted: true, images: [], likes: 152, comments: 1, likedBy: [], createTime: new Date(now - 172800000) },
    { openid, nickname: '逆袭学长', avatar: '', title: '复试逆袭：初试倒数第三到录取', content: '初试擦线进复试，排名倒数第三，复试表现优异最终录取。', category: '复试经验', school: '浙江大学', admitted: true, images: [], likes: 234, comments: 0, likedBy: [], createTime: new Date(now - 259200000) }
  ]

  // ========== 家教帖 ==========
  const tutorPosts = [
    { openid, type: 'tutor', status: 1, name: '张同学', school: '重庆大学', major: '数学', subject: '高数', subjects: ['高数', '线代'], mode: '线上+线下', area: '沙坪坝', price: 80, experience: '带过3个学生', desc: '数学系大三，擅长高数线代', avatar: '', phone: '13800001111', wechat: 'zhangxx', qq: '', createTime: new Date(now - 36000000) },
    { openid, type: 'tutor', status: 1, name: '李同学', school: '西南大学', major: '英语', subject: '英语', subjects: ['英语'], mode: '线下', area: '北碚', price: 100, experience: '雅思7.5', desc: '英语专业大四，口语流利', avatar: '', phone: '', wechat: '', qq: '123456789', createTime: new Date(now - 72000000) },
    { openid, type: 'demand', status: 1, subject: '数学', title: '初三数学一对一', desc: '孩子数学基础薄弱，需补习初三数学', grade: '初三', location: '渝北区', schedule: '周末', budget: 120, parentName: '王女士', idCard: '', phone: '13900001111', wechat: '', qq: '', createTime: new Date(now - 50000000) },
    { openid, type: 'demand', status: 1, subject: '英语', title: '高一英语口语陪练', desc: '想提高孩子的英语口语水平', grade: '高一', location: '江北区', schedule: '每周三+周日', budget: 150, parentName: '陈先生', idCard: '', phone: '', wechat: 'chen_wx', qq: '', createTime: new Date(now - 90000000) }
  ]

  // ========== 外卖商家 ==========
  const foodShops = [
    { name: '学苑快餐', logo: '', category: '快餐', phone: '023-12345', address: '一食堂二楼', deliveryFee: 2, minOrder: 10, openTime: '07:00', closeTime: '21:00', status: 1, sort: 0 },
    { name: '茶语时光', logo: '', category: '饮品', phone: '', address: '二食堂一楼', deliveryFee: 1, minOrder: 8, openTime: '09:00', closeTime: '22:00', status: 1, sort: 1 },
    { name: '麻辣香锅', logo: '', category: '快餐', phone: '', address: '三食堂', deliveryFee: 3, minOrder: 15, openTime: '10:30', closeTime: '21:30', status: 1, sort: 2 }
  ]

  // ========== 洗护商品 ==========
  const washProducts = [
    { name: '运动鞋基础清洗', image: '', type: 'normal', price: 35, status: 1, sort: 0 },
    { name: '运动鞋深度清洗', image: '', type: 'normal', price: 55, status: 1, sort: 1 },
    { name: '皮鞋/靴子养护', image: '', type: 'normal', price: 65, status: 1, sort: 2 },
    { name: '运动鞋基础清洗（团购）', image: '', type: 'group', price: 35, originalPrice: 35, groupPrice: 19.9, groupSize: 3, status: 1, sort: 0 },
    { name: '运动鞋深度清洗（团购）', image: '', type: 'group', price: 55, originalPrice: 55, groupPrice: 29.9, groupSize: 3, status: 1, sort: 1 }
  ]

  // 写入所有数据
  const [exDocs, , , fpDocs, , teamDocs, expDocs] = await Promise.all([
    ExpressOrder.insertMany(expressOrders),
    ErrandTask.insertMany(errandTasks),
    Carpool.insertMany(carpools),
    ForumPost.insertMany(forumPosts),
    MarketGoods.insertMany(marketGoods),
    TeamActivity.insertMany(teams),
    ExperiencePost.insertMany(experiencePosts)
  ])

  // 论坛评论
  const comments = [
    { postId: fpDocs[0]._id.toString(), openid, nickname: '代码少女', avatar: '', content: '我也在三楼！靠窗第二排下次可以一起~', createTime: new Date(now - 600000) },
    { postId: fpDocs[0]._id.toString(), openid, nickname: '跑步达人', avatar: '', content: '考研加油！泡了一年图书馆最后上岸了', createTime: new Date(now - 1200000) },
    { postId: fpDocs[2]._id.toString(), openid, nickname: '音乐爱好者', avatar: '', content: '报名了！唱一首周杰伦的', createTime: new Date(now - 8000000) }
  ]

  // 经验帖评论
  const expComments = [
    { postId: expDocs[0]._id.toString(), openid, nickname: '考研小白', avatar: '', content: '学姐太厉害了！3月开始来得及吗？', likes: 0, likedBy: [], createTime: new Date(now - 80000000) },
    { postId: expDocs[1]._id.toString(), openid, nickname: '英语苦手', avatar: '', content: '真题刷3遍这个建议太好了', likes: 0, likedBy: [], createTime: new Date(now - 160000000) }
  ]

  // 组队成员
  const teamMembers = teamDocs.map(t => ({
    activityId: t._id.toString(), openid, name: t.owner, joinTime: new Date()
  }))

  const shopDocs = await FoodShop.insertMany(foodShops)

  // 外卖菜品
  const foodItems = [
    { shopId: shopDocs[0]._id.toString(), name: '红烧肉套餐', price: 15, category: '热销', status: 1, sort: 0 },
    { shopId: shopDocs[0]._id.toString(), name: '番茄炒蛋套餐', price: 12, category: '热销', status: 1, sort: 1 },
    { shopId: shopDocs[0]._id.toString(), name: '宫保鸡丁套餐', price: 14, category: '主食', status: 1, sort: 2 },
    { shopId: shopDocs[1]._id.toString(), name: '珍珠奶茶', price: 12, category: '奶茶', status: 1, sort: 0 },
    { shopId: shopDocs[1]._id.toString(), name: '芒果冰沙', price: 15, category: '冰沙', status: 1, sort: 1 },
    { shopId: shopDocs[2]._id.toString(), name: '麻辣香锅（小份）', price: 18, category: '香锅', status: 1, sort: 0 },
    { shopId: shopDocs[2]._id.toString(), name: '麻辣香锅（大份）', price: 28, category: '香锅', status: 1, sort: 1 }
  ]

  await Promise.all([
    ForumComment.insertMany(comments),
    ExperienceComment.insertMany(expComments),
    TeamMember.insertMany(teamMembers),
    TutorPost.insertMany(tutorPosts),
    FoodItem.insertMany(foodItems),
    WashProduct.insertMany(washProducts),
    Stat.updateOne({ key: 'global' }, { $set: { todayDelivered: 4, totalOrders: 7 } }, { upsert: true })
  ])

  console.log('Seed complete:', {
    users: 1,
    express_orders: expressOrders.length,
    errand_tasks: errandTasks.length,
    carpool: carpools.length,
    forum_posts: forumPosts.length,
    forum_comments: comments.length,
    market_goods: marketGoods.length,
    team_activities: teams.length,
    team_members: teamMembers.length,
    experience_posts: experiencePosts.length,
    experience_comments: expComments.length,
    tutor_posts: tutorPosts.length,
    food_shops: foodShops.length,
    food_items: foodItems.length,
    wash_products: washProducts.length
  })

  await mongoose.disconnect()
  process.exit(0)
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1) })
