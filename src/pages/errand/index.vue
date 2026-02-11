<template>
  <view class="errand-page">
    <!-- 顶部Tab -->
    <view class="tab-bar">
      <view class="tab-item" :class="{active: tab === 0}" @click="tab = 0">
        <text>全部任务</text>
      </view>
      <view class="tab-item" :class="{active: tab === 1}" @click="tab = 1">
        <text>待接单</text>
      </view>
      <view class="tab-item" :class="{active: tab === 2}" @click="tab = 2">
        <text>进行中</text>
      </view>
      <view class="tab-item" :class="{active: tab === 3}" @click="tab = 3">
        <text>已完成</text>
      </view>
    </view>

    <!-- 任务列表 -->
    <view class="task-list">
      <view v-for="task in filteredTasks" :key="task.id" class="task-card" @click="goDetail(task.id)">
        <view class="task-header">
          <text class="task-title">{{ task.title }}</text>
          <text class="task-status" :style="{color: task.statusColor}">{{ task.statusText }}</text>
        </view>
        <text class="task-desc">{{ task.desc }}</text>
        <view class="task-footer">
          <view class="task-info">
            <text class="task-user">{{ task.userAvatar }} {{ task.userName }}</text>
            <text class="task-time">{{ task.time }}</text>
          </view>
          <text class="task-price">¥{{ task.price }}</text>
        </view>
      </view>

      <view v-if="filteredTasks.length === 0" class="empty">
        <text class="empty-emoji">📭</text>
        <text class="empty-text">暂无任务</text>
      </view>
    </view>

    <!-- 发布按钮 -->
    <view class="fab-btn" @click="goCreate">
      <text>+ 发布任务</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

const tab = ref(0)

const tasks = ref([
  { id: 1, title: '帮我去图书馆还书', desc: '3本书，在6号楼门口取，还到图书馆2楼还书处', userName: '小明', userAvatar: '🧑', price: 8, time: '15分钟前', statusText: '待接单', statusColor: '#FF9800', status: 0 },
  { id: 2, title: '食堂带饭', desc: '二食堂，一份黄焖鸡+一杯豆浆，送到3号楼502', userName: '小红', userAvatar: '👩', price: 5, time: '30分钟前', statusText: '进行中', statusColor: '#66BB6A', status: 1 },
  { id: 3, title: '打印资料', desc: '一份PPT 30页彩印，打印店取，送到教学楼A301', userName: '学霸', userAvatar: '🧑‍🎓', price: 10, time: '1小时前', statusText: '待接单', statusColor: '#FF9800', status: 0 },
  { id: 4, title: '帮忙排队取号', desc: '校医院一楼挂号处，帮我排队取号，大概需要30分钟', userName: '小李', userAvatar: '🧑', price: 15, time: '2小时前', statusText: '已完成', statusColor: '#9E9E9E', status: 2 },
  { id: 5, title: '代买咖啡', desc: '瑞幸咖啡，一杯生椰拿铁 大杯少冰，送到图书馆3楼', userName: '小张', userAvatar: '👩‍🎓', price: 3, time: '3小时前', statusText: '已完成', statusColor: '#9E9E9E', status: 2 }
])

const filteredTasks = computed(() => {
  if (tab.value === 0) return tasks.value
  if (tab.value === 1) return tasks.value.filter(t => t.status === 0)
  if (tab.value === 2) return tasks.value.filter(t => t.status === 1)
  return tasks.value.filter(t => t.status === 2)
})

const goDetail = (id) => {
  uni.navigateTo({ url: `/pages/errand/detail?id=${id}` })
}

const goCreate = () => {
  uni.navigateTo({ url: '/pages/errand/create' })
}
</script>

<style scoped>
.errand-page { background: #F5F7FA; min-height: 100vh; padding-bottom: 140rpx; }

.tab-bar { display: flex; background: #fff; padding: 0 12rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06); }
.tab-item { flex: 1; text-align: center; padding: 24rpx 0; font-size: 26rpx; color: #999; border-bottom: 4rpx solid transparent; }
.tab-item.active { color: #4A90D9; font-weight: bold; border-bottom-color: #4A90D9; }

.task-list { padding: 20rpx 24rpx; }
.task-card { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 16rpx; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08); }
.task-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12rpx; }
.task-title { font-size: 30rpx; font-weight: bold; color: #333; flex: 1; }
.task-status { font-size: 24rpx; font-weight: bold; flex-shrink: 0; }
.task-desc { font-size: 26rpx; color: #666; display: block; margin-bottom: 16rpx; line-height: 38rpx; }
.task-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 16rpx; border-top: 1rpx solid #f0f0f0; }
.task-info { display: flex; flex-direction: column; }
.task-user { font-size: 24rpx; color: #333; }
.task-time { font-size: 22rpx; color: #999; margin-top: 4rpx; }
.task-price { font-size: 36rpx; color: #FF6B6B; font-weight: bold; }

.empty { display: flex; flex-direction: column; align-items: center; padding: 120rpx 0; }
.empty-emoji { font-size: 80rpx; margin-bottom: 16rpx; }
.empty-text { font-size: 28rpx; color: #999; }

.fab-btn { position: fixed; bottom: 40rpx; left: 24rpx; right: 24rpx; background: linear-gradient(135deg, #FF9800, #F57C00); border-radius: 48rpx; padding: 28rpx; text-align: center; box-shadow: 0 8rpx 24rpx rgba(255,152,0,0.4); }
.fab-btn text { color: #fff; font-size: 32rpx; font-weight: bold; }
</style>
