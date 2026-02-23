<template>
  <view class="custom-tab-bar" :style="{ paddingBottom: safeBottom + 'px' }">
    <view
      v-for="(item, index) in tabs"
      :key="index"
      class="tab-item"
      :class="{ active: current === index }"
      @click="switchTab(index)"
    >
      <image
        class="tab-icon"
        :class="{ 'tab-icon-active': current === index }"
        :src="current === index ? item.selectedIcon : item.icon"
        mode="aspectFit"
      />
      <text class="tab-label" :class="{ 'tab-label-active': current === index }">{{ item.text }}</text>
    </view>
  </view>
  <view class="tab-bar-placeholder" :style="{ height: (120 + safeBottom) + 'px' }"></view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

defineProps({
  current: { type: Number, default: 0 }
})

const safeBottom = ref(0)

onMounted(() => {
  const info = uni.getSystemInfoSync()
  safeBottom.value = info.safeAreaInsets ? info.safeAreaInsets.bottom : 0
})

const tabs = [
  { pagePath: '/pages/index/index', icon: '/static/tab/run.png', selectedIcon: '/static/tab/run-active.png', text: '首页' },
  { pagePath: '/pages/job/index', icon: '/static/tab/market.png', selectedIcon: '/static/tab/market-active.png', text: '兼职' },
  { pagePath: '/pages/forum/index', icon: '/static/tab/forum.png', selectedIcon: '/static/tab/forum-active.png', text: '广场' },
  { pagePath: '/pages/welfare/index', icon: '/static/tab/team.png', selectedIcon: '/static/tab/team-active.png', text: '福利' },
  { pagePath: '/pages/mine/index', icon: '/static/tab/mine.png', selectedIcon: '/static/tab/mine-active.png', text: '我的' }
]

const switchTab = (index) => {
  uni.switchTab({ url: tabs[index].pagePath })
}
</script>

<style scoped>
.custom-tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 120rpx;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-around;
  box-shadow: 0 -2rpx 12rpx rgba(0,0,0,0.06);
  z-index: 9999;
}
.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}
.tab-item:active {
  opacity: 0.7;
}
.tab-icon {
  width: 52rpx;
  height: 52rpx;
  transition: all 0.2s ease;
}
.tab-icon-active {
  width: 60rpx;
  height: 60rpx;
}
.tab-label {
  font-size: 20rpx;
  color: #A0AEC0;
  margin-top: 4rpx;
}
.tab-label-active {
  color: #2B6CB0;
  font-weight: 600;
}
.tab-bar-placeholder {
  width: 100%;
  flex-shrink: 0;
}
</style>
