<template>
  <view class="msg-page">
    <!-- 顶部操作栏 -->
    <view class="top-bar">
      <text class="top-title">消息中心</text>
      <view class="top-actions" v-if="list.length > 0">
        <view class="mark-all-btn" @click="markAllRead">
          <text>全部已读</text>
        </view>
        <view class="delete-all-btn" @click="deleteAll">
          <text>一键删除</text>
        </view>
      </view>
    </view>

    <!-- 消息列表 -->
    <view class="msg-list" v-if="list.length > 0">
      <view
        v-for="item in list"
        :key="item._id"
        class="msg-item"
        :class="{ unread: !item.read }"
        @click="onMsgClick(item)"
      >
        <view class="msg-icon-wrap" :style="'background:' + getIconBg(item.type)">
          <text class="msg-icon">{{ getIcon(item.type) }}</text>
        </view>
        <view class="msg-body">
          <view class="msg-title-row">
            <text class="msg-title">{{ item.title }}</text>
            <view class="unread-dot" v-if="!item.read"></view>
          </view>
          <text class="msg-content">{{ item.content }}</text>
          <view v-if="item.fromPhone" class="msg-contact">
            <text class="msg-contact-text">📱 {{ item.fromName || '匿名' }}：{{ item.fromPhone }}</text>
          </view>
          <text class="msg-time">{{ formatTime(item.createTime) }}</text>
        </view>
        <view class="msg-del-btn" @click.stop="deleteOne(item._id)">
          <text>删除</text>
        </view>
      </view>
    </view>

    <!-- 加载更多 -->
    <view class="load-more" v-if="hasMore && list.length > 0" @click="loadMore">
      <text>加载更多</text>
    </view>

    <!-- 空状态 -->
    <view class="empty" v-if="!loading && list.length === 0">
      <text class="empty-icon">📭</text>
      <text class="empty-text">暂无消息</text>
    </view>

    <!-- 加载中 -->
    <view class="loading-wrap" v-if="loading && list.length === 0">
      <text class="loading-text">加载中...</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { callCloud } from '@/utils/cloud.js'

var list = ref([])
var loading = ref(false)
var page = ref(1)
var hasMore = ref(true)

var iconMap = {
  like: '👍',
  comment: '💬',
  order_accept: '🏃',
  order_status: '📦',
  order_cancel: '❌',
  tutor_apply: '📝',
  tutor_contact: '📞'
}
var bgMap = {
  like: 'linear-gradient(135deg, #F6AD55, #DD6B20)',
  comment: 'linear-gradient(135deg, #63B3ED, #2B6CB0)',
  order_accept: 'linear-gradient(135deg, #68D391, #38A169)',
  order_status: 'linear-gradient(135deg, #B794F4, #805AD5)',
  order_cancel: 'linear-gradient(135deg, #FC8181, #E53E3E)',
  tutor_apply: 'linear-gradient(135deg, #F6AD55, #DD6B20)',
  tutor_contact: 'linear-gradient(135deg, #68D391, #38A169)'
}

var getIcon = (type) => { return iconMap[type] || '🔔' }
var getIconBg = (type) => { return bgMap[type] || 'linear-gradient(135deg, #A0AEC0, #718096)' }

var formatTime = (t) => {
  if (!t) return ''
  var d = new Date(t)
  if (isNaN(d.getTime())) return ''
  var now = new Date()
  var diff = now.getTime() - d.getTime()
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  if (diff < 604800000) return Math.floor(diff / 86400000) + '天前'
  var m = d.getMonth() + 1
  var day = d.getDate()
  return (m < 10 ? '0' + m : m) + '-' + (day < 10 ? '0' + day : day)
}

var loadMessages = async (reset) => {
  if (reset) {
    page.value = 1
    hasMore.value = true
  }
  loading.value = true
  var res = await callCloud('message', 'list', { page: page.value, pageSize: 20 })
  loading.value = false
  if (res.code === 0) {
    if (reset) {
      list.value = res.data || []
    } else {
      list.value = list.value.concat(res.data || [])
    }
    if (!res.data || res.data.length < 20) {
      hasMore.value = false
    }
  }
}

var loadMore = () => {
  page.value++
  loadMessages(false)
}

var markAllRead = async () => {
  await callCloud('message', 'markAllRead')
  for (var i = 0; i < list.value.length; i++) {
    list.value[i].read = true
  }
  uni.showToast({ title: '已全部标记已读', icon: 'success' })
}

var onMsgClick = async (item) => {
  // 标记已读
  if (!item.read) {
    await callCloud('message', 'markRead', { msgId: item._id })
    item.read = true
  }
  // 跳转到对应页面
  var targetType = item.targetType
  var targetId = item.targetId
  if (!targetId) return
  var urlMap = {
    forum: '/pages/forum-sub/detail?id=',
    express: '/pages/express/detail?id=',
    errand: '/pages/errand/detail?id=',
    tutor: '/pages/job-sub/tutor?id='
  }
  var url = urlMap[targetType]
  if (url) {
    uni.navigateTo({ url: url + targetId })
  }
}

var deleteOne = async (msgId) => {
  uni.showModal({
    title: '提示',
    content: '确定删除这条消息？',
    success: async function(res) {
      if (res.confirm) {
        await callCloud('message', 'delete', { msgId: msgId })
        var arr = []
        for (var i = 0; i < list.value.length; i++) {
          if (list.value[i]._id !== msgId) arr.push(list.value[i])
        }
        list.value = arr
        uni.showToast({ title: '已删除', icon: 'success' })
      }
    }
  })
}

var deleteAll = async () => {
  uni.showModal({
    title: '提示',
    content: '确定删除全部消息？删除后不可恢复',
    success: async function(res) {
      if (res.confirm) {
        await callCloud('message', 'deleteAll')
        list.value = []
        uni.showToast({ title: '已全部删除', icon: 'success' })
      }
    }
  })
}

onShow(() => { loadMessages(true) })
</script>

<style scoped>
.msg-page { background: #F0F2F5; min-height: 100vh; }

.top-bar { display: flex; align-items: center; justify-content: space-between; padding: 24rpx 32rpx; background: #fff; border-bottom: 1rpx solid #EDF2F7; }
.top-title { font-size: 32rpx; font-weight: 700; color: #1A1A2E; }
.top-actions { display: flex; align-items: center; gap: 16rpx; }
.mark-all-btn { padding: 10rpx 24rpx; border-radius: 24rpx; background: #EBF4FF; }
.mark-all-btn text { font-size: 24rpx; color: #2B6CB0; font-weight: 600; }
.mark-all-btn:active { opacity: 0.7; }
.delete-all-btn { padding: 10rpx 24rpx; border-radius: 24rpx; background: #FFF5F5; }
.delete-all-btn text { font-size: 24rpx; color: #E53E3E; font-weight: 600; }
.delete-all-btn:active { opacity: 0.7; }

.msg-list { padding: 16rpx 0; }
.msg-item { display: flex; align-items: flex-start; padding: 28rpx 32rpx; background: #fff; margin-bottom: 2rpx; transition: background 0.15s ease; }
.msg-item:active { background: #F7FAFC; }
.msg-item.unread { background: #FAFCFF; }

.msg-icon-wrap { width: 72rpx; height: 72rpx; border-radius: 18rpx; display: flex; align-items: center; justify-content: center; margin-right: 20rpx; flex-shrink: 0; }
.msg-icon { font-size: 32rpx; }

.msg-body { flex: 1; min-width: 0; }
.msg-title-row { display: flex; align-items: center; }
.msg-title { font-size: 28rpx; font-weight: 600; color: #1A1A2E; flex: 1; }
.unread-dot { width: 14rpx; height: 14rpx; border-radius: 50%; background: #E53E3E; flex-shrink: 0; margin-left: 8rpx; }
.msg-content { font-size: 26rpx; color: #718096; margin-top: 8rpx; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.msg-contact { margin-top: 8rpx; padding: 10rpx 16rpx; background: #EBF8FF; border-radius: 8rpx; }
.msg-contact-text { font-size: 26rpx; color: #2B6CB0; font-weight: 600; }
.msg-time { font-size: 22rpx; color: #A0AEC0; margin-top: 8rpx; display: block; }

.msg-del-btn { flex-shrink: 0; margin-left: 16rpx; padding: 8rpx 20rpx; border-radius: 20rpx; background: #FFF5F5; align-self: center; }
.msg-del-btn text { font-size: 22rpx; color: #E53E3E; font-weight: 600; }
.msg-del-btn:active { opacity: 0.7; }

.load-more { text-align: center; padding: 28rpx; }
.load-more text { font-size: 26rpx; color: #2B6CB0; font-weight: 500; }
.load-more:active { opacity: 0.7; }

.empty { display: flex; flex-direction: column; align-items: center; padding-top: 200rpx; }
.empty-icon { font-size: 80rpx; }
.empty-text { font-size: 28rpx; color: #A0AEC0; margin-top: 20rpx; }

.loading-wrap { text-align: center; padding-top: 200rpx; }
.loading-text { font-size: 28rpx; color: #A0AEC0; }
</style>
