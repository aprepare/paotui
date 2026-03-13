<template>
  <view class="order-page">
    <!-- 默认：我发布的 菜单入口 -->
    <view v-if="tab === 0" class="menu-page">
      <view class="menu-card">
        <view class="menu-item" @click="goSub('/pages/order/list?tab=10')">
          <view class="menu-icon-bg" style="background: linear-gradient(135deg, #63B3ED, #2B6CB0);"><text class="mi">📦</text></view>
          <text class="menu-text">我的快递单</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="goSub('/pages/order/list?tab=11')">
          <view class="menu-icon-bg" style="background: linear-gradient(135deg, #F6AD55, #DD6B20);"><text class="mi">🏃</text></view>
          <text class="menu-text">我的跑腿任务</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="goSub('/pages/order/list?tab=18')">
          <view class="menu-icon-bg" style="background: linear-gradient(135deg, #ED8936, #C05621);"><text class="mi">🍔</text></view>
          <text class="menu-text">我的外卖</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="goSub('/pages/order/list?tab=19')">
          <view class="menu-icon-bg" style="background: linear-gradient(135deg, #4FD1C5, #319795);"><text class="mi">🧼</text></view>
          <text class="menu-text">我的洗护</text>
          <text class="menu-arrow">›</text>
        </view>

        <view class="menu-item" @click="goSub('/pages/order/list?tab=14')">
          <view class="menu-icon-bg" style="background: linear-gradient(135deg, #B794F4, #805AD5);"><text class="mi">🏕️</text></view>
          <text class="menu-text">我的组队</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="goSub('/pages/order/list?tab=17')">
          <view class="menu-icon-bg" style="background: linear-gradient(135deg, #F687B3, #D53F8C);"><text class="mi">🎯</text></view>
          <text class="menu-text">我的技能</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="goSub('/pages/order/list?tab=15')">
          <view class="menu-icon-bg" style="background: linear-gradient(135deg, #667eea, #764ba2);"><text class="mi">📚</text></view>
          <text class="menu-text">我的家教</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="goSub('/pages/order/list?tab=16')">
          <view class="menu-icon-bg" style="background: linear-gradient(135deg, #4facfe, #00f2fe);"><text class="mi">💼</text></view>
          <text class="menu-text">我的兼职</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item last" @click="goSub('/pages/order/list?tab=13')">
          <view class="menu-icon-bg" style="background: linear-gradient(135deg, #FC8181, #E53E3E);"><text class="mi">🛒</text></view>
          <text class="menu-text">我的商品</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 我接的：未注册骑手引导 -->
    <view v-if="tab === 1 && !isRider" class="list-content">
      <view class="register-card">
        <view class="register-icon">🏅</view>
        <view class="register-info">
          <text class="register-title">成为骑手，接单赚钱</text>
          <text class="register-desc">注册骑手后即可接单，轻松赚取零花钱</text>
        </view>
        <view class="register-btn" @click="goRegister">
          <text>立即注册</text>
        </view>
      </view>
    </view>

    <!-- 订单列表（tab >= 1） -->
    <view v-if="tab >= 1 && (tab !== 1 || isRider)" class="list-content">
      <view v-for="order in currentList" :key="order.id" class="order-card" @click="goDetail(order)">
        <view class="order-header">
          <text class="order-type">{{ order.typeEmoji }} {{ order.type }}</text>
          <text class="order-status" :style="{color: order.statusColor}">{{ order.statusText }}</text>
        </view>
        <view class="order-body">
          <view class="addr-row">
            <text class="addr-icon">📍</text>
            <text class="addr-text">{{ order.toAddr || order.fromAddr }}{{ order.toAddr && order.fromAddr ? ' ← ' + order.fromAddr : '' }}</text>
          </view>
          <text class="order-desc" v-if="order.desc">{{ order.desc }}</text>
        </view>
        <view class="order-footer">
          <text class="order-time">{{ order.time }}</text>
          <text class="order-price" v-if="order.price">¥{{ order.price }}</text>
        </view>
        <!-- 应聘者信息（家教） -->
        <view v-if="order.applicants && order.applicants.length > 0" class="applicants-section">
          <view class="applicants-title">
            <text>📝 应聘者（{{ order.applicants.length }}人）</text>
          </view>
          <view v-for="(ap, idx) in order.applicants" :key="idx" class="applicant-item">
            <view class="applicant-info">
              <text class="applicant-name">{{ ap.name }}</text>
              <text class="applicant-type">{{ ap.type === 'tutor_apply' ? '应聘' : '联系' }}</text>
            </view>
            <view class="applicant-phone" v-if="ap.phone" @click.stop="callPhone(ap.phone)">
              <text>📱 {{ ap.phone }}</text>
            </view>
          </view>
        </view>
        <view v-if="order.applicants && order.applicants.length === 0 && tab === 15" class="no-applicants">
          <text>暂无应聘者</text>
        </view>
      </view>
      <view v-if="currentList.length === 0 && !loading" class="empty">
        <text class="empty-emoji">📭</text>
        <text class="empty-text">暂无记录</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow, onLoad } from '@dcloudio/uni-app'
import { callCloud } from '@/utils/cloud'

var tab = ref(0)
var isRider = ref(false)
var loading = ref(false)

var takenList = ref([])
var expressList = ref([])
var errandList = ref([])

var goodsList = ref([])
var teamList = ref([])
var skillList = ref([])
var tutorList = ref([])
var foodOrderList = ref([])
var washOrderList = ref([])

var expressStatusMap = { 0: '待接单', 1: '已接单', 2: '配送中', 3: '已完成', 4: '已取消' }
var expressColorMap = { 0: '#DD6B20', 1: '#2B6CB0', 2: '#38A169', 3: '#A0AEC0', 4: '#E53E3E' }
var errandStatusMap = { 0: '待接单', 1: '进行中', 2: '已完成', 3: '已取消', 4: '待确认' }
var errandColorMap = { 0: '#DD6B20', 1: '#38A169', 2: '#A0AEC0', 3: '#E53E3E', 4: '#2B6CB0' }

var goodsStatusMap = { 0: '在售', 1: '已售出', 2: '已下架' }
var goodsColorMap = { 0: '#38A169', 1: '#A0AEC0', 2: '#E53E3E' }

var fmtTime = function(t) {
  if (!t) return ''
  var d = new Date(t)
  return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
}

var mapExpress = function(o) {
  var s = o.status || 0
  return { id: o._id, type: '代取快递', typeEmoji: '📦', _raw: 'express',
    fromAddr: o.pickupPoint || '', toAddr: (o.building || '') + (o.room || ''),
    desc: o.remark || '', price: (o.price || 0) + (o.tip || 0), time: fmtTime(o.createTime),
    statusText: expressStatusMap[s] || '待接单', statusColor: expressColorMap[s] || '#DD6B20' }
}
var mapErrand = function(o) {
  var s = o.status || 0
  return { id: o._id, type: '万能跑腿', typeEmoji: '🏃', _raw: 'errand',
    fromAddr: o.title || o.desc || '', toAddr: '',
    desc: o.remark || o.desc || '', price: o.price || 0, time: fmtTime(o.createTime),
    statusText: errandStatusMap[s] || '待接单', statusColor: errandColorMap[s] || '#DD6B20' }
}

var teamStatusMap = { 0: '招募中', 1: '已满员', 2: '进行中', 3: '已结束' }
var teamColorMap = { 0: '#DD6B20', 1: '#2B6CB0', 2: '#38A169', 3: '#A0AEC0' }

var mapGoods = function(o) {
  var s = o.status || 0
  return { id: o._id, type: '二手商品', typeEmoji: '🛒', _raw: 'goods',
    fromAddr: o.title || '', toAddr: '',
    desc: o.desc || '', price: o.price || 0, time: fmtTime(o.createTime),
    statusText: goodsStatusMap[s] || '在售', statusColor: goodsColorMap[s] || '#38A169' }
}

var mapTeam = function(o) {
  var s = o.status || 0
  return { id: o._id, type: '组队', typeEmoji: '🏕️', _raw: 'team',
    fromAddr: o.title || '', toAddr: '',
    desc: o.type || '', price: 0, time: fmtTime(o.createTime),
    statusText: teamStatusMap[s] || '招募中', statusColor: teamColorMap[s] || '#DD6B20' }
}

var loadData = async function() {
  loading.value = true
  var userInfo = uni.getStorageSync('userInfo')
  if (userInfo && userInfo.isRider) isRider.value = true
  isRider.value = isRider.value || !!uni.getStorageSync('isRider')

  try {
    var r1 = await callCloud('order', 'myPublished')
    if (r1.code === 0) {
      var eArr = [], rArr = []
      for (var i = 0; i < r1.data.length; i++) {
        var o = r1.data[i]
        if (o.type === '万能跑腿') rArr.push(mapErrand(o))
        else eArr.push(mapExpress(o))
      }
      expressList.value = eArr
      errandList.value = rArr
    }
  } catch (e) { console.log('loadData myPublished error:', e) }

  try {
    var r2 = await callCloud('order', 'myAccepted')
    if (r2.code === 0) {
      var tArr = []
      for (var j = 0; j < r2.data.length; j++) {
        var o2 = r2.data[j]
        if (o2.type === '万能跑腿') tArr.push(mapErrand(o2))
        else tArr.push(mapExpress(o2))
      }
      takenList.value = tArr
    }
  } catch (e) { console.log('loadData myAccepted error:', e) }



  try {
    var r4 = await callCloud('market', 'myGoods')
    if (r4.code === 0) {
      var gArr = []
      for (var m = 0; m < r4.data.length; m++) gArr.push(mapGoods(r4.data[m]))
      goodsList.value = gArr
    }
  } catch (e) { console.log('loadData myGoods error:', e) }

  try {
    var r5 = await callCloud('team', 'myTeam')
    if (r5.code === 0) {
      var tArr2 = []
      for (var n = 0; n < r5.data.length; n++) tArr2.push(mapTeam(r5.data[n]))
      teamList.value = tArr2
    }
  } catch (e) { console.log('loadData myTeam error:', e) }

  try {
    var r6 = await callCloud('skill', 'my')
    if (r6.code === 0) {
      var sArr = []
      for (var p = 0; p < r6.data.length; p++) {
        var sk = r6.data[p]
        sArr.push({ id: sk._id, type: '技能', typeEmoji: '🎯', _raw: 'skill',
          fromAddr: sk.title || '', toAddr: '',
          desc: sk.category || '', price: sk.price || 0, time: fmtTime(sk.createTime),
          statusText: sk.status === 0 ? '上架中' : '已下架', statusColor: sk.status === 0 ? '#38A169' : '#A0AEC0' })
      }
      skillList.value = sArr
    }
  } catch (e) { console.log('loadData skill error:', e) }

  try {
    var r7 = await callCloud('tutor', 'myPosts')
    console.log('tutor myPosts result:', JSON.stringify(r7))
    if (r7.code === 0) {
      var tArr3 = []
      for (var q = 0; q < r7.data.length; q++) {
        var tp = r7.data[q]
        tArr3.push({
          id: tp._id, _raw: 'tutor',
          type: tp.type === 'demand' ? '家长需求' : '家教信息',
          typeEmoji: tp.type === 'demand' ? '📋' : '📚',
          fromAddr: tp.title || tp.name || '',
          toAddr: '',
          desc: tp.subject || '',
          price: tp.price || tp.budget || 0,
          time: fmtTime(tp.createTime),
          statusText: tp.status === 1 ? '发布中' : '已关闭',
          statusColor: tp.status === 1 ? '#38A169' : '#A0AEC0',
          applicants: tp.applicants || []
        })
      }
      tutorList.value = tArr3
    }
  } catch (e) { console.log('loadData tutor error:', e) }

  try {
    var r8 = await callCloud('food', 'myOrders', { page: 1, pageSize: 50 })
    if (r8.code === 0) {
      var fArr = []
      var foodStatusMap = { 0: '待确认', 1: '制作中', 2: '配送中', 3: '已完成', 4: '已取消' }
      var foodColorMap = { 0: '#DD6B20', 1: '#38A169', 2: '#4299E1', 3: '#A0AEC0', 4: '#E53E3E' }
      for (var fi = 0; fi < r8.data.length; fi++) {
        var fo = r8.data[fi]
        var st = fo.status || 0
        var stText = fo.statusText || foodStatusMap[st] || '待确认'
        if (st === 2 && fo.deliveryMode === 'self_pickup') stText = '待自取'
        fArr.push({ id: fo._id, type: '福利外卖', typeEmoji: '🍔', _raw: 'food',
          fromAddr: fo.shopName || '', toAddr: fo.address || '',
          desc: (fo.deliveryMode === 'self_pickup' ? '🏪自取' : '🚴配送') + ' · ' + (fo.items || []).map(function(x) { return x.name }).join('、'),
          price: fo.totalPrice || 0, time: fmtTime(fo.createTime),
          statusText: stText, statusColor: foodColorMap[st] || '#DD6B20' })
      }
      foodOrderList.value = fArr
    }
  } catch (e) { console.log('loadData food error:', e) }

  try {
    var r9 = await callCloud('wash', 'myOrders')
    if (r9.code === 0) {
      var wArr = []
      var washStatusMap = { 0: '待处理', 1: '处理中', 2: '已完成', 3: '已取消' }
      var washColorMap = { 0: '#DD6B20', 1: '#2B6CB0', 2: '#A0AEC0', 3: '#E53E3E' }
      for (var wi = 0; wi < r9.data.length; wi++) {
        var wo = r9.data[wi]
        var ws = wo.status || 0
        wArr.push({ id: wo._id, type: '萌马洗护', typeEmoji: '🧼', _raw: 'wash',
          fromAddr: wo.productName || '', toAddr: wo.address || '',
          desc: 'x' + (wo.quantity || 1) + (wo.needDelivery ? ' · 🏃跑腿取送' : ''),
          price: wo.totalPrice || 0, time: fmtTime(wo.createTime),
          statusText: wo.statusText || washStatusMap[ws] || '待处理', statusColor: washColorMap[ws] || '#DD6B20' })
      }
      washOrderList.value = wArr
    }
  } catch (e) { console.log('loadData wash error:', e) }

  loading.value = false
}

var currentList = computed(function() {
  if (tab.value === 1) return takenList.value
  if (tab.value === 10) return expressList.value
  if (tab.value === 11) return errandList.value

  if (tab.value === 13) return goodsList.value
  if (tab.value === 14) return teamList.value
  if (tab.value === 15) return tutorList.value
  if (tab.value === 16) return []
  if (tab.value === 17) return skillList.value
  if (tab.value === 18) return foodOrderList.value
  if (tab.value === 19) return washOrderList.value
  return []
})

var goSub = function(url) { uni.navigateTo({ url: url }) }
var goDetail = function(order) {
  if (order._raw === 'errand') uni.navigateTo({ url: '/pages/errand/detail?id=' + order.id })

  else if (order._raw === 'team') uni.navigateTo({ url: '/pages/team/detail?id=' + order.id })
  else if (order._raw === 'goods') uni.navigateTo({ url: '/pages/market/detail?id=' + order.id })
  else if (order._raw === 'skill') uni.navigateTo({ url: '/pages/skill/detail?id=' + order.id })
  else if (order._raw === 'tutor') uni.navigateTo({ url: '/pages/job-sub/tutor' })
  else if (order._raw === 'food') uni.navigateTo({ url: '/pages/food/detail?id=' + order.id })
  else uni.navigateTo({ url: '/pages/express/detail?id=' + order.id })
}
var callPhone = function(phone) {
  uni.makePhoneCall({ phoneNumber: phone, fail: function() {} })
}
var goRegister = function() { uni.navigateTo({ url: '/pages/express/rider-register' }) }

onLoad(function(opts) {
  if (opts && opts.tab) {
    tab.value = Number(opts.tab)
    var titleMap = { 1: '我的接单', 10: '我的快递单', 11: '我的跑腿任务', 13: '我的商品', 14: '我的组队', 15: '我的家教', 16: '我的兼职', 17: '我的技能', 18: '我的外卖', 19: '我的洗护' }
    var t = titleMap[tab.value]
    if (t) uni.setNavigationBarTitle({ title: t })
  }
})
onShow(function() { loadData() })
</script>

<style scoped>
.order-page { background: #F0F2F5; min-height: 100vh; }

.menu-page { padding: 24rpx 28rpx; }
.menu-card { background: #fff; border-radius: 20rpx; overflow: hidden; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.menu-item { display: flex; align-items: center; padding: 28rpx 28rpx; border-bottom: 1rpx solid #F7FAFC; }
.menu-item:active { background: #F7FAFC; }
.menu-item.last { border-bottom: none; }
.menu-icon-bg { width: 56rpx; height: 56rpx; border-radius: 14rpx; display: flex; align-items: center; justify-content: center; margin-right: 20rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.08); }
.mi { font-size: 28rpx; }
.menu-text { flex: 1; font-size: 28rpx; color: #2D3748; font-weight: 500; }
.menu-arrow { font-size: 28rpx; color: #CBD5E0; font-weight: 300; }

.list-content { padding: 20rpx 28rpx; }

.register-card { background: linear-gradient(135deg, #FFFAF0, #FFF5EB); border: 1rpx solid #FEEBC8; border-radius: 20rpx; padding: 32rpx; display: flex; align-items: center; margin-bottom: 24rpx; }
.register-icon { font-size: 48rpx; margin-right: 20rpx; }
.register-info { flex: 1; }
.register-title { font-size: 28rpx; font-weight: 700; color: #1A1A2E; display: block; }
.register-desc { font-size: 22rpx; color: #718096; margin-top: 6rpx; display: block; }
.register-btn { padding: 14rpx 32rpx; border-radius: 28rpx; background: linear-gradient(135deg, #ED8936, #DD6B20); box-shadow: 0 4rpx 12rpx rgba(221,107,32,0.25); }
.register-btn:active { transform: scale(0.95); }
.register-btn text { font-size: 24rpx; color: #fff; font-weight: 700; }

.order-card { background: #fff; border-radius: 20rpx; padding: 28rpx; margin-bottom: 16rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.order-card:active { transform: scale(0.98); }
.order-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.order-type { font-size: 28rpx; font-weight: 700; color: #1A1A2E; }
.order-status { font-size: 24rpx; font-weight: 700; }
.addr-row { display: flex; align-items: center; margin-bottom: 8rpx; }
.addr-icon { margin-right: 8rpx; font-size: 24rpx; }
.addr-text { font-size: 26rpx; color: #4A5568; font-weight: 500; }
.order-desc { font-size: 24rpx; color: #A0AEC0; margin-left: 36rpx; }
.order-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 16rpx; padding-top: 16rpx; border-top: 1rpx solid #F7FAFC; }
.order-time { font-size: 24rpx; color: #A0AEC0; }
.order-price { font-size: 34rpx; color: #E53E3E; font-weight: 800; }

.empty { display: flex; flex-direction: column; align-items: center; padding: 120rpx 0; }
.empty-emoji { font-size: 80rpx; margin-bottom: 16rpx; }
.empty-text { font-size: 28rpx; color: #A0AEC0; }

/* 应聘者 */
.applicants-section { margin-top: 16rpx; padding-top: 16rpx; border-top: 1rpx solid #EDF2F7; }
.applicants-title { margin-bottom: 12rpx; }
.applicants-title text { font-size: 26rpx; color: #2B6CB0; font-weight: 700; }
.applicant-item { display: flex; justify-content: space-between; align-items: center; padding: 12rpx 16rpx; background: #F7FAFC; border-radius: 12rpx; margin-bottom: 8rpx; }
.applicant-info { display: flex; align-items: center; gap: 12rpx; }
.applicant-name { font-size: 26rpx; color: #2D3748; font-weight: 600; }
.applicant-type { font-size: 20rpx; color: #fff; background: #4299E1; padding: 2rpx 12rpx; border-radius: 10rpx; }
.applicant-phone { padding: 6rpx 16rpx; background: #EBF8FF; border-radius: 12rpx; }
.applicant-phone text { font-size: 24rpx; color: #2B6CB0; font-weight: 600; }
.no-applicants { margin-top: 12rpx; padding-top: 12rpx; border-top: 1rpx solid #EDF2F7; text-align: center; }
.no-applicants text { font-size: 24rpx; color: #A0AEC0; }
</style>
