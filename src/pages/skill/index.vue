<template>
  <view class="skill-page">
    <view class="search-bar">
      <view class="search-input">
        <text class="search-icon">🔍</text>
        <input placeholder="搜索技能服务" v-model="keyword" @confirm="loadData"></input>
      </view>
    </view>
    <view class="category-bar">
      <view v-for="(cat, i) in categories" :key="i" class="cat-item" :class="{active: currentCat === i}" @click="currentCat = i">
        <text>{{ cat }}</text>
      </view>
    </view>
    <view class="skill-list">
      <view v-for="item in skillList" :key="item.id" class="skill-card" @click="goDetail(item.id)">
        <view class="card-top">
          <view class="card-avatar" :style="{background: item.color}">
            <text class="avatar-emoji">{{ item.emoji }}</text>
          </view>
          <view class="card-info">
            <text class="card-title">{{ item.title }}</text>
            <text class="card-publisher">{{ item.publisher }}</text>
          </view>
          <view class="card-price">
            <text class="price-num">¥{{ item.price }}</text>
            <text class="price-unit">/{{ item.priceUnit }}</text>
          </view>
        </view>
        <text class="card-desc">{{ item.desc }}</text>
        <view class="card-bottom">
          <view class="card-tags">
            <text class="tag">{{ item.category }}</text>
          </view>
          <text class="card-views">{{ item.views }}人浏览</text>
        </view>
      </view>
      <view v-if="skillList.length === 0" class="empty">
        <text class="empty-emoji">🎯</text>
        <text class="empty-text">暂无技能服务，快来发布吧</text>
      </view>
    </view>
    <view class="fab-btn" @click="goCreate">
      <text>+</text>
    </view>
    <MsgNotify />
  </view>
</template>

<script setup>
import { ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { callCloud } from '@/utils/cloud'
import MsgNotify from '@/components/MsgNotify.vue'

const keyword = ref('')
const currentCat = ref(0)
const categories = ref(['全部', 'PS/设计', '视频剪辑', '编程开发', '翻译写作', '音乐舞蹈', '摄影', '其他'])
const colorPool = ['linear-gradient(135deg, #F687B3, #D53F8C)', 'linear-gradient(135deg, #63B3ED, #2B6CB0)', 'linear-gradient(135deg, #68D391, #38A169)', 'linear-gradient(135deg, #F6AD55, #DD6B20)', 'linear-gradient(135deg, #B794F4, #805AD5)', 'linear-gradient(135deg, #4FD1C5, #319795)']
const emojiPool = ['🎨', '🎬', '💻', '✍️', '🎵', '📷', '🎯', '🛠️']

const skillList = ref([])

const loadData = async () => {
  const cat = categories.value[currentCat.value]
  const res = await callCloud('skill', 'list', { category: cat, keyword: keyword.value })
  if (res.code === 0) {
    skillList.value = res.data.map((s, i) => ({
      id: s._id,
      title: s.title || '',
      publisher: s.publisher || '匿名',
      price: s.price || 0,
      priceUnit: s.priceUnit || '次',
      desc: s.desc || '',
      category: s.category || '其他',
      views: s.views || 0,
      emoji: emojiPool[i % emojiPool.length],
      color: colorPool[i % colorPool.length]
    }))
  }
}

onShow(() => { loadData() })
watch(currentCat, () => { loadData() })

const goDetail = (id) => { uni.navigateTo({ url: '/pages/skill/detail?id=' + id }) }
const goCreate = () => { uni.navigateTo({ url: '/pages/skill/create' }) }
</script>

<style scoped>
.skill-page { background: #F0F2F5; min-height: 100vh; padding-bottom: 120rpx; }
.search-bar { padding: 20rpx 24rpx; }
.search-input { display: flex; align-items: center; background: #fff; border-radius: 40rpx; padding: 16rpx 24rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06); }
.search-icon { margin-right: 12rpx; font-size: 28rpx; }
.search-input input { flex: 1; font-size: 28rpx; }
.category-bar { display: flex; padding: 0 24rpx 20rpx; gap: 12rpx; overflow-x: auto; white-space: nowrap; }
.cat-item { padding: 10rpx 24rpx; background: #fff; border-radius: 30rpx; font-size: 24rpx; color: #666; flex-shrink: 0; }
.cat-item.active { background: linear-gradient(135deg, #F687B3, #D53F8C); color: #fff; }
.skill-list { padding: 0 24rpx; }
.skill-card { background: #fff; border-radius: 20rpx; padding: 28rpx; margin-bottom: 20rpx; box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06); }
.card-top { display: flex; align-items: center; }
.card-avatar { width: 80rpx; height: 80rpx; border-radius: 20rpx; display: flex; align-items: center; justify-content: center; margin-right: 20rpx; flex-shrink: 0; }
.avatar-emoji { font-size: 36rpx; }
.card-info { flex: 1; }
.card-title { font-size: 30rpx; font-weight: 700; color: #1A1A2E; display: block; }
.card-publisher { font-size: 22rpx; color: #A0AEC0; margin-top: 4rpx; display: block; }
.card-price { text-align: right; }
.price-num { font-size: 36rpx; color: #E53E3E; font-weight: 800; }
.price-unit { font-size: 22rpx; color: #A0AEC0; }
.card-desc { font-size: 26rpx; color: #718096; margin-top: 16rpx; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.5; }
.card-bottom { display: flex; justify-content: space-between; align-items: center; margin-top: 16rpx; }
.card-tags { display: flex; gap: 8rpx; }
.tag { font-size: 22rpx; color: #D53F8C; background: #FFF5F7; padding: 4rpx 16rpx; border-radius: 6rpx; }
.card-views { font-size: 22rpx; color: #A0AEC0; }
.empty { padding: 120rpx 0; text-align: center; }
.empty-emoji { font-size: 80rpx; display: block; }
.empty-text { font-size: 28rpx; color: #A0AEC0; margin-top: 16rpx; display: block; }
.fab-btn { position: fixed; right: 40rpx; bottom: 200rpx; width: 100rpx; height: 100rpx; background: linear-gradient(135deg, #F687B3, #D53F8C); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 8rpx 24rpx rgba(213,63,140,0.4); }
.fab-btn text { color: #fff; font-size: 48rpx; }
</style>
