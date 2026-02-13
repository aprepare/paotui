<template>
  <view class="graduate-page">
    <view class="hero">
      <text class="hero-title">考研服务</text>
      <text class="hero-sub">资料、课程与自习规划一站式</text>
    </view>

    <view class="service-grid">
      <view class="service-card" v-for="item in services" :key="item.id">
        <text class="service-emoji">{{ item.emoji }}</text>
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
  </view>
</template>

<script setup>
import { ref } from 'vue'

const services = ref([
  { id: 1, title: '资料包', desc: '真题+笔记合集', emoji: '📘' },
  { id: 2, title: '课程表', desc: '名师课程安排', emoji: '🎯' },
  { id: 3, title: '自习室', desc: '空位预约提醒', emoji: '🏫' },
  { id: 4, title: '经验帖', desc: '上岸学长学姐分享', emoji: '🧑‍🎓' }
])

const plans = ref([
  { id: 1, day: '周一', task: '英语阅读+数学高数' },
  { id: 2, day: '周二', task: '政治选择题+专业课一' },
  { id: 3, day: '周三', task: '英语写作+数学线代' },
  { id: 4, day: '周四', task: '政治主观题+专业课二' },
  { id: 5, day: '周五', task: '英语真题精练' }
])
</script>

<style scoped>
.graduate-page { background: #F5F7FA; min-height: 100vh; padding-bottom: 40rpx; }

.hero { margin: 20rpx 24rpx; padding: 28rpx 24rpx; border-radius: 16rpx; background: linear-gradient(135deg, #43A047, #2E7D32); color: #fff; box-shadow: 0 6rpx 16rpx rgba(67,160,71,0.35); }
.hero-title { font-size: 34rpx; font-weight: bold; display: block; }
.hero-sub { font-size: 24rpx; margin-top: 8rpx; display: block; opacity: 0.85; }

.service-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16rpx; padding: 8rpx 24rpx 20rpx; }
.service-card { background: #fff; border-radius: 16rpx; padding: 24rpx; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08); }
.service-emoji { font-size: 40rpx; display: block; }
.service-title { font-size: 28rpx; font-weight: bold; color: #333; display: block; margin-top: 12rpx; }
.service-desc { font-size: 22rpx; color: #666; display: block; margin-top: 6rpx; }

.plan-card { margin: 0 24rpx 24rpx; background: #fff; border-radius: 16rpx; padding: 24rpx; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08); }
.plan-title { font-size: 28rpx; font-weight: bold; color: #333; display: block; margin-bottom: 12rpx; }
.plan-item { display: flex; justify-content: space-between; padding: 10rpx 0; border-bottom: 1rpx solid #f0f0f0; }
.plan-item:last-child { border-bottom: none; }
.plan-left { font-size: 24rpx; color: #999; }
.plan-right { font-size: 24rpx; color: #333; }
</style>
