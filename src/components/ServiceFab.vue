<template>
  <view class="service-fab" :style="{top: posY + 'px', right: posR + 'px'}" @touchstart="onTouchStart" @touchmove.prevent="onTouchMove" @touchend="onTouchEnd" @click="onClick">
    <text class="service-text">客服</text>
  </view>
</template>

<script setup>
import { ref } from 'vue'

const posY = ref(300)
const posR = ref(16)
const startY = ref(0)
const startPosY = ref(0)
const moved = ref(false)

const onTouchStart = (e) => {
  startY.value = e.touches[0].clientY
  startPosY.value = posY.value
  moved.value = false
}
const onTouchMove = (e) => {
  const dy = e.touches[0].clientY - startY.value
  if (Math.abs(dy) > 5) moved.value = true
  let newY = startPosY.value + dy
  const sysInfo = uni.getSystemInfoSync()
  if (newY < 80) newY = 80
  if (newY > sysInfo.windowHeight - 60) newY = sysInfo.windowHeight - 60
  posY.value = newY
}
const onTouchEnd = () => {}
const onClick = () => {
  if (moved.value) return
  uni.navigateTo({ url: '/pages/kefu/show?img=' + encodeURIComponent('/static/TeamWork.png') })
}
</script>

<style scoped>
.service-fab {
  position: fixed;
  width: 88rpx;
  height: 88rpx;
  border-radius: 24rpx;
  background: linear-gradient(135deg, #4299E1, #2B6CB0);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(43,108,176,0.3);
  z-index: 99;
  transition: box-shadow 0.2s ease;
}
.service-fab:active {
  box-shadow: 0 4rpx 12rpx rgba(43,108,176,0.4);
}
.service-text {
  color: #fff;
  font-size: 22rpx;
  font-weight: 700;
  letter-spacing: 1rpx;
}
</style>
