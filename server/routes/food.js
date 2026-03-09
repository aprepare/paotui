const router = require('express').Router()
const auth = require('../middleware/auth')
const adminAuth = require('../middleware/adminAuth')
const crypto = require('crypto')
const axios = require('axios')
const FoodShop = require('../models/FoodShop')
const FoodItem = require('../models/FoodItem')
const FoodOrder = require('../models/FoodOrder')
const PageConfig = require('../models/PageConfig')

// ========== 飞鹅云打印机 ==========
const FEIE_URL = 'http://api.feieyun.cn/Api/Open/'

async function getPrinterConfig() {
    try {
        const doc = await PageConfig.findOne({ key: 'printer' })
        return doc ? doc.config : null
    } catch (e) { return null }
}

function feieSign(user, ukey, stime) {
    return crypto.createHash('sha1').update(user + ukey + stime).digest('hex')
}

async function printOrder(order, shop, printerSn) {
    const config = await getPrinterConfig()
    if (!config || !config.user || !config.ukey) return { success: false, msg: '未配置打印机' }
    const sn = printerSn || (shop && shop.printerSn) || config.defaultSn
    if (!sn) return { success: false, msg: '无打印机SN' }

    const stime = Math.floor(Date.now() / 1000).toString()
    const sig = feieSign(config.user, config.ukey, stime)

    let content = '<CB>校园外卖订单</CB><BR>'
    content += '--------------------------------<BR>'
    content += '订单号: ' + (order._id || '').toString().substr(-8) + '<BR>'
    content += '商家: ' + (shop.name || '') + '<BR>'
    content += '--------------------------------<BR>'
    content += '<B>商品明细</B><BR>'
    for (const item of (order.items || [])) {
        const name = (item.name || '').padEnd(10, ' ')
        content += name + ' x' + item.quantity + '  ¥' + (item.price * item.quantity).toFixed(2) + '<BR>'
    }
    content += '--------------------------------<BR>'
    content += '配送费: ¥' + (order.deliveryFee || 0).toFixed(2) + '<BR>'
    content += '<B>合计: ¥' + (order.totalPrice || 0).toFixed(2) + '</B><BR>'
    content += '--------------------------------<BR>'
    content += '收货地址: ' + (order.address || '') + '<BR>'
    content += '联系电话: ' + (order.phone || '') + '<BR>'
    if (order.remark) content += '备注: ' + order.remark + '<BR>'
    content += '下单时间: ' + new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) + '<BR>'
    content += '<BR><BR>'

    try {
        const querystring = require('querystring')
        const res = await axios.post(FEIE_URL, querystring.stringify({
            user: config.user, stime, sig, apiname: 'Open_printMsg', sn, content, times: '1'
        }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
        return { success: res.data.ret === 0, msg: res.data.msg || '' }
    } catch (e) {
        return { success: false, msg: e.message }
    }
}

// 默认商家数据
const defaultShops = [
    { _id: 'default_shop_1', name: '学苑快餐', logo: '', category: '快餐', phone: '', address: '一食堂二楼', deliveryFee: 2, minOrder: 10, openTime: '07:00', closeTime: '21:00', status: 1, sort: 0 },
    { _id: 'default_shop_2', name: '茶语时光', logo: '', category: '饮品', phone: '', address: '二食堂一楼', deliveryFee: 1, minOrder: 8, openTime: '09:00', closeTime: '22:00', status: 1, sort: 1 },
    { _id: 'default_shop_3', name: '麻辣香锅', logo: '', category: '快餐', phone: '', address: '三食堂', deliveryFee: 3, minOrder: 15, openTime: '10:30', closeTime: '21:30', status: 1, sort: 2 },
    { _id: 'default_shop_4', name: '鸡蛋灌饼·煎饼果子', logo: '', category: '小吃', phone: '', address: '北门小吃街', deliveryFee: 2, minOrder: 5, openTime: '06:30', closeTime: '20:00', status: 1, sort: 3 },
    { _id: 'default_shop_5', name: '兰州拉面', logo: '', category: '面食', phone: '', address: '一食堂一楼', deliveryFee: 2, minOrder: 12, openTime: '07:00', closeTime: '21:00', status: 1, sort: 4 }
]

const defaultMenus = {
    'default_shop_1': {
        shop: { _id: 'default_shop_1', name: '学苑快餐', category: '快餐', deliveryFee: 2, minOrder: 10 },
        items: [
            { _id: 'di_1_1', shopId: 'default_shop_1', name: '红烧肉套餐', price: 15, category: '热销', desc: '红烧肉+米饭+时蔬', status: 1, sort: 0 },
            { _id: 'di_1_2', shopId: 'default_shop_1', name: '番茄炒蛋套餐', price: 12, category: '热销', desc: '番茄炒蛋+米饭+汤', status: 1, sort: 1 },
            { _id: 'di_1_3', shopId: 'default_shop_1', name: '宫保鸡丁套餐', price: 14, category: '主食', desc: '宫保鸡丁+米饭+小菜', status: 1, sort: 2 },
            { _id: 'di_1_4', shopId: 'default_shop_1', name: '鱼香肉丝套餐', price: 14, category: '主食', desc: '鱼香肉丝+米饭+汤', status: 1, sort: 3 },
            { _id: 'di_1_5', shopId: 'default_shop_1', name: '可乐', price: 3, category: '饮品', status: 1, sort: 10 },
            { _id: 'di_1_6', shopId: 'default_shop_1', name: '矿泉水', price: 2, category: '饮品', status: 1, sort: 11 }
        ]
    },
    'default_shop_2': {
        shop: { _id: 'default_shop_2', name: '茶语时光', category: '饮品', deliveryFee: 1, minOrder: 8 },
        items: [
            { _id: 'di_2_1', shopId: 'default_shop_2', name: '珍珠奶茶', price: 12, category: '奶茶', status: 1, sort: 0 },
            { _id: 'di_2_2', shopId: 'default_shop_2', name: '芒果冰沙', price: 15, category: '冰沙', status: 1, sort: 1 },
            { _id: 'di_2_3', shopId: 'default_shop_2', name: '柠檬绿茶', price: 8, category: '茶饮', status: 1, sort: 2 },
            { _id: 'di_2_4', shopId: 'default_shop_2', name: '草莓奶昔', price: 14, category: '奶昔', status: 1, sort: 3 }
        ]
    },
    'default_shop_3': {
        shop: { _id: 'default_shop_3', name: '麻辣香锅', category: '快餐', deliveryFee: 3, minOrder: 15 },
        items: [
            { _id: 'di_3_1', shopId: 'default_shop_3', name: '麻辣香锅（小份）', price: 18, category: '香锅', status: 1, sort: 0 },
            { _id: 'di_3_2', shopId: 'default_shop_3', name: '麻辣香锅（大份）', price: 28, category: '香锅', status: 1, sort: 1 },
            { _id: 'di_3_3', shopId: 'default_shop_3', name: '酸辣粉', price: 12, category: '小吃', status: 1, sort: 2 },
            { _id: 'di_3_4', shopId: 'default_shop_3', name: '米饭', price: 2, category: '主食', status: 1, sort: 10 }
        ]
    },
    'default_shop_4': {
        shop: { _id: 'default_shop_4', name: '鸡蛋灌饼·煎饼果子', category: '小吃', deliveryFee: 2, minOrder: 5 },
        items: [
            { _id: 'di_4_1', shopId: 'default_shop_4', name: '鸡蛋灌饼', price: 5, category: '灌饼', status: 1, sort: 0 },
            { _id: 'di_4_2', shopId: 'default_shop_4', name: '鸡蛋灌饼+火腿', price: 7, category: '灌饼', status: 1, sort: 1 },
            { _id: 'di_4_3', shopId: 'default_shop_4', name: '煎饼果子', price: 6, category: '煎饼', status: 1, sort: 2 },
            { _id: 'di_4_4', shopId: 'default_shop_4', name: '煎饼果子+火腿', price: 8, category: '煎饼', status: 1, sort: 3 },
            { _id: 'di_4_5', shopId: 'default_shop_4', name: '豆浆', price: 3, category: '饮品', status: 1, sort: 10 }
        ]
    },
    'default_shop_5': {
        shop: { _id: 'default_shop_5', name: '兰州拉面', category: '面食', deliveryFee: 2, minOrder: 12 },
        items: [
            { _id: 'di_5_1', shopId: 'default_shop_5', name: '牛肉拉面', price: 15, category: '拉面', status: 1, sort: 0 },
            { _id: 'di_5_2', shopId: 'default_shop_5', name: '牛肉刀削面', price: 14, category: '刀削面', status: 1, sort: 1 },
            { _id: 'di_5_3', shopId: 'default_shop_5', name: '炸酱面', price: 12, category: '拌面', status: 1, sort: 2 },
            { _id: 'di_5_4', shopId: 'default_shop_5', name: '凉皮', price: 10, category: '小吃', status: 1, sort: 3 },
            { _id: 'di_5_5', shopId: 'default_shop_5', name: '肉夹馍', price: 8, category: '小吃', status: 1, sort: 4 }
        ]
    }
}

const defaultShopNames = {
    'default_shop_1': { name: '学苑快餐', deliveryFee: 2, minOrder: 10 },
    'default_shop_2': { name: '茶语时光', deliveryFee: 1, minOrder: 8 },
    'default_shop_3': { name: '麻辣香锅', deliveryFee: 3, minOrder: 15 },
    'default_shop_4': { name: '鸡蛋灌饼·煎饼果子', deliveryFee: 2, minOrder: 5 },
    'default_shop_5': { name: '兰州拉面', deliveryFee: 2, minOrder: 12 }
}

// GET /api/food/shops
router.get('/shops', async (req, res) => {
    try {
        const { category } = req.query
        const where = { status: 1 }
        if (category && category !== '全部') where.category = category
        const data = await FoodShop.find(where).sort({ sort: 1 })
        if (data && data.length > 0) return res.json({ code: 0, data })
        // 返回默认商家
        let filtered = defaultShops
        if (category && category !== '全部') filtered = defaultShops.filter(s => s.category === category)
        res.json({ code: 0, data: filtered })
    } catch (err) {
        res.json({ code: 0, data: defaultShops })
    }
})

// GET /api/food/shop/:id/menu
router.get('/shop/:id/menu', async (req, res) => {
    const shopId = req.params.id
    if (defaultMenus[shopId]) return res.json({ code: 0, data: defaultMenus[shopId] })
    try {
        const shop = await FoodShop.findById(shopId)
        if (!shop) return res.json({ code: -1, msg: '商家不存在' })
        const items = await FoodItem.find({ shopId, status: 1 }).sort({ sort: 1 })
        res.json({ code: 0, data: { shop, items } })
    } catch (err) {
        res.json({ code: -1, msg: '获取菜单失败' })
    }
})

// POST /api/food/order
router.post('/order', auth, async (req, res) => {
    try {
        const { shopId, items, address, phone, remark, userName, deliveryMode = 'delivery' } = req.body
        if (!shopId || !items || !items.length) return res.json({ code: -1, msg: '参数不完整' })
        if (!phone) return res.json({ code: -1, msg: '请填写联系电话' })
        if (deliveryMode === 'delivery' && (!address || !address.trim())) return res.json({ code: -1, msg: '请填写收货地址' })

        let shop = null
        if (defaultShopNames[shopId]) {
            shop = defaultShopNames[shopId]
        } else {
            shop = await FoodShop.findById(shopId)
            if (!shop) return res.json({ code: -1, msg: '商家不存在' })
        }

        let itemsTotal = 0
        const orderItems = []
        for (const ci of items) {
            if (!ci.itemId || !ci.quantity || ci.quantity <= 0) continue
            let itemName, itemPrice, itemImage = ''
            if (ci.itemId.startsWith('di_')) {
                const menu = defaultMenus[shopId]
                const defaultItem = menu && menu.items.find(i => i._id === ci.itemId)
                if (!defaultItem) return res.json({ code: -1, msg: '菜品不存在: ' + ci.itemId })
                itemName = defaultItem.name; itemPrice = defaultItem.price; itemImage = defaultItem.image || ''
            } else {
                const item = await FoodItem.findById(ci.itemId)
                if (!item) return res.json({ code: -1, msg: '菜品不存在: ' + ci.itemId })
                itemName = item.name; itemPrice = item.price; itemImage = item.image || ''
            }
            orderItems.push({ itemId: ci.itemId, name: itemName, price: itemPrice, image: itemImage, quantity: ci.quantity })
            itemsTotal += itemPrice * ci.quantity
        }
        if (orderItems.length === 0) return res.json({ code: -1, msg: '订单中没有有效商品' })

        const deliveryFee = deliveryMode === 'self_pickup' ? 0 : (shop.deliveryFee || 0)
        const totalPrice = itemsTotal + deliveryFee
        if (shop.minOrder && itemsTotal < shop.minOrder) return res.json({ code: -1, msg: '未达到起送价 ¥' + shop.minOrder })

        const foodOrder = await FoodOrder.create({
            openid: req.user.openid, shopId, shopName: shop.name, items: orderItems,
            itemsTotal, deliveryFee, totalPrice, deliveryMode,
            address: deliveryMode === 'self_pickup' ? '' : (address || ''),
            phone, userName: userName || '', remark: remark || '',
            status: 0, statusText: '待确认', createTime: new Date()
        })

        // 异步打印小票
        printOrder(foodOrder, shop).catch(e => console.error('[print async]', e))

        res.json({ code: 0, data: { orderId: foodOrder._id } })
    } catch (err) {
        res.status(500).json({ code: -1, msg: '下单失败: ' + err.message })
    }
})

// GET /api/food/my-orders
router.get('/my-orders', auth, async (req, res) => {
    try {
        const { page = 1, pageSize = 20 } = req.query
        const total = await FoodOrder.countDocuments({ openid: req.user.openid })
        const data = await FoodOrder.find({ openid: req.user.openid })
            .sort({ createTime: -1 }).skip((Number(page) - 1) * Number(pageSize)).limit(Number(pageSize))
        res.json({ code: 0, data, total })
    } catch (err) {
        res.json({ code: 0, data: [], total: 0 })
    }
})

// GET /api/food/order/:id
router.get('/order/:id', auth, async (req, res) => {
    try {
        const order = await FoodOrder.findById(req.params.id)
        if (!order) return res.json({ code: -1, msg: '订单不存在' })
        if (order.openid !== req.user.openid) return res.json({ code: -1, msg: '无权查看该订单' })
        res.json({ code: 0, data: order })
    } catch (err) {
        res.json({ code: -1, msg: '订单不存在' })
    }
})

// POST /api/food/order/:id/cancel
router.post('/order/:id/cancel', auth, async (req, res) => {
    try {
        const order = await FoodOrder.findById(req.params.id)
        if (!order || order.openid !== req.user.openid) return res.json({ code: -1, msg: '无权操作' })
        if (order.status > 1) return res.json({ code: -1, msg: '当前状态不可取消' })
        await FoodOrder.updateOne({ _id: req.params.id }, { $set: { status: 4, statusText: '已取消' } })
        res.json({ code: 0 })
    } catch (err) {
        res.json({ code: -1, msg: '取消失败' })
    }
})

// POST /api/food/order/:id/rider-accept
router.post('/order/:id/rider-accept', auth, async (req, res) => {
    try {
        const { riderName, riderPhone } = req.body
        const order = await FoodOrder.findById(req.params.id)
        if (!order) return res.json({ code: -1, msg: '订单不存在' })
        if (order.status !== 2 || order.deliveryMode !== 'delivery') return res.json({ code: -1, msg: '该订单不可接单' })
        if (order.riderId) return res.json({ code: -1, msg: '该订单已被接单' })
        await FoodOrder.updateOne({ _id: req.params.id }, {
            $set: { riderId: req.user.openid, riderName: riderName || '', riderPhone: riderPhone || '' }
        })
        res.json({ code: 0 })
    } catch (err) {
        res.json({ code: -1, msg: '接单失败' })
    }
})

// POST /api/food/order/:id/rider-complete
router.post('/order/:id/rider-complete', auth, async (req, res) => {
    try {
        const order = await FoodOrder.findById(req.params.id)
        if (!order) return res.json({ code: -1, msg: '订单不存在' })
        if (order.status !== 2) return res.json({ code: -1, msg: '当前状态不可完成' })
        if (order.riderId !== req.user.openid) return res.json({ code: -1, msg: '无权操作' })
        await FoodOrder.updateOne({ _id: req.params.id }, { $set: { status: 3, statusText: '已完成' } })
        res.json({ code: 0 })
    } catch (err) {
        res.json({ code: -1, msg: '操作失败' })
    }
})

// ========== 管理员接口 ==========

// GET /api/food/admin/shops
router.get('/admin/shops', adminAuth, async (req, res) => {
    try {
        const data = await FoodShop.find().sort({ sort: 1 })
        res.json({ code: 0, data })
    } catch (err) {
        res.json({ code: 0, data: [] })
    }
})

// POST /api/food/admin/shop
router.post('/admin/shop', adminAuth, async (req, res) => {
    try {
        const { name, logo, category, phone, address, deliveryFee, minOrder, printerSn, openTime, closeTime } = req.body
        if (!name) return res.json({ code: -1, msg: '商家名称不能为空' })
        await FoodShop.create({
            name, logo: logo || '', category: category || '快餐',
            phone: phone || '', address: address || '',
            deliveryFee: parseFloat(deliveryFee) || 0, minOrder: parseFloat(minOrder) || 0,
            printerSn: printerSn || '', openTime: openTime || '08:00', closeTime: closeTime || '22:00',
            status: 1, sort: 0, createTime: new Date()
        })
        res.json({ code: 0 })
    } catch (err) {
        res.status(500).json({ code: -1, msg: '服务器错误' })
    }
})

// PUT /api/food/admin/shop/:id
router.put('/admin/shop/:id', adminAuth, async (req, res) => {
    try {
        const updateData = { ...req.body }
        if (updateData.deliveryFee !== undefined) updateData.deliveryFee = parseFloat(updateData.deliveryFee) || 0
        if (updateData.minOrder !== undefined) updateData.minOrder = parseFloat(updateData.minOrder) || 0
        await FoodShop.updateOne({ _id: req.params.id }, { $set: updateData })
        res.json({ code: 0 })
    } catch (err) {
        res.status(500).json({ code: -1, msg: '服务器错误' })
    }
})

// DELETE /api/food/admin/shop/:id
router.delete('/admin/shop/:id', adminAuth, async (req, res) => {
    try {
        await FoodShop.deleteOne({ _id: req.params.id })
        await FoodItem.deleteMany({ shopId: req.params.id })
        res.json({ code: 0 })
    } catch (err) {
        res.status(500).json({ code: -1, msg: '服务器错误' })
    }
})

// GET /api/food/admin/items/:shopId
router.get('/admin/items/:shopId', adminAuth, async (req, res) => {
    try {
        const data = await FoodItem.find({ shopId: req.params.shopId }).sort({ sort: 1 })
        res.json({ code: 0, data })
    } catch (err) {
        res.json({ code: 0, data: [] })
    }
})

// POST /api/food/admin/item
router.post('/admin/item', adminAuth, async (req, res) => {
    try {
        const { shopId, name, image, price, category, desc } = req.body
        if (!shopId || !name) return res.json({ code: -1, msg: '参数不完整' })
        await FoodItem.create({
            shopId, name, image: image || '', price: parseFloat(price) || 0,
            category: category || '热销', desc: desc || '', status: 1, sort: 0, sales: 0
        })
        res.json({ code: 0 })
    } catch (err) {
        res.status(500).json({ code: -1, msg: '服务器错误' })
    }
})

// PUT /api/food/admin/item/:id
router.put('/admin/item/:id', adminAuth, async (req, res) => {
    try {
        const updateData = { ...req.body }
        if (updateData.price !== undefined) updateData.price = parseFloat(updateData.price) || 0
        await FoodItem.updateOne({ _id: req.params.id }, { $set: updateData })
        res.json({ code: 0 })
    } catch (err) {
        res.status(500).json({ code: -1, msg: '服务器错误' })
    }
})

// DELETE /api/food/admin/item/:id
router.delete('/admin/item/:id', adminAuth, async (req, res) => {
    try {
        await FoodItem.deleteOne({ _id: req.params.id })
        res.json({ code: 0 })
    } catch (err) {
        res.status(500).json({ code: -1, msg: '服务器错误' })
    }
})

// GET /api/food/admin/orders
router.get('/admin/orders', adminAuth, async (req, res) => {
    try {
        const { page = 1, pageSize = 20, status } = req.query
        const where = {}
        if (status !== undefined && status !== '-1') where.status = Number(status)
        const total = await FoodOrder.countDocuments(where)
        const data = await FoodOrder.find(where)
            .sort({ createTime: -1 }).skip((Number(page) - 1) * Number(pageSize)).limit(Number(pageSize))
        res.json({ code: 0, data, total })
    } catch (err) {
        res.json({ code: 0, data: [], total: 0 })
    }
})

// PUT /api/food/admin/order/:id/status
router.put('/admin/order/:id/status', adminAuth, async (req, res) => {
    try {
        const { status: newStatus } = req.body
        const order = await FoodOrder.findById(req.params.id)
        if (!order) return res.json({ code: -1, msg: '订单不存在' })
        const statusMap = {
            0: '待确认', 1: '制作中',
            2: order.deliveryMode === 'self_pickup' ? '待自取' : '配送中',
            3: '已完成', 4: '已取消'
        }
        await FoodOrder.updateOne({ _id: req.params.id }, {
            $set: { status: newStatus, statusText: statusMap[newStatus] || '待确认' }
        })
        res.json({ code: 0 })
    } catch (err) {
        res.json({ code: -1, msg: '更新失败' })
    }
})

// ========== 打印机配置 ==========
// GET /api/food/admin/printer-config
router.get('/admin/printer-config', adminAuth, async (req, res) => {
    const pc = await getPrinterConfig()
    res.json({ code: 0, data: pc || {} })
})

// POST /api/food/admin/printer-config
router.post('/admin/printer-config', adminAuth, async (req, res) => {
    try {
        const { user, ukey, defaultSn } = req.body
        const pConfig = { user: user || '', ukey: ukey || '', defaultSn: defaultSn || '' }
        const existing = await PageConfig.findOne({ key: 'printer' })
        if (!existing) {
            await PageConfig.create({ key: 'printer', config: pConfig, updateTime: new Date() })
        } else {
            await PageConfig.updateOne({ key: 'printer' }, { $set: { config: pConfig, updateTime: new Date() } })
        }
        res.json({ code: 0 })
    } catch (err) {
        res.status(500).json({ code: -1, msg: '服务器错误' })
    }
})

// POST /api/food/admin/order/:id/reprint
router.post('/admin/order/:id/reprint', adminAuth, async (req, res) => {
    try {
        const order = await FoodOrder.findById(req.params.id)
        if (!order) return res.json({ code: -1, msg: '订单不存在' })
        let shopData = { name: order.shopName || '', printerSn: '' }
        if (order.shopId && !order.shopId.startsWith('default_')) {
            try {
                const shop = await FoodShop.findById(order.shopId)
                if (shop) shopData.printerSn = shop.printerSn || ''
            } catch (e) { }
        }
        const result = await printOrder(order, shopData)
        res.json({ code: 0, data: result })
    } catch (err) {
        res.json({ code: -1, msg: '打印失败: ' + err.message })
    }
})

module.exports = router
