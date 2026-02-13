<template>
  <view class="service-fab" :style="'bottom:' + bottom + 'rpx'" @click="previewKefu">
    <text class="service-text">客服</text>
  </view>
</template>

<script setup>
const props = defineProps({
  bottom: { type: Number, default: 160 }
})

const previewKefu = () => {
  uni.navigateTo({ url: '/pages/kefu/show?img=' + encodeURIComponent('/static/TeamWork.png') })
}
</script>

<style scoped>
.service-fab {
  position: fixed;
  right: 32rpx;
  width: 88rpx;
  height: 88rpx;
  border-radius: 24rpx;
  background: linear-gradient(135deg, #4299E1, #2B6CB0);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(43,108,176,0.3);
  z-index: 99;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.service-fab:active {
  transform: scale(0.9);
  box-shadow: 0 4rpx 12rpx rgba(43,108,176,0.4);
}
.service-text {
  color: #fff;
  font-size: 22rpx;
  font-weight: 700;
  letter-spacing: 1rpx;
}
</style>
