<template>
  <view class="job-page">
    <view class="hero">
      <text class="hero-title">兼职信息</text>
      <text class="hero-sub">精选校园内外兼职，安全可靠</text>
    </view>

    <view class="job-list">
      <view v-for="job in jobs" :key="job.id" class="job-card">
        <view class="job-top">
          <text class="job-title">{{ job.title }}</text>
          <text class="job-tag" :style="{ backgroundColor: job.tagBg }">{{ job.tag }}</text>
        </view>
        <view class="job-meta">
          <text class="job-meta-text">地点：{{ job.location }}</text>
          <text class="job-meta-text">时间：{{ job.time }}</text>
        </view>
        <view class="job-bottom">
          <text class="job-pay">¥{{ job.pay }}/{{ job.unit }}</text>
          <text class="job-status">{{ job.status }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

const jobs = ref([
  { id: 1, title: '图书馆整理员', location: '图书馆三楼', time: '周一-周五 18:00-21:00', pay: 20, unit: '小时', status: '招募中', tag: '校内', tagBg: '#E3F2FD' },
  { id: 2, title: '咖啡店兼职', location: '北门商圈', time: '周末 10:00-19:00', pay: 120, unit: '天', status: '急招', tag: '热门', tagBg: '#FFEBEE' },
  { id: 3, title: '社团活动执行', location: '学生活动中心', time: '周三 14:00-18:00', pay: 80, unit: '场', status: '报名中', tag: '短期', tagBg: '#E8F5E9' },
  { id: 4, title: '校园配送员', location: '全校范围', time: '自由排班', pay: 5, unit: '单', status: '长期招募', tag: '灵活', tagBg: '#FFF3E0' }
])
</script>

<style scoped>
.job-page { background: #F5F7FA; min-height: 100vh; padding-bottom: 40rpx; }

.hero { margin: 20rpx 24rpx; padding: 28rpx 24rpx; border-radius: 16rpx; background: linear-gradient(135deg, #4A90D9, #357ABD); color: #fff; box-shadow: 0 6rpx 16rpx rgba(74,144,217,0.35); }
.hero-title { font-size: 34rpx; font-weight: bold; display: block; }
.hero-sub { font-size: 24rpx; margin-top: 8rpx; display: block; opacity: 0.85; }

.job-list { padding: 4rpx 24rpx 20rpx; }
.job-card { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 16rpx; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08); }
.job-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12rpx; }
.job-title { font-size: 30rpx; font-weight: bold; color: #333; }
.job-tag { padding: 6rpx 14rpx; border-radius: 14rpx; font-size: 22rpx; color: #4A90D9; font-weight: bold; }
.job-meta { display: flex; flex-direction: column; gap: 6rpx; }
.job-meta-text { font-size: 24rpx; color: #666; }
.job-bottom { display: flex; justify-content: space-between; align-items: center; margin-top: 16rpx; }
.job-pay { font-size: 30rpx; color: #FF6B6B; font-weight: bold; }
.job-status { font-size: 24rpx; color: #4A90D9; }
</style>
