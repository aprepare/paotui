<template>
  <view class="login-page">
    <view class="login-header">
      <text class="login-emoji">🎓</text>
      <text class="login-title">校园跑腿</text>
      <text class="login-desc">完善信息后即可使用全部功能</text>
    </view>

    <view class="form-card">
      <!-- 头像 -->
      <view class="form-item avatar-row">
        <text class="form-label">头像</text>
        <button class="avatar-btn" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
          <view class="avatar-preview">
            <image v-if="avatarUrl" :src="avatarUrl" class="avatar-img" />
            <text v-else class="avatar-placeholder">🧑</text>
          </view>
          <text class="avatar-tip">点击获取头像</text>
          <text class="arrow">›</text>
        </button>
      </view>
      <view class="divider"></view>
      <!-- 昵称 -->
      <view class="form-item">
        <text class="form-label">昵称</text>
        <input type="nickname" v-model="nickname" placeholder="点击获取昵称" placeholder-style="color:#A0AEC0" class="form-input"></input>
      </view>
      <view class="divider"></view>
      <!-- 手机号（快捷登录） -->
      <view class="form-item">
        <text class="form-label">手机号</text>
        <text v-if="phone" class="phone-display">{{ phone }}</text>
        <button v-else class="phone-btn" open-type="getPhoneNumber" @getphonenumber="onGetPhoneNumber">
          <text>📱 手机号快捷登录</text>
        </button>
      </view>
    </view>

    <view class="tip-card">
      <text class="tip-icon">💡</text>
      <text class="tip-text">点击「手机号快捷登录」一键绑定，无需输入验证码</text>
    </view>

    <view class="submit-btn" @click="saveProfile">
      <text>保存并进入</text>
    </view>

    <text class="login-notice">你的信息仅用于校园跑腿服务</text>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { callCloud, uploadImage } from '@/utils/cloud'

const avatarUrl = ref('')
const nickname = ref('')
const phone = ref('')
const tempAvatarPath = ref('')

// 从缓存读取已有信息
const stored = uni.getStorageSync('userInfo')
if (stored && stored.name) {
  nickname.value = stored.name || ''
  phone.value = stored.phone || ''
  avatarUrl.value = stored.avatar || ''
} else {
  nickname.value = '校园用户'
}

const onChooseAvatar = (e) => {
  var url = e.detail.avatarUrl
  if (url) {
    avatarUrl.value = url
    tempAvatarPath.value = url
  }
}

// 微信手机号快速验证
const onGetPhoneNumber = async (e) => {
  if (e.detail.errMsg !== 'getPhoneNumber:ok') {
    uni.showToast({ title: '授权已取消', icon: 'none' })
    return
  }
  var code = e.detail.code
  if (!code) {
    uni.showToast({ title: '获取手机号失败', icon: 'none' })
    return
  }
  uni.showLoading({ title: '获取中...' })
  var res = await callCloud('user', 'getPhoneByCode', { code: code })
  uni.hideLoading()
  if (res.code === 0 && res.data && res.data.phone) {
    phone.value = res.data.phone
    uni.showToast({ title: '手机号获取成功', icon: 'success' })
  } else {
    uni.showToast({ title: res.msg || '获取手机号失败', icon: 'none' })
  }
}

const saving = ref(false)
const saveProfile = async () => {
  if (!nickname.value.trim()) {
    uni.showToast({ title: '请输入昵称', icon: 'none' })
    return
  }
  if (!phone.value) {
    uni.showToast({ title: '请先获取手机号', icon: 'none' })
    return
  }
  if (saving.value) return
  saving.value = true

  var avatar = avatarUrl.value
  if (tempAvatarPath.value) {
    uni.showLoading({ title: '上传头像...' })
    try {
      avatar = await uploadImage(tempAvatarPath.value, 'avatars')
    } catch (e) {
      console.error('upload avatar err', e)
    }
    uni.hideLoading()
  }

  var res = await callCloud('user', 'updateProfile', {
    name: nickname.value.trim(),
    avatar: avatar,
    phone: phone.value
  })
  saving.value = false

  if (res.code === 0) {
    var info = uni.getStorageSync('userInfo') || {}
    info.name = nickname.value.trim()
    info.avatar = avatar
    info.phone = phone.value
    uni.setStorageSync('userInfo', info)
    uni.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(function() { uni.navigateBack() }, 1500)
  }
}
</script>

<style scoped>
.login-page { background: #F0F2F5; min-height: 100vh; padding: 0 0 80rpx; }
.login-header { background: linear-gradient(160deg, #1A4F8B 0%, #2B6CB0 40%, #4299E1 100%); padding: 100rpx 32rpx 80rpx; display: flex; flex-direction: column; align-items: center; }
.login-emoji { font-size: 80rpx; margin-bottom: 16rpx; }
.login-title { font-size: 44rpx; font-weight: 800; color: #fff; }
.login-desc { font-size: 26rpx; color: rgba(255,255,255,0.7); margin-top: 12rpx; }
.form-card { background: #fff; margin: -30rpx 28rpx 0; border-radius: 20rpx; padding: 0 28rpx; box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.08); position: relative; z-index: 1; }
.form-item { display: flex; align-items: center; padding: 28rpx 0; }
.avatar-row { padding: 20rpx 0; }
.form-label { font-size: 28rpx; color: #333; width: 120rpx; flex-shrink: 0; font-weight: 600; }
.form-input { flex: 1; font-size: 28rpx; height: 80rpx; line-height: 80rpx; }
.divider { height: 1rpx; background: #F0F2F5; }
.avatar-btn { display: flex; align-items: center; flex: 1; background: none; border: none; padding: 0; margin: 0; line-height: normal; font-size: 28rpx; text-align: left; }
.avatar-btn::after { display: none; }
.avatar-preview { width: 80rpx; height: 80rpx; border-radius: 50%; background: #EBF4FF; display: flex; align-items: center; justify-content: center; overflow: hidden; margin-right: 16rpx; flex-shrink: 0; }
.avatar-img { width: 80rpx; height: 80rpx; border-radius: 50%; }
.avatar-placeholder { font-size: 40rpx; }
.avatar-tip { flex: 1; font-size: 26rpx; color: #A0AEC0; }
.arrow { font-size: 32rpx; color: #CBD5E0; }
.phone-display { flex: 1; font-size: 30rpx; color: #2D3748; font-weight: 600; }
.phone-btn { flex: 1; background: linear-gradient(135deg, #4299E1, #2B6CB0); border-radius: 32rpx; padding: 18rpx 0; text-align: center; border: none; margin: 0; line-height: normal; }
.phone-btn::after { display: none; }
.phone-btn text { color: #fff; font-size: 26rpx; font-weight: 600; }
.tip-card { display: flex; align-items: flex-start; margin: 24rpx 28rpx; padding: 20rpx; background: #EBF4FF; border-radius: 12rpx; }
.tip-icon { font-size: 28rpx; margin-right: 12rpx; flex-shrink: 0; }
.tip-text { font-size: 24rpx; color: #2B6CB0; line-height: 36rpx; }
.submit-btn { margin: 32rpx 28rpx 0; background: linear-gradient(135deg, #4299E1, #2B6CB0); border-radius: 48rpx; padding: 28rpx; text-align: center; box-shadow: 0 8rpx 24rpx rgba(43,108,176,0.3); }
.submit-btn text { color: #fff; font-size: 32rpx; font-weight: 700; }
.login-notice { display: block; text-align: center; font-size: 22rpx; color: #A0AEC0; margin-top: 24rpx; }
</style>
