<template>
  <view class="my-goods-page">
    <view v-if="loading" class="loading-wrap">
      <text>加载中...</text>
    </view>
    <view v-else-if="list.length === 0" class="empty-wrap">
      <text class="empty-emoji">📦</text>
      <text class="empty-text">还没有发布过商品</text>
      <view class="go-publish" @click="goPublish">
        <text>去发布</text>
      </view>
    </view>
    <view v-else class="goods-list">
      <view class="goods-item" v-for="item in list" :key="item._id" @click="goDetail(item._id)">
        <image v-if="isValidImage(item.images && item.images[0])" :src="item.images[0]" class="goods-img" mode="aspectFill" />
        <view v-else class="goods-img-placeholder"><text>🖼</text></view>
        <view class="goods-info">
          <text class="goods-title">{{ item.title }}</text>
          <text class="goods-price">¥{{ item.price }}</text>
          <view class="goods-meta">
            <text>{{ item.category || '其他' }}</text>
            <text>浏览 {{ item.views || 0 }}</text>
          </view>
        </view>
        <view class="del-btn" @click.stop="deleteGoods(item._id)">
          <text>删除</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { callCloud } from '@/utils/cloud.js'

const list = ref([])
const loading = ref(true)

const loadData = async () => {
  loading.value = true
  const res = await callCloud('market', 'myGoods')
  if (res.code === 0) {
    list.value = res.data || []
  }
  loading.value = false
}

const isValidImage = (src) => {
  if (!src || typeof src !== 'string') return false
  return src.indexOf('cloud://') === 0 || src.indexOf('https://') === 0
}

const goDetail = (id) => {
  uni.navigateTo({ url: '/pages/market/detail?id=' + id })
}

const goPublish = () => {
  uni.navigateTo({ url: '/pages/market/create' })
}

const deleteGoods = (id) => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这个商品吗？',
    success: async (res) => {
      if (res.confirm) {
        const r = await callCloud('market', 'delete', { goodsId: id })
        if (r.code === 0) {
          uni.showToast({ title: '已删除', icon: 'success' })
          list.value = list.value.filter(g => g._id !== id)
        }
      }
    }
  })
}

onShow(() => { loadData() })
</script>

<style scoped>
.my-goods-page { background: #F0F2F5; min-height: 100vh; padding: 24rpx; }

.loading-wrap { display: flex; justify-content: center; padding: 120rpx 0; }
.loading-wrap text { font-size: 28rpx; color: #A0AEC0; }

.empty-wrap { display: flex; flex-direction: column; align-items: center; padding: 160rpx 0; }
.empty-emoji { font-size: 80rpx; margin-bottom: 20rpx; }
.empty-text { font-size: 28rpx; color: #A0AEC0; margin-bottom: 32rpx; }
.go-publish { padding: 16rpx 48rpx; background: linear-gradient(135deg, #4A90D9, #2B6CB0); border-radius: 32rpx; }
.go-publish text { color: #fff; font-size: 28rpx; font-weight: 600; }

.goods-list { display: flex; flex-direction: column; gap: 20rpx; }
.goods-item { display: flex; align-items: center; background: #fff; border-radius: 16rpx; padding: 20rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.goods-img { width: 160rpx; height: 160rpx; border-radius: 12rpx; flex-shrink: 0; }
.goods-img-placeholder { width: 160rpx; height: 160rpx; border-radius: 12rpx; background: #F7FAFC; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.goods-img-placeholder text { font-size: 48rpx; }
.goods-info { flex: 1; margin-left: 20rpx; display: flex; flex-direction: column; }
.goods-title { font-size: 28rpx; color: #2D3748; font-weight: 600; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.goods-price { font-size: 32rpx; color: #E53E3E; font-weight: 700; margin-top: 8rpx; }
.goods-meta { display: flex; gap: 16rpx; margin-top: 8rpx; }
.goods-meta text { font-size: 22rpx; color: #A0AEC0; }
.del-btn { padding: 12rpx 24rpx; border: 1rpx solid #FEB2B2; border-radius: 12rpx; background: #FFF5F5; flex-shrink: 0; margin-left: 12rpx; }
.del-btn text { font-size: 24rpx; color: #E53E3E; }
</style>
