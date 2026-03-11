<template>
  <view class="goods-detail">
    <swiper class="img-swiper" indicator-dots autoplay circular>
      <swiper-item v-for="(img, i) in goods.images" :key="i">
        <image v-if="img.url" class="swiper-real-img" :src="img.url" mode="aspectFill" />
        <view v-else class="swiper-img" :style="{background: img.bg}">
          <text class="swiper-emoji">{{ img.emoji }}</text>
        </view>
      </swiper-item>
    </swiper>
    <view class="goods-info">
      <text class="goods-price">¥{{ goods.price }}</text>
      <text class="goods-original">原价 ¥{{ goods.originalPrice }}</text>
      <text class="goods-title">{{ goods.title }}</text>
      <view class="tags">
        <text class="tag">{{ goods.condition }}</text>
        <text class="tag">{{ goods.category }}</text>
        <text class="tag delivery-tag" v-if="goods.deliveryText">{{ goods.deliveryText }}</text>
      </view>
    </view>
    <view class="desc-card">
      <text class="card-title">📝 商品描述</text>
      <text class="desc-text">{{ goods.desc }}</text>
      <text class="pub-time">发布于 {{ goods.time }}</text>
    </view>
    <view class="seller-card">
      <text class="card-title">👤 卖家信息</text>
      <view class="seller-info">
        <text class="seller-avatar">{{ goods.seller.avatar }}</text>
        <view class="seller-detail">
          <text class="seller-name">{{ goods.seller.name }}</text>
          <text class="seller-wechat" v-if="goods.contactPublic === 1 && goods.contact">微信号：{{ goods.contact }}</text>
          <text class="seller-wechat hidden-wechat" v-else-if="goods.contact">微信号已隐藏</text>
          <text class="seller-school">{{ goods.seller.school }}</text>
        </view>
        <view class="seller-stats">
          <text class="stat">在售 {{ goods.seller.onSale }} 件</text>
        </view>
      </view>
    </view>

    <!-- 留言区 -->
    <view class="comment-card">
      <view class="comment-header">
        <text class="card-title">💬 留言 ({{ commentList.length }})</text>
      </view>
      <view v-if="commentList.length === 0" class="comment-empty">
        <text class="comment-empty-text">暂无留言，快来抢沙发～</text>
      </view>
      <view v-for="cmt in commentList" :key="cmt._id" class="comment-item" @longpress="onCommentLongPress(cmt)">
        <view class="comment-avatar-wrap">
          <text class="comment-avatar-text">{{ cmt.nickname ? cmt.nickname.substring(0, 1) : '匿' }}</text>
        </view>
        <view class="comment-body">
          <view class="comment-top-row">
            <text class="comment-nickname">{{ cmt.nickname || '匿名' }}</text>
            <text class="comment-time">{{ formatTime(cmt.createTime) }}</text>
          </view>
          <view v-if="cmt.replyTo && cmt.replyName" class="comment-reply-tag">
            <text>回复 {{ cmt.replyName }}</text>
          </view>
          <text class="comment-text">{{ cmt.content }}</text>
          <view class="comment-actions">
            <view class="comment-action-btn" @click="onReplyComment(cmt)">
              <text>回复</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <view class="bottom-left">
        <view class="bottom-icon-item" @click="toggleFavorite">
          <text>{{ favorited ? '⭐' : '☆' }}</text>
          <text class="icon-label">{{ favorited ? '已收藏' : '收藏' }}</text>
        </view>
        <view class="bottom-icon-item" @click="openCommentInput">
          <text>💬</text>
          <text class="icon-label">留言{{ commentList.length > 0 ? '(' + commentList.length + ')' : '' }}</text>
        </view>
      </view>
      <view class="contact-btn" @click="contactSeller">
        <text>联系卖家</text>
      </view>
      <view class="buy-btn" @click="handleWant">
        <text>我想要</text>
      </view>
    </view>

    <!-- 留言输入弹窗 -->
    <view class="comment-input-mask" v-if="showCommentInput" @click="closeCommentInput">
      <view class="comment-input-bar" @click.stop>
        <view class="comment-input-wrap">
          <input
            class="comment-input"
            v-model="commentText"
            :placeholder="commentPlaceholder"
            :focus="showCommentInput"
            confirm-type="send"
            @confirm="sendComment"
          />
        </view>
        <view class="comment-send-btn" :class="{active: commentText.trim()}" @click="sendComment">
          <text>发送</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { callCloud, checkLogin } from '@/utils/cloud'

const goods = ref({
  id: '', title: '',
  price: 0, originalPrice: 0,
  condition: '', category: '',
  images: [],
  desc: '',
  time: '',
  contact: '',
  contactPublic: 1,
  deliveryText: '',
  seller: { avatar: '🧑', name: '加载中...', school: '', onSale: 0 }
})
const favorited = ref(false)
const commentList = ref([])
const showCommentInput = ref(false)
const commentText = ref('')
const commentPlaceholder = ref('说点什么...')
const replyToId = ref('')
const replyToName = ref('')

const formatTime = (t) => {
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

onLoad((opts) => {
  if (opts && opts.id) {
    loadDetail(opts.id)
  }
})

const showTip = (msg) => { uni.showToast({ title: msg, icon: 'none' }) }

const toggleFavorite = async () => {
  var res = await callCloud('user', 'toggleFavorite', { targetId: goods.value.id, targetType: 'goods' })
  if (res.code === 0) {
    favorited.value = res.favorited
    uni.showToast({ title: res.favorited ? '已收藏' : '取消收藏', icon: 'success' })
  }
}

const contactSeller = () => {
  var g = goods.value
  if (g.contactPublic === 1 && g.contact) {
    uni.showModal({
      title: '联系卖家',
      content: '卖家：' + g.seller.name + '\n微信号：' + g.contact,
      confirmText: '复制微信号',
      success: (res) => {
        if (res.confirm) {
          uni.setClipboardData({ data: g.contact })
        }
      }
    })
  } else if (g.contact) {
    uni.showModal({
      title: '联系卖家',
      content: '卖家微信号已隐藏，点击确认查看',
      success: (res) => {
        if (res.confirm) {
          uni.showModal({
            title: '卖家微信号',
            content: g.contact,
            confirmText: '复制微信号',
            success: (r) => {
              if (r.confirm) {
                uni.setClipboardData({ data: g.contact })
              }
            }
          })
        }
      }
    })
  } else {
    uni.showModal({
      title: '联系卖家',
      content: '卖家：' + g.seller.name + '\n卖家未留微信号，请通过广场私信联系',
      showCancel: false
    })
  }
}

const handleWant = async () => {
  const res = await callCloud('market', 'want', { goodsId: goods.value.id })
  if (res.code === 0) {
    uni.showToast({ title: '已标记想要', icon: 'success' })
  }
}

const openCommentInput = () => {
  if (!checkLogin()) return
  replyToId.value = ''
  replyToName.value = ''
  commentPlaceholder.value = '说点什么...'
  commentText.value = ''
  showCommentInput.value = true
}

const closeCommentInput = () => {
  showCommentInput.value = false
  commentText.value = ''
  replyToId.value = ''
  replyToName.value = ''
}

const onReplyComment = (cmt) => {
  if (!checkLogin()) return
  replyToId.value = cmt._id
  replyToName.value = cmt.nickname || '匿名'
  commentPlaceholder.value = '回复 ' + replyToName.value + '...'
  commentText.value = ''
  showCommentInput.value = true
}

const sendComment = async () => {
  var text = commentText.value.trim()
  if (!text) return
  if (!checkLogin()) return
  uni.showLoading({ title: '发送中...' })
  var params = { id: goods.value.id, content: text }
  if (replyToId.value) {
    params.replyTo = replyToId.value
    params.replyName = replyToName.value
  }
  var res = await callCloud('market', 'comment', params)
  uni.hideLoading()
  if (res.code === 0) {
    showCommentInput.value = false
    commentText.value = ''
    replyToId.value = ''
    replyToName.value = ''
    uni.showToast({ title: '留言成功', icon: 'success' })
    loadDetail(goods.value.id)
  }
}

const onCommentLongPress = (cmt) => {
  var userInfo = uni.getStorageSync('userInfo')
  var myOpenid = (userInfo && userInfo.openid) || uni.getStorageSync('openid') || ''
  // 只有评论者本人或商品发布者可删
  if (cmt.openid !== myOpenid && goods.value.ownerOpenid !== myOpenid) return
  uni.showActionSheet({
    itemList: ['删除留言'],
    success: async (res) => {
      if (res.tapIndex === 0) {
        uni.showModal({
          title: '提示',
          content: '确定删除这条留言？',
          success: async (r) => {
            if (r.confirm) {
              var delRes = await callCloud('market', 'deleteComment', { id: cmt._id })
              if (delRes.code === 0) {
                uni.showToast({ title: '已删除', icon: 'success' })
                loadDetail(goods.value.id)
              }
            }
          }
        })
      }
    }
  })
}

const loadDetail = async (id) => {
  const res = await callCloud('market', 'detail', { id: id })
  if (res.code === 0) {
    const d = res.data
    goods.value = {
      id: d._id,
      ownerOpenid: d.openid || '',
      title: d.title || '',
      price: d.price || 0,
      originalPrice: Math.round((d.price || 0) * 1.5),
      condition: '二手',
      category: d.category || '其他',
      images: (d.images || []).length > 0
        ? d.images.filter(function(img) { return img && typeof img === 'string' && (img.indexOf('cloud://') === 0 || img.indexOf('https://') === 0 || img.indexOf('http://') === 0 || img.indexOf('wxfile://') === 0) }).map(function(img) { return { url: img } })
        : [{ emoji: '🛒', bg: '#E3F2FD' }],
      desc: d.desc || '',
      time: '',
      contact: d.contact || '',
      contactPublic: d.contactPublic === 0 ? 0 : 1,
      deliveryText: d.deliveryText || '',
      seller: { avatar: '🧑', name: d.publisher || '匿名', school: '', onSale: 0 }
    }
    commentList.value = d.commentList || []
  }
  var favRes = await callCloud('user', 'checkFavorite', { targetId: id, targetType: 'goods' })
  if (favRes.code === 0) favorited.value = favRes.favorited
}
</script>

<style scoped>
.goods-detail { background: #F5F7FA; min-height: 100vh; padding-bottom: 140rpx; }
.img-swiper { height: 600rpx; }
.swiper-img { height: 100%; display: flex; align-items: center; justify-content: center; }
.swiper-real-img { width: 100%; height: 100%; }
.swiper-emoji { font-size: 120rpx; }
.goods-info { background: #fff; padding: 28rpx 24rpx; margin-bottom: 16rpx; }
.goods-price { font-size: 48rpx; color: #FF6B6B; font-weight: bold; }
.goods-original { font-size: 24rpx; color: #999; text-decoration: line-through; margin-left: 16rpx; }
.goods-title { font-size: 32rpx; color: #333; font-weight: bold; margin-top: 16rpx; display: block; line-height: 1.5; }
.tags { display: flex; gap: 12rpx; margin-top: 16rpx; }
.tag { font-size: 22rpx; color: #4A90D9; background: #E3F2FD; padding: 6rpx 16rpx; border-radius: 6rpx; }
.desc-card { background: #fff; margin: 0 0 16rpx; padding: 28rpx 24rpx; }
.card-title { font-size: 28rpx; font-weight: bold; color: #333; margin-bottom: 16rpx; display: block; }
.desc-text { font-size: 28rpx; color: #666; line-height: 1.6; }
.pub-time { font-size: 22rpx; color: #999; margin-top: 16rpx; display: block; }
.seller-card { background: #fff; padding: 28rpx 24rpx; margin-bottom: 16rpx; }
.seller-info { display: flex; align-items: center; }
.seller-avatar { font-size: 56rpx; margin-right: 16rpx; }
.seller-detail { flex: 1; }
.seller-name { font-size: 28rpx; font-weight: bold; color: #333; display: block; }
.seller-wechat { font-size: 24rpx; color: #2B6CB0; margin-top: 4rpx; display: block; }
.seller-wechat.hidden-wechat { color: #A0AEC0; }
.seller-school { font-size: 24rpx; color: #999; }
.delivery-tag { background: #F0FFF4; color: #38A169; }
.stat { font-size: 22rpx; color: #999; }

/* 留言区 */
.comment-card { background: #fff; padding: 28rpx 24rpx; margin-bottom: 16rpx; }
.comment-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16rpx; }
.comment-empty { padding: 40rpx 0; text-align: center; }
.comment-empty-text { font-size: 26rpx; color: #A0AEC0; }
.comment-item { display: flex; padding: 20rpx 0; border-bottom: 1rpx solid #F0F2F5; }
.comment-item:last-child { border-bottom: none; }
.comment-avatar-wrap { width: 64rpx; height: 64rpx; border-radius: 50%; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-right: 16rpx; }
.comment-avatar-text { font-size: 26rpx; color: #fff; font-weight: bold; }
.comment-body { flex: 1; min-width: 0; }
.comment-top-row { display: flex; align-items: center; justify-content: space-between; }
.comment-nickname { font-size: 24rpx; color: #4A5568; font-weight: 600; }
.comment-time { font-size: 20rpx; color: #A0AEC0; }
.comment-reply-tag { margin-top: 4rpx; }
.comment-reply-tag text { font-size: 22rpx; color: #4A90D9; background: #EBF4FF; padding: 2rpx 12rpx; border-radius: 8rpx; }
.comment-text { font-size: 26rpx; color: #2D3748; margin-top: 8rpx; display: block; line-height: 1.5; word-break: break-all; }
.comment-actions { display: flex; gap: 24rpx; margin-top: 8rpx; }
.comment-action-btn text { font-size: 22rpx; color: #A0AEC0; }
.comment-action-btn:active text { color: #4A90D9; }

/* 底部栏 */
.bottom-bar { position: fixed; bottom: 0; left: 0; right: 0; background: #fff; display: flex; align-items: center; padding: 16rpx 24rpx 36rpx; box-shadow: 0 -4rpx 12rpx rgba(0,0,0,0.06); z-index: 50; }
.bottom-left { display: flex; gap: 32rpx; margin-right: 24rpx; }
.bottom-icon-item { display: flex; flex-direction: column; align-items: center; }
.icon-label { font-size: 20rpx; color: #999; }
.contact-btn { flex: 1; padding: 20rpx; border: 2rpx solid #4A90D9; border-radius: 40rpx; text-align: center; margin-right: 16rpx; }
.contact-btn text { color: #4A90D9; font-size: 28rpx; }
.buy-btn { flex: 1; padding: 20rpx; background: linear-gradient(135deg, #FF6B6B, #FF5252); border-radius: 40rpx; text-align: center; }
.buy-btn text { color: #fff; font-size: 28rpx; font-weight: bold; }

/* 留言输入弹窗 */
.comment-input-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); z-index: 200; display: flex; align-items: flex-end; }
.comment-input-bar { width: 100%; background: #fff; display: flex; align-items: center; padding: 20rpx 24rpx; padding-bottom: calc(20rpx + env(safe-area-inset-bottom)); box-shadow: 0 -4rpx 16rpx rgba(0,0,0,0.08); animation: slideUp 0.2s ease-out; }
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
.comment-input-wrap { flex: 1; background: #F0F2F5; border-radius: 36rpx; padding: 0 28rpx; height: 72rpx; display: flex; align-items: center; }
.comment-input { width: 100%; height: 72rpx; font-size: 28rpx; color: #333; }
.comment-send-btn { margin-left: 16rpx; padding: 16rpx 32rpx; border-radius: 36rpx; background: #E2E8F0; flex-shrink: 0; }
.comment-send-btn.active { background: linear-gradient(135deg, #4A90D9, #2B6CB0); }
.comment-send-btn text { font-size: 28rpx; color: #A0AEC0; font-weight: 600; }
.comment-send-btn.active text { color: #fff; }
</style>
