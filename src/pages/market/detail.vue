<template>
  <view class="goods-detail">
    <swiper class="img-swiper" indicator-dots autoplay circular>
      <swiper-item v-for="(img, i) in goods.images" :key="i">
        <view class="swiper-img" :style="{background: img.bg}">
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
          <text class="seller-school">{{ goods.seller.school }}</text>
        </view>
        <view class="seller-stats">
          <text class="stat">在售 {{ goods.seller.onSale }} 件</text>
        </view>
      </view>
    </view>
    <view class="bottom-bar">
      <view class="bottom-left">
        <view class="bottom-icon-item">
          <text>⭐</text>
          <text class="icon-label">收藏</text>
        </view>
        <view class="bottom-icon-item">
          <text>💬</text>
          <text class="icon-label">留言</text>
        </view>
      </view>
      <view class="contact-btn">
        <text>联系卖家</text>
      </view>
      <view class="buy-btn">
        <text>我想要</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

const goods = ref({
  id: 1, title: '九成新iPad Air 5 64G WiFi版 送笔和壳',
  price: 2800, originalPrice: 4399,
  condition: '9成新', category: '数码',
  images: [
    { emoji: '📱', bg: '#E3F2FD' },
    { emoji: '✏️', bg: '#F3E5F5' },
    { emoji: '📦', bg: '#FFF3E0' }
  ],
  desc: '去年9月买的，一直贴膜戴壳使用，无磕碰无划痕。电池健康度98%。送Apple Pencil二代和保护壳。因为换了新款所以出掉，诚心出不刀。',
  time: '2026-02-10 10:30',
  seller: { avatar: '🧑‍🎓', name: '学长小李', school: '计算机学院 大四', onSale: 3 }
})
</script>

<style scoped>
.goods-detail { background: #F5F7FA; min-height: 100vh; padding-bottom: 140rpx; }
.img-swiper { height: 600rpx; }
.swiper-img { height: 100%; display: flex; align-items: center; justify-content: center; }
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
.seller-school { font-size: 24rpx; color: #999; }
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
