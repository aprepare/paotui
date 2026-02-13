<template>
  <view class="team-page">
    <view class="tab-bar">
      <view v-for="(tabName, i) in teamTabs" :key="tabName" class="tab-item" :class="{active: tab === i}" @click="tab = i">
        <text>{{ tabName }}</text>
        <view v-if="tab === i" class="tab-line"></view>
      </view>
    </view>

    <view class="team-list">
      <view v-for="item in filteredTeams" :key="item.id" class="team-card" @click="goDetail(item.id)">
        <view class="card-header">
          <text class="card-title">{{ item.title }}</text>
          <view class="card-tag" :class="item.tag === '热门' ? 'hot' : item.status === 'ended' ? 'ended' : ''">
            <text>{{ item.tag }}</text>
          </view>
        </view>
        <view class="card-meta">
          <view class="meta-item">
            <text class="meta-icon">👤</text>
            <text class="meta-val">{{ item.owner }}</text>
          </view>
          <view class="meta-item">
            <text class="meta-icon">📍</text>
            <text class="meta-val">{{ item.place }}</text>
          </view>
          <view class="meta-item">
            <text class="meta-icon">🕒</text>
            <text class="meta-val">{{ item.time }}</text>
          </view>
        </view>
        <view class="card-footer">
          <view class="people-info">
            <view class="people-bar">
              <view class="people-fill" :style="{width: (item.current/item.max*100)+'%'}"></view>
            </view>
            <text class="people-text">{{ item.current }}/{{ item.max }}人</text>
          </view>
          <view class="status-btn" :class="{ended: item.status === 'ended', full: item.current >= item.max && item.status !== 'ended'}">
            <text>{{ item.status === 'ended' ? '已结束' : item.current >= item.max ? '已满员' : '可加入' }}</text>
          </view>
        </view>

        <!-- 活动成果 -->
        <view v-if="item.status === 'ended' && item.photos && item.photos.length > 0" class="result-section">
          <text class="result-label">📸 活动成果</text>
          <scroll-view scroll-x class="result-scroll">
            <view class="result-photos">
              <image v-for="(photo, pi) in item.photos" :key="pi" class="result-photo" :src="photo" mode="aspectFill" @click.stop="previewPhoto(item.photos, pi)" />
            </view>
          </scroll-view>
        </view>
        <view v-if="item.status === 'ended' && item.isOwner" class="upload-area" @click.stop="uploadPhoto(item)">
          <text class="upload-icon">📷</text>
          <text class="upload-text">上传活动成果</text>
        </view>
      </view>

      <view v-if="filteredTeams.length === 0" class="empty">
        <text class="empty-emoji">🤝</text>
        <text class="empty-text">暂无组队信息</text>
      </view>
    </view>
    <ServiceFab />
    <!-- 发起组队按钮 -->
    <view class="create-fab" @click.stop="goCreate">
      <text class="create-fab-text">+ 发起组队</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import ServiceFab from '@/components/ServiceFab.vue'

const tab = ref(0)
const teamTabs = ref(['校园开黑', '球类竞技', '校园陪跑', '撸铁健身'])

const teamList = ref([
  { id: 1, type: '校园开黑', title: '王者荣耀五排缺2', owner: '小杰', place: '宿舍楼B区', time: '今晚20:00', current: 3, max: 5, tag: '热门', status: 'active', isOwner: false, photos: [] },
  { id: 2, type: '校园开黑', title: '原神深渊冲榜组队', owner: '阿洛', place: '线上语音', time: '周六14:00', current: 4, max: 4, tag: '已结束', status: 'ended', isOwner: true, photos: ['/static/logo.png', '/static/TeamWork.png'] },
  { id: 3, type: '球类竞技', title: '周末篮球友谊赛', owner: '篮球社', place: '南区篮球场', time: '周六16:00', current: 10, max: 10, tag: '已结束', status: 'ended', isOwner: true, photos: ['/static/TeamWork.png', '/static/logo.png', '/static/TeamWork.png'] },
  { id: 4, type: '球类竞技', title: '羽毛球双打搭子', owner: '小雨', place: '体育馆2号场', time: '明天19:30', current: 2, max: 4, tag: '热门', status: 'active', isOwner: false, photos: [] },
  { id: 5, type: '校园陪跑', title: '晨跑打卡7天挑战', owner: '跑团', place: '操场北门', time: '每天06:30', current: 20, max: 20, tag: '已结束', status: 'ended', isOwner: false, photos: ['/static/logo.png', '/static/TeamWork.png'] },
  { id: 6, type: '校园陪跑', title: '5km配速训练', owner: '阿飞', place: '田径场', time: '周三18:40', current: 4, max: 6, tag: '招募中', status: 'active', isOwner: false, photos: [] },
  { id: 7, type: '撸铁健身', title: '新手力量训练小组', owner: '健身社', place: '健身房A区', time: '周二/四19:00', current: 8, max: 8, tag: '已结束', status: 'ended', isOwner: true, photos: ['/static/TeamWork.png'] },
  { id: 8, type: '撸铁健身', title: '卧推进阶训练', owner: '阿森', place: '力量区3号台', time: '周五20:30', current: 3, max: 5, tag: '招募中', status: 'active', isOwner: false, photos: [] }
])

const filteredTeams = computed(() => teamList.value.filter(t => t.type === teamTabs.value[tab.value]))

onLoad((query) => {
  const idx = Number(query?.tab ?? 0)
  if (!Number.isNaN(idx) && idx >= 0 && idx < teamTabs.value.length) tab.value = idx
})

const previewPhoto = (photos, index) => { uni.previewImage({ urls: photos, current: photos[index] }) }

const goDetail = (id) => { uni.navigateTo({ url: '/pages/team/detail?id=' + id }) }

const goCreate = () => { uni.navigateTo({ url: '/pages/team/create' }) }

const uploadPhoto = (item) => {
  uni.chooseImage({
    count: 9, sizeType: ['compressed'], sourceType: ['album', 'camera'],
    success: (res) => {
      item.photos = [...item.photos, ...res.tempFilePaths]
      uni.showToast({ title: '上传成功', icon: 'success' })
    }
  })
}
</script>

<style scoped>
.team-page { background: #F0F2F5; min-height: 100vh; padding-bottom: 40rpx; }

.tab-bar { display: flex; background: #fff; box-shadow: 0 1rpx 0 #E2E8F0; }
.tab-item { flex: 1; text-align: center; padding: 28rpx 0 24rpx; font-size: 26rpx; color: #A0AEC0; font-weight: 500; position: relative; }
.tab-item.active { color: #2B6CB0; font-weight: 700; }
.tab-line { position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 48rpx; height: 6rpx; border-radius: 3rpx; background: linear-gradient(90deg, #4299E1, #2B6CB0); }

.team-list { padding: 20rpx 28rpx; }
.team-card { background: #fff; border-radius: 20rpx; padding: 28rpx; margin-bottom: 16rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); transition: transform 0.2s ease, box-shadow 0.2s ease; }
.team-card:active { transform: scale(0.98); box-shadow: 0 1rpx 4rpx rgba(0,0,0,0.08); }

.card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16rpx; }
.card-title { font-size: 30rpx; font-weight: 700; color: #1A1A2E; }
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
.status-btn { padding: 8rpx 24rpx; border-radius: 20rpx; background: linear-gradient(135deg, #4299E1, #2B6CB0); transition: transform 0.15s ease; }
.status-btn:active { transform: scale(0.92); }
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

.upload-area { margin-top: 16rpx; padding: 20rpx; background: #F7FAFC; border-radius: 14rpx; text-align: center; border: 2rpx dashed #CBD5E0; display: flex; align-items: center; justify-content: center; gap: 8rpx; transition: background 0.15s ease, border-color 0.15s ease; }
.upload-area:active { background: #EDF2F7; border-color: #A0AEC0; }
.upload-icon { font-size: 28rpx; }
.upload-text { font-size: 24rpx; color: #718096; font-weight: 600; }

.empty { display: flex; flex-direction: column; align-items: center; padding: 100rpx 0; }
.empty-emoji { font-size: 72rpx; margin-bottom: 12rpx; }
.empty-text { font-size: 26rpx; color: #A0AEC0; }

.create-fab { position: fixed; bottom: 140rpx; right: 32rpx; background: linear-gradient(135deg, #4299E1, #2B6CB0); border-radius: 40rpx; padding: 20rpx 36rpx; box-shadow: 0 8rpx 24rpx rgba(43,108,176,0.3); z-index: 99; transition: transform 0.2s ease, box-shadow 0.2s ease; }
.create-fab:active { transform: scale(0.92); box-shadow: 0 4rpx 12rpx rgba(43,108,176,0.4); }
.create-fab-text { color: #fff; font-size: 26rpx; font-weight: 700; }
</style>
