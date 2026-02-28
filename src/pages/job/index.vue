<template>
  <view class="job-page">
    <!-- 联系客服发布招聘 -->
    <view class="publish-recruit-btn" @click="onPublishRecruit">
      <text class="publish-recruit-icon">📢</text>
      <text class="publish-recruit-text">联系客服发布招聘信息</text>
      <text class="publish-recruit-arrow">›</text>
    </view>

    <!-- 分类入口 2x2 -->
    <view class="cat-grid">
      <view class="cat-card" v-for="cat in categories" :key="cat.title" @click="onCatTap(cat)">
        <view class="cat-icon-wrap" :style="{background: cat.gradient}">
          <text class="cat-emoji">{{ cat.icon }}</text>
        </view>
        <text class="cat-title">{{ cat.title }}</text>
        <text class="cat-desc">{{ cat.desc }}</text>
      </view>
    </view>

    <!-- 寒暑假兼职横幅 -->
    <view class="season-banner" @click="onSeasonTap">
      <view class="season-content">
        <text class="season-icon">🌴</text>
        <view class="season-text">
          <text class="season-title">寒暑假兼职</text>
          <text class="season-sub">精选假期好岗位，安全有保障</text>
        </view>
      </view>
      <text class="season-arrow">›</text>
    </view>

    <!-- 热门兼职 纵向轮播 -->
    <view class="feed-section">
      <view class="feed-header">
        <text class="feed-title">热门兼职</text>
        <text class="feed-more" @click="onMoreTap">更多 ›</text>
      </view>
      <swiper class="feed-swiper" vertical autoplay circular :interval="3000" :duration="600" indicator-dots indicator-color="rgba(43,108,176,0.2)" indicator-active-color="#2B6CB0">
        <swiper-item v-for="job in jobList" :key="job.id">
          <view class="feed-card" @click="onJobTap(job)">
            <view class="feed-img" :style="{background: job.bg}">
              <text class="feed-img-emoji">{{ job.emoji }}</text>
              <view class="feed-tag" v-if="job.hot">
                <text>🔥 热招</text>
              </view>
            </view>
            <view class="feed-info">
              <text class="feed-job-title">{{ job.title }}</text>
              <text class="feed-company">{{ job.company }}</text>
              <view class="feed-meta-row">
                <text class="feed-location">📍 {{ job.location }}</text>
              </view>
              <view class="feed-bottom">
                <text class="feed-pay">{{ job.pay }}</text>
                <view class="feed-apply-btn">
                  <text>查看详情</text>
                </view>
              </view>
            </view>
          </view>
        </swiper-item>
      </swiper>
    </view>
    <!-- 详情弹出层 -->
    <view class="popup-mask" v-if="showDetail" @click="showDetail = false">
      <view class="popup-body" @click.stop>
        <view class="popup-close" @click="showDetail = false"><text>✕</text></view>
        <view class="popup-content" v-if="detailJob">
          <view class="popup-emoji-wrap" :style="{background: detailJob.bg}">
            <text class="popup-emoji-icon">{{ detailJob.emoji }}</text>
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
          </view>
          <view class="popup-tip">
            <text>📌 详细信息即将上线，敬请期待</text>
          </view>
        </view>
      </view>
    </view>
    <MsgNotify />
      <CustomTabBar :current="1" />
  </view>
</template>

<script setup>
import CustomTabBar from '@/components/CustomTabBar.vue'
import { onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'
import MsgNotify from '@/components/MsgNotify.vue'

const categories = ref([
  { icon: '📚', title: '家教信息', desc: '一对一辅导', gradient: 'linear-gradient(135deg, #667eea, #764ba2)' },
  { icon: '🏫', title: '校内兼职', desc: '图书馆/食堂', gradient: 'linear-gradient(135deg, #4299E1, #2B6CB0)' },
  { icon: '🏖️', title: '阿那亚兼职', desc: '海边度假区', gradient: 'linear-gradient(135deg, #f093fb, #f5576c)' },
  { icon: '🏡', title: '阿尔卡迪亚兼职', desc: '社区服务', gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)' }
])

const jobList = ref([
  { id: 1, title: '周末家教 数学辅导', company: '家长直招', location: '线上/线下均可', pay: '¥120/小时', emoji: '📐', bg: 'linear-gradient(135deg, #a18cd1, #fbc2eb)', hot: true },
  { id: 2, title: '图书馆整理员', company: '校图书馆', location: '图书馆三楼', pay: '¥20/小时', emoji: '📖', bg: 'linear-gradient(135deg, #89f7fe, #66a6ff)', hot: false },
  { id: 3, title: '咖啡店周末兼职', company: '瑞幸咖啡', location: '北门商圈', pay: '¥130/天', emoji: '☕', bg: 'linear-gradient(135deg, #ffecd2, #fcb69f)', hot: true },
  { id: 4, title: '校园配送骑手', company: '校园跑腿平台', location: '全校范围', pay: '¥5-15/单', emoji: '🚴', bg: 'linear-gradient(135deg, #a1c4fd, #c2e9fb)', hot: false },
  { id: 5, title: '暑期游泳教练助理', company: '校游泳馆', location: '体育中心', pay: '¥150/天', emoji: '🏊', bg: 'linear-gradient(135deg, #d4fc79, #96e6a1)', hot: true },
  { id: 6, title: '社团活动摄影师', company: '学生会', location: '学生活动中心', pay: '¥200/场', emoji: '📸', bg: 'linear-gradient(135deg, #fbc2eb, #a6c1ee)', hot: false }
])

const onCatTap = (cat) => {
  const routeMap = {
    '家教信息': '/pages/job-sub/tutor',
    '校内兼职': '/pages/job-sub/campus',
    '阿那亚兼职': '/pages/job-sub/anaya',
    '阿尔卡迪亚兼职': '/pages/job-sub/arcadia'
  }
  const url = routeMap[cat.title]
  if (url) {
    uni.navigateTo({ url })
    return
  }
  uni.showModal({
    title: cat.title,
    content: cat.title + '分类下的岗位正在收录中，敬请期待',
    showCancel: false
  })
}
const onSeasonTap = () => {
  uni.navigateTo({ url: '/pages/job-sub/seasonal' })
}
const onMoreTap = () => {
  uni.navigateTo({ url: '/pages/job-sub/all' })
}
const showDetail = ref(false)
const detailJob = ref(null)

const onJobTap = (job) => {
  detailJob.value = job
  showDetail.value = true
}

const onPublishRecruit = () => {
  uni.navigateTo({ url: '/pages/kefu/show?img=' + encodeURIComponent('/static/TeamWork.jpg') })
}

onShow(() => {
  uni.hideTabBar({ animation: false })
  })
</script>

<style scoped>
.job-page { background: #F0F2F5; min-height: 100vh; padding-bottom: 40rpx; }

/* 分类入口 2x2 */
.cat-grid { display: flex; flex-wrap: wrap; padding: 24rpx 24rpx 0; gap: 16rpx; }
.cat-card { width: 336rpx; background: #fff; border-radius: 20rpx; padding: 28rpx 24rpx; display: flex; align-items: center; box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04), 0 1rpx 4rpx rgba(0,0,0,0.06); transition: transform 0.2s ease, box-shadow 0.2s ease; }
.cat-card:active { transform: scale(0.96); box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.08); }
.cat-icon-wrap { width: 80rpx; height: 80rpx; border-radius: 20rpx; display: flex; align-items: center; justify-content: center; margin-right: 18rpx; flex-shrink: 0; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08); }
.cat-emoji { font-size: 36rpx; }
.cat-title { font-size: 28rpx; font-weight: 700; color: #1A1A2E; display: block; }
.cat-desc { font-size: 22rpx; color: #A0AEC0; margin-top: 4rpx; display: block; }

/* 寒暑假横幅 */
.season-banner { margin: 24rpx 24rpx 0; background: linear-gradient(135deg, #FF9A56 0%, #FF6B6B 50%, #EE5A6F 100%); border-radius: 20rpx; padding: 36rpx 32rpx; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 8rpx 24rpx rgba(238,90,111,0.25); transition: transform 0.2s ease; }
.season-banner:active { transform: scale(0.98); }
.season-content { display: flex; align-items: center; }
.season-icon { font-size: 48rpx; margin-right: 20rpx; }
.season-text { display: flex; flex-direction: column; }
.season-title { font-size: 34rpx; font-weight: 800; color: #fff; letter-spacing: 2rpx; }
.season-sub { font-size: 22rpx; color: rgba(255,255,255,0.8); margin-top: 6rpx; }
.season-arrow { font-size: 36rpx; color: rgba(255,255,255,0.7); font-weight: 300; }

/* 热门兼职轮播 */
.feed-section { padding: 24rpx 24rpx 0; }
.feed-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20rpx; }
.feed-title { font-size: 32rpx; font-weight: 700; color: #1A1A2E; letter-spacing: 1rpx; }
.feed-more { font-size: 24rpx; color: #2B6CB0; font-weight: 600; }
.feed-swiper { height: 560rpx; }
.feed-card { background: #fff; border-radius: 20rpx; overflow: hidden; margin: 0 4rpx 16rpx; box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06), 0 1rpx 4rpx rgba(0,0,0,0.04); }
.feed-img { height: 280rpx; display: flex; align-items: center; justify-content: center; position: relative; }
.feed-img-emoji { font-size: 88rpx; }
.feed-tag { position: absolute; top: 16rpx; left: 16rpx; background: rgba(255,255,255,0.92); padding: 6rpx 18rpx; border-radius: 20rpx; backdrop-filter: blur(4px); }
.feed-tag text { font-size: 22rpx; color: #E53E3E; font-weight: 700; }
.feed-info { padding: 20rpx 24rpx 24rpx; }
.feed-job-title { font-size: 30rpx; font-weight: 700; color: #1A1A2E; display: block; }
.feed-company { font-size: 24rpx; color: #718096; margin-top: 6rpx; display: block; }
.feed-meta-row { margin-top: 8rpx; }
.feed-location { font-size: 22rpx; color: #A0AEC0; }
.feed-bottom { display: flex; justify-content: space-between; align-items: center; margin-top: 14rpx; }
.feed-pay { font-size: 32rpx; color: #E53E3E; font-weight: 800; }
.feed-apply-btn { padding: 10rpx 28rpx; border-radius: 24rpx; background: linear-gradient(135deg, #4299E1, #2B6CB0); box-shadow: 0 4rpx 12rpx rgba(43,108,176,0.25); }
.feed-apply-btn text { font-size: 22rpx; color: #fff; font-weight: 700; }

/* 发布招聘按钮 */
.publish-recruit-btn { margin: 24rpx 24rpx 0; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 16rpx; padding: 28rpx 32rpx; display: flex; align-items: center; box-shadow: 0 8rpx 24rpx rgba(102,126,234,0.25); }
.publish-recruit-btn:active { transform: scale(0.98); opacity: 0.9; }
.publish-recruit-icon { font-size: 40rpx; margin-right: 16rpx; }
.publish-recruit-text { flex: 1; font-size: 30rpx; font-weight: 700; color: #fff; letter-spacing: 1rpx; }
.publish-recruit-arrow { font-size: 36rpx; color: rgba(255,255,255,0.7); font-weight: 300; }

/* Popup */
.popup-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 100; display: flex; align-items: flex-end; justify-content: center; }
.popup-body { width: 100%; max-height: 80vh; background: #fff; border-radius: 32rpx 32rpx 0 0; padding: 40rpx 32rpx; padding-bottom: calc(40rpx + env(safe-area-inset-bottom)); position: relative; overflow-y: auto; animation: slideUp 0.25s ease-out; }
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
.popup-close { position: absolute; top: 24rpx; right: 28rpx; width: 56rpx; height: 56rpx; border-radius: 50%; background: #F0F2F5; display: flex; align-items: center; justify-content: center; }
.popup-close text { font-size: 28rpx; color: #718096; }
.popup-content { display: flex; flex-direction: column; align-items: center; }
.popup-emoji-wrap { width: 120rpx; height: 120rpx; border-radius: 28rpx; display: flex; align-items: center; justify-content: center; margin-bottom: 24rpx; }
.popup-emoji-icon { font-size: 56rpx; }
.popup-title { font-size: 34rpx; font-weight: 800; color: #1A1A2E; margin-bottom: 8rpx; }
.popup-company { font-size: 26rpx; color: #718096; margin-bottom: 28rpx; }
.popup-grid { display: flex; flex-wrap: wrap; gap: 20rpx; width: 100%; margin-bottom: 24rpx; }
.popup-field { width: calc(50% - 10rpx); background: #F7FAFC; border-radius: 16rpx; padding: 20rpx; }
.popup-label { font-size: 22rpx; color: #A0AEC0; display: block; margin-bottom: 6rpx; }
.popup-val { font-size: 28rpx; color: #2D3748; font-weight: 600; display: block; }
.popup-val.price { color: #E53E3E; font-weight: 800; }
.popup-tip { background: #FFFAF0; border-radius: 12rpx; padding: 20rpx; width: 100%; text-align: center; }
.popup-tip text { font-size: 24rpx; color: #DD6B20; }
</style>
