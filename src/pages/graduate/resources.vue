<template>
  <view class="resources-page">
    <view class="category-bar">
      <view v-for="(cat, i) in categories" :key="i" class="cat-item" :class="{active: currentCat === i}" @click="currentCat = i">
        <text>{{ cat }}</text>
      </view>
    </view>

    <view class="resource-list">
      <view v-for="item in filteredList" :key="item.id" class="resource-card" @click="openResource(item)">
        <view class="res-icon" :style="{background: item.color}">
          <text class="res-emoji">{{ item.emoji }}</text>
        </view>
        <view class="res-info">
          <text class="res-title">{{ item.title }}</text>
          <text class="res-desc">{{ item.desc }}</text>
          <view class="res-meta">
            <text class="res-size">{{ item.size }}</text>
            <text class="res-date">{{ item.date }}</text>
          </view>
        </view>
        <view class="res-action">
          <text class="res-arrow">›</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

const currentCat = ref(0)
const categories = ref(['全部', '英语', '数学', '政治', '专业课', '综合'])

const resources = ref([
  { id: 1, title: '考研英语一真题合集(2010-2025)', desc: '历年真题PDF+详细解析', size: '256MB', date: '2025-12', emoji: '📖', color: 'linear-gradient(135deg, #63B3ED, #2B6CB0)', category: '英语', link: 'https://pan.baidu.com/s/xxxxx1', password: 'ab12' },
  { id: 2, title: '张宇高数18讲笔记', desc: '手写笔记扫描版+思维导图', size: '180MB', date: '2025-11', emoji: '📐', color: 'linear-gradient(135deg, #F6AD55, #DD6B20)', category: '数学', link: 'https://pan.baidu.com/s/xxxxx2', password: 'cd34' },
  { id: 3, title: '肖秀荣1000题+精讲精练', desc: '政治全套复习资料', size: '320MB', date: '2025-10', emoji: '📕', color: 'linear-gradient(135deg, #FC8181, #E53E3E)', category: '政治', link: 'https://pan.baidu.com/s/xxxxx3', password: 'ef56' },
  { id: 4, title: '考研英语词汇5500红宝书', desc: '高频词汇+例句+音频', size: '95MB', date: '2025-09', emoji: '📗', color: 'linear-gradient(135deg, #68D391, #38A169)', category: '英语', link: 'https://pan.baidu.com/s/xxxxx4', password: 'gh78' },
  { id: 5, title: '线性代数辅导讲义(李永乐)', desc: '知识点梳理+典型例题', size: '145MB', date: '2025-11', emoji: '📘', color: 'linear-gradient(135deg, #B794F4, #805AD5)', category: '数学', link: 'https://pan.baidu.com/s/xxxxx5', password: 'ij90' },
  { id: 6, title: '考研复试面试技巧汇总', desc: '自我介绍模板+常见问题+英语口语', size: '50MB', date: '2026-01', emoji: '🎓', color: 'linear-gradient(135deg, #4FD1C5, #319795)', category: '综合', link: 'https://pan.baidu.com/s/xxxxx6', password: 'kl12' },
  { id: 7, title: '肖四肖八预测卷(2026)', desc: '最新预测题+答案解析', size: '88MB', date: '2026-01', emoji: '📝', color: 'linear-gradient(135deg, #FBD38D, #D69E2E)', category: '政治', link: 'https://pan.baidu.com/s/xxxxx7', password: 'mn34' }
])

const filteredList = computed(() => {
  const cat = categories.value[currentCat.value]
  if (cat === '全部') return resources.value
  return resources.value.filter(r => r.category === cat)
})

const openResource = (item) => {
  uni.showModal({
    title: item.title,
    content: '网盘链接：' + item.link + '\n提取码：' + item.password + '\n\n点击确认复制链接和提取码',
    confirmText: '复制',
    success: (res) => {
      if (res.confirm) {
        uni.setClipboardData({
          data: '链接：' + item.link + ' 提取码：' + item.password,
          success: () => { uni.showToast({ title: '已复制', icon: 'success' }) }
        })
      }
    }
  })
}
</script>

<style scoped>
.resources-page { background: #F0F2F5; min-height: 100vh; padding-bottom: 40rpx; }
.category-bar { display: flex; padding: 20rpx 24rpx; gap: 12rpx; overflow-x: auto; white-space: nowrap; background: #fff; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06); }
.cat-item { padding: 10rpx 24rpx; background: #F0F2F5; border-radius: 30rpx; font-size: 24rpx; color: #666; flex-shrink: 0; }
.cat-item.active { background: linear-gradient(135deg, #43A047, #2E7D32); color: #fff; }
.resource-list { padding: 20rpx 24rpx; }
.resource-card { display: flex; align-items: center; background: #fff; border-radius: 20rpx; padding: 28rpx; margin-bottom: 16rpx; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.06); }
.resource-card:active { transform: scale(0.98); }
.res-icon { width: 88rpx; height: 88rpx; border-radius: 20rpx; display: flex; align-items: center; justify-content: center; margin-right: 20rpx; flex-shrink: 0; }
.res-emoji { font-size: 40rpx; }
.res-info { flex: 1; }
.res-title { font-size: 28rpx; font-weight: 700; color: #1A1A2E; display: block; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
.res-desc { font-size: 24rpx; color: #718096; margin-top: 6rpx; display: block; }
.res-meta { display: flex; gap: 16rpx; margin-top: 8rpx; }
.res-size { font-size: 22rpx; color: #A0AEC0; }
.res-date { font-size: 22rpx; color: #A0AEC0; }
.res-action { margin-left: 12rpx; }
.res-arrow { font-size: 32rpx; color: #CBD5E0; }
</style>
