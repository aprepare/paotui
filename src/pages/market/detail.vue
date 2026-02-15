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
    <view class="bottom-bar">
      <view class="bottom-left">
        <view class="bottom-icon-item" @click="toggleFavorite">
          <text>{{ favorited ? '⭐' : '☆' }}</text>
          <text class="icon-label">{{ favorited ? '已收藏' : '收藏' }}</text>
        </view>
        <view class="bottom-icon-item" @click="showTip('留言功能即将上线')">
          <text>💬</text>
          <text class="icon-label">留言</text>
        </view>
      </view>
      <view class="contact-btn" @click="contactSeller">
        <text>联系卖家</text>
      </view>
      <view class="buy-btn" @click="handleWant">
        <text>我想要</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { callCloud } from '@/utils/cloud'

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

const loadDetail = async (id) => {
  const res = await callCloud('market', 'detail', { id: id })
  if (res.code === 0) {
    const d = res.data
    goods.value = {
      id: d._id,
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
.seller-card { background: #fff; padding: 28rpx 24rpx; }
.seller-info { display: flex; align-items: center; }
.seller-avatar { font-size: 56rpx; margin-right: 16rpx; }
.seller-detail { flex: 1; }
.seller-name { font-size: 28rpx; font-weight: bold; color: #333; display: block; }
.seller-wechat { font-size: 24rpx; color: #2B6CB0; margin-top: 4rpx; display: block; }
.seller-wechat.hidden-wechat { color: #A0AEC0; }
.seller-school { font-size: 24rpx; color: #999; }
.delivery-tag { background: #F0FFF4; color: #38A169; }
.stat { font-size: 22rpx; color: #999; }
.bottom-bar { position: fixed; bottom: 0; left: 0; right: 0; background: #fff; display: flex; align-items: center; padding: 16rpx 24rpx 36rpx; box-shadow: 0 -4rpx 12rpx rgba(0,0,0,0.06); }
.bottom-left { display: flex; gap: 32rpx; margin-right: 24rpx; }
.bottom-icon-item { display: flex; flex-direction: column; align-items: center; }
.icon-label { font-size: 20rpx; color: #999; }
.contact-btn { flex: 1; padding: 20rpx; border: 2rpx solid #4A90D9; border-radius: 40rpx; text-align: center; margin-right: 16rpx; }
.contact-btn text { color: #4A90D9; font-size: 28rpx; }
.buy-btn { flex: 1; padding: 20rpx; background: linear-gradient(135deg, #FF6B6B, #FF5252); border-radius: 40rpx; text-align: center; }
.buy-btn text { color: #fff; font-size: 28rpx; font-weight: bold; }
</style>
