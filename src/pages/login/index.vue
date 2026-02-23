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
          <text class="avatar-tip">点击获取微信头像</text>
          <text class="arrow">›</text>
        </button>
      </view>
      <view class="divider"></view>
      <!-- 昵称 -->
      <view class="form-item">
        <text class="form-label">昵称</text>
        <input type="nickname" v-model="nickname" placeholder="点击获取微信昵称" placeholder-style="color:#A0AEC0" class="form-input"></input>
      </view>
      <view class="divider"></view>
      <!-- 手机号 -->
      <view class="form-item">
        <text class="form-label">手机号</text>
        <input type="number" v-model="phone" placeholder="请输入手机号" placeholder-style="color:#A0AEC0" maxlength="11" class="form-input"></input>
      </view>
      <view class="divider"></view>
      <!-- 验证码 -->
      <view class="form-item">
        <text class="form-label">验证码</text>
        <input type="number" v-model="smsCode" placeholder="请输入验证码" placeholder-style="color:#A0AEC0" maxlength="6" class="form-input sms-input"></input>
        <view class="sms-btn" :class="{disabled: !isPhoneValid || countdown > 0}" @click="sendCode">
          <text>{{ countdown > 0 ? countdown + 's' : '获取验证码' }}</text>
        </view>
      </view>
    </view>

    <view class="tip-card">
      <text class="tip-icon">💡</text>
      <text class="tip-text">可直接保存使用默认信息，也可点击头像和昵称获取微信授权</text>
    </view>

    <view class="submit-btn" @click="saveProfile">
      <text>保存并进入</text>
    </view>

    <text class="login-notice">你的信息仅用于校园跑腿服务</text>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { callCloud, uploadImage } from '@/utils/cloud'

const avatarUrl = ref('')
const nickname = ref('')
const phone = ref('')
const smsCode = ref('')
const tempAvatarPath = ref('')
const countdown = ref(0)
var countdownTimer = null

const isPhoneValid = computed(() => {
  return /^1[3-9]\d{9}$/.test(phone.value)
})

// 从缓存读取已有信息，或设置默认值
const stored = uni.getStorageSync('userInfo')
if (stored && stored.name) {
  nickname.value = stored.name || ''
  phone.value = stored.phone || ''
  avatarUrl.value = stored.avatar || ''
} else {
  // 未登录用户给默认昵称
  nickname.value = '微信用户'
}

const onChooseAvatar = (e) => {
  var url = e.detail.avatarUrl
  if (url) {
    avatarUrl.value = url
    tempAvatarPath.value = url
  }
}

const sendCode = async () => {
  if (countdown.value > 0) return
  if (!isPhoneValid.value) {
    uni.showToast({ title: '请先输入正确的11位手机号', icon: 'none' })
    return
  }
  var res = await callCloud('user', 'sendSmsCode', { phone: phone.value })
  if (res.code === 0) {
    uni.showToast({ title: '验证码已发送', icon: 'success' })
    countdown.value = 60
    countdownTimer = setInterval(function() {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(countdownTimer)
        countdownTimer = null
      }
    }, 1000)
  } else {
    uni.showToast({ title: res.msg || '发送失败', icon: 'none' })
  }
}

const phoneVerified = ref(false)

const saving = ref(false)
const saveProfile = async () => {
  if (!nickname.value.trim()) {
    uni.showToast({ title: '请输入昵称', icon: 'none' })
    return
  }
  if (!phone.value || phone.value.length !== 11 || !isPhoneValid.value) {
    uni.showToast({ title: '请输入正确的11位手机号', icon: 'none' })
    return
  }
  if (saving.value) return
  saving.value = true

  // 手机号必填，必须验证短信验证码
  if (!phoneVerified.value) {
    if (!smsCode.value || smsCode.value.length !== 6) {
      uni.showToast({ title: '请输入6位验证码', icon: 'none' })
      saving.value = false
      return
    }
    var verifyRes = await callCloud('user', 'verifySmsCode', { phone: phone.value, smsCode: smsCode.value })
    if (verifyRes.code !== 0) {
      uni.showToast({ title: verifyRes.msg || '验证码错误', icon: 'none' })
      saving.value = false
      return
    }
    phoneVerified.value = true
  }
  var submitPhone = phone.value.trim()

  var avatar = avatarUrl.value
  // 如果选了新头像（临时路径），上传到云存储
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
    phone: submitPhone
  })
  saving.value = false

  if (res.code === 0) {
    var info = uni.getStorageSync('userInfo') || {}
    info.name = nickname.value.trim()
    info.avatar = avatar
    info.phone = submitPhone
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

.tip-card { display: flex; align-items: flex-start; margin: 24rpx 28rpx; padding: 20rpx; background: #EBF4FF; border-radius: 12rpx; }
.tip-icon { font-size: 28rpx; margin-right: 12rpx; flex-shrink: 0; }
.tip-text { font-size: 24rpx; color: #2B6CB0; line-height: 36rpx; }

.submit-btn { margin: 32rpx 28rpx 0; background: linear-gradient(135deg, #4299E1, #2B6CB0); border-radius: 48rpx; padding: 28rpx; text-align: center; box-shadow: 0 8rpx 24rpx rgba(43,108,176,0.3); }
.submit-btn text { color: #fff; font-size: 32rpx; font-weight: 700; }

.login-notice { display: block; text-align: center; font-size: 22rpx; color: #A0AEC0; margin-top: 24rpx; }

.sms-input { width: 200rpx; }
.sms-btn { padding: 12rpx 24rpx; background: linear-gradient(135deg, #4299E1, #2B6CB0); border-radius: 28rpx; flex-shrink: 0; margin-left: 12rpx; }
.sms-btn text { color: #fff; font-size: 24rpx; font-weight: 600; white-space: nowrap; }
.sms-btn.disabled { opacity: 0.5; }
</style>
