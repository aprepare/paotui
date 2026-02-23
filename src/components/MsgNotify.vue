<template>
  <view class="msg-notify" v-if="show" @click="goMessage">
    <view class="notify-card" :class="{ 'notify-enter': animIn }">
      <view class="notify-header">
        <view class="notify-icon-wrap" :style="'background:' + curMsg.iconBg">
          <text class="notify-icon">{{ curMsg.icon }}</text>
        </view>
        <view class="notify-info">
          <text class="notify-title">{{ curMsg.title }}</text>
          <text class="notify-time">{{ curMsg.timeText }}</text>
        </view>
        <view class="notify-close" @click.stop="dismiss">
          <text>×</text>
        </view>
      </view>
      <text class="notify-content">{{ curMsg.content }}</text>
      <view class="notify-footer" v-if="extraCount > 0">
        <text class="notify-extra">还有 {{ extraCount }} 条未读消息</text>
        <text class="notify-link">查看全部 ›</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { callCloud } from '@/utils/cloud.js'

var show = ref(false)
var animIn = ref(false)
var extraCount = ref(0)
var curMsg = reactive({ icon: '🔔', iconBg: '#718096', title: '', content: '', timeText: '', targetId: '', targetType: '' })

var iconMap = {
  like: '👍', comment: '💬',
  order_accept: '🏃', order_status: '📦', order_cancel: '❌'
}
var bgMap = {
  like: 'linear-gradient(135deg, #F6AD55, #DD6B20)',
  comment: 'linear-gradient(135deg, #63B3ED, #2B6CB0)',
  order_accept: 'linear-gradient(135deg, #68D391, #38A169)',
  order_status: 'linear-gradient(135deg, #B794F4, #805AD5)',
  order_cancel: 'linear-gradient(135deg, #FC8181, #E53E3E)'
}

var formatTime = (t) => {
  if (!t) return ''
  var d = new Date(t)
  if (isNaN(d.getTime())) return ''
  var now = new Date()
  var diff = now.getTime() - d.getTime()
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  return Math.floor(diff / 86400000) + '天前'
}

var checkUnread = async () => {
  var info = uni.getStorageSync('userInfo')
  if (!info || !info.name) return
  try {
    var res = await callCloud('message', 'list', { page: 1, pageSize: 1 })
    var countRes = await callCloud('message', 'unreadCount')
    var unread = (countRes.code === 0) ? (countRes.count || 0) : 0
    uni.setStorageSync('unreadMsgCount', unread)

    if (res.code === 0 && res.data && res.data.length > 0) {
      var msg = res.data[0]
      // 用本地存储记住已弹过的消息ID，每条只弹一次
      var shownId = uni.getStorageSync('lastShownMsgId') || ''
      if (!msg.read && msg._id !== shownId) {
        // 记住这条，下次不再弹
        uni.setStorageSync('lastShownMsgId', msg._id)

        var shortContent = msg.content || ''
        if (shortContent.length > 30) shortContent = shortContent.substring(0, 30) + '...'
        curMsg.icon = iconMap[msg.type] || '🔔'
        curMsg.iconBg = bgMap[msg.type] || 'linear-gradient(135deg, #A0AEC0, #718096)'
        curMsg.title = msg.title || '新消息'
        curMsg.content = shortContent
        curMsg.timeText = formatTime(msg.createTime)
        curMsg.targetId = msg.targetId || ''
        curMsg.targetType = msg.targetType || ''
        extraCount.value = unread > 1 ? unread - 1 : 0

        show.value = true
        setTimeout(function() { animIn.value = true }, 50)
        setTimeout(function() { dismiss() }, 6000)
      }
    }
  } catch (e) {
    // 静默
  }
}

var dismiss = () => {
  animIn.value = false
  setTimeout(function() { show.value = false }, 300)
}

var goMessage = () => {
  dismiss()
  var urlMap = {
    forum: '/pages/forum-sub/detail?id=',
    express: '/pages/express/detail?id=',
    errand: '/pages/errand/detail?id='
  }
  if (curMsg.targetId && urlMap[curMsg.targetType]) {
    uni.navigateTo({ url: urlMap[curMsg.targetType] + curMsg.targetId })
  } else {
    uni.navigateTo({ url: '/pages/message/index' })
  }
}

onShow(() => { checkUnread() })
</script>

<style scoped>
.msg-notify {
  position: fixed;
  top: 20rpx;
  left: 20rpx;
  right: 20rpx;
  z-index: 9999;
  pointer-events: auto;
}
.notify-card {
  background: rgba(255, 255, 255, 0.97);
  border-radius: 24rpx;
  padding: 24rpx;
  box-shadow: 0 8rpx 40rpx rgba(0,0,0,0.15), 0 2rpx 8rpx rgba(0,0,0,0.08);
  border: 1rpx solid rgba(0,0,0,0.05);
  opacity: 0;
  transform: translateY(-30rpx);
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.notify-card.notify-enter {
  opacity: 1;
  transform: translateY(0);
}
.notify-header {
  display: flex;
  align-items: center;
}
.notify-icon-wrap {
  width: 56rpx;
  height: 56rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16rpx;
  flex-shrink: 0;
}
.notify-icon { font-size: 28rpx; }
.notify-info { flex: 1; }
.notify-title {
  font-size: 26rpx;
  font-weight: 700;
  color: #1A1A2E;
  display: block;
}
.notify-time {
  font-size: 20rpx;
  color: #A0AEC0;
  display: block;
  margin-top: 2rpx;
}
.notify-close {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: #F0F2F5;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.notify-close text {
  font-size: 26rpx;
  color: #718096;
  line-height: 1;
}
.notify-close:active { background: #E2E8F0; }
.notify-content {
  font-size: 24rpx;
  color: #4A5568;
  line-height: 1.5;
  margin-top: 12rpx;
  display: block;
  padding-left: 72rpx;
}
.notify-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12rpx;
  padding-top: 12rpx;
  border-top: 1rpx solid #EDF2F7;
  padding-left: 72rpx;
}
.notify-extra {
  font-size: 22rpx;
  color: #A0AEC0;
  font-weight: 500;
}
.notify-link {
  font-size: 22rpx;
  color: #2B6CB0;
  font-weight: 600;
}
</style>
