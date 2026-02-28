<template>
  <view class="graduate-page">
    <view class="hero">
      <view class="hero-left">
        <text class="hero-title">考研服务</text>
        <text class="hero-sub">资料、课程与自习规划一站式</text>
      </view>
      <view class="hero-kefu" @click="showKefu">
        <text class="kefu-icon">💬</text>
        <text class="kefu-label">客服</text>
      </view>
    </view>

    <view class="service-grid">
      <view class="service-card" v-for="item in services" :key="item.id" @click="onServiceTap(item)">
        <view class="service-icon-wrap" :style="{background: item.gradient}">
          <text class="service-emoji">{{ item.emoji }}</text>
        </view>
        <text class="service-title">{{ item.title }}</text>
        <text class="service-desc">{{ item.desc }}</text>
      </view>
    </view>

    <view class="plan-card">
      <text class="plan-title">本周自习计划</text>
      <view class="plan-item" v-for="plan in plans" :key="plan.id">
        <text class="plan-left">{{ plan.day }}</text>
        <text class="plan-right">{{ plan.task }}</text>
      </view>
    </view>

    <view class="showcase-card">
      <text class="showcase-title">🏆 成果展示</text>
      <scroll-view scroll-x class="showcase-scroll" :show-scrollbar="false">
        <view class="showcase-list">
          <view class="showcase-item" v-for="item in showcaseList" :key="item.id" @click="previewImage(item.url)">
            <image :src="item.url" class="showcase-img" mode="aspectFill"></image>
            <text class="showcase-label">{{ item.label }}</text>
          </view>
        </view>
      </scroll-view>
      <view v-if="showcaseList.length === 0" class="showcase-empty">
        <text class="empty-emoji">📷</text>
        <text class="empty-text">暂无活动图片</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

const services = ref([
  { id: 1, title: '资料包', desc: '真题+笔记合集', emoji: '📘', url: '/pages/graduate/resources', gradient: 'linear-gradient(135deg, #4299E1, #2B6CB0)' },
  { id: 2, title: '课程表', desc: '我的课程安排', emoji: '🎯', url: '/pages/graduate/schedule', gradient: 'linear-gradient(135deg, #ED8936, #DD6B20)' },
  { id: 3, title: '打卡', desc: '每日学习打卡', emoji: '✅', url: '/pages/graduate/checkin', gradient: 'linear-gradient(135deg, #48BB78, #38A169)' },
  { id: 4, title: '经验帖', desc: '上岸学长学姐分享', emoji: '🧑‍🎓', url: '/pages/graduate/experience', gradient: 'linear-gradient(135deg, #9F7AEA, #6B46C1)' }
])

const plans = ref([
  { id: 1, day: '周一', task: '英语阅读+数学高数' },
  { id: 2, day: '周二', task: '政治选择题+专业课一' },
  { id: 3, day: '周三', task: '英语写作+数学线代' },
  { id: 4, day: '周四', task: '政治主观题+专业课二' },
  { id: 5, day: '周五', task: '英语真题精练' }
])

const showcaseList = ref([
  { id: 1, url: '/static/qrcode-work-wechat.png', label: '自习室打卡' },
  { id: 2, url: '/static/TeamWork.jpg', label: '学习小组' },
  { id: 3, url: '/static/logo.png', label: '上岸喜报' }
])

const onServiceTap = (item) => {
  uni.navigateTo({ url: item.url })
}

const showKefu = () => {
  // 考研专属客服二维码，和首页客服不同
  uni.navigateTo({ url: '/pages/kefu/show?img=' + encodeURIComponent('/static/qrcode-work-wechat.png') })
}

const previewImage = (url) => {
  uni.previewImage({
    current: url,
    urls: showcaseList.value.map(i => i.url)
  })
}
</script>

<style scoped>
.graduate-page { background: #F5F7FA; min-height: 100vh; padding-bottom: 40rpx; }

.hero {
  margin: 20rpx 24rpx;
  padding: 32rpx 28rpx;
  border-radius: 20rpx;
  background: linear-gradient(135deg, #43A047, #2E7D32);
  color: #fff;
  box-shadow: 0 8rpx 24rpx rgba(67,160,71,0.3);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.hero-left { display: flex; flex-direction: column; }
.hero-title { font-size: 36rpx; font-weight: bold; display: block; }
.hero-sub { font-size: 24rpx; margin-top: 8rpx; display: block; opacity: 0.85; }
.hero-kefu {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(255,255,255,0.2);
  border-radius: 16rpx;
  padding: 16rpx 20rpx;
  backdrop-filter: blur(4px);
}
.hero-kefu:active { background: rgba(255,255,255,0.35); }
.kefu-icon { font-size: 36rpx; display: block; }
.kefu-label { font-size: 20rpx; color: #fff; margin-top: 4rpx; display: block; font-weight: 600; }

.service-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
  padding: 8rpx 24rpx 24rpx;
}
.service-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx 24rpx 24rpx;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06);
  transition: transform 0.2s ease;
}
.service-card:active { transform: scale(0.95); }
.service-icon-wrap {
  width: 96rpx;
  height: 96rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16rpx;
  box-shadow: 0 6rpx 16rpx rgba(0,0,0,0.1);
}
.service-emoji { font-size: 52rpx; line-height: 96rpx; }
.service-title { font-size: 28rpx; font-weight: bold; color: #333; display: block; }
.service-desc { font-size: 22rpx; color: #999; display: block; margin-top: 6rpx; }

.plan-card {
  margin: 0 24rpx 24rpx;
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06);
}
.plan-title { font-size: 30rpx; font-weight: bold; color: #333; display: block; margin-bottom: 16rpx; }
.plan-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}
.plan-item:last-child { border-bottom: none; }
.plan-left { font-size: 26rpx; color: #666; flex-shrink: 0; }
.plan-right { font-size: 26rpx; color: #333; font-weight: 500; }

.showcase-card {
  margin: 0 24rpx 24rpx;
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06);
}
.showcase-title { font-size: 30rpx; font-weight: bold; color: #333; display: block; margin-bottom: 20rpx; }
.showcase-scroll { width: 100%; white-space: nowrap; }
.showcase-list { display: flex; gap: 16rpx; }
.showcase-item {
  flex-shrink: 0;
  width: 240rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.showcase-img {
  width: 240rpx;
  height: 240rpx;
  border-radius: 16rpx;
  background: #f0f0f0;
}
.showcase-label {
  font-size: 22rpx;
  color: #666;
  margin-top: 10rpx;
  display: block;
}
.showcase-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx 0;
}
.empty-emoji { font-size: 56rpx; margin-bottom: 8rpx; }
.empty-text { font-size: 24rpx; color: #999; }
</style>
