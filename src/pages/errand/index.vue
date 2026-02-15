<template>
  <view class="errand-page">
    <view class="tab-bar">
      <view class="tab-item" :class="{active: tab === i}" v-for="(name, i) in tabNames" :key="i" @click="tab = i">
        <text>{{ name }}</text>
        <view v-if="tab === i" class="tab-line"></view>
      </view>
    </view>

    <view class="task-list">
      <view v-for="task in filteredTasks" :key="task.id" class="task-card" @click="goDetail(task.id)">
        <view class="task-top">
          <text class="task-title">{{ task.title }}</text>
          <text class="task-status" :style="{color: task.statusColor}">{{ task.statusText }}</text>
        </view>
        <text class="task-desc">{{ task.desc }}</text>
        <view class="task-bottom">
          <view class="task-user">
            <text class="user-avatar">{{ task.userAvatar }}</text>
            <view class="user-info">
              <text class="user-name">{{ task.userName }}</text>
              <text class="user-time">{{ task.time }}</text>
            </view>
          </view>
          <text class="task-price">¥{{ task.price }}</text>
        </view>
      </view>
      <view v-if="filteredTasks.length === 0" class="empty">
        <text class="empty-emoji">📭</text>
        <text class="empty-text">暂无任务</text>
      </view>
    </view>

    <view class="fab-btn" @click="goCreate"><text>+ 发布任务</text></view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app'
import { callCloud } from '@/utils/cloud.js'

const tab = ref(0)
const tabNames = ['全部任务','待接单','进行中','已完成']
const tasks = ref([])

const statusMap = { 0: undefined, 1: 0, 2: 1, 3: 2 }

const errandStatusTextMap = { 0: '待接单', 1: '进行中', 2: '已完成', 3: '已取消' }
const errandStatusColorMap = { 0: '#DD6B20', 1: '#38A169', 2: '#A0AEC0', 3: '#E53E3E' }

const loadTasks = async () => {
  const res = await callCloud('errand', 'list', {
    status: statusMap[tab.value],
    page: 1, pageSize: 20
  })
  if (res.code === 0) {
    tasks.value = res.data.map(t => ({
      ...t, id: t._id,
      userName: t.userName || '匿名',
      userAvatar: t.userAvatar || '🧑',
      statusText: errandStatusTextMap[t.status] || '待接单',
      statusColor: errandStatusColorMap[t.status] || '#DD6B20',
      time: formatTime(t.createTime)
    }))
  }
}

const formatTime = (t) => {
  if (!t) return ''
  const d = new Date(t)
  const diff = Math.floor((new Date() - d) / 60000)
  if (diff < 1) return '刚刚'
  if (diff < 60) return diff + '分钟前'
  if (diff < 1440) return Math.floor(diff / 60) + '小时前'
  return Math.floor(diff / 1440) + '天前'
}

const filteredTasks = computed(() => tasks.value)

watch(tab, () => { loadTasks() })
onShow(() => { loadTasks() })
onPullDownRefresh(async () => {
  await loadTasks()
  uni.stopPullDownRefresh()
})

const goDetail = (id) => { uni.navigateTo({ url: '/pages/errand/detail?id=' + id }) }
const goCreate = () => { uni.navigateTo({ url: '/pages/errand/create' }) }
</script>

<style scoped>
.errand-page { background: #F0F2F5; min-height: 100vh; padding-bottom: 160rpx; }

.tab-bar { display: flex; background: #fff; box-shadow: 0 1rpx 0 #E2E8F0; }
.tab-item { flex: 1; text-align: center; padding: 28rpx 0 24rpx; font-size: 26rpx; color: #A0AEC0; font-weight: 500; position: relative; }
.tab-item.active { color: #DD6B20; font-weight: 700; }
.tab-line { position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 48rpx; height: 6rpx; border-radius: 3rpx; background: linear-gradient(90deg, #ED8936, #DD6B20); }

.task-list { padding: 20rpx 28rpx; }
.task-card { background: #fff; border-radius: 20rpx; padding: 28rpx; margin-bottom: 16rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); transition: transform 0.2s ease, box-shadow 0.2s ease; }
.task-card:active { transform: scale(0.98); box-shadow: 0 1rpx 4rpx rgba(0,0,0,0.08); }
.task-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14rpx; }
.task-title { font-size: 30rpx; font-weight: 700; color: #1A1A2E; flex: 1; }
.task-status { font-size: 24rpx; font-weight: 700; flex-shrink: 0; }
.task-desc { font-size: 26rpx; color: #718096; display: block; margin-bottom: 20rpx; line-height: 40rpx; background: #F7FAFC; padding: 16rpx 20rpx; border-radius: 12rpx; }
.task-bottom { display: flex; justify-content: space-between; align-items: center; }
.task-user { display: flex; align-items: center; }
.user-avatar { font-size: 36rpx; margin-right: 12rpx; }
.user-info { display: flex; flex-direction: column; }
.user-name { font-size: 24rpx; color: #2D3748; font-weight: 600; }
.user-time { font-size: 22rpx; color: #A0AEC0; margin-top: 2rpx; }
.task-price { font-size: 38rpx; color: #E53E3E; font-weight: 800; }

.empty { display: flex; flex-direction: column; align-items: center; padding: 120rpx 0; }
.empty-emoji { font-size: 80rpx; margin-bottom: 16rpx; }
.empty-text { font-size: 28rpx; color: #A0AEC0; }

.fab-btn { position: fixed; bottom: 48rpx; left: 28rpx; right: 28rpx; background: linear-gradient(135deg, #ED8936, #DD6B20); border-radius: 52rpx; padding: 30rpx; text-align: center; box-shadow: 0 12rpx 32rpx rgba(221,107,32,0.35); transition: transform 0.15s ease, box-shadow 0.15s ease; }
.fab-btn:active { transform: scale(0.96); box-shadow: 0 6rpx 16rpx rgba(221,107,32,0.4); }
.fab-btn text { color: #fff; font-size: 30rpx; font-weight: 700; letter-spacing: 2rpx; }
</style>
