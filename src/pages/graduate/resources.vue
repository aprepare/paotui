<template>
  <view class="resources-page">
    <view class="category-bar">
      <view v-for="(cat, i) in categories" :key="i" class="cat-item" :class="{active: currentCat === i}" @click="currentCat = i">
        <text>{{ cat }}</text>
      </view>
    </view>

    <view class="resource-list">
      <view v-for="item in filteredList" :key="item._id" class="resource-card" @click="openResource(item)">
        <view class="res-icon" :style="{background: item.color}">
          <text class="res-emoji">{{ item.emoji }}</text>
        </view>
        <view class="res-info">
          <text class="res-title">{{ item.title }}</text>
          <text class="res-desc">{{ item.desc }}</text>
          <view class="res-meta">
            <text class="res-size">{{ item.size }}</text>
            <text class="res-date">{{ fmtDate(item.createTime) }}</text>
          </view>
        </view>
        <view class="res-action">
          <text class="res-arrow">›</text>
        </view>
      </view>
      <view v-if="loaded && !filteredList.length" class="empty-state">
        <text class="empty-emoji">📭</text>
        <text class="empty-text">暂无该分类的资料</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { callCloud } from '@/utils/cloud.js'

const currentCat = ref(0)
const categories = ref(['全部', '英语', '数学', '政治', '专业课', '综合'])
const resources = ref([])
const loaded = ref(false)

const loadResources = async () => {
  var res = await callCloud('admin', 'resourceListPublic')
  if (res.code === 0) resources.value = res.data || []
  loaded.value = true
}

const filteredList = computed(() => {
  const cat = categories.value[currentCat.value]
  if (cat === '全部') return resources.value
  return resources.value.filter(r => r.category === cat)
})

const fmtDate = (t) => {
  if (!t) return ''
  var d = new Date(t)
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
}

const openResource = (item) => {
  uni.showModal({
    title: item.title,
    content: '网盘链接：' + item.link + '\n提取码：' + (item.password || '无') + '\n\n点击确认复制链接和提取码',
    confirmText: '复制',
    success: (res) => {
      if (res.confirm) {
        var text = '链接：' + item.link
        if (item.password) text += ' 提取码：' + item.password
        uni.setClipboardData({
          data: text,
          success: () => { uni.showToast({ title: '已复制', icon: 'success' }) }
        })
      }
    }
  })
}

onLoad(() => { loadResources() })
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
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 80rpx 0; }
.empty-emoji { font-size: 60rpx; margin-bottom: 16rpx; }
.empty-text { font-size: 26rpx; color: #A0AEC0; }
</style>
