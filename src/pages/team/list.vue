<template>
  <view class="team-list-page">
    <view class="tab-bar">
      <view v-for="(tabName, i) in teamTabs" :key="tabName" class="tab-item" :class="{active: tab === i}" @click="tab = i">
        <text>{{ tabName }}</text>
        <view v-if="tab === i" class="tab-line"></view>
      </view>
    </view>

    <view class="team-list">
      <view v-for="item in teamList" :key="item.id" class="team-card" @click="goDetail(item.id)">
        <view class="card-header">
          <text class="card-title">{{ item.title }}</text>
          <view class="card-tag" :class="item.tagClass">
            <text>{{ item.tag }}</text>
          </view>
        </view>
        <view class="card-meta">
          <view class="meta-item"><text class="meta-icon">👤</text><text class="meta-val">{{ item.owner }}</text></view>
          <view class="meta-item"><text class="meta-icon">📍</text><text class="meta-val">{{ item.place }}</text></view>
          <view class="meta-item"><text class="meta-icon">🕒</text><text class="meta-val">{{ item.time }}</text></view>
        </view>
        <view class="card-footer">
          <view class="people-info">
            <view class="people-bar">
              <view class="people-fill" :style="{width: (item.current/item.max*100)+'%'}"></view>
            </view>
            <text class="people-text">{{ item.current }}/{{ item.max }}人</text>
          </view>
          <view class="status-btn" :class="{ended: item.expired, full: !item.expired && item.current >= item.max}">
            <text>{{ item.expired ? (item.status === 'ended' ? '已结束' : '已过期') : item.current >= item.max ? '已满员' : '可加入' }}</text>
          </view>
        </view>

        <!-- 活动成果 -->
        <view v-if="item.expired && item.photos && item.photos.length > 0" class="result-section">
          <text class="result-label">📸 活动成果</text>
          <scroll-view scroll-x class="result-scroll">
            <view class="result-photos">
              <image v-for="(photo, pi) in item.photos" :key="pi" class="result-photo" :src="photo" mode="aspectFill" @click.stop="previewPhoto(item.photos, pi)" />
            </view>
          </scroll-view>
        </view>
        <view v-if="item.expired && item.isOwner" class="upload-area" @click.stop="uploadPhoto(item)">
          <text class="upload-icon">📷</text>
          <text class="upload-text">上传活动成果</text>
        </view>
      </view>

      <view v-if="teamList.length === 0" class="empty">
        <text class="empty-emoji">🤝</text>
        <text class="empty-text">暂无组队信息</text>
      </view>
    </view>

    <view class="create-fab" @click.stop="goCreate">
      <text class="create-fab-text">+ 发起组队</text>
    </view>
  </view>
</template>

<script setup>
import { ref, watch } from 'vue'
import { onLoad, onShow, onPullDownRefresh } from '@dcloudio/uni-app'
import { callCloud, uploadImages } from '@/utils/cloud.js'

const tab = ref(0)
const teamTabs = ['校园开黑', '球类竞技', '校园陪跑', '撸铁健身', '户外骑行', '其他活动']
const teamList = ref([])

const isExpired = (timeStr, status) => {
  if (status === 'ended') return true
  if (!timeStr) return false
  var d = new Date(timeStr.replace(/-/g, '/'))
  if (isNaN(d.getTime())) return false
  return d.getTime() < Date.now()
}

const loadTeams = async () => {
  var type = teamTabs[tab.value]
  var res = await callCloud('team', 'list', { type: type, page: 1, pageSize: 20 })
  if (res.code === 0) {
    teamList.value = res.data.map(function(t) {
      var expired = isExpired(t.time, t.status)
      var tag = t.tag || '招募中'
      var tagClass = ''
      if (expired) {
        tag = t.status === 'ended' ? '已结束' : '已过期'
        tagClass = 'ended'
      } else if (t.tag === '热门') {
        tagClass = 'hot'
      }
      return {
        ...t,
        id: t._id,
        expired: expired,
        tag: tag,
        tagClass: tagClass,
        photos: (t.photos || []).filter(function(p) { return p && typeof p === 'string' && p.indexOf('cloud://') === 0 }),
        images: (t.images || []).filter(function(p) { return p && typeof p === 'string' && p.indexOf('cloud://') === 0 })
      }
    })
  }
}

watch(tab, function() { loadTeams() })

onLoad(function(query) {
  var idx = Number(query && query.tab ? query.tab : 0)
  if (!isNaN(idx) && idx >= 0 && idx < teamTabs.length) tab.value = idx
  loadTeams()
})
onShow(function() { loadTeams() })
onPullDownRefresh(async function() {
  await loadTeams()
  uni.stopPullDownRefresh()
})

var previewPhoto = function(photos, index) { uni.previewImage({ urls: photos, current: photos[index] }) }
var goDetail = function(id) { uni.navigateTo({ url: '/pages/team/detail?id=' + id }) }
var goCreate = function() { uni.navigateTo({ url: '/pages/team/create' }) }

var uploadPhoto = async function(item) {
  uni.chooseImage({
    count: 9, sizeType: ['compressed'], sourceType: ['album', 'camera'],
    success: async function(res) {
      uni.showLoading({ title: '上传中...' })
      var fileIDs = await uploadImages(res.tempFilePaths, 'team-photos')
      await callCloud('team', 'uploadPhotos', { activityId: item._id, fileIDs: fileIDs })
      uni.hideLoading()
      uni.showToast({ title: '上传成功', icon: 'success' })
      loadTeams()
    }
  })
}
</script>

<style scoped>
.team-list-page { background: #F0F2F5; min-height: 100vh; padding-bottom: 140rpx; }

.tab-bar { display: flex; background: #fff; box-shadow: 0 1rpx 0 #E2E8F0; }
.tab-item { flex: 1; text-align: center; padding: 28rpx 0 24rpx; font-size: 24rpx; color: #A0AEC0; font-weight: 500; position: relative; }
.tab-item.active { color: #2B6CB0; font-weight: 700; }
.tab-line { position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 48rpx; height: 6rpx; border-radius: 3rpx; background: linear-gradient(90deg, #4299E1, #2B6CB0); }

.team-list { padding: 20rpx 28rpx; }
.team-card { background: #fff; border-radius: 20rpx; padding: 28rpx; margin-bottom: 16rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); transition: transform 0.2s ease; }
.team-card:active { transform: scale(0.98); }

.card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16rpx; }
.card-title { font-size: 30rpx; font-weight: 700; color: #1A1A2E; flex: 1; }
.card-tag { padding: 6rpx 18rpx; border-radius: 20rpx; background: #EBF4FF; }
.card-tag text { font-size: 22rpx; color: #2B6CB0; font-weight: 600; }
.card-tag.hot { background: #FFF5F5; }
.card-tag.hot text { color: #E53E3E; }
.card-tag.ended { background: #EDF2F7; }
.card-tag.ended text { color: #A0AEC0; }

.card-meta { background: #F7FAFC; border-radius: 14rpx; padding: 16rpx 20rpx; margin-bottom: 16rpx; }
.meta-item { display: flex; align-items: center; padding: 6rpx 0; }
.meta-icon { font-size: 22rpx; margin-right: 10rpx; }
.meta-val { font-size: 24rpx; color: #4A5568; font-weight: 500; }

.card-footer { display: flex; justify-content: space-between; align-items: center; }
.people-info { display: flex; align-items: center; flex: 1; margin-right: 20rpx; }
.people-bar { width: 120rpx; height: 8rpx; background: #EDF2F7; border-radius: 4rpx; margin-right: 12rpx; overflow: hidden; }
.people-fill { height: 100%; background: linear-gradient(90deg, #4299E1, #2B6CB0); border-radius: 4rpx; }
.people-text { font-size: 24rpx; color: #718096; font-weight: 600; }
.status-btn { padding: 8rpx 24rpx; border-radius: 20rpx; background: linear-gradient(135deg, #4299E1, #2B6CB0); }
.status-btn text { font-size: 22rpx; color: #fff; font-weight: 700; }
.status-btn.full { background: #EDF2F7; }
.status-btn.full text { color: #A0AEC0; }
.status-btn.ended { background: #F7FAFC; border: 1rpx solid #E2E8F0; }
.status-btn.ended text { color: #A0AEC0; }

.result-section { margin-top: 20rpx; padding-top: 20rpx; border-top: 1rpx solid #F7FAFC; }
.result-label { font-size: 24rpx; color: #4A5568; font-weight: 700; display: block; margin-bottom: 14rpx; }
.result-scroll { white-space: nowrap; }
.result-photos { display: flex; gap: 14rpx; }
.result-photo { width: 160rpx; height: 160rpx; border-radius: 14rpx; flex-shrink: 0; }

.upload-area { margin-top: 16rpx; padding: 20rpx; background: #F7FAFC; border-radius: 14rpx; text-align: center; border: 2rpx dashed #CBD5E0; display: flex; align-items: center; justify-content: center; gap: 8rpx; }
.upload-area:active { background: #EDF2F7; }
.upload-icon { font-size: 28rpx; }
.upload-text { font-size: 24rpx; color: #718096; font-weight: 600; }

.empty { display: flex; flex-direction: column; align-items: center; padding: 100rpx 0; }
.empty-emoji { font-size: 72rpx; margin-bottom: 12rpx; }
.empty-text { font-size: 26rpx; color: #A0AEC0; }

.create-fab { position: fixed; bottom: 48rpx; left: 28rpx; right: 28rpx; background: linear-gradient(135deg, #4299E1, #2B6CB0); border-radius: 52rpx; padding: 30rpx; text-align: center; box-shadow: 0 12rpx 32rpx rgba(43,108,176,0.35); }
.create-fab:active { transform: scale(0.96); }
.create-fab-text { color: #fff; font-size: 30rpx; font-weight: 700; letter-spacing: 2rpx; }
</style>