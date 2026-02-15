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
        <view class="menu-item" @click="goSub('/pages/order/list?tab=12')">
          <view class="menu-icon-bg" style="background: linear-gradient(135deg, #68D391, #38A169);"><text class="mi">🚗</text></view>
          <text class="menu-text">我的拼车</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="goSub('/pages/order/list?tab=13')">
          <view class="menu-icon-bg" style="background: linear-gradient(135deg, #FC8181, #E53E3E);"><text class="mi">🛒</text></view>
          <text class="menu-text">我的商品</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item last" @click="goSub('/pages/order/list?tab=14')">
          <view class="menu-icon-bg" style="background: linear-gradient(135deg, #B794F4, #805AD5);"><text class="mi">🏕️</text></view>
          <text class="menu-text">我的组队</text>
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
            <text class="addr-text">{{ order.fromAddr }}{{ order.toAddr ? ' → ' + order.toAddr : '' }}</text>
          </view>
          <text class="order-desc" v-if="order.desc">{{ order.desc }}</text>
        </view>
        <view class="order-footer">
          <text class="order-time">{{ order.time }}</text>
          <text class="order-price" v-if="order.price">¥{{ order.price }}</text>
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
var carpoolList = ref([])
var goodsList = ref([])
var teamList = ref([])

var expressStatusMap = { 0: '待接单', 1: '已接单', 2: '配送中', 3: '已完成', 4: '已取消' }
var expressColorMap = { 0: '#DD6B20', 1: '#2B6CB0', 2: '#38A169', 3: '#A0AEC0', 4: '#E53E3E' }
var errandStatusMap = { 0: '待接单', 1: '进行中', 2: '已完成', 3: '已取消' }
var errandColorMap = { 0: '#DD6B20', 1: '#38A169', 2: '#A0AEC0', 3: '#E53E3E' }
var carpoolStatusMap = { 0: '招募中', 1: '已满员', 2: '已出发', 3: '已结束' }
var carpoolColorMap = { 0: '#DD6B20', 1: '#2B6CB0', 2: '#38A169', 3: '#A0AEC0' }
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
var mapCarpool = function(o) {
  var s = o.status || 0
  return { id: o._id, type: '拼车', typeEmoji: '🚗', _raw: 'carpool',
    fromAddr: o.from || '', toAddr: o.to || '',
    desc: o.remark || '', price: o.price || 0, time: fmtTime(o.createTime),
    statusText: carpoolStatusMap[s] || '招募中', statusColor: carpoolColorMap[s] || '#DD6B20' }
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

  var r3 = await callCloud('order', 'myCarpool')
  if (r3.code === 0) {
    var cArr = []
    for (var k = 0; k < r3.data.length; k++) cArr.push(mapCarpool(r3.data[k]))
    carpoolList.value = cArr
  }

  var r4 = await callCloud('market', 'myGoods')
  if (r4.code === 0) {
    var gArr = []
    for (var m = 0; m < r4.data.length; m++) gArr.push(mapGoods(r4.data[m]))
    goodsList.value = gArr
  }

  var r5 = await callCloud('team', 'myTeam')
  if (r5.code === 0) {
    var tArr2 = []
    for (var n = 0; n < r5.data.length; n++) tArr2.push(mapTeam(r5.data[n]))
    teamList.value = tArr2
  }

  loading.value = false
}

var currentList = computed(function() {
  if (tab.value === 1) return takenList.value
  if (tab.value === 10) return expressList.value
  if (tab.value === 11) return errandList.value
  if (tab.value === 12) return carpoolList.value
  if (tab.value === 13) return goodsList.value
  if (tab.value === 14) return teamList.value
  return []
})

var goSub = function(url) { uni.navigateTo({ url: url }) }
var goDetail = function(order) {
  if (order._raw === 'errand') uni.navigateTo({ url: '/pages/errand/detail?id=' + order.id })
  else if (order._raw === 'carpool') uni.navigateTo({ url: '/pages/carpool/detail?id=' + order.id })
  else if (order._raw === 'team') uni.navigateTo({ url: '/pages/team/detail?id=' + order.id })
  else if (order._raw === 'goods') uni.navigateTo({ url: '/pages/market/detail?id=' + order.id })
  else uni.navigateTo({ url: '/pages/express/detail?id=' + order.id })
}
var goRegister = function() { uni.navigateTo({ url: '/pages/express/rider-register' }) }

onLoad(function(opts) {
  if (opts && opts.tab) {
    tab.value = Number(opts.tab)
    var titleMap = { 1: '我的接单', 10: '我的快递单', 11: '我的跑腿任务', 12: '我的拼车', 13: '我的商品', 14: '我的组队' }
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
</style>
