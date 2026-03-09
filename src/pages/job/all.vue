<template>
  <view class="all-page">
    <view class="search-bar">
      <view class="search-input">
        <text class="search-icon">🔍</text>
        <input placeholder="搜索所有兼职" v-model="keyword" confirm-type="search"></input>
      </view>
    </view>
    <scroll-view scroll-x class="filter-bar">
      <view class="filter-inner">
        <view v-for="f in filterTags" :key="f" class="filter-chip" :class="{active: activeFilter === f}" @click="activeFilter = f">
          <text>{{ f }}</text>
        </view>
      </view>
    </scroll-view>
    <scroll-view scroll-y class="job-list">
      <view v-for="job in filteredJobs" :key="job._id || job.id" class="job-card" @click="onJobTap(job)">
        <view class="job-top">
          <view class="job-emoji-wrap" :style="{background: job.bg}">
            <image v-if="job.image" class="job-img" :src="job.image" mode="aspectFill" />
            <text v-else class="job-emoji">{{ job.emoji }}</text>
          </view>
          <view class="job-main">
            <text class="job-title">{{ job.title }}</text>
            <text class="job-company">{{ job.company }}</text>
          </view>
          <view class="job-hot" v-if="job.hot"><text>🔥 热招</text></view>
        </view>
        <view class="job-detail-row">
          <text class="job-location">📍 {{ job.location }}</text>
          <view class="job-cat-tag"><text>{{ job.category }}</text></view>
        </view>
        <view class="job-bottom">
          <text class="job-pay">{{ job.pay }}</text>
          <view class="job-apply-btn"><text>查看详情</text></view>
        </view>
      </view>
      <view v-if="filteredJobs.length === 0" class="empty-state">
        <text class="empty-emoji">🔍</text>
        <text class="empty-text">没有找到相关兼职</text>
      </view>
    </scroll-view>

    <!-- 详情弹出层 -->
    <view class="popup-mask" v-if="showDetail" @click="showDetail = false">
      <view class="popup-body" @click.stop>
        <view class="popup-close" @click="showDetail = false"><text>✕</text></view>
        <view class="popup-content" v-if="detailJob">
          <view class="popup-emoji-wrap" :style="{background: detailJob.bg}">
            <image v-if="detailJob.image" class="popup-img" :src="detailJob.image" mode="aspectFill" />
            <text v-else class="popup-emoji-icon">{{ detailJob.emoji }}</text>
          </view>
          <text class="popup-title">{{ detailJob.title }}</text>
          <text class="popup-company">{{ detailJob.company }}</text>
          <view class="popup-grid">
            <view class="popup-field">
              <text class="popup-label">📍 工作地点</text>
              <text class="popup-val">{{ detailJob.location }}</text>
            </view>
            <view class="popup-field">
              <text class="popup-label">💰 薪资待遇</text>
              <text class="popup-val price">{{ detailJob.pay }}</text>
            </view>
            <view class="popup-field">
              <text class="popup-label">📂 岗位分类</text>
              <text class="popup-val">{{ detailJob.category }}</text>
            </view>
            <view class="popup-field">
              <text class="popup-label">🏢 招聘单位</text>
              <text class="popup-val">{{ detailJob.company }}</text>
            </view>
          </view>
          <view class="popup-desc" v-if="detailJob.description">
            <text class="popup-desc-title">📋 岗位介绍</text>
            <text class="popup-desc-text">{{ detailJob.description }}</text>
          </view>
          <view class="popup-contact-btn" @click="onContactKefu">
            <text>联系客服获取详细信息</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { callCloud } from '@/utils/cloud'

const keyword = ref('')
const activeFilter = ref('全部')
const filterTags = ['全部', '校内', '家教', '阿那亚', '阿尔卡迪亚', '寒暑假']

const allJobs = ref([])

const loadJobs = async () => {
  try {
    const res = await callCloud('job', 'list', {})
    if (res.code === 0 && res.data && res.data.length > 0) {
      allJobs.value = res.data
    }
  } catch (e) { }
}

onLoad(() => { loadJobs() })

const filteredJobs = computed(() => {
  let list = allJobs.value
  if (activeFilter.value !== '全部') list = list.filter(j => j.category === activeFilter.value)
  if (keyword.value.trim()) {
    const kw = keyword.value.trim().toLowerCase()
    list = list.filter(j => j.title.toLowerCase().includes(kw) || j.company.toLowerCase().includes(kw))
  }
  return list
})

const showDetail = ref(false)
const detailJob = ref(null)

const onJobTap = (job) => {
  detailJob.value = job
  showDetail.value = true
}

const onContactKefu = () => {
  showDetail.value = false
  uni.navigateTo({ url: '/pages/kefu/show?img=' + encodeURIComponent('/static/TeamWork.jpg') })
}
</script>

<style scoped>
.all-page { background: #F0F2F5; min-height: 100vh; display: flex; flex-direction: column; }
.search-bar { padding: 16rpx 24rpx; background: #fff; }
.search-input { display: flex; align-items: center; background: #F7FAFC; border-radius: 32rpx; padding: 14rpx 24rpx; }
.search-icon { font-size: 28rpx; margin-right: 12rpx; }
.search-input input { flex: 1; font-size: 26rpx; color: #4A5568; }
.filter-bar { padding: 16rpx 24rpx 0; white-space: nowrap; background: #fff; }
.filter-inner { display: flex; gap: 16rpx; padding-bottom: 16rpx; }
.filter-chip { padding: 12rpx 28rpx; border-radius: 28rpx; background: #F7FAFC; }
.filter-chip text { font-size: 24rpx; color: #718096; }
.filter-chip.active { background: linear-gradient(135deg, #4299E1, #2B6CB0); }
.filter-chip.active text { color: #fff; font-weight: 600; }
.job-list { flex: 1; height: calc(100vh - 200rpx); padding: 16rpx 24rpx; }
.job-card { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 16rpx; box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04); }
.job-top { display: flex; align-items: center; }
.job-emoji-wrap { width: 72rpx; height: 72rpx; border-radius: 16rpx; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-right: 16rpx; overflow: hidden; }
.job-emoji { font-size: 32rpx; }
.job-img { width: 72rpx; height: 72rpx; }
.job-main { flex: 1; min-width: 0; }
.job-title { font-size: 28rpx; font-weight: 700; color: #1A1A2E; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.job-company { font-size: 22rpx; color: #718096; margin-top: 4rpx; display: block; }
.job-hot { background: #FFF5F5; padding: 4rpx 12rpx; border-radius: 12rpx; flex-shrink: 0; }
.job-hot text { font-size: 20rpx; color: #E53E3E; font-weight: 600; }
.job-detail-row { display: flex; justify-content: space-between; align-items: center; margin-top: 12rpx; }
.job-location { font-size: 22rpx; color: #A0AEC0; }
.job-cat-tag { padding: 4rpx 14rpx; border-radius: 12rpx; background: #EBF4FF; }
.job-cat-tag text { font-size: 20rpx; color: #2B6CB0; }
.job-bottom { display: flex; justify-content: space-between; align-items: center; margin-top: 12rpx; }
.job-pay { font-size: 28rpx; color: #E53E3E; font-weight: 800; }
.job-apply-btn { padding: 8rpx 24rpx; border-radius: 20rpx; background: linear-gradient(135deg, #4299E1, #2B6CB0); }
.job-apply-btn text { font-size: 22rpx; color: #fff; font-weight: 600; }
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 100rpx 0; }
.empty-emoji { font-size: 72rpx; }
.empty-text { font-size: 26rpx; color: #A0AEC0; margin-top: 16rpx; }

/* Popup */
.popup-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 100; display: flex; align-items: flex-end; justify-content: center; }
.popup-body { width: 100%; max-height: 80vh; background: #fff; border-radius: 32rpx 32rpx 0 0; padding: 40rpx 32rpx; padding-bottom: calc(40rpx + env(safe-area-inset-bottom)); position: relative; overflow-y: auto; animation: slideUp 0.25s ease-out; }
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
.popup-close { position: absolute; top: 24rpx; right: 28rpx; width: 56rpx; height: 56rpx; border-radius: 50%; background: #F0F2F5; display: flex; align-items: center; justify-content: center; z-index: 10; }
.popup-close text { font-size: 28rpx; color: #718096; }
.popup-content { display: flex; flex-direction: column; align-items: center; }
.popup-emoji-wrap { width: 120rpx; height: 120rpx; border-radius: 28rpx; display: flex; align-items: center; justify-content: center; margin-bottom: 24rpx; overflow: hidden; }
.popup-emoji-icon { font-size: 56rpx; }
.popup-img { width: 120rpx; height: 120rpx; }
.popup-title { font-size: 34rpx; font-weight: 800; color: #1A1A2E; margin-bottom: 8rpx; }
.popup-company { font-size: 26rpx; color: #718096; margin-bottom: 28rpx; }
.popup-grid { display: flex; flex-wrap: wrap; gap: 20rpx; width: 100%; margin-bottom: 24rpx; }
.popup-field { width: calc(50% - 10rpx); background: #F7FAFC; border-radius: 16rpx; padding: 20rpx; }
.popup-label { font-size: 22rpx; color: #A0AEC0; display: block; margin-bottom: 6rpx; }
.popup-val { font-size: 28rpx; color: #2D3748; font-weight: 600; display: block; }
.popup-val.price { color: #E53E3E; font-weight: 800; }
.popup-desc { width: 100%; background: #F7FAFC; border-radius: 16rpx; padding: 24rpx; margin-bottom: 24rpx; }
.popup-desc-title { font-size: 24rpx; color: #718096; display: block; margin-bottom: 12rpx; }
.popup-desc-text { font-size: 26rpx; color: #4A5568; line-height: 40rpx; display: block; }
.popup-contact-btn { width: 100%; padding: 24rpx; background: linear-gradient(135deg, #4299E1, #2B6CB0); border-radius: 48rpx; text-align: center; }
.popup-contact-btn text { font-size: 28rpx; color: #fff; font-weight: 700; }
</style>
