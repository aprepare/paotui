<template>
  <view class="detail-page">
    <view class="info-card">
      <view class="card-header">
        <text class="card-title">{{ team.title }}</text>
        <view class="card-tag" :class="(team.status === 'ended' || team.status === 'expired') ? 'ended' : team.tag === '热门' ? 'hot' : ''">
          <text>{{ team.tag }}</text>
        </view>
      </view>
      <view class="card-meta">
        <view class="meta-item"><text class="meta-icon">👤</text><text class="meta-val">发起人：{{ team.owner }}</text></view>
        <view class="meta-item"><text class="meta-icon">📍</text><text class="meta-val">地点：{{ team.place }}</text></view>
        <view class="meta-item"><text class="meta-icon">🕒</text><text class="meta-val">时间：{{ team.time }}</text></view>
        <view class="meta-item"><text class="meta-icon">👥</text><text class="meta-val">人数：{{ team.current }}/{{ team.max }}人</text></view>
      </view>
    </view>

    <!-- 活动详情 -->
    <view class="section">
      <text class="section-label">活动详情</text>
      <view class="desc-card">
        <text class="desc-text">{{ team.desc || '暂无详情' }}</text>
      </view>
      <!-- 发布时上传的图片 -->
      <view class="photo-grid" v-if="team.images && team.images.length > 0">
        <image v-for="(img, i) in team.images" :key="'img'+i" class="photo-item" :src="img" mode="aspectFill" @click="previewImages(i)" />
      </view>
    </view>

    <!-- 成员列表 -->
    <view class="section">
      <text class="section-label">参与成员</text>
      <view class="member-list">
        <view class="member-item" v-for="(m, i) in members" :key="i">
          <text class="member-avatar">{{ m.avatar }}</text>
          <text class="member-name">{{ m.name }}</text>
        </view>
      </view>
    </view>

    <!-- 活动成果 -->
    <view class="section" v-if="team.photos && team.photos.length > 0">
      <text class="section-label">📸 活动成果</text>
      <view class="photo-grid">
        <image v-for="(p, i) in team.photos" :key="i" class="photo-item" :src="p" mode="aspectFill" @click="previewPhoto(i)" />
      </view>
    </view>

    <!-- 底部操作 -->
    <view class="bottom-bar" v-if="team.status !== 'ended' && team.status !== 'expired'">
      <view v-if="team.isOwner" class="bottom-actions">
        <view class="end-btn" @click="onEndActivity"><text>结束活动</text></view>
      </view>
      <view v-else-if="isJoined" class="bottom-actions">
        <view class="leave-btn" @click="onLeave"><text>退出组队</text></view>
      </view>
      <view v-else-if="team.current < team.max">
        <view class="join-btn" @click="onJoin"><text>加入组队</text></view>
      </view>
      <view v-else>
        <view class="join-btn disabled"><text>已满员</text></view>
      </view>
    </view>
    <view class="bottom-bar" v-else>
      <view class="join-btn disabled"><text>{{ team.status === 'expired' ? '活动已过期' : '活动已结束' }}</text></view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { callCloud } from '@/utils/cloud.js'

const team = ref({
  title: '加载中...', owner: '', place: '', time: '', current: 0, max: 0, tag: '', status: 'active', photos: [], desc: '', images: [], isOwner: false
})

const members = ref([])
const isJoined = ref(false)
const isExpired = ref(false)

onLoad(async (query) => {
  const id = query.id
  if (!id) return
  const res = await callCloud('team', 'detail', { id })
  if (res.code === 0) {
    var d = res.data
    d.photos = (d.photos || []).filter(function(p) { return p && typeof p === 'string' && p.indexOf('cloud://') === 0 })
    d.images = (d.images || []).filter(function(p) { return p && typeof p === 'string' && p.indexOf('cloud://') === 0 })
    // 检查是否过期
    if (d.time) {
      var dt = new Date(d.time.replace(/-/g, '/'))
      if (!isNaN(dt.getTime()) && dt.getTime() < Date.now()) {
        isExpired.value = true
        if (d.status !== 'ended') {
          d.status = 'expired'
          d.tag = '已过期'
        }
      }
    }
    team.value = d
    members.value = (d.members || []).map(m => ({
      name: m.name || '匿名',
      avatar: '🧑'
    }))
    // 检查当前用户是否已加入
    var userInfo = uni.getStorageSync('userInfo')
    var myOpenid = ''
    if (userInfo && userInfo.openid) myOpenid = userInfo.openid
    if (myOpenid && d.members) {
      for (var i = 0; i < d.members.length; i++) {
        if (d.members[i].openid === myOpenid) {
          isJoined.value = true
          break
        }
      }
    }
  }
})

const previewImages = (index) => {
  uni.previewImage({ urls: team.value.images, current: team.value.images[index] })
}

const previewPhoto = (index) => {
  uni.previewImage({ urls: team.value.photos, current: team.value.photos[index] })
}

const onJoin = async () => {
  const res = await callCloud('team', 'join', { activityId: team.value._id })
  if (res.code === 0) {
    uni.showToast({ title: '加入成功', icon: 'success' })
    team.value.current++
    isJoined.value = true
  } else {
    uni.showToast({ title: res.msg || '加入失败', icon: 'none' })
  }
}

const onLeave = () => {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出该组队吗？',
    success: async (modalRes) => {
      if (modalRes.confirm) {
        var res = await callCloud('team', 'leave', { activityId: team.value._id })
        if (res.code === 0) {
          isJoined.value = false
          team.value.current--
          uni.showToast({ title: '已退出', icon: 'success' })
        } else {
          uni.showToast({ title: res.msg || '退出失败', icon: 'none' })
        }
      }
    }
  })
}

const onEndActivity = () => {
  uni.showModal({
    title: '结束活动',
    content: '确定要结束该活动吗？结束后无法再加入新成员。',
    success: async (modalRes) => {
      if (modalRes.confirm) {
        var res = await callCloud('team', 'endActivity', { activityId: team.value._id })
        if (res.code === 0) {
          team.value.status = 'ended'
          team.value.tag = '已结束'
          uni.showToast({ title: '活动已结束', icon: 'success' })
        }
      }
    }
  })
}
</script>

<style scoped>
.detail-page { background: #F0F2F5; min-height: 100vh; padding-bottom: 140rpx; }

.info-card { background: #fff; margin: 20rpx 28rpx; border-radius: 20rpx; padding: 28rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20rpx; }
.card-title { font-size: 34rpx; font-weight: 800; color: #1A1A2E; }
.card-tag { padding: 6rpx 18rpx; border-radius: 20rpx; background: #EBF4FF; }
.card-tag text { font-size: 22rpx; color: #2B6CB0; font-weight: 600; }
.card-tag.hot { background: #FFF5F5; }
.card-tag.hot text { color: #E53E3E; }
.card-tag.ended { background: #EDF2F7; }
.card-tag.ended text { color: #A0AEC0; }

.card-meta { background: #F7FAFC; border-radius: 14rpx; padding: 20rpx 24rpx; }
.meta-item { display: flex; align-items: center; padding: 8rpx 0; }
.meta-icon { font-size: 24rpx; margin-right: 12rpx; }
.meta-val { font-size: 26rpx; color: #4A5568; font-weight: 500; }

.section { padding: 0 28rpx; margin-top: 24rpx; }
.section-label { font-size: 30rpx; font-weight: 700; color: #1A1A2E; display: block; margin-bottom: 16rpx; }

.member-list { display: flex; flex-wrap: wrap; gap: 20rpx; }
.member-item { display: flex; align-items: center; background: #fff; padding: 16rpx 24rpx; border-radius: 16rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.member-avatar { font-size: 32rpx; margin-right: 10rpx; }
.member-name { font-size: 26rpx; color: #2D3748; font-weight: 600; }

.photo-grid { display: flex; flex-wrap: wrap; gap: 14rpx; }
.photo-item { width: 210rpx; height: 210rpx; border-radius: 16rpx; }

.desc-card { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 16rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.desc-text { font-size: 26rpx; color: #4A5568; line-height: 1.8; }

.bottom-bar { position: fixed; bottom: 0; left: 0; right: 0; padding: 20rpx 28rpx; padding-bottom: calc(20rpx + env(safe-area-inset-bottom)); background: #fff; box-shadow: 0 -2rpx 8rpx rgba(0,0,0,0.04); }
.join-btn { background: linear-gradient(135deg, #4299E1, #2B6CB0); border-radius: 48rpx; padding: 28rpx; text-align: center; box-shadow: 0 8rpx 24rpx rgba(43,108,176,0.3); transition: transform 0.15s ease; }
.join-btn:active { transform: scale(0.96); }
.join-btn text { color: #fff; font-size: 30rpx; font-weight: 700; }
.join-btn.disabled { background: #E2E8F0; box-shadow: none; }
.join-btn.disabled text { color: #A0AEC0; }
.bottom-actions { display: flex; gap: 16rpx; }
.end-btn { flex: 1; background: linear-gradient(135deg, #FC8181, #E53E3E); border-radius: 48rpx; padding: 28rpx; text-align: center; box-shadow: 0 8rpx 24rpx rgba(229,62,62,0.3); }
.end-btn text { color: #fff; font-size: 30rpx; font-weight: 700; }
.leave-btn { flex: 1; border: 2rpx solid #E53E3E; border-radius: 48rpx; padding: 28rpx; text-align: center; }
.leave-btn text { color: #E53E3E; font-size: 30rpx; font-weight: 700; }
</style>
