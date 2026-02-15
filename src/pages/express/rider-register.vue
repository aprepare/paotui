<template>
  <view class="rider-register">
    <!-- 顶部说明 -->
    <view class="header-banner">
      <text class="banner-emoji">🏅</text>
      <text class="banner-title">成为校园骑手</text>
      <text class="banner-desc">接单赚零花钱，自由安排时间</text>
    </view>

    <!-- 实名信息 -->
    <view class="form-section">
      <text class="section-title">📋 实名认证（手机号为必填项）</text>
      <view class="form-card">
        <view class="form-item">
          <text class="form-label">真实姓名</text>
          <input placeholder="请输入真实姓名" v-model="form.realName" />
        </view>
        <view class="divider"></view>
        <view class="form-item">
          <text class="form-label">手机号码</text>
          <input type="number" placeholder="请输入手机号" v-model="form.phone" maxlength="11" />
        </view>
        <view class="divider"></view>
        <view class="form-item sms-row">
          <text class="form-label">验证码</text>
          <input type="number" placeholder="请输入验证码" v-model="smsCode" maxlength="6" class="sms-input" />
          <view class="sms-btn" :class="{disabled: !isPhoneValid || countdown > 0}" @click="sendCode">
            <text>{{ countdown > 0 ? countdown + 's' : '获取验证码' }}</text>
          </view>
        </view>
        <view class="phone-hint">
          <text class="hint-icon">🔒</text>
          <text class="hint-text">手机号严格保密，其他用户无法查看</text>
        </view>
      </view>
    </view>

    <!-- 学生信息 -->
    <view class="form-section">
      <text class="section-title">🎓 学生信息</text>
      <view class="form-card">
        <view class="form-item">
          <text class="form-label">学校</text>
          <input placeholder="请输入学校名称" v-model="form.school" />
        </view>
        <view class="divider"></view>
        <view class="form-item">
          <text class="form-label">学号</text>
          <input type="number" placeholder="12位学号" v-model="form.studentId" maxlength="12" @input="onStudentIdInput" />
        </view>
        <view class="divider"></view>
        <view class="form-item">
          <text class="form-label">宿舍楼</text>
          <picker :range="buildingList" @change="onBuildingChange">
            <view class="picker-value">
              <text>{{ form.building || '请选择所在宿舍楼' }}</text>
              <text class="picker-arrow">›</text>
            </view>
          </picker>
        </view>
      </view>
    </view>

    <!-- 学生证照片 -->
    <view class="form-section">
      <text class="section-title">📸 学生证照片</text>
      <view class="photo-upload-area">
        <view class="upload-box" @click="uploadStudentCard">
          <text v-if="!form.studentCardUploaded" class="upload-plus">+</text>
          <text v-if="!form.studentCardUploaded" class="upload-hint">上传学生证照片</text>
          <text v-else class="uploaded-text">✅ 已上传</text>
        </view>
      </view>
    </view>

    <!-- 服务承诺 -->
    <view class="agreement-section">
      <view class="agreement-check" @click="form.agreed = !form.agreed">
        <view class="check-box" :class="{checked: form.agreed}">
          <text v-if="form.agreed">✓</text>
        </view>
        <text class="agreement-text">我已阅读并同意《骑手服务协议》，保证信息真实有效，遵守平台配送规则</text>
      </view>
    </view>

    <!-- 骑手须知 -->
    <view class="notice-card">
      <text class="notice-title">📖 骑手须知</text>
      <text class="notice-text">1. 接单后需在30分钟内取件，1小时内送达</text>
      <text class="notice-text">2. 取件和送达均需上传照片作为凭证</text>
      <text class="notice-text">3. 照片仅发布者、骑手和管理员可查看</text>
      <text class="notice-text">4. 配送费实时到账，可随时提现</text>
      <text class="notice-text">5. 违规操作将被取消骑手资格</text>
    </view>

    <!-- 提交按钮 -->
    <view class="submit-btn" :class="{disabled: !form.agreed}" @click="submit">
      <text>提交注册申请</text>
    </view>
  </view>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { callCloud, uploadImage, checkLogin } from '@/utils/cloud'

const buildingList = ['1号宿舍楼', '2号宿舍楼', '3号宿舍楼', '5号宿舍楼', '6号宿舍楼', '8号宿舍楼', '10号宿舍楼', '12号宿舍楼']

const smsCode = ref('')
const countdown = ref(0)
const phoneVerified = ref(false)
var countdownTimer = null

const isPhoneValid = computed(() => {
  return /^1[3-9]\d{9}$/.test(form.phone)
})

const sendCode = async () => {
  if (countdown.value > 0) return
  if (!isPhoneValid.value) {
    uni.showToast({ title: '请先输入正确的11位手机号', icon: 'none' })
    return
  }
  var res = await callCloud('user', 'sendSmsCode', { phone: form.phone })
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

const form = reactive({
  realName: '',
  phone: '',
  school: '',
  studentId: '',
  building: '',
  studentCardUploaded: false,
  studentCardFileID: '',
  agreed: false
})
const onStudentIdInput = (e) => {
  // 仅保留数字，最多12位
  const v = String(e.detail.value || '').replace(/\D/g, '').slice(0, 12)
  form.studentId = v
}

const onBuildingChange = (e) => {
  form.building = buildingList[e.detail.value]
}

const uploadStudentCard = () => {
  uni.chooseImage({
    count: 1,
    success: async (res) => {
      uni.showLoading({ title: '上传中...' })
      const fileID = await uploadImage(res.tempFilePaths[0], 'rider')
      uni.hideLoading()
      form.studentCardUploaded = true
      form.studentCardFileID = fileID
      uni.showToast({ title: '上传成功', icon: 'success' })
    }
  })
}

const submitting = ref(false)
const submit = async () => {
  if (!form.agreed) {
    uni.showToast({ title: '请先同意服务协议', icon: 'none' })
    return
  }
  if (!checkLogin()) return
  if (!form.realName.trim()) {
    uni.showToast({ title: '请输入真实姓名', icon: 'none' })
    return
  }
  if (form.realName.trim().length < 2 || form.realName.trim().length > 10) {
    uni.showToast({ title: '姓名长度为2-10个字', icon: 'none' })
    return
  }
  if (/[0-9]/.test(form.realName)) {
    uni.showToast({ title: '姓名不能包含数字', icon: 'none' })
    return
  }
  if (!form.phone) {
    uni.showToast({ title: '请输入手机号', icon: 'none' })
    return
  }
  if (!/^1[3-9]\d{9}$/.test(form.phone)) {
    uni.showToast({ title: '请输入正确的11位手机号', icon: 'none' })
    return
  }
  // 验证短信验证码
  if (!phoneVerified.value) {
    if (!smsCode.value || smsCode.value.length !== 6) {
      uni.showToast({ title: '请输入6位验证码', icon: 'none' })
      return
    }
    var verifyRes = await callCloud('user', 'verifySmsCode', { phone: form.phone, smsCode: smsCode.value })
    if (verifyRes.code !== 0) {
      uni.showToast({ title: verifyRes.msg || '验证码错误', icon: 'none' })
      return
    }
    phoneVerified.value = true
  }
  if (!form.school.trim()) {
    uni.showToast({ title: '请输入学校名称', icon: 'none' })
    return
  }
  if (!form.studentId) {
    uni.showToast({ title: '请输入学号', icon: 'none' })
    return
  }
  if (!/^\d{8,12}$/.test(form.studentId)) {
    uni.showToast({ title: '学号为8-12位数字', icon: 'none' })
    return
  }
  if (!form.building) {
    uni.showToast({ title: '请选择宿舍楼', icon: 'none' })
    return
  }
  if (!form.studentCardUploaded) {
    uni.showToast({ title: '请上传学生证照片', icon: 'none' })
    return
  }
  if (submitting.value) return
  submitting.value = true
  const res = await callCloud('user', 'registerRider', {
    realName: form.realName,
    phone: form.phone,
    studentId: form.studentId,
    building: form.building
  })
  submitting.value = false
  if (res.code === 0) {
    uni.setStorageSync('isRider', true)
    const userInfo = uni.getStorageSync('userInfo') || {}
    userInfo.isRider = true
    userInfo.riderId = res.riderId
    uni.setStorageSync('userInfo', userInfo)
    uni.showToast({ title: '注册成功！', icon: 'success' })
    setTimeout(() => { uni.navigateBack() }, 1500)
  }
}
</script>

<style scoped>
.rider-register { background: #F5F7FA; min-height: 100vh; padding: 0 0 160rpx; }

.header-banner { background: linear-gradient(135deg, #FF9800, #F57C00); padding: 60rpx 32rpx 40rpx; display: flex; flex-direction: column; align-items: center; }
.banner-emoji { font-size: 72rpx; margin-bottom: 12rpx; }
.banner-title { font-size: 36rpx; font-weight: bold; color: #fff; }
.banner-desc { font-size: 26rpx; color: rgba(255,255,255,0.8); margin-top: 8rpx; }

.form-section { padding: 0 24rpx; margin-top: 24rpx; }
.section-title { font-size: 28rpx; font-weight: bold; color: #333; padding: 16rpx 0; display: block; }
.form-card { background: #fff; border-radius: 16rpx; padding: 0 24rpx; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08); }
.form-item { display: flex; align-items: center; padding: 28rpx 0; }
.form-label { font-size: 28rpx; color: #333; width: 160rpx; flex-shrink: 0; }
.form-item input { flex: 1; font-size: 28rpx; }
.divider { height: 1rpx; background: #f0f0f0; }
.phone-hint { display: flex; align-items: center; padding: 0 0 20rpx; }
.hint-icon { font-size: 22rpx; margin-right: 8rpx; }
.hint-text { font-size: 22rpx; color: #38A169; font-weight: 500; }
.picker-value { flex: 1; display: flex; justify-content: space-between; align-items: center; font-size: 28rpx; color: #333; }
.picker-arrow { font-size: 32rpx; color: #ccc; }

.photo-upload-area { padding: 0 24rpx; }
.upload-box { width: 240rpx; height: 240rpx; background: #fff; border: 2rpx dashed #ccc; border-radius: 16rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08); }
.upload-plus { font-size: 64rpx; color: #ccc; }
.upload-hint { font-size: 22rpx; color: #999; margin-top: 8rpx; }
.uploaded-text { font-size: 28rpx; color: #43A047; font-weight: bold; }

.agreement-section { padding: 24rpx; }
.agreement-check { display: flex; align-items: flex-start; }
.check-box { width: 40rpx; height: 40rpx; border: 2rpx solid #ccc; border-radius: 8rpx; display: flex; align-items: center; justify-content: center; margin-right: 12rpx; flex-shrink: 0; margin-top: 4rpx; }
.check-box.checked { background: #4A90D9; border-color: #4A90D9; }
.check-box text { color: #fff; font-size: 24rpx; }
.agreement-text { font-size: 24rpx; color: #666; line-height: 36rpx; }

.notice-card { margin: 0 24rpx; background: #FFF8E1; border-radius: 12rpx; padding: 20rpx; }
.notice-title { font-size: 26rpx; font-weight: bold; color: #F57C00; display: block; margin-bottom: 12rpx; }
.notice-text { font-size: 22rpx; color: #795548; display: block; line-height: 36rpx; }

.submit-btn { position: fixed; bottom: 40rpx; left: 24rpx; right: 24rpx; background: linear-gradient(135deg, #FF9800, #F57C00); border-radius: 48rpx; padding: 28rpx; text-align: center; box-shadow: 0 8rpx 24rpx rgba(255,152,0,0.4); }
.submit-btn.disabled { opacity: 0.5; }
.submit-btn text { color: #fff; font-size: 32rpx; font-weight: bold; }

.sms-row { display: flex; align-items: center; padding: 28rpx 0; }
.sms-input { flex: 1; font-size: 28rpx; }
.sms-btn { padding: 12rpx 24rpx; background: linear-gradient(135deg, #FF9800, #F57C00); border-radius: 28rpx; flex-shrink: 0; margin-left: 12rpx; }
.sms-btn text { color: #fff; font-size: 24rpx; font-weight: 600; white-space: nowrap; }
.sms-btn.disabled { opacity: 0.5; }
</style>
