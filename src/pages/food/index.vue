<template>
  <view class="food-page">
    <!-- 顶部 -->
    <view class="header">
      <view class="header-top">
        <text class="header-title">🍔 福利外卖</text>
        <text class="header-sub">校园美食 优惠送达</text>
      </view>
    </view>

    <!-- 分类筛选 -->
    <view class="cat-bar">
      <scroll-view :scroll-x="true" class="cat-scroll">
        <text class="cat-tag" :class="{active: currentCat === c}" v-for="c in categories" :key="c" @click="currentCat = c; loadShops()">{{ c }}</text>
      </scroll-view>
    </view>

    <!-- 商家列表 -->
    <view class="shop-list">
      <view class="shop-card" v-for="s in shops" :key="s._id" @click="goMenu(s)">
        <image class="shop-logo" :src="s.logo || '/static/welfare/waimai.png'" mode="aspectFill" />
        <view class="shop-info">
          <view class="shop-name-row">
            <text class="shop-name">{{ s.name }}</text>
            <text class="shop-tag" v-if="s.tag">{{ s.tag }}</text>
          </view>
          <view class="shop-meta">
            <text class="meta-item">🕐 {{ s.openTime || '08:00' }}-{{ s.closeTime || '22:00' }}</text>
            <text class="meta-item">📍 {{ s.address || '校内' }}</text>
          </view>
          <view class="shop-bottom">
            <text class="delivery-fee">配送费 ¥{{ (s.deliveryFee || 0).toFixed(1) }}</text>
            <text class="min-order" v-if="s.minOrder">¥{{ s.minOrder }}起送</text>
          </view>
        </view>
      </view>

      <view class="empty" v-if="loaded && !shops.length">
        <text class="empty-icon">🏪</text>
        <text class="empty-text">暂无商家入驻</text>
        <text class="empty-sub">敬请期待</text>
      </view>
    </view>

    <!-- 我的订单入口 -->
    <view class="my-orders-fab" @click="goMyOrders">
      <text class="fab-icon">📋</text>
      <text class="fab-text">我的订单</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { callCloud, checkLogin } from '@/utils/cloud.js'

const categories = ['全部', '快餐', '饮品', '小吃', '面食', '其他']
const currentCat = ref('全部')
const shops = ref([])
const loaded = ref(false)

const loadShops = async () => {
  const params = {}
  if (currentCat.value !== '全部') params.category = currentCat.value
  const res = await callCloud('food', 'listShops', params)
  if (res.code === 0) shops.value = res.data || []
  loaded.value = true
}

const goMenu = (shop) => {
  uni.navigateTo({ url: '/pages/food/menu?shopId=' + shop._id + '&shopName=' + encodeURIComponent(shop.name) })
}

const goMyOrders = () => {
  if (!checkLogin()) return
  uni.navigateTo({ url: '/pages/food/orders' })
}

onShow(() => { loadShops() })
</script>

<style scoped>
.food-page { background: #F0F2F5; min-height: 100vh; padding-bottom: 40rpx; }
.header { background: linear-gradient(135deg, #ED8936 0%, #DD6B20 50%, #C05621 100%); padding: 48rpx 32rpx 32rpx; }
.header-top { display: flex; flex-direction: column; }
.header-title { font-size: 40rpx; font-weight: 800; color: #fff; }
.header-sub { font-size: 24rpx; color: rgba(255,255,255,0.8); margin-top: 8rpx; }

.cat-bar { background: #fff; padding: 16rpx 0; }
.cat-scroll { white-space: nowrap; padding: 0 24rpx; }
.cat-tag { display: inline-block; padding: 10rpx 28rpx; margin-right: 16rpx; border-radius: 28rpx; font-size: 26rpx; color: #718096; background: #F7FAFC; border: 2rpx solid #E2E8F0; }
.cat-tag.active { background: #FFFAF0; color: #DD6B20; border-color: #DD6B20; font-weight: 600; }

.shop-list { padding: 20rpx 24rpx; }
.shop-card { display: flex; background: #fff; border-radius: 20rpx; padding: 24rpx; margin-bottom: 20rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.05); }
.shop-card:active { opacity: 0.85; }
.shop-logo { width: 140rpx; height: 140rpx; border-radius: 16rpx; flex-shrink: 0; background: #F7FAFC; }
.shop-info { flex: 1; margin-left: 20rpx; display: flex; flex-direction: column; justify-content: space-between; }
.shop-name-row { display: flex; align-items: center; gap: 10rpx; }
.shop-name { font-size: 30rpx; font-weight: 700; color: #1A1A2E; }
.shop-tag { font-size: 20rpx; padding: 2rpx 12rpx; border-radius: 6rpx; background: #FFF5F5; color: #E53E3E; }
.shop-meta { display: flex; gap: 20rpx; margin-top: 8rpx; }
.meta-item { font-size: 22rpx; color: #A0AEC0; }
.shop-bottom { display: flex; gap: 16rpx; margin-top: 8rpx; }
.delivery-fee { font-size: 22rpx; color: #DD6B20; font-weight: 600; }
.min-order { font-size: 22rpx; color: #A0AEC0; }

.empty { text-align: center; padding: 120rpx 0; }
.empty-icon { font-size: 80rpx; display: block; }
.empty-text { font-size: 30rpx; color: #4A5568; display: block; margin-top: 16rpx; }
.empty-sub { font-size: 24rpx; color: #A0AEC0; display: block; margin-top: 8rpx; }

.my-orders-fab { position: fixed; right: 24rpx; bottom: 120rpx; background: linear-gradient(135deg, #ED8936, #DD6B20); padding: 16rpx 28rpx; border-radius: 40rpx; display: flex; align-items: center; gap: 8rpx; box-shadow: 0 4rpx 16rpx rgba(221,107,32,0.4); z-index: 99; }
.fab-icon { font-size: 28rpx; }
.fab-text { font-size: 24rpx; color: #fff; font-weight: 600; }
</style>
