<template>
  <view class="create-page">
    <!-- 基本信息 -->
    <view class="form-card">
      <text class="card-label">基本信息</text>
      <view class="form-item">
        <text class="form-label">活动标题</text>
        <input class="form-input" v-model="form.title" placeholder="输入活动标题" placeholder-style="color:#A0AEC0"></input>
      </view>
      <view class="form-item">
        <text class="form-label">活动类型</text>
        <picker :range="typeOptions" @change="onTypePick">
          <view class="form-picker">
            <text :class="form.type ? '' : 'placeholder'">{{ form.type || '选择活动类型' }}</text>
            <text class="picker-arrow">›</text>
          </view>
        </picker>
      </view>
      <view class="form-item">
        <text class="form-label">活动地点</text>
        <input class="form-input" v-model="form.place" placeholder="输入活动地点" placeholder-style="color:#A0AEC0"></input>
      </view>
      <view class="form-item">
        <text class="form-label">活动时间</text>
        <picker mode="date" :start="todayStr" @change="onDatePick">
          <view class="form-picker">
            <text :class="form.date ? '' : 'placeholder'">{{ form.date || '选择日期' }}</text>
            <text class="picker-arrow">›</text>
          </view>
        </picker>
      </view>
      <view class="form-item">
        <text class="form-label">具体时间</text>
        <picker mode="time" @change="onTimePick">
          <view class="form-picker">
            <text :class="form.hour ? '' : 'placeholder'">{{ form.hour || '选择时间' }}</text>
            <text class="picker-arrow">›</text>
          </view>
        </picker>
      </view>
      <view class="form-item">
        <text class="form-label">最大人数</text>
        <input class="form-input" v-model="form.max" type="number" placeholder="输入最大参与人数" placeholder-style="color:#A0AEC0"></input>
      </view>
    </view>

    <!-- 活动详情 -->
    <view class="form-card">
      <text class="card-label">活动详情</text>
      <view class="form-item">
        <textarea class="form-textarea" v-model="form.desc" placeholder="描述一下你的活动，让更多人了解" maxlength="500" placeholder-style="color:#A0AEC0" />
        <text class="char-count">{{ form.desc.length }}/500</text>
      </view>
    </view>

    <!-- 图片上传 -->
    <view class="form-card">
      <text class="card-label">活动图片</text>
      <text class="card-hint">添加图片让活动更有吸引力（最多9张）</text>
      <view class="image-grid">
        <view v-for="(img, i) in form.images" :key="i" class="image-item">
          <image class="preview-img" :src="img" mode="aspectFill" @click="previewImg(i)" />
          <view class="remove-btn" @click="removeImg(i)">
            <text class="remove-icon">×</text>
          </view>
        </view>
        <view v-if="form.images.length < 9" class="add-image" @click="chooseImage">
          <text class="add-icon">+</text>
          <text class="add-text">添加图片</text>
        </view>
      </view>
    </view>

    <!-- 提交按钮 -->
    <view class="submit-bar">
      <view class="submit-btn" @click="onSubmit">
        <text>发布组队</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { reactive } from 'vue'
import { callCloud, uploadImages, checkLogin } from '@/utils/cloud.js'

const typeOptions = ['校园开黑', '球类竞技', '校园陪跑', '撸铁健身', '户外骑行', '其他活动']

var _now = new Date()
var todayStr = _now.getFullYear() + '-' + String(_now.getMonth() + 1).padStart(2, '0') + '-' + String(_now.getDate()).padStart(2, '0')

const form = reactive({
  title: '', type: '', place: '', date: '', hour: '', max: '', desc: '', images: []
})

const onTypePick = (e) => { form.type = typeOptions[e.detail.value] }
const onDatePick = (e) => { form.date = e.detail.value }
const onTimePick = (e) => { form.hour = e.detail.value }

const chooseImage = () => {
  const remain = 9 - form.images.length
  uni.chooseImage({
    count: remain, sizeType: ['compressed'], sourceType: ['album', 'camera'],
    success: (res) => { form.images = form.images.concat(res.tempFilePaths) }
  })
}

const removeImg = (index) => { form.images.splice(index, 1) }
const previewImg = (index) => { uni.previewImage({ urls: form.images, current: form.images[index] }) }

const onSubmit = async () => {
  if (!checkLogin()) return
  if (!form.title) return uni.showToast({ title: '请输入活动标题', icon: 'none' })
  if (!form.type) return uni.showToast({ title: '请选择活动类型', icon: 'none' })
  if (!form.place) return uni.showToast({ title: '请输入活动地点', icon: 'none' })
  if (!form.date) return uni.showToast({ title: '请选择活动日期', icon: 'none' })
  if (!form.hour) return uni.showToast({ title: '请选择活动时间', icon: 'none' })
  const maxVal = Number(form.max)
  if (!form.max || !Number.isInteger(maxVal) || maxVal < 2 || maxVal > 100) return uni.showToast({ title: '人数范围为2-100人', icon: 'none' })

  var activityTime = form.date + ' ' + form.hour

  uni.showLoading({ title: '发布中...' })
  let imageFileIDs = []
  if (form.images.length > 0) {
    imageFileIDs = await uploadImages(form.images, 'team-images')
  }
  const res = await callCloud('team', 'create', {
    title: form.title, type: form.type, place: form.place,
    time: activityTime, max: form.max, desc: form.desc, images: imageFileIDs
  })
  uni.hideLoading()
  if (res.code === 0) {
    uni.showToast({ title: '发布成功', icon: 'success' })
    setTimeout(() => { uni.navigateBack() }, 1200)
  }
}
</script>

<style scoped>
.create-page { background: #F0F2F5; min-height: 100vh; padding-bottom: 160rpx; }

.form-card { background: #fff; margin: 20rpx 28rpx; border-radius: 20rpx; padding: 28rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.card-label { font-size: 30rpx; font-weight: 700; color: #1A1A2E; display: block; margin-bottom: 20rpx; }
.card-hint { font-size: 22rpx; color: #A0AEC0; display: block; margin-bottom: 16rpx; }

.form-item { margin-bottom: 20rpx; }
.form-label { font-size: 26rpx; color: #4A5568; font-weight: 600; display: block; margin-bottom: 10rpx; }
.form-input { background: #F7FAFC; border: 1rpx solid #E2E8F0; border-radius: 14rpx; padding: 0 24rpx; font-size: 26rpx; color: #2D3748; width: 100%; height: 80rpx; line-height: 80rpx; }
.form-textarea { background: #F7FAFC; border: 1rpx solid #E2E8F0; border-radius: 14rpx; padding: 20rpx 24rpx; font-size: 26rpx; color: #2D3748; width: 100%; height: 200rpx; }
.char-count { font-size: 22rpx; color: #A0AEC0; text-align: right; display: block; margin-top: 8rpx; }

.form-picker { background: #F7FAFC; border: 1rpx solid #E2E8F0; border-radius: 14rpx; padding: 20rpx 24rpx; display: flex; align-items: center; justify-content: space-between; }
.form-picker text { font-size: 26rpx; color: #2D3748; }
.form-picker .placeholder { color: #A0AEC0; }
.picker-arrow { font-size: 28rpx; color: #CBD5E0; }

.image-grid { display: flex; flex-wrap: wrap; }
.image-item { width: 200rpx; height: 200rpx; margin-right: 16rpx; margin-bottom: 16rpx; position: relative; border-radius: 16rpx; overflow: hidden; }
.preview-img { width: 200rpx; height: 200rpx; }
.remove-btn { position: absolute; top: 6rpx; right: 6rpx; width: 40rpx; height: 40rpx; background: rgba(0,0,0,0.5); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.remove-icon { color: #fff; font-size: 28rpx; font-weight: 700; line-height: 1; }

.add-image { width: 200rpx; height: 200rpx; background: #F7FAFC; border: 2rpx dashed #CBD5E0; border-radius: 16rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; transition: background 0.15s ease, border-color 0.15s ease; }
.add-image:active { background: #EDF2F7; border-color: #A0AEC0; }
.add-icon { font-size: 48rpx; color: #A0AEC0; line-height: 1; }
.add-text { font-size: 22rpx; color: #A0AEC0; margin-top: 8rpx; }

.submit-bar { position: fixed; bottom: 0; left: 0; right: 0; padding: 20rpx 28rpx; padding-bottom: 20rpx; background: #fff; box-shadow: 0 -2rpx 8rpx rgba(0,0,0,0.04); }
.submit-btn { background: linear-gradient(135deg, #4299E1, #2B6CB0); border-radius: 48rpx; padding: 28rpx; text-align: center; box-shadow: 0 8rpx 24rpx rgba(43,108,176,0.3); transition: transform 0.15s ease; }
.submit-btn:active { transform: scale(0.96); }
.submit-btn text { color: #fff; font-size: 30rpx; font-weight: 700; }
</style>
