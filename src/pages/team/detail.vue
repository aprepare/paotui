<template>
  <view class="detail-page">
    <view class="info-card">
      <view class="card-header">
        <text class="card-title">{{ team.title }}</text>
        <view class="card-tag" :class="team.status === 'ended' ? 'ended' : team.tag === '热门' ? 'hot' : ''">
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
    <view class="bottom-bar" v-if="team.status !== 'ended' && team.current < team.max">
      <view class="join-btn" @click="onJoin"><text>加入组队</text></view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const team = ref({
  id: 1, title: '加载中...', owner: '', place: '', time: '', current: 0, max: 0, tag: '', status: 'active', photos: [], desc: '', images: []
})

const members = ref([
  { name: '小杰', avatar: '🧑' },
  { name: '阿洛', avatar: '👩' },
  { name: '小明', avatar: '🧑‍🎓' }
])

// mock 数据
const allTeams = [
  { id: 1, title: '王者荣耀五排缺2', owner: '小杰', place: '宿舍楼B区', time: '今晚20:00', current: 3, max: 5, tag: '热门', status: 'active', photos: [], desc: '冲王者段位，需要会玩辅助和打野的，最好有语音。段位钻石以上优先，来了直接开打！', images: [] },
  { id: 2, title: '原神深渊冲榜组队', owner: '阿洛', place: '线上语音', time: '周六14:00', current: 4, max: 4, tag: '已结束', status: 'ended', photos: ['/static/logo.png', '/static/TeamWork.png'], desc: '深渊12层满星挑战，需要有雷神、万叶等主流角色的大佬。', images: ['/static/TeamWork.png'] },
  { id: 3, title: '周末篮球友谊赛', owner: '篮球社', place: '南区篮球场', time: '周六16:00', current: 10, max: 10, tag: '已结束', status: 'ended', photos: ['/static/TeamWork.png', '/static/logo.png'], desc: '篮球社周末友谊赛，5v5全场，自备球鞋和水。赛后聚餐AA，欢迎各院系同学参加！', images: ['/static/TeamWork.png', '/static/logo.png'] },
  { id: 4, title: '羽毛球双打搭子', owner: '小雨', place: '体育馆2号场', time: '明天19:30', current: 2, max: 4, tag: '热门', status: 'active', photos: [], desc: '找两个羽毛球搭子打双打，水平不限，主要是锻炼身体开心就好。球拍我有多余的可以借。', images: [] },
  { id: 5, title: '晨跑打卡7天挑战', owner: '跑团', place: '操场北门', time: '每天06:30', current: 20, max: 20, tag: '已结束', status: 'ended', photos: ['/static/logo.png'], desc: '连续7天晨跑3公里打卡挑战，坚持完成的同学有小礼品。每天早上6:30操场北门集合。', images: ['/static/logo.png'] },
  { id: 6, title: '5km配速训练', owner: '阿飞', place: '田径场', time: '周三18:40', current: 4, max: 6, tag: '招募中', status: 'active', photos: [], desc: '目标配速5分30秒/公里，适合有一定跑步基础的同学。训练完一起拉伸放松。', images: [] },
  { id: 7, title: '新手力量训练小组', owner: '健身社', place: '健身房A区', time: '周二/四19:00', current: 8, max: 8, tag: '已结束', status: 'ended', photos: ['/static/TeamWork.png'], desc: '针对健身新手的力量训练课程，有教练带练，包含深蹲、硬拉、卧推三大项基础动作教学。', images: ['/static/TeamWork.png'] },
  { id: 8, title: '卧推进阶训练', owner: '阿森', place: '力量区3号台', time: '周五20:30', current: 3, max: 5, tag: '招募中', status: 'active', photos: [], desc: '卧推进阶训练，目标突破体重倍数。需要有半年以上训练基础，互相保护互相进步。', images: [] }
]

onLoad((query) => {
  const id = Number(query.id)
  const found = allTeams.find(t => t.id === id)
  if (found) team.value = found
})

const previewImages = (index) => {
  uni.previewImage({ urls: team.value.images, current: team.value.images[index] })
}

const previewPhoto = (index) => {
  uni.previewImage({ urls: team.value.photos, current: team.value.photos[index] })
}

const onJoin = () => {
  uni.showToast({ title: '已申请加入', icon: 'success' })
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
</style>
