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
import { ref, computed } from 'vue'
import { onPullDownRefresh } from '@dcloudio/uni-app'

const tab = ref(0)
const tabNames = ['全部任务','待接单','进行中','已完成']
const tasks = ref([
  { id: 1, title: '帮我去图书馆还书', desc: '3本书，在6号楼门口取，还到图书馆2楼还书处', userName: '小明', userAvatar: '🧑', price: 8, time: '15分钟前', statusText: '待接单', statusColor: '#DD6B20', status: 0 },
  { id: 2, title: '食堂带饭', desc: '二食堂，一份黄焖鸡+一杯豆浆，送到3号楼502', userName: '小红', userAvatar: '👩', price: 5, time: '30分钟前', statusText: '进行中', statusColor: '#38A169', status: 1 },
  { id: 3, title: '打印资料', desc: '一份PPT 30页彩印，打印店取，送到教学楼A301', userName: '学霸', userAvatar: '🧑‍🎓', price: 10, time: '1小时前', statusText: '待接单', statusColor: '#DD6B20', status: 0 },
  { id: 4, title: '帮忙排队取号', desc: '校医院一楼挂号处，帮我排队取号，大概需要30分钟', userName: '小李', userAvatar: '🧑', price: 15, time: '2小时前', statusText: '已完成', statusColor: '#A0AEC0', status: 2 },
  { id: 5, title: '代买咖啡', desc: '瑞幸咖啡，一杯生椰拿铁 大杯少冰，送到图书馆3楼', userName: '小张', userAvatar: '👩‍🎓', price: 3, time: '3小时前', statusText: '已完成', statusColor: '#A0AEC0', status: 2 }
])

const filteredTasks = computed(() => {
  if (tab.value === 0) return tasks.value
  if (tab.value === 1) return tasks.value.filter(t => t.status === 0)
  if (tab.value === 2) return tasks.value.filter(t => t.status === 1)
  return tasks.value.filter(t => t.status === 2)
})

const goDetail = (id) => { uni.navigateTo({ url: '/pages/errand/detail?id=' + id }) }
const goCreate = () => { uni.navigateTo({ url: '/pages/errand/create' }) }
onPullDownRefresh(() => {
  setTimeout(() => { uni.stopPullDownRefresh() }, 800)
})
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
