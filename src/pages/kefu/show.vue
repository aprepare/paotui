<template>
  <view class="kefu-container" @tap="goBack">
    <image :src="imgSrc" class="kefu-image" mode="aspectFit"></image>
    <text class="tap-hint">点击 anywhere 返回</text>
  </view>
</template>

<script setup>
import { onLoad } from '@dcloudio/uni-app'
import { ref } from 'vue'

const imgSrc = ref('')

onLoad((query) => {
  if (query.img) {
    imgSrc.value = decodeURIComponent(query.img)
  }
})

const goBack = () => {
  uni.navigateBack()
}

</script>

<style scoped>
.kefu-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 40rpx;
  background: rgba(0,0,0,0.8);
}
.kefu-image {
  max-width: 90vw;
  max-height: 80vh;
  border-radius: 16rpx;
}
.tap-hint {
  margin-top: 40rpx;
  color: #fff;
  font-size: 24rpx;
  opacity: 0.8;
}
</style>