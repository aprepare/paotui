<template>
  <view class="create-page">
    <view class="form-card">
      <view class="form-item">
        <text class="form-label">标题</text>
        <input v-model="title" placeholder="给你的经验帖起个标题" class="form-input" maxlength="50" />
      </view>
      <view class="form-item">
        <text class="form-label">分类</text>
        <view class="cat-row">
          <view v-for="(cat, i) in categories" :key="i" class="cat-tag" :class="{active: category === cat}" @click="category = cat">
            <text>{{ cat }}</text>
          </view>
        </view>
      </view>
      <view class="form-item">
        <text class="form-label">目标院校（选填）</text>
        <input v-model="school" placeholder="如：北京大学" class="form-input" maxlength="20" />
      </view>
      <view class="form-item admit-row">
        <text class="form-label">是否已上岸</text>
        <switch :checked="admitted" @change="admitted = $event.detail.value" color="#43A047" />
      </view>
      <view class="form-item">
        <text class="form-label">正文</text>
        <textarea v-model="content" placeholder="分享你的考研经验、学习方法、心路历程..." class="form-textarea" maxlength="5000" :auto-height="true" />
      </view>
      <view class="form-item">
        <text class="form-label">配图（选填）</text>
        <view class="img-row">
          <view v-for="(img, i) in images" :key="i" class="img-wrap">
            <image :src="img" class="img-preview" mode="aspectFill" />
            <view class="img-del" @click="removeImg(i)"><text>×</text></view>
          </view>
          <view class="img-add" v-if="images.length < 9" @click="chooseImg">
            <text>+</text>
          </view>
        </view>
      </view>
    </view>
    <view class="submit-btn" :class="{disabled: !canSubmit}" @click="submit">
      <text>发布经验帖</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { callCloud, checkLogin, uploadImages } from '@/utils/cloud.js'

const title = ref('')
const content = ref('')
const category = ref('')
const school = ref('')
const admitted = ref(false)
const images = ref([])
const submitting = ref(false)

const categories = ['初试经验', '复试经验', '择校建议', '学习方法', '心态调整']

const canSubmit = computed(() => title.value.trim() && content.value.trim() && category.value && !submitting.value)

const chooseImg = () => {
  uni.chooseImage({
    count: 9 - images.value.length,
    success: (res) => {
      images.value = images.value.concat(res.tempFilePaths)
    }
  })
}

const removeImg = (i) => { images.value.splice(i, 1) }

const submit = async () => {
  if (!canSubmit.value) return
  if (!checkLogin()) return
  submitting.value = true
  uni.showLoading({ title: '发布中...' })
  try {
    var uploadedImages = []
    if (images.value.length > 0) {
      uploadedImages = await uploadImages(images.value)
    }
    var res = await callCloud('experience', 'create', {
      title: title.value.trim(),
      content: content.value.trim(),
      category: category.value,
      school: school.value.trim(),
      admitted: admitted.value,
      images: uploadedImages
    })
    if (res.code === 0) {
      uni.showToast({ title: '发布成功', icon: 'success' })
      setTimeout(() => { uni.navigateBack() }, 1000)
    } else {
      uni.showToast({ title: res.msg || '发布失败', icon: 'none' })
    }
  } catch (e) {
    uni.showToast({ title: '发布失败', icon: 'none' })
  }
  uni.hideLoading()
  submitting.value = false
}
</script>

<style scoped>
.create-page { background: #F0F2F5; min-height: 100vh; padding: 20rpx 24rpx 40rpx; }
.form-card { background: #fff; border-radius: 20rpx; padding: 28rpx; box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06); }
.form-item { margin-bottom: 28rpx; }
.form-item:last-child { margin-bottom: 0; }
.form-label { font-size: 26rpx; font-weight: 700; color: #333; display: block; margin-bottom: 12rpx; }
.form-input { background: #F5F7FA; border-radius: 12rpx; height: 80rpx; line-height: 80rpx; padding: 0 20rpx; font-size: 28rpx; }
.form-textarea { background: #F5F7FA; border-radius: 12rpx; padding: 20rpx; font-size: 28rpx; min-height: 300rpx; width: 100%; box-sizing: border-box; line-height: 1.7; }
.cat-row { display: flex; flex-wrap: wrap; gap: 12rpx; }
.cat-tag { padding: 10rpx 24rpx; background: #F0F2F5; border-radius: 30rpx; font-size: 24rpx; color: #666; }
.cat-tag.active { background: linear-gradient(135deg, #43A047, #2E7D32); color: #fff; }
.admit-row { display: flex; align-items: center; justify-content: space-between; }
.img-row { display: flex; flex-wrap: wrap; gap: 12rpx; }
.img-wrap { position: relative; width: 160rpx; height: 160rpx; }
.img-preview { width: 160rpx; height: 160rpx; border-radius: 12rpx; }
.img-del { position: absolute; top: -10rpx; right: -10rpx; width: 40rpx; height: 40rpx; background: #E53E3E; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.img-del text { color: #fff; font-size: 24rpx; }
.img-add { width: 160rpx; height: 160rpx; background: #F5F7FA; border-radius: 12rpx; display: flex; align-items: center; justify-content: center; border: 2rpx dashed #ccc; }
.img-add text { font-size: 48rpx; color: #ccc; }
.submit-btn { margin-top: 32rpx; background: linear-gradient(135deg, #43A047, #2E7D32); border-radius: 16rpx; padding: 28rpx; text-align: center; box-shadow: 0 8rpx 24rpx rgba(67,160,71,0.3); }
.submit-btn text { color: #fff; font-size: 30rpx; font-weight: 700; }
.submit-btn.disabled { opacity: 0.5; }
</style>
