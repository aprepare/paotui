<template>
  <view class="express-page">
    <!-- 楼栋卡片视图（默认） -->
    <view v-if="!selectedBuilding" class="building-view">
      <view class="page-header">
        <text class="page-title">📦 最新快递订单</text>
        <text class="page-desc">选择楼栋查看对应订单</text>
      </view>
      <view class="building-list">
        <view v-for="(b, i) in buildings" :key="i" class="building-card" @click="selectBuilding(b.name)">
          <view class="building-left">
            <text class="building-icon">🏠</text>
            <view class="building-info">
              <text class="building-name">{{ b.name }}</text>
              <text class="building-detail">待接单 {{ b.pending }} 单 · 配送中 {{ b.delivering }} 单</text>
            </view>
          </view>
          <view class="building-right">
            <view class="order-count-badge" :class="b.level">
              <text class="count-num">{{ b.total }}</text>
              <text class="count-label">待处理</text>
            </view>
          </view>
        </view>
      </view>
      <!-- 今日数据 -->
      <view class="stats-card">
        <text class="stats-title">📊 今日数据</text>
        <view class="stats-grid">
          <view class="stat-item">
            <text class="stat-num" style="color:#DD6B20">{{ totalPending }}</text>
            <text class="stat-label">待接单</text>
          </view>
          <view class="stat-item">
            <text class="stat-num" style="color:#2B6CB0">{{ totalDelivering }}</text>
            <text class="stat-label">配送中</text>
          </view>
          <view class="stat-item">
            <text class="stat-num" style="color:#38A169">{{ totalCompleted }}</text>
            <text class="stat-label">已完成</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 订单列表视图（选中楼栋后） -->
    <view v-if="selectedBuilding" class="order-view">
      <view class="back-bar" @click="selectedBuilding = ''">
        <text class="back-arrow">‹</text>
        <text class="back-text">{{ selectedBuilding }} 的订单</text>
      </view>
      <!-- Tab筛选 -->
      <view class="tab-bar">
        <view class="tab-item" :class="{active: tab === i}" v-for="(name, i) in tabNames" :key="i" @click="tab = i">
          <text>{{ name }}</text>
          <view v-if="tab === i" class="tab-line"></view>
        </view>
      </view>
      <view class="order-list">
        <view v-for="order in orders" :key="order.id" class="order-card" @click="goDetail(order.id, order.orderType)">
          <view class="card-top">
            <text class="order-type">{{ order.orderType === 'errand' ? '🏃 万能跑腿' : '📦 代取快递' }}</text>
            <text class="status-text" :style="{color: order.statusColor}">{{ order.statusText }}</text>
          </view>
          <view class="card-body">
            <view class="addr-row">
              <text class="addr-icon">📍</text>
              <text class="addr-text">{{ order.building }}{{ order.room }} ← {{ order.pickupPoint || '未知' }}</text>
            </view>
            <text class="order-desc" v-if="order.remark">{{ order.remark }}</text>
          </view>
          <view class="card-bottom">
            <text class="card-time">{{ order.time }}</text>
            <view class="price-area">
              <text class="card-price">¥{{ (order.price || 0) + (order.tip || 0) }}</text>
              <text v-if="order.tip > 0" class="card-tip">+{{ order.tip }}加急费</text>
            </view>
          </view>
        </view>
        <view v-if="orders.length === 0" class="empty">
          <text class="empty-emoji">📭</text>
          <text class="empty-text">暂无订单</text>
        </view>
      </view>
    </view>

    <view class="fab-btn" @click="goCreate"><text>+ 发快递单</text></view>
  </view>
</template>

<script setup>
import { ref, watch } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { callCloud } from '@/utils/cloud'

var tab = ref(0)
var tabNames = ['全部', '待接单', '配送中', '已完成']
var selectedBuilding = ref('')
var buildings = ref([])
var orders = ref([])
var totalPending = ref(0)
var totalDelivering = ref(0)
var totalCompleted = ref(0)
var queryBuilding = ''

var statusMap = { 0: -1, 1: 0, 2: 1, 3: 3 }

var loadBuildings = async function() {
  var res = await callCloud('express', 'buildingStats')
  if (res.code === 0 && res.data) {
    var pAll = 0, dAll = 0, cAll = 0
    var list = []
    for (var i = 0; i < res.data.length; i++) {
      var b = res.data[i]
      if (b.name === '全部') continue
      var p = b.pending || 0
      var d = b.delivering || 0
      var c = b.completed || 0
      pAll += p
      dAll += d
      cAll += c
      var active = p + d
      list.push({
        name: b.name,
        pending: p,
        delivering: d,
        total: active,
        level: active >= 4 ? 'high' : (active >= 2 ? 'mid' : 'low')
      })
    }
    list.sort(function(a, b) { return b.total - a.total })
    buildings.value = list
    totalPending.value = pAll
    totalDelivering.value = dAll
    totalCompleted.value = cAll
  }
}

var loadOrders = async function() {
  var s = statusMap[tab.value]
  var params = { building: selectedBuilding.value, page: 1, pageSize: 50 }
  if (s !== undefined && s !== -1) params.status = s
  // 对于"配送中"tab，需要包含status 1和2
  if (tab.value === 2) {
    params.status = undefined
  }
  var res = await callCloud('express', 'list', params)
  // 同时查跑腿任务（用toAddr匹配楼栋）
  var errandParams = { page: 1, pageSize: 50 }
  // 跑腿状态映射：tab 0=全部(-1), 1=待接单(0), 2=进行中(1), 3=已完成(2)
  var errandStatusMap = { 0: -1, 1: 0, 2: 1, 3: 2 }
  var es = errandStatusMap[tab.value]
  if (es !== undefined && es !== -1) errandParams.status = es
  if (tab.value === 2) errandParams.status = undefined
  var errandRes = await callCloud('errand', 'list', errandParams)

  var list = []
  // 处理快递订单
  if (res.code === 0) {
    var eList = res.data || []
    if (tab.value === 2) {
      var filtered = []
      for (var i = 0; i < eList.length; i++) {
        if (eList[i].status === 1 || eList[i].status === 2) filtered.push(eList[i])
      }
      eList = filtered
    }
    for (var j = 0; j < eList.length; j++) {
      var o = eList[j]
      o.id = o._id
      o.orderType = 'express'
      o.time = formatTime(o.createTime)
      list.push(o)
    }
  }
  // 处理跑腿任务（按楼栋过滤）
  if (errandRes.code === 0) {
    var rList = errandRes.data || []
    if (tab.value === 2) {
      var filtered2 = []
      for (var k = 0; k < rList.length; k++) {
        if (rList[k].status === 1) filtered2.push(rList[k])
      }
      rList = filtered2
    }
    for (var m = 0; m < rList.length; m++) {
      var r = rList[m]
      // 跑腿用toAddr匹配楼栋
      if (selectedBuilding.value && (r.toAddr || '') !== selectedBuilding.value) continue
      r.id = r._id
      r.orderType = 'errand'
      r.pickupPoint = r.title || r.fromAddr || '跑腿任务'
      r.building = r.toAddr || ''
      r.room = ''
      r.sizeText = '跑腿'
      r.sizeClass = 'errand'
      r.statusText = r.statusText || '待接单'
      r.statusColor = r.statusColor || '#DD6B20'
      r.time = formatTime(r.createTime)
      list.push(r)
    }
  }
  // 排序：待接单 > 配送中/进行中 > 已接单 > 已完成 > 已取消，同状态按加急费降序
  // 快递：0=待接单, 1=已接单, 2=配送中, 3=已完成, 4=已取消
  // 跑腿：0=待接单, 1=进行中, 2=已完成, 3=已取消
  var expressPriority = { 0: 0, 2: 1, 1: 2, 3: 3, 4: 4 }
  var errandPriority = { 0: 0, 1: 1, 2: 3, 3: 4 }
  list.sort(function(a, b) {
    var pm = a.orderType === 'errand' ? errandPriority : expressPriority
    var pm2 = b.orderType === 'errand' ? errandPriority : expressPriority
    var ap = pm[a.status] !== undefined ? pm[a.status] : 5
    var bp = pm2[b.status] !== undefined ? pm2[b.status] : 5
    if (ap !== bp) return ap - bp
    return (b.tip || 0) - (a.tip || 0)
  })
  orders.value = list
}

var selectBuilding = function(name) {
  selectedBuilding.value = name
  tab.value = 0
  loadOrders()
}

var formatTime = function(t) {
  if (!t) return ''
  var d = new Date(t)
  var m = d.getMonth() + 1
  var day = d.getDate()
  var h = d.getHours()
  var min = d.getMinutes()
  return m + '-' + day + ' ' + (h < 10 ? '0' + h : h) + ':' + (min < 10 ? '0' + min : min)
}

var goDetail = function(id, orderType) {
  if (orderType === 'errand') {
    uni.navigateTo({ url: '/pages/errand/detail?id=' + id })
  } else {
    uni.navigateTo({ url: '/pages/express/detail?id=' + id })
  }
}

var goCreate = function() {
  uni.navigateTo({ url: '/pages/express/create' })
}

watch(tab, function() {
  if (selectedBuilding.value) loadOrders()
})

onLoad(function(options) {
  if (options && options.building) {
    queryBuilding = options.building
  }
})

onShow(function() {
  if (queryBuilding) {
    selectedBuilding.value = queryBuilding
    queryBuilding = ''
    loadOrders()
  } else if (selectedBuilding.value) {
    loadOrders()
  }
  loadBuildings()
})
</script>


<style scoped>
.express-page { background: #F0F2F5; min-height: 100vh; padding-bottom: 120rpx; }

.page-header { padding: 32rpx 28rpx; background: linear-gradient(135deg, #4A90D9, #2B6CB0); }
.page-title { font-size: 36rpx; font-weight: 800; color: #fff; display: block; }
.page-desc { font-size: 24rpx; color: rgba(255,255,255,0.8); display: block; margin-top: 8rpx; }

.building-list { padding: 20rpx 28rpx; }
.building-card { display: flex; justify-content: space-between; align-items: center; background: #fff; border-radius: 20rpx; padding: 28rpx 24rpx; margin-bottom: 16rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.building-card:active { transform: scale(0.98); }
.building-left { display: flex; align-items: center; flex: 1; }
.building-icon { font-size: 40rpx; margin-right: 16rpx; }
.building-info { flex: 1; }
.building-name { font-size: 30rpx; font-weight: 700; color: #1A1A2E; display: block; }
.building-detail { font-size: 22rpx; color: #A0AEC0; display: block; margin-top: 6rpx; }

.building-right { margin-left: 16rpx; }
.order-count-badge { width: 100rpx; height: 100rpx; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.order-count-badge.high { background: #FFEBEE; }
.order-count-badge.mid { background: #FFF3E0; }
.order-count-badge.low { background: #E8F5E9; }
.count-num { font-size: 36rpx; font-weight: 800; }
.order-count-badge.high .count-num { color: #E53E3E; }
.order-count-badge.mid .count-num { color: #DD6B20; }
.order-count-badge.low .count-num { color: #38A169; }
.count-label { font-size: 18rpx; color: #A0AEC0; }

.stats-card { margin: 0 28rpx; background: #fff; border-radius: 20rpx; padding: 28rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.stats-title { font-size: 28rpx; font-weight: 700; color: #1A1A2E; display: block; margin-bottom: 20rpx; }
.stats-grid { display: flex; }
.stat-item { flex: 1; display: flex; flex-direction: column; align-items: center; }
.stat-num { font-size: 36rpx; font-weight: 800; }
.stat-label { font-size: 22rpx; color: #A0AEC0; margin-top: 8rpx; }

.back-bar { display: flex; align-items: center; padding: 24rpx 28rpx; background: #fff; border-bottom: 1rpx solid #EDF2F7; }
.back-arrow { font-size: 40rpx; color: #4A90D9; margin-right: 12rpx; }
.back-text { font-size: 30rpx; font-weight: 700; color: #1A1A2E; }

.tab-bar { display: flex; background: #fff; padding: 0 28rpx; }
.tab-item { flex: 1; text-align: center; padding: 20rpx 0; font-size: 26rpx; color: #A0AEC0; position: relative; }
.tab-item.active { color: #4A90D9; font-weight: 700; }
.tab-line { position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 48rpx; height: 6rpx; background: #4A90D9; border-radius: 3rpx; }

.order-list { padding: 20rpx 28rpx; }
.order-card { background: #fff; border-radius: 20rpx; padding: 24rpx; margin-bottom: 16rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.order-card:active { transform: scale(0.98); }
.card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.order-type { font-size: 28rpx; font-weight: 700; color: #1A1A2E; }
.status-text { font-size: 24rpx; font-weight: 600; }

.card-body { margin-bottom: 16rpx; }
.addr-row { display: flex; align-items: center; margin-bottom: 8rpx; }
.addr-icon { font-size: 24rpx; margin-right: 8rpx; }
.addr-text { font-size: 26rpx; color: #4A5568; flex: 1; }
.order-desc { font-size: 24rpx; color: #A0AEC0; margin-top: 8rpx; display: block; }

.card-bottom { display: flex; justify-content: space-between; align-items: center; }
.card-time { font-size: 22rpx; color: #A0AEC0; }
.price-area { display: flex; align-items: center; }
.card-price { font-size: 30rpx; font-weight: 800; color: #E53E3E; }
.card-tip { font-size: 22rpx; color: #DD6B20; margin-left: 8rpx; }

.empty { display: flex; flex-direction: column; align-items: center; padding: 80rpx 0; }
.empty-emoji { font-size: 80rpx; }
.empty-text { font-size: 28rpx; color: #A0AEC0; margin-top: 20rpx; }

.fab-btn { position: fixed; bottom: 60rpx; right: 40rpx; background: linear-gradient(135deg, #4A90D9, #2B6CB0); color: #fff; padding: 20rpx 36rpx; border-radius: 40rpx; font-size: 28rpx; font-weight: 700; box-shadow: 0 8rpx 24rpx rgba(43,108,176,0.3); z-index: 99; }
.fab-btn:active { transform: scale(0.95); }
</style>
