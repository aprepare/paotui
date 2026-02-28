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
          <input placeholder="请输入真实姓名" v-model="form.realName"></input>
        </view>
        <view class="divider"></view>
        <view class="form-item">
          <text class="form-label">手机号码</text>
          <text v-if="form.phone" class="phone-display">{{ form.phone }}</text>
          <button v-else class="wx-phone-btn" open-type="getPhoneNumber" @getphonenumber="onGetPhoneNumber">
            <text>📱 微信授权获取</text>
          </button>
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
          <input placeholder="请输入学校名称" v-model="form.school"></input>
        </view>
        <view class="divider"></view>
        <view class="form-item">
          <text class="form-label">学号</text>
          <input type="number" placeholder="12位学号" v-model="form.studentId" maxlength="12" @input="onStudentIdInput"></input>
        </view>
        <view class="divider"></view>
        <view class="form-item">
          <text class="form-label">宿舍楼</text>
          <picker mode="multiSelector" :range="buildingColumns" :value="buildingIndex" @columnchange="onColumnChange" @change="onBuildingChange">
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
import { reactive, ref } from 'vue'
import { callCloud, uploadImage, checkLogin } from '@/utils/cloud'

const buildingData = {
  '东区': ['一舍女', '二舍男', '三舍女', '四舍男', '五舍女', '六舍男', '七舍女', '八舍男'],
  '西区': ['一组团男', '二组团女', '二组团男', '三组团女', '三组团男', '四组团男', '五组团男', '六组团女', '七组团男', '八组团男', '九组团女', '十组团女', '十一组团男', '十二组团男', '十二组团女']
}
var areaList = ['东区', '西区']
const buildingIndex = ref([0, 0])
const buildingColumns = computed(() => {
  var area = areaList[buildingIndex.value[0]] || '东区'
  return [areaList, buildingData[area]]
})

const smsCode = ref('')
const countdown = ref(0)
const phoneVerified = ref(false)

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
    form.phone = res.data.phone
    phoneVerified.value = true
    uni.showToast({ title: '手机号获取成功', icon: 'success' })
  } else {
    uni.showToast({ title: res.msg || '获取手机号失败', icon: 'none' })
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

const onColumnChange = (e) => {
  var col = e.detail.column
  var val = e.detail.value
  var newIdx = [buildingIndex.value[0], buildingIndex.value[1]]
  newIdx[col] = val
  if (col === 0) { newIdx[1] = 0 }
  buildingIndex.value = newIdx
}

const onBuildingChange = (e) => {
  var vals = e.detail.value
  var area = areaList[vals[0]]
  var bld = buildingData[area][vals[1]]
  form.building = area + bld
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
    uni.showToast({ title: '请先授权获取手机号', icon: 'none' })
    return
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
.phone-display { flex: 1; font-size: 30rpx; color: #2D3748; font-weight: 600; }
.wx-phone-btn { flex: 1; background: linear-gradient(135deg, #07C160, #06AD56); border-radius: 32rpx; padding: 16rpx 0; text-align: center; border: none; margin: 0; line-height: normal; font-size: 26rpx; }
.wx-phone-btn::after { display: none; }
.wx-phone-btn text { color: #fff; font-size: 26rpx; font-weight: 600; }
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

</style>
