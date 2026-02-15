<template>
  <view class="team-page">
    <!-- 分类入口 -->
    <view class="cat-grid">
      <view class="cat-card" v-for="cat in categories" :key="cat.title" @click="goList(cat.type)">
        <view class="cat-icon-wrap" :style="{background: cat.gradient}">
          <text class="cat-emoji">{{ cat.icon }}</text>
        </view>
        <view class="cat-text">
          <text class="cat-title">{{ cat.title }}</text>
          <text class="cat-desc">{{ cat.desc }}</text>
        </view>
      </view>
    </view>

    <!-- 发起组队横幅 -->
    <view class="create-banner" @click="goCreate">
      <view class="banner-content">
        <text class="banner-icon">🤝</text>
        <view class="banner-text">
          <text class="banner-title">发起组队</text>
          <text class="banner-sub">找到志同道合的小伙伴，一起运动</text>
        </view>
      </view>
      <text class="banner-arrow">›</text>
    </view>

    <!-- 推荐活动 纵向轮播 -->
    <view class="feed-section">
      <view class="feed-header">
        <text class="feed-title">推荐活动</text>
        <text class="feed-more" @click="goList('')">更多 ›</text>
      </view>
      <view v-if="hotList.length === 0" class="empty-feed">
        <text class="empty-emoji">🤝</text>
        <text class="empty-text">暂无推荐活动</text>
      </view>
      <swiper v-else class="feed-swiper" vertical autoplay circular :interval="3000" :duration="600" indicator-dots indicator-color="rgba(43,108,176,0.2)" indicator-active-color="#2B6CB0">
        <swiper-item v-for="item in hotList" :key="item.id">
          <view class="feed-card" @click="goDetail(item.id)">
            <view class="feed-img" :style="{background: item.bg}">
              <text class="feed-img-emoji">{{ item.emoji }}</text>
              <view class="feed-tag" v-if="item.tagText">
                <text>{{ item.tagText }}</text>
              </view>
            </view>
            <view class="feed-info">
              <text class="feed-item-title">{{ item.title }}</text>
              <text class="feed-owner">👤 {{ item.owner }}</text>
              <view class="feed-meta-row">
                <text class="feed-location">📍 {{ item.place }}</text>
                <text class="feed-time">🕒 {{ item.time }}</text>
              </view>
              <view class="feed-bottom">
                <view class="feed-people">
                  <view class="people-bar">
                    <view class="people-fill" :style="{width: (item.current/item.max*100)+'%'}"></view>
                  </view>
                  <text class="people-text">{{ item.current }}/{{ item.max }}人</text>
                </view>
                <view class="feed-status-btn" :class="{ended: item.expired, full: !item.expired && item.current >= item.max}">
                  <text>{{ item.expired ? '已结束' : item.current >= item.max ? '已满员' : '可加入' }}</text>
                </view>
              </view>
            </view>
          </view>
        </swiper-item>
      </swiper>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { callCloud } from '@/utils/cloud.js'

const categories = ref([
  { icon: '🎮', title: '校园开黑', desc: '组队上分', type: '校园开黑', gradient: 'linear-gradient(135deg, #667eea, #764ba2)' },
  { icon: '⚽', title: '球类竞技', desc: '篮球/足球/羽毛球', type: '球类竞技', gradient: 'linear-gradient(135deg, #4299E1, #2B6CB0)' },
  { icon: '🏃', title: '校园陪跑', desc: '一起锻炼', type: '校园陪跑', gradient: 'linear-gradient(135deg, #48BB78, #38A169)' },
  { icon: '💪', title: '撸铁健身', desc: '健身搭子', type: '撸铁健身', gradient: 'linear-gradient(135deg, #ED8936, #DD6B20)' },
  { icon: '🚴', title: '户外骑行', desc: '骑行探索', type: '户外骑行', gradient: 'linear-gradient(135deg, #38B2AC, #2C7A7B)' },
  { icon: '🎯', title: '其他活动', desc: '更多精彩', type: '其他活动', gradient: 'linear-gradient(135deg, #f093fb, #f5576c)' }
])

const typeEmojiMap = { '校园开黑': '🎮', '球类竞技': '⚽', '校园陪跑': '🏃', '撸铁健身': '💪', '户外骑行': '🚴', '其他活动': '🎯' }
const typeBgMap = {
  '校园开黑': 'linear-gradient(135deg, #a18cd1, #fbc2eb)',
  '球类竞技': 'linear-gradient(135deg, #89f7fe, #66a6ff)',
  '校园陪跑': 'linear-gradient(135deg, #d4fc79, #96e6a1)',
  '撸铁健身': 'linear-gradient(135deg, #ffecd2, #fcb69f)',
  '户外骑行': 'linear-gradient(135deg, #43e97b, #38f9d7)',
  '其他活动': 'linear-gradient(135deg, #fbc2eb, #a6c1ee)'
}

const hotList = ref([])

const isExpired = (timeStr, status) => {
  if (status === 'ended') return true
  if (!timeStr) return false
  var d = new Date(timeStr.replace(/-/g, '/'))
  if (isNaN(d.getTime())) return false
  return d.getTime() < Date.now()
}

const loadHot = async () => {
  var res = await callCloud('team', 'list', { page: 1, pageSize: 10 })
  if (res.code === 0) {
    hotList.value = res.data.map(function(t) {
      var expired = isExpired(t.time, t.status)
      var tagText = ''
      if (t.current >= t.max && !expired) tagText = '🔥 火热'
      else if (!expired && t.current >= t.max * 0.7) tagText = '🔥 快满员'
      return {
        id: t._id,
        title: t.title || '',
        owner: t.owner || '匿名',
        place: t.place || '',
        time: t.time || '',
        current: t.current || 0,
        max: t.max || 10,
        type: t.type || '',
        expired: expired,
        emoji: typeEmojiMap[t.type] || '🎯',
        bg: typeBgMap[t.type] || 'linear-gradient(135deg, #a1c4fd, #c2e9fb)',
        tagText: tagText
      }
    })
  }
}

onShow(() => { loadHot() })

const goList = (type) => {
  var idx = 0
  var types = ['校园开黑', '球类竞技', '校园陪跑', '撸铁健身', '户外骑行', '其他活动']
  for (var i = 0; i < types.length; i++) {
    if (types[i] === type) { idx = i; break }
  }
  uni.navigateTo({ url: '/pages/team/list?tab=' + idx })
}
const goDetail = (id) => { uni.navigateTo({ url: '/pages/team/detail?id=' + id }) }
const goCreate = () => { uni.navigateTo({ url: '/pages/team/create' }) }
</script>

<style scoped>
.team-page { background: #F0F2F5; min-height: 100vh; padding-bottom: 40rpx; }

/* 分类入口 */
.cat-grid { display: flex; flex-wrap: wrap; padding: 24rpx 24rpx 0; gap: 16rpx; }
.cat-card { width: 218rpx; background: #fff; border-radius: 20rpx; padding: 24rpx 16rpx; display: flex; flex-direction: column; align-items: center; box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04), 0 1rpx 4rpx rgba(0,0,0,0.06); transition: transform 0.2s ease, box-shadow 0.2s ease; }
.cat-card:active { transform: scale(0.96); box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.08); }
.cat-icon-wrap { width: 80rpx; height: 80rpx; border-radius: 20rpx; display: flex; align-items: center; justify-content: center; margin-bottom: 12rpx; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08); }
.cat-emoji { font-size: 36rpx; }
.cat-text { display: flex; flex-direction: column; align-items: center; }
.cat-title { font-size: 26rpx; font-weight: 700; color: #1A1A2E; display: block; }
.cat-desc { font-size: 20rpx; color: #A0AEC0; margin-top: 4rpx; display: block; }

/* 发起组队横幅 */
.create-banner { margin: 24rpx 24rpx 0; background: linear-gradient(135deg, #4299E1 0%, #2B6CB0 50%, #1A4F8B 100%); border-radius: 20rpx; padding: 36rpx 32rpx; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 8rpx 24rpx rgba(43,108,176,0.25); transition: transform 0.2s ease; }
.create-banner:active { transform: scale(0.98); }
.banner-content { display: flex; align-items: center; }
.banner-icon { font-size: 48rpx; margin-right: 20rpx; }
.banner-text { display: flex; flex-direction: column; }
.banner-title { font-size: 34rpx; font-weight: 800; color: #fff; letter-spacing: 2rpx; }
.banner-sub { font-size: 22rpx; color: rgba(255,255,255,0.8); margin-top: 6rpx; }
.banner-arrow { font-size: 36rpx; color: rgba(255,255,255,0.7); font-weight: 300; }

/* 推荐活动轮播 */
.feed-section { padding: 24rpx 24rpx 0; }
.feed-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20rpx; }
.feed-title { font-size: 32rpx; font-weight: 700; color: #1A1A2E; letter-spacing: 1rpx; }
.feed-more { font-size: 24rpx; color: #2B6CB0; font-weight: 600; }
.feed-swiper { height: 560rpx; }
.feed-card { background: #fff; border-radius: 20rpx; overflow: hidden; margin: 0 4rpx 16rpx; box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06), 0 1rpx 4rpx rgba(0,0,0,0.04); }
.feed-img { height: 240rpx; display: flex; align-items: center; justify-content: center; position: relative; }
.feed-img-emoji { font-size: 88rpx; }
.feed-tag { position: absolute; top: 16rpx; left: 16rpx; background: rgba(255,255,255,0.92); padding: 6rpx 18rpx; border-radius: 20rpx; backdrop-filter: blur(4px); }
.feed-tag text { font-size: 22rpx; color: #E53E3E; font-weight: 700; }
.feed-info { padding: 20rpx 24rpx 24rpx; }
.feed-item-title { font-size: 30rpx; font-weight: 700; color: #1A1A2E; display: block; }
.feed-owner { font-size: 24rpx; color: #718096; margin-top: 6rpx; display: block; }
.feed-meta-row { display: flex; gap: 24rpx; margin-top: 8rpx; }
.feed-location { font-size: 22rpx; color: #A0AEC0; }
.feed-time { font-size: 22rpx; color: #A0AEC0; }
.feed-bottom { display: flex; justify-content: space-between; align-items: center; margin-top: 14rpx; }
.feed-people { display: flex; align-items: center; }
.people-bar { width: 120rpx; height: 8rpx; background: #EDF2F7; border-radius: 4rpx; margin-right: 12rpx; overflow: hidden; }
.people-fill { height: 100%; background: linear-gradient(90deg, #4299E1, #2B6CB0); border-radius: 4rpx; }
.people-text { font-size: 24rpx; color: #718096; font-weight: 600; }
.feed-status-btn { padding: 10rpx 28rpx; border-radius: 24rpx; background: linear-gradient(135deg, #4299E1, #2B6CB0); box-shadow: 0 4rpx 12rpx rgba(43,108,176,0.25); }
.feed-status-btn text { font-size: 22rpx; color: #fff; font-weight: 700; }
.feed-status-btn.full { background: #EDF2F7; box-shadow: none; }
.feed-status-btn.full text { color: #A0AEC0; }
.feed-status-btn.ended { background: #F7FAFC; border: 1rpx solid #E2E8F0; box-shadow: none; }
.feed-status-btn.ended text { color: #A0AEC0; }

.empty-feed { display: flex; flex-direction: column; align-items: center; padding: 80rpx 0; }
.empty-emoji { font-size: 72rpx; margin-bottom: 12rpx; }
.empty-text { font-size: 26rpx; color: #A0AEC0; }
</style>