/**
 * MongoDB 数据迁移种子脚本
 * 用法: node server/scripts/seed.js
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
const Stat = require('../models/Stat')

async function seed() {
  await mongoose.connect(config.mongoUri)
  console.log('MongoDB connected')

  const openid = 'seed_test_user'
  const now = Date.now()

  // 清空旧数据
  await Promise.all([
    ExpressOrder.deleteMany({}), ErrandTask.deleteMany({}),
    Carpool.deleteMany({}), ForumPost.deleteMany({}),
    ForumComment.deleteMany({}), MarketGoods.deleteMany({}),
    TeamActivity.deleteMany({})
  ])
  console.log('Collections cleared')

  // 快递订单
  const expressOrders = [
    { openid, pickupPoint: '菜鸟驿站A区', pickupCode: '5-2-1234', expressCompany: '顺丰', sizeType: 0, sizeText: '小件', sizeClass: 'small', building: '6号宿舍楼', room: '302', price: 2, tip: 1, remark: '放门口就行', status: 0, statusText: '待接单', statusColor: '#DD6B20', createTime: new Date(now - 3600000) },
    { openid, pickupPoint: '京东快递柜B区', pickupCode: '3-1-5678', expressCompany: '京东', sizeType: 1, sizeText: '大件', sizeClass: 'large', building: '3号宿舍楼', room: '501', price: 5, tip: 2, remark: '两个箱子', status: 0, statusText: '待接单', statusColor: '#DD6B20', createTime: new Date(now - 7200000) },
    { openid, pickupPoint: '菜鸟驿站C区', pickupCode: '8-3-9012', expressCompany: '中通', sizeType: 0, sizeText: '小件', sizeClass: 'small', building: '1号宿舍楼', room: '203', price: 2, tip: 3, remark: '轻拿轻放', status: 1, statusText: '已接单', statusColor: '#2B6CB0', riderId: openid, createTime: new Date(now - 10800000) },
    { openid, pickupPoint: '丰巢快递柜', pickupCode: '12-5-3456', expressCompany: '圆通', sizeType: 2, sizeText: '超大件', sizeClass: 'xlarge', building: '8号宿舍楼', room: '618', price: 20, tip: 5, remark: '很重需要小推车', status: 0, statusText: '待接单', statusColor: '#DD6B20', createTime: new Date(now - 1800000) },
    { openid, pickupPoint: '菜鸟驿站A区', pickupCode: '2-4-7890', expressCompany: '韵达', sizeType: 0, sizeText: '小件', sizeClass: 'small', building: '5号宿舍楼', room: '105', price: 2, tip: 0, status: 2, statusText: '配送中', statusColor: '#38A169', riderId: openid, createTime: new Date(now - 14400000) },
    { openid, pickupPoint: '京东快递柜A区', pickupCode: '6-2-1111', expressCompany: '极兔', sizeType: 1, sizeText: '大件', sizeClass: 'large', building: '10号宿舍楼', room: '412', price: 5, tip: 1, status: 3, statusText: '已完成', statusColor: '#A0AEC0', riderId: openid, createTime: new Date(now - 86400000) }
  ]

  // 跑腿任务
  const errandTasks = [
    { openid, title: '帮我去图书馆还书', desc: '3本书在6号楼门口取，还到图书馆2楼', price: 8, tip: 0, status: 0, statusText: '待接单', statusColor: '#DD6B20', publisher: '小王', createTime: new Date(now - 5400000) },
    { openid, title: '代买一杯奶茶', desc: '蜜雪冰城柠檬水少糖去冰', price: 5, tip: 2, status: 0, statusText: '待接单', statusColor: '#DD6B20', publisher: '小陈', createTime: new Date(now - 2700000) },
    { openid, title: '帮打印论文', desc: '30页论文双面打印A4纸', price: 5, tip: 1, status: 1, statusText: '进行中', statusColor: '#38A169', riderId: openid, publisher: '学姐', createTime: new Date(now - 9000000) },
    { openid, title: '代取外卖', desc: '美团外卖取餐码8832', price: 3, tip: 0, status: 0, statusText: '待接单', statusColor: '#DD6B20', publisher: '小李', createTime: new Date(now - 1200000) }
  ]

  // 拼车
  const carpools = [
    { openid, from: '学校南门', to: '火车站', departTime: '2026-02-16 08:00', pickupLocation: '南门星巴克门口', maxPeople: 4, currentPeople: 2, publisher: '小王', members: [openid, 'u1'], createTime: new Date(now - 3600000) },
    { openid, from: '学校北门', to: '机场T2', departTime: '2026-02-17 06:30', pickupLocation: '北门公交站', maxPeople: 3, currentPeople: 1, publisher: '小陈', members: [openid], createTime: new Date(now - 7200000) },
    { openid, from: '学校西门', to: '高铁站', departTime: '2026-02-15 14:00', pickupLocation: '西门快递站旁', maxPeople: 4, currentPeople: 4, publisher: '老张', members: [openid, 'u2', 'u3', 'u4'], createTime: new Date(now - 10800000) }
  ]

  // 论坛帖子
  const forumPosts = [
    { openid, nickname: '学霸小王', avatar: '', content: '图书馆三楼靠窗的位置真的绝了，安静又有阳光，考研党冲！', images: [], likes: 32, comments: 2, likedBy: [], createTime: new Date(now - 1800000) },
    { openid, nickname: '美食达人', avatar: '', content: '食堂二楼新出的麻辣香锅也太好吃了！强烈推荐加芝士年糕和午餐肉', images: [], likes: 89, comments: 1, likedBy: [openid], createTime: new Date(now - 5400000) },
    { openid, nickname: '跑步达人', avatar: '', content: '有没有人一起晨跑？每天早上6:30操场集合，已经坚持30天了', images: [], likes: 45, comments: 0, likedBy: [], createTime: new Date(now - 10800000) },
    { openid, nickname: '吉他社社长', avatar: '', content: '校园歌手大赛报名开始啦！不管你是唱歌还是乐器都可以来', images: [], likes: 128, comments: 1, likedBy: [], createTime: new Date(now - 14400000) }
  ]

  // 二手市场
  const marketGoods = [
    { openid, title: '九成新iPad Air 5 64G WiFi版', desc: '去年9月买的贴膜戴壳电池98%', price: 2800, category: '数码', images: [], views: 23, wants: 5, publisher: '学长小李', status: 'active', createTime: new Date(now - 3600000) },
    { openid, title: '高等数学同济第七版上下册', desc: '有少量笔记标注不影响使用', price: 15, category: '书籍', images: [], views: 45, wants: 12, publisher: '大四学姐', status: 'active', createTime: new Date(now - 7200000) },
    { openid, title: 'AirPods Pro 2 带保修', desc: '买了半年降噪效果很好', price: 980, category: '数码', images: [], views: 18, wants: 3, publisher: '数码控', status: 'active', createTime: new Date(now - 10800000) },
    { openid, title: '考研政治全套资料', desc: '肖四肖八+徐涛核心考案全新未拆', price: 25, category: '书籍', images: [], views: 56, wants: 15, publisher: '上岸学长', status: 'active', createTime: new Date(now - 21600000) }
  ]

  // 组队
  const teams = [
    { openid, title: '王者荣耀五排', desc: '冲星耀，需要辅助和打野', type: '校园开黑', place: '线上', time: '每晚8点', max: 5, current: 3, tag: '招募中', owner: '峡谷之巅', status: 'active', images: [], photos: [], createTime: new Date(now - 3600000) },
    { openid, title: '周末篮球3v3', desc: '周六下午3点篮球场水平不限', type: '球类竞技', place: '东区篮球场', time: '周六 15:00', max: 6, current: 4, tag: '热门', owner: '灌篮高手', status: 'active', images: [], photos: [], createTime: new Date(now - 10800000) },
    { openid, title: '晨跑打卡团', desc: '每天6:30操场集合坚持30天', type: '校园陪跑', place: '操场', time: '每天 06:30', max: 10, current: 6, tag: '热门', owner: '跑步达人', status: 'active', images: [], photos: [], createTime: new Date(now - 18000000) }
  ]

  // 写入数据
  const [exDocs, , , fpDocs] = await Promise.all([
    ExpressOrder.insertMany(expressOrders),
    ErrandTask.insertMany(errandTasks),
    Carpool.insertMany(carpools),
    ForumPost.insertMany(forumPosts)
  ])

  // 论坛评论
  const comments = [
    { postId: fpDocs[0]._id.toString(), openid, nickname: '代码少女', avatar: '', content: '我也在三楼！靠窗第二排下次可以一起~', createTime: new Date(now - 600000) },
    { postId: fpDocs[0]._id.toString(), openid, nickname: '跑步达人', avatar: '', content: '考研加油！去年也是泡了一年图书馆最后上岸了', createTime: new Date(now - 1200000) },
    { postId: fpDocs[1]._id.toString(), openid, nickname: '吃货同学', avatar: '', content: '确实好吃！我每天都去', createTime: new Date(now - 3000000) },
    { postId: fpDocs[3]._id.toString(), openid, nickname: '音乐爱好者', avatar: '', content: '报名了！唱一首周杰伦的', createTime: new Date(now - 8000000) }
  ]

  await Promise.all([
    ForumComment.insertMany(comments),
    MarketGoods.insertMany(marketGoods),
    TeamActivity.insertMany(teams)
  ])

  // 更新统计
  await Stat.updateOne({ key: 'global' }, { $set: { todayDelivered: 6, totalOrders: 10 } }, { upsert: true })

  console.log('Seed complete:', {
    express_orders: expressOrders.length,
    errand_tasks: errandTasks.length,
    carpool: carpools.length,
    forum_posts: forumPosts.length,
    forum_comments: comments.length,
    market_goods: marketGoods.length,
    team_activities: teams.length
  })

  await mongoose.disconnect()
  process.exit(0)
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1) })
