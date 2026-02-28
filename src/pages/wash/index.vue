<template>
  <view class="wash-page">
    <view class="top-banner">
      <view class="banner-inner">
        <text class="banner-emoji">🧼</text>
        <view class="banner-text">
          <text class="banner-title">萌马洗护</text>
          <text class="banner-desc">专业洗护，拼团更优惠 · 跑腿上门取仅+3元</text>
        </view>
      </view>
    </view>

    <view class="tab-bar">
      <view class="tab-item" :class="{active: currentTab === 0}" @click="currentTab = 0">
        <text>🛒 普通商品</text>
      </view>
      <view class="tab-item" :class="{active: currentTab === 1}" @click="currentTab = 1">
        <text>🔥 团购专区</text>
      </view>
      <view class="tab-item" :class="{active: currentTab === 2}" @click="currentTab = 2; loadMyGroups(); loadMyOrders()">
        <text>📋 我的订单</text>
      </view>
    </view>

    <!-- 普通商品 -->
    <view v-if="currentTab === 0">
      <view class="product-list">
        <view class="product-card" v-for="p in normalProducts" :key="p._id">
          <view v-if="p.image" class="product-img-wrap"><image class="product-img" :src="p.image" mode="aspectFill" /></view>
          <view v-else class="product-img-placeholder"><text>🧴</text></view>
          <view class="product-info">
            <text class="product-name">{{ p.name }}</text>
            <text class="product-desc">{{ p.desc }}</text>
            <view class="price-row">
              <text class="normal-price">¥{{ p.price }}</text>
            </view>
          </view>
          <view class="product-actions">
            <view class="btn-buy" @click="openOrderModal(p)"><text>下单</text></view>
          </view>
        </view>
      </view>
      <view class="empty" v-if="normalProducts.length === 0 && loaded"><text>暂无商品</text></view>
    </view>

    <!-- 团购专区 -->
    <view v-if="currentTab === 1">
      <view class="product-list">
        <view class="product-card" v-for="p in groupProducts" :key="p._id">
          <view v-if="p.image" class="product-img-wrap"><image class="product-img" :src="p.image" mode="aspectFill" /></view>
          <view v-else class="product-img-placeholder"><text>🧴</text></view>
          <view class="product-info">
            <text class="product-name">{{ p.name }}</text>
            <text class="product-desc">{{ p.desc }}</text>
            <view class="price-row">
              <text class="group-price">¥{{ p.groupPrice }}</text>
              <text class="original-price">¥{{ p.originalPrice }}</text>
              <view class="group-size-tag"><text>{{ p.groupSize }}人团</text></view>
            </view>
          </view>
          <view class="product-actions">
            <view class="btn-create" @click="createGroup(p._id)"><text>开团</text></view>
          </view>
        </view>
      </view>
      <view class="empty" v-if="groupProducts.length === 0 && loaded"><text>暂无团购商品</text></view>
      <view class="section" v-if="groups.length > 0">
        <text class="section-label">🔥 正在拼团</text>
        <view class="group-card" v-for="g in groups" :key="g._id">
          <view class="group-header">
            <text class="group-product-name">{{ g.productName }}</text>
            <view class="group-status-tag" :class="g.status === 1 ? 'success' : ''">
              <text>{{ g.status === 0 ? '拼团中' : '已成团' }}</text>
            </view>
          </view>
          <view class="group-progress">
            <view class="progress-bar"><view class="progress-fill" :style="{width: (g.currentCount / g.targetCount * 100) + '%'}"></view></view>
            <text class="progress-text">{{ g.currentCount }}/{{ g.targetCount }}人</text>
          </view>
          <view class="group-members">
            <view class="gm-item" v-for="(m, i) in g.members" :key="i"><text class="gm-avatar">🧑</text><text class="gm-name">{{ m.name }}</text></view>
            <view class="gm-item gm-empty" v-for="n in (g.targetCount - g.currentCount)" :key="'e'+n"><text class="gm-avatar">❓</text></view>
          </view>
          <view class="group-footer">
            <text class="group-price-label">团购价 <text class="gp">¥{{ g.groupPrice }}</text></text>
            <text class="group-expire">{{ formatExpire(g.expireTime) }}</text>
          </view>
          <view class="btn-join" v-if="g.status === 0 && !hasJoined(g)" @click="joinGroup(g._id)"><text>参加拼团</text></view>
          <view class="btn-joined" v-else><text>{{ hasJoined(g) ? (g.status === 1 ? '已成团 ✓' : '已参团') : '已成团' }}</text></view>
        </view>
      </view>
    </view>

    <!-- 我的订单 -->
    <view v-if="currentTab === 2">
      <view class="sub-tabs">
        <text class="sub-tab" :class="{active: myTab === 0}" @click="myTab = 0">普通订单</text>
        <text class="sub-tab" :class="{active: myTab === 1}" @click="myTab = 1">我的团购</text>
      </view>
      <!-- 普通订单 -->
      <view v-if="myTab === 0">
        <view class="order-card" v-for="o in myOrders" :key="o._id" @click="goOrderDetail(o)">
          <view class="oc-header">
            <text class="oc-name">{{ o.productName }}</text>
            <text class="oc-status" :class="'st' + o.status">{{ o.statusText }}</text>
          </view>
          <view class="oc-body">
            <text class="oc-info">x{{ o.quantity }} · ¥{{ (o.itemPrice || 0).toFixed(2) }}</text>
            <text class="oc-delivery" v-if="o.needDelivery">🏃 跑腿取送 +¥3</text>
          </view>
          <view class="oc-footer">
            <text class="oc-time">{{ fmtDate(o.createTime) }}</text>
            <text class="oc-total">合计 ¥{{ (o.totalPrice || 0).toFixed(2) }}</text>
          </view>
        </view>
        <view class="empty" v-if="myOrders.length === 0 && myOrderLoaded"><text>暂无订单</text></view>
      </view>
      <!-- 我的团购 -->
      <view v-if="myTab === 1">
        <view class="group-card" v-for="g in myGroups" :key="g._id">
          <view class="group-header">
            <text class="group-product-name">{{ g.productName }}</text>
            <view class="group-status-tag" :class="g.status === 1 ? 'success' : g.status === 2 ? 'expired' : ''">
              <text>{{ ['拼团中','已成团','已过期'][g.status] || '拼团中' }}</text>
            </view>
          </view>
          <view class="group-progress">
            <view class="progress-bar"><view class="progress-fill" :style="{width: (g.currentCount / g.targetCount * 100) + '%'}"></view></view>
            <text class="progress-text">{{ g.currentCount }}/{{ g.targetCount }}人</text>
          </view>
          <view class="group-footer">
            <text class="group-price-label">团购价 <text class="gp">¥{{ g.groupPrice }}</text></text>
            <text class="group-expire">{{ g.status === 1 ? '拼团成功' : g.status === 2 ? '已过期' : formatExpire(g.expireTime) }}</text>
          </view>
        </view>
        <view class="empty" v-if="myGroups.length === 0 && myLoaded"><text>暂无参与的团购</text></view>
      </view>
    </view>

    <!-- 下单弹窗 -->
    <view class="modal-mask" v-if="showModal" @click="showModal = false">
      <view class="modal-box" @click.stop>
        <text class="modal-title">{{ modalProduct.name }}</text>
        <view class="modal-row">
          <text class="modal-label">单价</text>
          <text class="modal-value">¥{{ modalProduct.price }}</text>
        </view>
        <view class="modal-row">
          <text class="modal-label">数量</text>
          <view class="qty-ctrl">
            <view class="qty-btn" @click="orderQty > 1 && orderQty--"><text>-</text></view>
            <text class="qty-num">{{ orderQty }}</text>
            <view class="qty-btn" @click="orderQty++"><text>+</text></view>
          </view>
        </view>
        <view class="modal-row">
          <text class="modal-label">联系电话</text>
          <input class="modal-input" v-model="orderPhone" placeholder="手机号" type="number" />
        </view>
        <view class="modal-row">
          <text class="modal-label">备注</text>
          <input class="modal-input" v-model="orderRemark" placeholder="颜色/特殊要求（可选）" />
        </view>
        <view class="delivery-option" @click="orderDelivery = !orderDelivery">
          <view class="delivery-check" :class="{checked: orderDelivery}"><text v-if="orderDelivery">✓</text></view>
          <view class="delivery-text">
            <text class="dt-main">🏃 跑腿上门取 +¥3</text>
            <text class="dt-sub">骑手到宿舍取件送至洗护店</text>
          </view>
        </view>
        <view class="modal-row" v-if="orderDelivery">
          <text class="modal-label">宿舍地址</text>
          <input class="modal-input" v-model="orderAddress" placeholder="如：3号楼 502" />
        </view>
        <view class="modal-total">
          <text>合计：</text>
          <text class="mt-price">¥{{ ((modalProduct.price || 0) * orderQty + (orderDelivery ? 3 : 0)).toFixed(2) }}</text>
        </view>
        <view class="modal-btn" @click="submitOrder"><text>{{ submitting ? '提交中...' : '确认下单' }}</text></view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { callCloud, checkLogin } from '@/utils/cloud'

var currentTab = ref(0)
var myTab = ref(0)
var loaded = ref(false)
var myLoaded = ref(false)
var myOrderLoaded = ref(false)
var showModal = ref(false)
var submitting = ref(false)
var myOpenid = ''

var normalProducts = ref([])
var groupProducts = ref([])
var groups = ref([])
var myGroups = ref([])
var myOrders = ref([])

var modalProduct = ref({})
var orderQty = ref(1)
var orderPhone = ref('')
var orderAddress = ref('')
var orderRemark = ref('')
var orderDelivery = ref(false)

var defaultNormals = [
  { _id: 'normal_1', name: '运动鞋基础清洗', price: 35, desc: '适用于日常运动鞋、帆布鞋' },
  { _id: 'normal_2', name: '运动鞋深度清洗', price: 55, desc: '深层去污+除臭+护理' },
  { _id: 'normal_3', name: '皮鞋/靴子养护', price: 65, desc: '皮面清洁+滋养+抛光护理' },
  { _id: 'normal_4', name: 'AJ/椰子精洗', price: 79, desc: '高端球鞋专业清洗' },
  { _id: 'normal_5', name: '小白鞋焕新套餐', price: 45, desc: '去黄增白+防水喷雾' },
  { _id: 'normal_6', name: '衣物干洗（件）', price: 25, desc: '羽绒服/大衣/西装等' },
  { _id: 'normal_7', name: '书包清洗', price: 30, desc: '书包/双肩包深度清洗' }
]
var defaultGroups = [
  { _id: 'default_1', name: '运动鞋基础清洗', originalPrice: 35, groupPrice: 19.9, groupSize: 3, desc: '3人团享超低价' },
  { _id: 'default_2', name: '运动鞋深度清洗', originalPrice: 55, groupPrice: 29.9, groupSize: 3, desc: '深层去污+除臭+护理' },
  { _id: 'default_3', name: '皮鞋/靴子养护', originalPrice: 65, groupPrice: 39.9, groupSize: 3, desc: '皮面清洁+滋养+抛光' },
  { _id: 'default_4', name: 'AJ/椰子精洗', originalPrice: 79, groupPrice: 49.9, groupSize: 3, desc: '高端球鞋专业清洗' },
  { _id: 'default_5', name: '小白鞋焕新套餐', originalPrice: 45, groupPrice: 25.9, groupSize: 3, desc: '去黄增白+防水喷雾' }
]

var loadData = async function() {
  loaded.value = false
  try {
    var r1 = await callCloud('wash', 'getProducts', { type: 'normal' })
    normalProducts.value = (r1.code === 0 && r1.data && r1.data.length) ? r1.data : defaultNormals
  } catch (e) { normalProducts.value = defaultNormals }
  try {
    var r2 = await callCloud('wash', 'getProducts', { type: 'group' })
    groupProducts.value = (r2.code === 0 && r2.data && r2.data.length) ? r2.data : defaultGroups
  } catch (e) { groupProducts.value = defaultGroups }
  try {
    var r3 = await callCloud('wash', 'getGroups')
    groups.value = (r3.code === 0) ? (r3.data || []) : []
  } catch (e) { groups.value = [] }
  loaded.value = true
}

var loadMyGroups = async function() {
  myLoaded.value = false
  try {
    var r = await callCloud('wash', 'myGroups')
    myGroups.value = (r.code === 0) ? (r.data || []) : []
  } catch (e) { myGroups.value = [] }
  myLoaded.value = true
}

var loadMyOrders = async function() {
  myOrderLoaded.value = false
  try {
    var r = await callCloud('wash', 'myOrders')
    myOrders.value = (r.code === 0) ? (r.data || []) : []
  } catch (e) { myOrders.value = [] }
  myOrderLoaded.value = true
}

var createGroup = async function(productId) {
  var ok = await checkLogin()
  if (!ok) return
  uni.showLoading({ title: '开团中' })
  var r = await callCloud('wash', 'createGroup', { productId: productId })
  uni.hideLoading()
  if (r.code === 0) {
    uni.showToast({ title: '开团成功', icon: 'success' })
    loadData()
  } else {
    uni.showToast({ title: r.msg || '开团失败', icon: 'none' })
  }
}

var joinGroup = async function(groupId) {
  var ok = await checkLogin()
  if (!ok) return
  uni.showLoading({ title: '参团中' })
  var r = await callCloud('wash', 'joinGroup', { groupId: groupId })
  uni.hideLoading()
  if (r.code === 0) {
    uni.showToast({ title: r.success ? '拼团成功' : '参团成功', icon: 'success' })
    loadData()
  } else {
    uni.showToast({ title: r.msg || '参团失败', icon: 'none' })
  }
}

var hasJoined = function(g) {
  if (!myOpenid) return false
  for (var i = 0; i < g.members.length; i++) {
    if (g.members[i].openid === myOpenid) return true
  }
  return false
}

var formatExpire = function(t) {
  if (!t) return ''
  var now = Date.now()
  var exp = new Date(t).getTime()
  var diff = exp - now
  if (diff <= 0) return '已过期'
  var h = Math.floor(diff / 3600000)
  var m = Math.floor((diff % 3600000) / 60000)
  return h + '时' + m + '分后过期'
}

var openOrderModal = function(p) {
  modalProduct.value = p
  orderQty.value = 1
  orderRemark.value = ''
  orderDelivery.value = false
  orderAddress.value = ''
  var userInfo = uni.getStorageSync('userInfo')
  if (userInfo && userInfo.phone) orderPhone.value = userInfo.phone
  showModal.value = true
}

var submitOrder = async function() {
  if (submitting.value) return
  var ok = await checkLogin()
  if (!ok) return
  if (!orderPhone.value) { uni.showToast({ title: '请填写联系电话', icon: 'none' }); return }
  if (orderDelivery.value && !orderAddress.value.trim()) { uni.showToast({ title: '请填写宿舍地址', icon: 'none' }); return }
  submitting.value = true
  uni.showLoading({ title: '提交中' })
  var userInfo = uni.getStorageSync('userInfo')
  var r = await callCloud('wash', 'createOrder', {
    productId: modalProduct.value._id,
    quantity: orderQty.value,
    phone: orderPhone.value,
    userName: (userInfo && userInfo.name) || '',
    address: orderAddress.value,
    remark: orderRemark.value,
    needDelivery: orderDelivery.value
  })
  uni.hideLoading()
  submitting.value = false
  if (r.code === 0) {
    uni.showToast({ title: '下单成功', icon: 'success' })
    showModal.value = false
    currentTab.value = 2
    myTab.value = 0
    loadMyOrders()
  } else {
    uni.showToast({ title: r.msg || '下单失败', icon: 'none' })
  }
}

var goOrderDetail = function(o) {
  // 暂时用弹窗显示详情
  var statusMap = { 0: '待处理', 1: '处理中', 2: '已完成', 3: '已取消' }
  var info = '商品: ' + o.productName + '\n数量: ' + o.quantity
  info += '\n金额: ¥' + (o.totalPrice || 0).toFixed(2)
  if (o.needDelivery) info += '\n跑腿取送: 是 (+¥3)\n地址: ' + (o.address || '')
  info += '\n状态: ' + (statusMap[o.status] || o.statusText || '待处理')
  if (o.remark) info += '\n备注: ' + o.remark
  uni.showModal({ title: '订单详情', content: info, showCancel: o.status === 0, cancelText: '取消订单',
    success: async function(res) {
      if (!res.confirm && o.status === 0) {
        uni.showLoading({ title: '取消中' })
        var r = await callCloud('wash', 'cancelOrder', { orderId: o._id })
        uni.hideLoading()
        if (r.code === 0) { uni.showToast({ title: '已取消', icon: 'success' }); loadMyOrders() }
        else uni.showToast({ title: r.msg || '取消失败', icon: 'none' })
      }
    }
  })
}

var fmtDate = function(t) {
  if (!t) return ''
  var d = new Date(t)
  return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
}

onShow(function() {
  loadData()
  try {
    var info = uni.getStorageSync('userInfo')
    if (info && info.openid) myOpenid = info.openid
  } catch (e) {}
})
</script>

<style scoped>
.wash-page { background: #F0F2F5; min-height: 100vh; padding-bottom: 40rpx; }
.top-banner { padding: 24rpx 28rpx 0; }
.banner-inner { background: linear-gradient(135deg, #4FD1C5, #319795); border-radius: 20rpx; padding: 32rpx; display: flex; align-items: center; box-shadow: 0 4rpx 16rpx rgba(49,151,149,0.2); }
.banner-emoji { font-size: 56rpx; margin-right: 20rpx; }
.banner-text { flex: 1; }
.banner-title { font-size: 36rpx; font-weight: 800; color: #fff; display: block; }
.banner-desc { font-size: 22rpx; color: rgba(255,255,255,0.85); margin-top: 6rpx; display: block; }

.tab-bar { display: flex; margin: 20rpx 28rpx 0; background: #fff; border-radius: 16rpx; overflow: hidden; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.tab-item { flex: 1; text-align: center; padding: 22rpx 0; font-size: 26rpx; color: #718096; position: relative; }
.tab-item.active { color: #319795; font-weight: 700; }
.tab-item.active::after { content: ''; position: absolute; bottom: 0; left: 25%; right: 25%; height: 4rpx; background: #319795; border-radius: 2rpx; }

.product-list { padding: 20rpx 28rpx; }
.product-card { background: #fff; border-radius: 18rpx; padding: 24rpx; margin-bottom: 16rpx; display: flex; align-items: center; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.product-img-wrap { width: 120rpx; height: 120rpx; border-radius: 14rpx; overflow: hidden; margin-right: 20rpx; flex-shrink: 0; }
.product-img { width: 120rpx; height: 120rpx; }
.product-img-placeholder { width: 120rpx; height: 120rpx; border-radius: 14rpx; background: #F0FFF4; display: flex; align-items: center; justify-content: center; margin-right: 20rpx; flex-shrink: 0; font-size: 48rpx; }
.product-info { flex: 1; min-width: 0; }
.product-name { font-size: 28rpx; font-weight: 700; color: #2D3748; display: block; }
.product-desc { font-size: 22rpx; color: #A0AEC0; margin-top: 6rpx; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.price-row { display: flex; align-items: center; margin-top: 10rpx; gap: 10rpx; }
.normal-price { font-size: 32rpx; font-weight: 800; color: #E53E3E; }
.group-price { font-size: 32rpx; font-weight: 800; color: #E53E3E; }
.original-price { font-size: 22rpx; color: #A0AEC0; text-decoration: line-through; }
.group-size-tag { background: #FFF5F5; padding: 2rpx 12rpx; border-radius: 8rpx; }
.group-size-tag text { font-size: 20rpx; color: #E53E3E; }
.product-actions { margin-left: 16rpx; flex-shrink: 0; }
.btn-buy { background: linear-gradient(135deg, #4FD1C5, #319795); padding: 14rpx 28rpx; border-radius: 28rpx; }
.btn-buy text { font-size: 24rpx; color: #fff; font-weight: 700; }
.btn-create { background: linear-gradient(135deg, #FC8181, #E53E3E); padding: 14rpx 28rpx; border-radius: 28rpx; }
.btn-create text { font-size: 24rpx; color: #fff; font-weight: 700; }

.section { padding: 20rpx 28rpx; }
.section-label { font-size: 28rpx; font-weight: 700; color: #2D3748; margin-bottom: 16rpx; display: block; }
.group-card { background: #fff; border-radius: 18rpx; padding: 24rpx; margin-bottom: 16rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.group-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.group-product-name { font-size: 28rpx; font-weight: 700; color: #2D3748; }
.group-status-tag { background: #FFFAF0; padding: 4rpx 16rpx; border-radius: 10rpx; }
.group-status-tag text { font-size: 22rpx; color: #DD6B20; }
.group-status-tag.success { background: #F0FFF4; }
.group-status-tag.success text { color: #38A169; }
.group-status-tag.expired { background: #FFF5F5; }
.group-status-tag.expired text { color: #E53E3E; }
.group-progress { margin-bottom: 16rpx; display: flex; align-items: center; gap: 16rpx; }
.progress-bar { flex: 1; height: 12rpx; background: #EDF2F7; border-radius: 6rpx; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #4FD1C5, #38A169); border-radius: 6rpx; transition: width 0.3s; }
.progress-text { font-size: 24rpx; color: #4A5568; font-weight: 600; flex-shrink: 0; }
.group-members { display: flex; gap: 12rpx; margin-bottom: 16rpx; flex-wrap: wrap; }
.gm-item { display: flex; flex-direction: column; align-items: center; }
.gm-avatar { font-size: 36rpx; }
.gm-name { font-size: 20rpx; color: #718096; margin-top: 4rpx; }
.gm-empty .gm-avatar { opacity: 0.4; }
.group-footer { display: flex; justify-content: space-between; align-items: center; }
.group-price-label { font-size: 24rpx; color: #718096; }
.gp { font-size: 30rpx; font-weight: 800; color: #E53E3E; }
.group-expire { font-size: 22rpx; color: #A0AEC0; }
.btn-join { background: linear-gradient(135deg, #FC8181, #E53E3E); text-align: center; padding: 16rpx; border-radius: 28rpx; margin-top: 16rpx; }
.btn-join text { font-size: 26rpx; color: #fff; font-weight: 700; }
.btn-joined { background: #EDF2F7; text-align: center; padding: 16rpx; border-radius: 28rpx; margin-top: 16rpx; }
.btn-joined text { font-size: 26rpx; color: #A0AEC0; font-weight: 600; }

.sub-tabs { display: flex; gap: 24rpx; padding: 16rpx 28rpx; }
.sub-tab { font-size: 26rpx; color: #A0AEC0; padding-bottom: 8rpx; }
.sub-tab.active { color: #319795; font-weight: 700; border-bottom: 4rpx solid #319795; }

.order-card { background: #fff; border-radius: 18rpx; padding: 24rpx; margin: 0 28rpx 16rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.oc-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12rpx; }
.oc-name { font-size: 28rpx; font-weight: 700; color: #2D3748; }
.oc-status { font-size: 24rpx; font-weight: 700; }
.oc-status.st0 { color: #DD6B20; }
.oc-status.st1 { color: #2B6CB0; }
.oc-status.st2 { color: #38A169; }
.oc-status.st3 { color: #A0AEC0; }
.oc-body { margin-bottom: 12rpx; }
.oc-info { font-size: 24rpx; color: #4A5568; }
.oc-delivery { font-size: 22rpx; color: #319795; margin-top: 6rpx; display: block; }
.oc-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 12rpx; border-top: 1rpx solid #F7FAFC; }
.oc-time { font-size: 22rpx; color: #A0AEC0; }
.oc-total { font-size: 28rpx; font-weight: 800; color: #E53E3E; }

.modal-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: flex-end; justify-content: center; z-index: 999; }
.modal-box { background: #fff; border-radius: 28rpx 28rpx 0 0; padding: 36rpx 32rpx; width: 100%; max-height: 80vh; }
.modal-title { font-size: 32rpx; font-weight: 800; color: #2D3748; display: block; margin-bottom: 24rpx; text-align: center; }
.modal-row { display: flex; align-items: center; margin-bottom: 20rpx; }
.modal-label { font-size: 26rpx; color: #718096; width: 140rpx; flex-shrink: 0; }
.modal-value { font-size: 28rpx; color: #E53E3E; font-weight: 700; }
.modal-input { flex: 1; background: #F7FAFC; border-radius: 12rpx; padding: 0 20rpx; font-size: 26rpx; color: #2D3748; height: 72rpx; line-height: 72rpx; }
.qty-ctrl { display: flex; align-items: center; gap: 20rpx; }
.qty-btn { width: 56rpx; height: 56rpx; border-radius: 50%; background: #F7FAFC; display: flex; align-items: center; justify-content: center; }
.qty-btn text { font-size: 32rpx; color: #4A5568; font-weight: 700; }
.qty-num { font-size: 30rpx; font-weight: 700; color: #2D3748; min-width: 40rpx; text-align: center; }

.delivery-option { display: flex; align-items: center; padding: 20rpx; background: #F0FFF4; border-radius: 14rpx; margin-bottom: 20rpx; }
.delivery-check { width: 44rpx; height: 44rpx; border-radius: 50%; border: 3rpx solid #CBD5E0; display: flex; align-items: center; justify-content: center; margin-right: 16rpx; flex-shrink: 0; }
.delivery-check.checked { background: #319795; border-color: #319795; }
.delivery-check text { font-size: 24rpx; color: #fff; font-weight: 700; }
.delivery-text { flex: 1; }
.dt-main { font-size: 26rpx; color: #2D3748; font-weight: 700; display: block; }
.dt-sub { font-size: 22rpx; color: #A0AEC0; margin-top: 4rpx; display: block; }

.modal-total { display: flex; align-items: center; justify-content: center; margin: 20rpx 0; }
.modal-total text { font-size: 28rpx; color: #718096; }
.mt-price { font-size: 36rpx; font-weight: 800; color: #E53E3E; margin-left: 8rpx; }
.modal-btn { background: linear-gradient(135deg, #4FD1C5, #319795); text-align: center; padding: 22rpx; border-radius: 28rpx; box-shadow: 0 4rpx 12rpx rgba(49,151,149,0.3); }
.modal-btn text { font-size: 30rpx; color: #fff; font-weight: 700; }

.empty { padding: 80rpx 0; text-align: center; }
.empty text { font-size: 28rpx; color: #A0AEC0; }
</style>
