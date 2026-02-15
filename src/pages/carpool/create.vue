<template>
  <view class="create-carpool">
    <!-- 路线信息 -->
    <view class="form-section">
      <text class="section-title">🚗 路线信息</text>
      <view class="form-card">
        <view class="form-item">
          <text class="form-label">出发地</text>
          <input placeholder="如：学校南门" v-model="form.from" />
        </view>
        <view class="divider"></view>
        <view class="form-item">
          <text class="form-label">目的地</text>
          <input placeholder="如：火车站" v-model="form.to" />
        </view>
        <view class="divider"></view>
        <view class="form-item">
          <text class="form-label">上车地点</text>
          <input placeholder="精确的上车地点" v-model="form.pickupLocation" />
        </view>
      </view>
    </view>

    <!-- 时间设置 -->
    <view class="form-section">
      <text class="section-title">🕐 时间设置</text>
      <view class="form-card">
        <view class="form-item">
          <text class="form-label">出发时间</text>
          <picker mode="multiSelector" :range="dateTimeRange" @change="onDepartTimeChange">
            <view class="picker-value">
              <text>{{ form.departTime || '请选择出发时间' }}</text>
              <text class="picker-arrow">›</text>
            </view>
          </picker>
        </view>
        <view class="divider"></view>
        <view class="form-item">
          <text class="form-label">截止时间</text>
          <picker mode="multiSelector" :range="dateTimeRange" @change="onDeadlineChange">
            <view class="picker-value">
              <text>{{ form.deadline || '报名截止时间' }}</text>
              <text class="picker-arrow">›</text>
            </view>
          </picker>
        </view>
      </view>
    </view>

    <!-- 人数设置 -->
    <view class="form-section">
      <text class="section-title">👥 拼车人数</text>
      <view class="people-selector">
        <view v-for="n in peopleOptions" :key="n" class="people-item" :class="{active: form.maxPeople === n}" @click="form.maxPeople = n">
          <text class="people-num">{{ n }}</text>
          <text class="people-label">人</text>
        </view>
      </view>
    </view>

    <!-- 联系方式 -->
    <view class="form-section">
      <text class="section-title">📞 联系方式</text>
      <view class="form-card">
        <view class="form-item">
          <text class="form-label">联系方式</text>
          <input placeholder="微信号/手机号" v-model="form.contact" />
        </view>
        <view class="divider"></view>
        <view class="form-item column">
          <text class="form-label">备注说明</text>
          <textarea placeholder="如：费用AA，预计打车费80元左右" v-model="form.remark" maxlength="300" />
        </view>
      </view>
    </view>

    <!-- 拉群提示 -->
    <view class="group-tip">
      <text class="tip-icon">💡</text>
      <text class="tip-text">建议在备注中留下微信号，方便建群沟通行程细节。拼车成功后可一键拉群！</text>
    </view>

    <!-- 提交按钮 -->
    <view class="submit-btn" @click="submit">
      <text>发布拼车信息</text>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { callCloud, checkLogin } from '@/utils/cloud'

const days = []
for (let i = 0; i < 7; i++) {
  const d = new Date(Date.now() + i * 86400000)
  days.push(`${d.getMonth() + 1}月${d.getDate()}日`)
}
const hours = Array.from({length: 24}, (_, i) => `${String(i).padStart(2, '0')}时`)
const minutes = ['00分', '10分', '20分', '30分', '40分', '50分']
const dateTimeRange = [days, hours, minutes]

const form = reactive({
  from: '',
  to: '',
  pickupLocation: '',
  departTime: '',
  deadline: '',
  maxPeople: 4,
  contact: '',
  remark: ''
})

const onDepartTimeChange = (e) => {
  const vals = e.detail.value
  form.departTime = `${days[vals[0]]} ${hours[vals[1]].replace('时',':')}${minutes[vals[2]].replace('分','')}`
}

const onDeadlineChange = (e) => {
  const vals = e.detail.value
  form.deadline = `${days[vals[0]]} ${hours[vals[1]].replace('时',':')}${minutes[vals[2]].replace('分','')}`
}

const peopleOptions = [2, 3, 4, 5]
const submitting = ref(false)
const submit = async () => {
  if (!checkLogin()) return
  if (!form.from || !form.to) {
    uni.showToast({ title: '请填写出发地和目的地', icon: 'none' })
    return
  }
  if (!form.pickupLocation) {
    uni.showToast({ title: '请填写上车地点', icon: 'none' })
    return
  }
  if (!form.departTime) {
    uni.showToast({ title: '请选择出发时间', icon: 'none' })
    return
  }
  if (!form.contact) {
    uni.showToast({ title: '请填写联系方式', icon: 'none' })
    return
  }
  if (submitting.value) return
  submitting.value = true
  const res = await callCloud('carpool', 'create', {
    from: form.from,
    to: form.to,
    departTime: form.departTime,
    pickupLocation: form.pickupLocation,
    maxPeople: form.maxPeople,
    deadline: form.deadline,
    contact: form.contact,
    remark: form.remark
  })
  submitting.value = false
  if (res.code === 0) {
    uni.showToast({ title: '发布成功！', icon: 'success' })
    setTimeout(() => { uni.navigateBack() }, 1500)
  }
}
</script>

<style scoped>
.create-carpool { background: #F5F7FA; min-height: 100vh; padding: 20rpx 24rpx 160rpx; }

.form-section { margin-bottom: 28rpx; }
.section-title { font-size: 28rpx; font-weight: bold; color: #333; padding: 16rpx 0; display: block; }

.form-card { background: #fff; border-radius: 16rpx; padding: 0 24rpx; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08); }
.form-item { display: flex; align-items: center; padding: 28rpx 0; }
.form-item.column { flex-direction: column; align-items: flex-start; }
.form-label { font-size: 28rpx; color: #333; width: 160rpx; flex-shrink: 0; }
.form-item input { flex: 1; font-size: 28rpx; }
.form-item.column .form-label { width: auto; margin-bottom: 12rpx; }
.form-item.column textarea { width: 100%; height: 160rpx; font-size: 26rpx; line-height: 40rpx; }
.divider { height: 1rpx; background: #f0f0f0; }

.picker-value { flex: 1; display: flex; justify-content: space-between; align-items: center; font-size: 28rpx; color: #333; }
.picker-arrow { font-size: 32rpx; color: #ccc; }

.people-selector { display: flex; gap: 20rpx; }
.people-item { flex: 1; background: #fff; border-radius: 16rpx; padding: 28rpx 0; display: flex; flex-direction: column; align-items: center; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08); border: 2rpx solid transparent; }
.people-item.active { border-color: #43A047; background: #E8F5E9; }
.people-num { font-size: 40rpx; font-weight: bold; color: #333; }
.people-item.active .people-num { color: #43A047; }
.people-label { font-size: 22rpx; color: #999; }

.group-tip { display: flex; align-items: flex-start; background: #E3F2FD; border-radius: 12rpx; padding: 20rpx; margin-bottom: 28rpx; }
.tip-icon { font-size: 28rpx; margin-right: 12rpx; flex-shrink: 0; }
.tip-text { font-size: 24rpx; color: #4A90D9; line-height: 36rpx; }

.submit-btn { position: fixed; bottom: 40rpx; left: 24rpx; right: 24rpx; background: linear-gradient(135deg, #43A047, #2E7D32); border-radius: 48rpx; padding: 28rpx; text-align: center; box-shadow: 0 8rpx 24rpx rgba(67,160,71,0.4); }
.submit-btn text { color: #fff; font-size: 32rpx; font-weight: bold; }
</style>
