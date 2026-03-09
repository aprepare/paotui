<template>
  <view class="create-post">
    <view class="textarea-area">
      <textarea v-model="content" placeholder="分享你的校园生活..." maxlength="1000" auto-height :focus="true" />
      <text class="word-count">{{ content.length }}/1000</text>
    </view>
    <view class="img-section">
      <view class="img-grid">
        <view v-for="(img, i) in tempPaths" :key="i" class="img-item">
          <image class="img-thumb" :src="img" mode="aspectFill" />
          <view class="img-del" @click="removeImage(i)">×</view>
        </view>
        <view v-if="tempPaths.length < 9" class="img-add" @click="addImage">
          <text class="add-icon">📷</text>
          <text class="add-text">添加图片</text>
        </view>
      </view>
    </view>
    <view class="toolbar">
      <view class="tool-item" @click="addImage">
        <text>🖼️ 图片</text>
      </view>
      <view class="tool-item">
        <text>📍 位置</text>
      </view>
      <view class="tool-item">
        <text># 话题</text>
      </view>
    </view>
    <view class="submit-btn" :class="{disabled: submitting}" @click="submit">
      <text>{{ submitting ? '发布中...' : '发布' }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { callCloud, uploadImages, checkLogin } from '@/utils/cloud'

const content = ref('')
const images = ref([])
const tempPaths = ref([])

const removeImage = (i) => {
  images.value.splice(i, 1)
  tempPaths.value.splice(i, 1)
}
const addImage = () => {
  if (images.value.length >= 9) return
  uni.chooseImage({
    count: 9 - images.value.length,
    success: (res) => {
      res.tempFilePaths.forEach(p => {
        images.value.push('🖼️')
        tempPaths.value.push(p)
      })
    }
  })
}
const submitting = ref(false)
const submit = async () => {
  if (!checkLogin()) return
  if (!content.value.trim()) {
    uni.showToast({ title: '请输入内容', icon: 'none' })
    return
  }
  if (submitting.value) return
  submitting.value = true
  let imageIds = []
  if (tempPaths.value.length > 0) {
    uni.showLoading({ title: '上传图片中...' })
    try {
      imageIds = await uploadImages(tempPaths.value, 'forum')
    } catch (e) {
      uni.hideLoading()
      submitting.value = false
      uni.showToast({ title: e.message || '上传失败', icon: 'none' })
      return
    }
    uni.hideLoading()
  }
  const res = await callCloud('forum', 'create', {
    content: content.value,
    images: imageIds
  })
  submitting.value = false
  if (res.code === 0) {
    uni.showToast({ title: '发布成功！', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 1500)
  } else {
    uni.showToast({ title: res.msg || '发布失败，请重试', icon: 'none' })
  }
}
</script>

<style scoped>
.create-post { background: #fff; min-height: 100vh; display: flex; flex-direction: column; }
.textarea-area { padding: 24rpx; flex: 1; }
.textarea-area textarea { width: 100%; min-height: 300rpx; font-size: 30rpx; line-height: 1.6; }
.word-count { font-size: 22rpx; color: #999; text-align: right; display: block; margin-top: 8rpx; }
.img-section { padding: 0 24rpx 24rpx; }
.img-grid { display: flex; flex-wrap: wrap; gap: 16rpx; }
.img-item { width: 180rpx; height: 180rpx; border-radius: 12rpx; background: #F5F7FA; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
.img-thumb { width: 180rpx; height: 180rpx; }
.img-emoji { font-size: 56rpx; }
.img-del { position: absolute; top: -10rpx; right: -10rpx; width: 36rpx; height: 36rpx; background: #FF6B6B; border-radius: 50%; color: #fff; font-size: 24rpx; display: flex; align-items: center; justify-content: center; }
.img-add { width: 180rpx; height: 180rpx; border-radius: 12rpx; border: 2rpx dashed #ccc; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.add-icon { font-size: 40rpx; }
.add-text { font-size: 22rpx; color: #999; margin-top: 8rpx; }
.toolbar { display: flex; padding: 20rpx 24rpx; border-top: 1rpx solid #f0f0f0; gap: 32rpx; }
.tool-item text { font-size: 26rpx; color: #666; }
.submit-btn { margin: 20rpx 24rpx 40rpx; background: linear-gradient(135deg, #4A90D9, #357ABD); border-radius: 48rpx; padding: 24rpx; text-align: center; }
.submit-btn text { color: #fff; font-size: 30rpx; font-weight: bold; }
.submit-btn.disabled { opacity: 0.6; pointer-events: none; }
</style>
