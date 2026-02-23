<template>
  <view class="wash-page">
    <!-- 顶部 Banner -->
    <view class="top-banner">
      <view class="banner-inner">
        <text class="banner-emoji">🧼</text>
        <view class="banner-text">
          <text class="banner-title">萌马洗鞋 · 团购专区</text>
          <text class="banner-desc">拼团更便宜，人满即成团</text>
        </view>
      </view>
    </view>

    <!-- Tab 切换 -->
    <view class="tab-bar">
      <view class="tab-item" :class="{active: currentTab === 0}" @click="currentTab = 0">
        <text>🛒 团购商品</text>
      </view>
      <view class="tab-item" :class="{active: currentTab === 1}" @click="currentTab = 1; loadMyGroups()">
        <text>📋 我的团购</text>
      </view>
    </view>

    <!-- 商品列表 -->
    <view v-if="currentTab === 0">
      <view class="product-list">
        <view class="product-card" v-for="p in products" :key="p._id">
          <image v-if="p.image" class="product-img" :src="p.image" mode="aspectFill" />
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
      <view class="empty" v-if="products.length === 0 && loaded">
        <text>暂无团购商品</text>
      </view>

      <!-- 进行中的团 -->
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
            <view class="progress-bar">
              <view class="progress-fill" :style="{width: (g.currentCount / g.targetCount * 100) + '%'}"></view>
            </view>
            <text class="progress-text">{{ g.currentCount }}/{{ g.targetCount }}人</text>
          </view>
          <view class="group-members">
            <view class="gm-item" v-for="(m, i) in g.members" :key="i">
              <text class="gm-avatar">🧑</text>
              <text class="gm-name">{{ m.name }}</text>
            </view>
            <view class="gm-item gm-empty" v-for="n in (g.targetCount - g.currentCount)" :key="'e'+n">
              <text class="gm-avatar">❓</text>
            </view>
          </view>
          <view class="group-footer">
            <text class="group-price-label">团购价 <text class="gp">¥{{ g.groupPrice }}</text></text>
            <text class="group-expire">{{ formatExpire(g.expireTime) }}</text>
          </view>
          <view class="btn-join" v-if="g.status === 0 && !hasJoined(g)" @click="joinGroup(g._id)">
            <text>参加拼团</text>
          </view>
          <view class="btn-joined" v-else-if="hasJoined(g)">
            <text>{{ g.status === 1 ? '已成团 ✓' : '已参团' }}</text>
          </view>
          <view class="btn-joined" v-else>
            <text>已成团</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 我的团购 -->
    <view v-if="currentTab === 1">
      <view class="group-card" v-for="g in myGroups" :key="g._id">
        <view class="group-header">
          <text class="group-product-name">{{ g.productName }}</text>
          <view class="group-status-tag" :class="g.status === 1 ? 'success' : g.status === 2 ? 'expired' : ''">
            <text>{{ ['拼团中','已成团','已过期'][g.status] || '拼团中' }}</text>
          </view>
        </view>
        <view class="group-progress">
          <view class="progress-bar">
            <view class="progress-fill" :style="{width: (g.currentCount / g.targetCount * 100) + '%'}"></view>
          </view>
          <text class="progress-text">{{ g.currentCount }}/{{ g.targetCount }}人</text>
        </view>
        <view class="group-members">
          <view class="gm-item" v-for="(m, i) in g.members" :key="i">
            <text class="gm-avatar">🧑</text>
            <text class="gm-name">{{ m.name }}</text>
          </view>
        </view>
        <view class="group-footer">
          <text class="group-price-label">团购价 <text class="gp">¥{{ g.groupPrice }}</text></text>
          <text class="group-expire">{{ g.status === 1 ? '拼团成功' : g.status === 2 ? '已过期' : formatExpire(g.expireTime) }}</text>
        </view>
      </view>
      <view class="empty" v-if="myGroups.length === 0 && myLoaded">
        <text>暂无参与的团购</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { callCloud, checkLogin } from '@/utils/cloud.js'

const currentTab = ref(0)
const products = ref([])
const groups = ref([])
const myGroups = ref([])
const loaded = ref(false)
const myLoaded = ref(false)
const myOpenid = ref('')

const defaultProducts = [
  { _id: 'default_1', name: '运动鞋基础清洗', desc: '适用于日常运动鞋、帆布鞋', originalPrice: 35, groupPrice: 19.9, groupSize: 3, image: '' },
  { _id: 'default_2', name: '运动鞋深度清洗', desc: '深层去污+除臭+护理，焕然一新', originalPrice: 55, groupPrice: 29.9, groupSize: 3, image: '' },
  { _id: 'default_3', name: '皮鞋/靴子养护', desc: '皮面清洁+滋养+抛光护理', originalPrice: 65, groupPrice: 39.9, groupSize: 3, image: '' },
  { _id: 'default_4', name: 'AJ/椰子精洗', desc: '高端球鞋专业清洗，温柔呵护', originalPrice: 79, groupPrice: 49.9, groupSize: 3, image: '' },
  { _id: 'default_5', name: '小白鞋焕新套餐', desc: '去黄增白+防水喷雾，白到发光', originalPrice: 45, groupPrice: 25.9, groupSize: 3, image: '' }
]

const loadData = async () => {
  var userInfo = uni.getStorageSync('userInfo')
  if (userInfo && userInfo.openid) myOpenid.value = userInfo.openid
  if (!myOpenid.value) myOpenid.value = uni.getStorageSync('openid') || ''

  var [pRes, gRes] = await Promise.all([
    callCloud('wash', 'getProducts'),
    callCloud('wash', 'getGroups')
  ])
  if (pRes.code === 0 && pRes.data && pRes.data.length > 0) products.value = pRes.data
  else products.value = defaultProducts
  if (gRes.code === 0) groups.value = gRes.data || []
  loaded.value = true
}

const loadMyGroups = async () => {
  var res = await callCloud('wash', 'myGroups')
  if (res.code === 0) myGroups.value = res.data || []
  myLoaded.value = true
}

const createGroup = async (productId) => {
  if (!checkLogin()) return
  uni.showModal({
    title: '开团',
    content: '确定要发起团购吗？',
    success: async (r) => {
      if (!r.confirm) return
      uni.showLoading({ title: '开团中...' })
      var res = await callCloud('wash', 'createGroup', { productId })
      uni.hideLoading()
      if (res.code === 0) {
        uni.showToast({ title: '开团成功', icon: 'success' })
        loadData()
      } else {
        uni.showToast({ title: res.msg || '开团失败', icon: 'none' })
      }
    }
  })
}

const joinGroup = async (groupId) => {
  if (!checkLogin()) return
  uni.showLoading({ title: '参团中...' })
  var res = await callCloud('wash', 'joinGroup', { groupId })
  uni.hideLoading()
  if (res.code === 0) {
    uni.showToast({ title: res.success ? '拼团成功' : '参团成功', icon: 'success' })
    loadData()
  } else {
    uni.showToast({ title: res.msg || '参团失败', icon: 'none' })
  }
}

const hasJoined = (g) => {
  if (!myOpenid.value) return false
  for (var i = 0; i < g.members.length; i++) {
    if (g.members[i].openid === myOpenid.value) return true
  }
  return false
}

const formatExpire = (t) => {
  if (!t) return ''
  var d = new Date(t)
  var now = Date.now()
  var diff = d.getTime() - now
  if (diff <= 0) return '已过期'
  var hours = Math.floor(diff / 3600000)
  var mins = Math.floor((diff % 3600000) / 60000)
  if (hours > 0) return hours + '小时' + mins + '分钟后截止'
  return mins + '分钟后截止'
}

onShow(() => { loadData() })
</script>

<style scoped>
.wash-page { background: #F0F2F5; min-height: 100vh; padding-bottom: 40rpx; }

.top-banner { background: linear-gradient(135deg, #F6AD55, #DD6B20); padding: 48rpx 32rpx; }
.banner-inner { display: flex; align-items: center; }
.banner-emoji { font-size: 64rpx; margin-right: 24rpx; }
.banner-text { display: flex; flex-direction: column; }
.banner-title { font-size: 36rpx; font-weight: 800; color: #fff; }
.banner-desc { font-size: 24rpx; color: rgba(255,255,255,0.85); margin-top: 6rpx; }

.tab-bar { display: flex; background: #fff; padding: 0 28rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.tab-item { flex: 1; text-align: center; padding: 24rpx 0; border-bottom: 4rpx solid transparent; }
.tab-item.active { border-bottom-color: #DD6B20; }
.tab-item text { font-size: 28rpx; color: #718096; font-weight: 600; }
.tab-item.active text { color: #DD6B20; }

.product-list { padding: 20rpx 28rpx 0; }
.product-card { background: #fff; border-radius: 20rpx; padding: 24rpx; margin-bottom: 20rpx; display: flex; align-items: center; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.product-img { width: 160rpx; height: 160rpx; border-radius: 16rpx; margin-right: 20rpx; flex-shrink: 0; }
.product-img-placeholder { width: 160rpx; height: 160rpx; border-radius: 16rpx; background: #FFF5EB; display: flex; align-items: center; justify-content: center; margin-right: 20rpx; flex-shrink: 0; }
.product-img-placeholder text { font-size: 56rpx; }
.product-info { flex: 1; }
.product-name { font-size: 30rpx; font-weight: 700; color: #1A1A2E; display: block; }
.product-desc { font-size: 24rpx; color: #A0AEC0; margin-top: 6rpx; display: block; }
.price-row { display: flex; align-items: baseline; gap: 12rpx; margin-top: 12rpx; }
.group-price { font-size: 36rpx; font-weight: 800; color: #E53E3E; }
.original-price { font-size: 24rpx; color: #CBD5E0; text-decoration: line-through; }
.group-size-tag { padding: 4rpx 14rpx; background: #FFF5F5; border-radius: 12rpx; }
.group-size-tag text { font-size: 20rpx; color: #E53E3E; font-weight: 600; }
.product-actions { margin-left: 16rpx; }
.btn-create { padding: 16rpx 28rpx; background: linear-gradient(135deg, #F6AD55, #DD6B20); border-radius: 32rpx; }
.btn-create text { color: #fff; font-size: 26rpx; font-weight: 700; }

.section { padding: 24rpx 28rpx 0; }
.section-label { font-size: 30rpx; font-weight: 700; color: #1A1A2E; display: block; margin-bottom: 16rpx; }

.group-card { background: #fff; border-radius: 20rpx; padding: 24rpx; margin: 0 28rpx 20rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.group-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16rpx; }
.group-product-name { font-size: 28rpx; font-weight: 700; color: #1A1A2E; }
.group-status-tag { padding: 6rpx 18rpx; border-radius: 20rpx; background: #FFF5EB; }
.group-status-tag text { font-size: 22rpx; color: #DD6B20; font-weight: 600; }
.group-status-tag.success { background: #F0FFF4; }
.group-status-tag.success text { color: #38A169; }
.group-status-tag.expired { background: #F7FAFC; }
.group-status-tag.expired text { color: #A0AEC0; }

.group-progress { display: flex; align-items: center; gap: 16rpx; margin-bottom: 16rpx; }
.progress-bar { flex: 1; height: 16rpx; background: #EDF2F7; border-radius: 8rpx; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #F6AD55, #DD6B20); border-radius: 8rpx; transition: width 0.3s; }
.progress-text { font-size: 24rpx; color: #718096; font-weight: 600; white-space: nowrap; }

.group-members { display: flex; gap: 16rpx; margin-bottom: 16rpx; flex-wrap: wrap; }
.gm-item { display: flex; align-items: center; background: #F7FAFC; padding: 8rpx 16rpx; border-radius: 24rpx; }
.gm-avatar { font-size: 28rpx; margin-right: 6rpx; }
.gm-name { font-size: 22rpx; color: #4A5568; font-weight: 500; }
.gm-empty { border: 2rpx dashed #CBD5E0; background: transparent; }

.group-footer { display: flex; align-items: center; justify-content: space-between; }
.group-price-label { font-size: 24rpx; color: #718096; }
.gp { font-size: 30rpx; font-weight: 800; color: #E53E3E; }
.group-expire { font-size: 22rpx; color: #A0AEC0; }

.btn-join { padding: 14rpx 32rpx; background: linear-gradient(135deg, #F6AD55, #DD6B20); border-radius: 32rpx; margin-top: 16rpx; text-align: center; }
.btn-join text { color: #fff; font-size: 26rpx; font-weight: 700; }
.btn-joined { padding: 14rpx 32rpx; background: #EDF2F7; border-radius: 32rpx; margin-top: 16rpx; text-align: center; }
.btn-joined text { color: #A0AEC0; font-size: 26rpx; font-weight: 600; }

.empty { padding: 80rpx 0; text-align: center; }
.empty text { font-size: 28rpx; color: #A0AEC0; }
</style>
