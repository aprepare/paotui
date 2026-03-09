<template>
  <view class="detail-page" :class="{ 'no-scroll': showGroupSelector }">
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

    <!-- 企业微信进群引导（已加入的成员可见） -->
    <view class="section" v-if="isJoined && team.status !== 'ended' && team.status !== 'expired'">
      <text class="section-label">💬 加入组队群聊</text>
      <view class="wechat-card" @click="handleShowQrcode">
        <view class="wechat-icon-wrap">
          <text class="wechat-icon">🏢</text>
        </view>
        <view class="wechat-info">
          <text class="wechat-title">{{ qrcodeType === 'group' ? '扫码直接加入组队群聊' : '添加企业微信，自动发送进群链接' }}</text>
          <text class="wechat-desc">{{ qrcodeType === 'group' ? '点击查看二维码 · 扫码即可加入群聊' : '点击查看二维码 · 扫码添加后自动收到进群邀请' }}</text>
        </view>
        <text class="wechat-arrow">›</text>
      </view>
    </view>

    <!-- 企业微信二维码弹窗 -->
    <view class="qr-mask" v-if="showQrcode" @click="showQrcode = false">
      <view class="qr-popup" @click.stop>
        <view class="qr-close" @click="showQrcode = false"><text>✕</text></view>
        <text class="qr-title">{{ qrcodeType === 'group' ? '扫码加入组队群聊' : '扫码添加企业微信' }}</text>
        <text class="qr-subtitle">{{ qrcodeType === 'group' ? '扫描下方二维码即可直接加入群聊' : '添加后将自动发送活动群聊邀请链接' }}</text>
        <image class="qr-image" :src="qrcodeUrl" mode="aspectFit" v-if="qrcodeUrl" />
        <view class="qr-image qr-loading" v-else><text>正在获取专属二维码...</text></view>
        <text class="qr-tip">长按二维码可保存到相册</text>
      </view>
    </view>

    <!-- 选择企微群弹窗 -->
    <view class="qr-mask" v-if="showGroupSelector" @click="showGroupSelector = false">
      <view class="group-popup" @click.stop>
        <view class="qr-close" @click="showGroupSelector = false"><text>✕</text></view>
        <text class="qr-title">选择企微客户群</text>
        <text class="qr-subtitle">请选择一个要绑定到该活动的专属群聊</text>
        
        <scroll-view scroll-y class="group-list" v-if="wxGroups.length > 0">
          <view class="group-item" v-for="g in wxGroups" :key="g.chat_id" @click="onBindGroup(g.chat_id)">
            <view class="group-info">
               <text class="group-name">{{ g.name }}</text>
               <text class="group-count">共有 {{ g.member_count }} 名成员</text>
            </view>
            <view class="group-btn"><text>绑定</text></view>
          </view>
        </scroll-view>
        <view class="group-empty" v-else-if="!loadingGroups">
          <text>暂无可用群聊</text>
          <text class="group-empty-tip">请先在企业微信客户端创建一个客户群</text>
        </view>
        <view class="group-loading" v-else>
           <text>正在获取企微群列表...</text>
        </view>
      </view>
    </view>

    <!-- 底部操作 -->
    <view class="bottom-bar" v-if="team.status !== 'ended' && team.status !== 'expired'">
      <view v-if="team.isOwner" class="bottom-actions">
        <view class="bind-btn" @click="openGroupSelector"><text>{{ hasBoundGroup ? '修改绑定的群' : '绑定专属企微群' }}</text></view>
        <view class="end-btn" @click="onEndActivity"><text>结束活动</text></view>
      </view>
      <view v-else-if="isJoined" class="bottom-actions">
        <view class="wechat-group-btn" @click="handleShowQrcode"><text>加微信进群</text></view>
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
const showQrcode = ref(false)
const qrcodeUrl = ref('')
const qrcodeType = ref('contact') // 'contact' = 加好友码, 'group' = 进群码
const showGroupSelector = ref(false)
const wxGroups = ref([])
const loadingGroups = ref(false)
const hasBoundGroup = ref(false)

const handleShowQrcode = async () => {
  showQrcode.value = true
  if (!qrcodeUrl.value) {
    uni.showLoading({ title: '获取中' })
    const res = await callCloud('team', 'getGroupQrcode', { id: team.value._id })
    uni.hideLoading()
    if (res.code === 0 && res.data && res.data.qr_code) {
      qrcodeUrl.value = res.data.qr_code
      qrcodeType.value = res.data.type || 'contact'
    } else {
      uni.showToast({ title: res.msg || '获取二维码失败', icon: 'none' })
      showQrcode.value = false
    }
  }
}

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
    // 如果是发起人，查询是否已绑定群
    if (d.isOwner) {
      callCloud('team', 'getGroupStatus', { id: d._id }).then(res => {
        if (res.code === 0 && res.data) {
          hasBoundGroup.value = res.data.hasGroup
        }
      })
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

const openGroupSelector = async () => {
  showGroupSelector.value = true
  loadingGroups.value = true
  wxGroups.value = []
  const res = await callCloud('team', 'getGroupList', { id: team.value._id })
  loadingGroups.value = false
  if (res.code === 0 && res.data) {
    wxGroups.value = res.data.groups || []
  } else {
    uni.showToast({ title: res.msg || '获取群列表失败', icon: 'none' })
  }
}

const onBindGroup = (chatId) => {
  uni.showModal({
    title: '确认绑定',
    content: '确定将该群绑定为此活动的专属群吗？',
    success: async (modalRes) => {
      if (modalRes.confirm) {
        uni.showLoading({ title: '绑定中' })
        const res = await callCloud('team', 'bindGroup', { id: team.value._id, chatId })
        uni.hideLoading()
        if (res.code === 0) {
          uni.showToast({ title: '绑定成功', icon: 'success' })
          hasBoundGroup.value = true
          showGroupSelector.value = false
        } else {
          uni.showToast({ title: res.msg || '绑定失败', icon: 'none' })
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
.join-btn.disabled { background: #E2E8F0; box-shadow: none; }
.join-btn.disabled text { color: #A0AEC0; }
.bottom-actions { display: flex; gap: 16rpx; }
.bind-btn { flex: 1; border: 2rpx solid #3182CE; border-radius: 48rpx; padding: 28rpx; text-align: center; }
.bind-btn text { color: #3182CE; font-size: 30rpx; font-weight: 700; }
.end-btn { flex: 1; background: linear-gradient(135deg, #FC8181, #E53E3E); border-radius: 48rpx; padding: 28rpx; text-align: center; box-shadow: 0 8rpx 24rpx rgba(229,62,62,0.3); }
.end-btn text { color: #fff; font-size: 30rpx; font-weight: 700; }
.leave-btn { flex: 1; border: 2rpx solid #E53E3E; border-radius: 48rpx; padding: 28rpx; text-align: center; }
.leave-btn text { color: #E53E3E; font-size: 30rpx; font-weight: 700; }

/* 企业微信进群卡片 */
.wechat-card { background: #fff; border-radius: 20rpx; padding: 28rpx; display: flex; align-items: center; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.wechat-card:active { opacity: 0.8; }
.wechat-icon-wrap { width: 80rpx; height: 80rpx; border-radius: 20rpx; background: linear-gradient(135deg, #07C160, #06AD56); display: flex; align-items: center; justify-content: center; margin-right: 20rpx; flex-shrink: 0; }
.wechat-icon { font-size: 36rpx; }
.wechat-info { flex: 1; }
.wechat-title { font-size: 28rpx; color: #1A1A2E; font-weight: 700; display: block; }
.wechat-desc { font-size: 22rpx; color: #A0AEC0; margin-top: 4rpx; display: block; }
.wechat-arrow { font-size: 36rpx; color: #CBD5E0; font-weight: 300; }

/* 企业微信二维码弹窗 */
.qr-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 100; display: flex; align-items: center; justify-content: center; }
.qr-popup { width: 600rpx; background: #fff; border-radius: 28rpx; padding: 48rpx 40rpx; position: relative; display: flex; flex-direction: column; align-items: center; animation: fadeIn 0.2s ease; }
@keyframes fadeIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
.qr-close { position: absolute; top: 20rpx; right: 24rpx; width: 56rpx; height: 56rpx; border-radius: 50%; background: #F0F2F5; display: flex; align-items: center; justify-content: center; }
.qr-close text { font-size: 28rpx; color: #718096; }
.qr-title { font-size: 32rpx; font-weight: 800; color: #1A1A2E; margin-bottom: 8rpx; }
.qr-subtitle { font-size: 24rpx; color: #A0AEC0; margin-bottom: 32rpx; }
.qr-image { width: 400rpx; height: 400rpx; border-radius: 16rpx; margin-bottom: 28rpx; }
.qr-copy-row { display: flex; align-items: center; gap: 16rpx; margin-bottom: 20rpx; }
.qr-wechat-id { font-size: 24rpx; color: #4A5568; }
.qr-copy-btn { padding: 8rpx 24rpx; border-radius: 20rpx; background: #EBF4FF; }
.qr-copy-btn text { font-size: 22rpx; color: #2B6CB0; font-weight: 600; }
.qr-tip { font-size: 22rpx; color: #CBD5E0; }

/* 底部加微信进群按钮 */
.wechat-group-btn { flex: 1; background: linear-gradient(135deg, #07C160, #06AD56); border-radius: 48rpx; padding: 28rpx; text-align: center; box-shadow: 0 8rpx 24rpx rgba(7,193,96,0.3); }
.wechat-group-btn text { color: #fff; font-size: 30rpx; font-weight: 700; }

/* 企微群选择列表配置 */
.no-scroll { overflow: hidden; height: 100vh; }
.group-popup { width: 640rpx; max-height: 80vh; background: #fff; border-radius: 28rpx; padding: 48rpx 0 24rpx 0; position: relative; display: flex; flex-direction: column; align-items: center; animation: fadeIn 0.2s ease; }
.group-list { width: 100%; max-height: 50vh; padding: 0 32rpx; box-sizing: border-box; }
.group-item { display: flex; align-items: center; justify-content: space-between; padding: 24rpx; background: #F7FAFC; border-radius: 16rpx; margin-bottom: 16rpx; border: 2rpx solid transparent; transition: all 0.2s; }
.group-item:active { background: #EDF2F7; border-color: #CBD5E0; }
.group-info { flex: 1; display: flex; flex-direction: column; gap: 6rpx; }
.group-name { font-size: 28rpx; color: #1A1A2E; font-weight: 700; }
.group-count { font-size: 24rpx; color: #718096; }
.group-btn { background: #3182CE; padding: 10rpx 28rpx; border-radius: 32rpx; }
.group-btn text { color: #fff; font-size: 24rpx; font-weight: 600; }
.group-empty { padding: 60rpx 0; display: flex; flex-direction: column; align-items: center; gap: 12rpx; }
.group-empty text { font-size: 28rpx; color: #4A5568; font-weight: 600; }
.group-empty .group-empty-tip { font-size: 24rpx; color: #A0AEC0; font-weight: 400; }
.group-loading { padding: 60rpx 0; }
.group-loading text { font-size: 28rpx; color: #718096; }
</style>
