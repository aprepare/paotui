<template>
  <view class="market-page">
    <view class="search-bar">
      <view class="search-input">
        <text class="search-icon">🔍</text>
        <input placeholder="搜索你想要的宝贝" v-model="keyword" />
      </view>
    </view>
    <view class="category-bar">
      <view v-for="(cat, i) in categories" :key="i" class="cat-item" :class="{active: currentCat === i}" @click="currentCat = i">
        <text>{{ cat }}</text>
      </view>
    </view>
    <view class="goods-grid">
      <view class="goods-column">
        <view v-for="item in leftList" :key="item.id" class="goods-card" @click="goDetail(item.id)">
          <view class="goods-img" :style="{height: item.imgH + 'rpx', background: item.color}">
            <text class="img-emoji">{{ item.emoji }}</text>
          </view>
          <view class="goods-info">
            <text class="goods-title">{{ item.title }}</text>
            <view class="goods-bottom">
              <text class="goods-price">¥{{ item.price }}</text>
              <text class="goods-views">{{ item.views }}人想要</text>
            </view>
          </view>
        </view>
      </view>
      <view class="goods-column">
        <view v-for="item in rightList" :key="item.id" class="goods-card" @click="goDetail(item.id)">
          <view class="goods-img" :style="{height: item.imgH + 'rpx', background: item.color}">
            <text class="img-emoji">{{ item.emoji }}</text>
          </view>
          <view class="goods-info">
            <text class="goods-title">{{ item.title }}</text>
            <view class="goods-bottom">
              <text class="goods-price">¥{{ item.price }}</text>
              <text class="goods-views">{{ item.views }}人想要</text>
            </view>
          </view>
        </view>
      </view>
    </view>
    <view class="fab-btn" @click="goCreate">
      <text>+</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { callCloud } from '@/utils/cloud'

const keyword = ref('')
const currentCat = ref(0)
const categories = ref(['全部', '数码', '书籍', '服饰', '生活', '其他'])
const colorPool = ['#E3F2FD', '#FFF3E0', '#F3E5F5', '#E8F5E9', '#FFEBEE', '#E0F7FA', '#FFF8E1', '#F1F8E9']
const heightPool = [220, 240, 260, 280, 300]

const goodsList = ref([])

const loadData = async () => {
  const cat = categories.value[currentCat.value]
  const res = await callCloud('market', 'list', { category: cat, keyword: keyword.value })
  if (res.code === 0) {
    goodsList.value = res.data.map((g, i) => ({
      id: g._id,
      title: g.title || '',
      price: g.price || 0,
      emoji: '🛒',
      color: colorPool[i % colorPool.length],
      imgH: heightPool[i % heightPool.length],
      views: g.wants || 0
    }))
  }
}

onShow(() => { loadData() })
watch(currentCat, () => { loadData() })

const leftList = computed(() => goodsList.value.filter((_, i) => i % 2 === 0))
const rightList = computed(() => goodsList.value.filter((_, i) => i % 2 === 1))

const goDetail = (id) => {
  uni.navigateTo({ url: '/pages/market/detail?id=' + id })
}
const goCreate = () => {
  uni.navigateTo({ url: '/pages/market/create' })
}
</script>

<style scoped>
.market-page { background: #F5F7FA; min-height: 100vh; padding-bottom: 120rpx; }
.search-bar { padding: 20rpx 24rpx; }
.search-input { display: flex; align-items: center; background: #fff; border-radius: 40rpx; padding: 16rpx 24rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06); }
.search-icon { margin-right: 12rpx; font-size: 28rpx; }
.search-input input { flex: 1; font-size: 28rpx; }
.category-bar { display: flex; padding: 0 24rpx 20rpx; gap: 16rpx; overflow-x: auto; }
.cat-item { padding: 10rpx 28rpx; background: #fff; border-radius: 30rpx; font-size: 26rpx; color: #666; white-space: nowrap; }
.cat-item.active { background: #4A90D9; color: #fff; }
.goods-grid { display: flex; padding: 0 24rpx; gap: 16rpx; }
.goods-column { flex: 1; display: flex; flex-direction: column; gap: 16rpx; }
.goods-card { background: #fff; border-radius: 16rpx; overflow: hidden; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08); }
.goods-img { display: flex; align-items: center; justify-content: center; }
.img-emoji { font-size: 80rpx; }
.goods-info { padding: 16rpx; }
.goods-title { font-size: 26rpx; color: #333; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.4; }
.goods-bottom { display: flex; justify-content: space-between; align-items: center; margin-top: 12rpx; }
.goods-price { font-size: 32rpx; color: #FF6B6B; font-weight: bold; }
.goods-views { font-size: 22rpx; color: #999; }
.fab-btn { position: fixed; right: 40rpx; bottom: 200rpx; width: 100rpx; height: 100rpx; background: linear-gradient(135deg, #4A90D9, #357ABD); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 8rpx 24rpx rgba(74,144,217,0.4); }
.fab-btn text { color: #fff; font-size: 48rpx; }
</style>
