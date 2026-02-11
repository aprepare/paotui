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
      <text class="section-title">📋 实名认证</text>
      <view class="form-card">
        <view class="form-item">
          <text class="form-label">真实姓名</text>
          <input placeholder="请输入真实姓名" v-model="form.realName" />
        </view>
        <view class="divider"></view>
        <view class="form-item">
          <text class="form-label">身份证号</text>
          <input placeholder="请输入身份证号码" v-model="form.idCard" />
        </view>
        <view class="divider"></view>
        <view class="form-item">
          <text class="form-label">手机号码</text>
          <input type="number" placeholder="请输入手机号" v-model="form.phone" />
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
          <input placeholder="请输入学号" v-model="form.studentId" />
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
import { reactive } from 'vue'

const buildingList = ['1号宿舍楼', '2号宿舍楼', '3号宿舍楼', '5号宿舍楼', '6号宿舍楼', '8号宿舍楼', '10号宿舍楼', '12号宿舍楼']

const form = reactive({
  realName: '',
  idCard: '',
  phone: '',
  school: '',
  studentId: '',
  building: '',
  studentCardUploaded: false,
  agreed: false
})

const onBuildingChange = (e) => {
  form.building = buildingList[e.detail.value]
}

const uploadStudentCard = () => {
  uni.chooseImage({
    count: 1,
    success: () => {
      form.studentCardUploaded = true
      uni.showToast({ title: '上传成功', icon: 'success' })
    }
  })
}

const submit = () => {
  if (!form.agreed) {
    uni.showToast({ title: '请先同意服务协议', icon: 'none' })
    return
  }
  if (!form.realName || !form.idCard || !form.phone) {
    uni.showToast({ title: '请填写完整实名信息', icon: 'none' })
    return
  }
  if (!form.school || !form.studentId) {
    uni.showToast({ title: '请填写学生信息', icon: 'none' })
    return
  }
  if (!form.studentCardUploaded) {
    uni.showToast({ title: '请上传学生证照片', icon: 'none' })
    return
  }
  uni.showToast({ title: '注册申请已提交！', icon: 'success' })
  setTimeout(() => { uni.navigateBack() }, 1500)
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
