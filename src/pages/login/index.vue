<template>
  <view class="login-page">
    <view class="logo-area">
      <text class="logo-emoji">🏃</text>
      <text class="app-name">校园跑腿</text>
      <text class="app-desc">让校园生活更便捷</text>
    </view>
    <view class="login-card">
      <view class="wx-btn" @click="wxLogin">
        <text class="wx-icon">💚</text>
        <text class="wx-text">微信一键登录</text>
      </view>
      <view class="phone-btn">
        <text>📱 手机号登录</text>
      </view>
    </view>
    <view class="agreement">
      <view class="check-box" :class="{checked: agreed}" @click="agreed = !agreed">
        <text v-if="agreed">✓</text>
      </view>
      <text class="agree-text">我已阅读并同意 </text>
      <text class="link">《用户协议》</text>
      <text class="agree-text"> 和 </text>
      <text class="link">《隐私政策》</text>
    </view>
    <view class="bottom-text">
      <text>— 校园跑腿 让生活更轻松 —</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

const agreed = ref(false)

const wxLogin = () => {
  if (!agreed.value) {
    uni.showToast({ title: '请先同意用户协议', icon: 'none' })
    return
  }
  uni.showToast({ title: '登录成功！', icon: 'success' })
  setTimeout(() => uni.switchTab({ url: '/pages/index/index' }), 1500)
}
</script>

<style scoped>
.login-page { background: linear-gradient(180deg, #4A90D9 0%, #F5F7FA 50%); min-height: 100vh; display: flex; flex-direction: column; align-items: center; }
.logo-area { display: flex; flex-direction: column; align-items: center; padding-top: 180rpx; margin-bottom: 80rpx; }
.logo-emoji { font-size: 120rpx; margin-bottom: 20rpx; }
.app-name { font-size: 48rpx; font-weight: bold; color: #fff; }
.app-desc { font-size: 26rpx; color: rgba(255,255,255,0.8); margin-top: 12rpx; }
.login-card { width: 85%; }
.wx-btn { background: #07C160; border-radius: 48rpx; padding: 28rpx; display: flex; align-items: center; justify-content: center; gap: 12rpx; margin-bottom: 24rpx; box-shadow: 0 8rpx 24rpx rgba(7,193,96,0.3); }
.wx-icon { font-size: 36rpx; }
.wx-text { color: #fff; font-size: 32rpx; font-weight: bold; }
.phone-btn { background: #fff; border-radius: 48rpx; padding: 28rpx; text-align: center; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08); }
.phone-btn text { font-size: 30rpx; color: #333; }
.agreement { display: flex; align-items: center; margin-top: 40rpx; padding: 0 60rpx; flex-wrap: wrap; justify-content: center; }
.check-box { width: 32rpx; height: 32rpx; border: 2rpx solid #ccc; border-radius: 50%; margin-right: 8rpx; display: flex; align-items: center; justify-content: center; font-size: 20rpx; }
.check-box.checked { background: #4A90D9; border-color: #4A90D9; color: #fff; }
.agree-text { font-size: 24rpx; color: #999; }
.link { font-size: 24rpx; color: #4A90D9; }
.bottom-text { position: absolute; bottom: 60rpx; }
.bottom-text text { font-size: 24rpx; color: #ccc; }
</style>
