<template>
  <view class="create-goods">
    <view class="upload-section">
      <text class="section-title">📷 商品图片</text>
      <view class="img-grid">
        <view v-for="(img, i) in images" :key="i" class="img-item">
          <text class="img-placeholder">{{ img }}</text>
          <view class="img-del" @click="removeImage(i)">×</view>
        </view>
        <view v-if="images.length < 9" class="img-add" @click="addImage">
          <text class="add-icon">+</text>
          <text class="add-text">{{ images.length }}/9</text>
        </view>
      </view>
    </view>
    <view class="form-section">
      <view class="form-card">
        <view class="form-item">
          <text class="form-label">标题</text>
          <input placeholder="描述一下你的宝贝" v-model="form.title" maxlength="30" />
        </view>
        <view class="divider"></view>
        <view class="form-item">
          <text class="form-label">价格</text>
          <view class="price-input">
            <text class="yen">¥</text>
            <input type="digit" placeholder="0.00" v-model="form.price" />
          </view>
        </view>
        <view class="divider"></view>
        <view class="form-item">
          <text class="form-label">分类</text>
          <picker :range="categories" @change="form.category = categories[$event.detail.value]">
            <text class="picker-text">{{ form.category || '请选择分类' }}</text>
          </picker>
        </view>
        <view class="divider"></view>
        <view class="form-item">
          <text class="form-label">配送方式</text>
          <view class="delivery-options">
            <view class="delivery-opt" :class="{active: form.deliveryType === 0}" @click="form.deliveryType = 0">
              <text>自提</text>
            </view>
            <view class="delivery-opt" :class="{active: form.deliveryType === 1}" @click="form.deliveryType = 1">
              <text>包配送</text>
            </view>
          </view>
        </view>
      </view>
    </view>
    <view class="form-section">
      <text class="section-title">📝 详细描述</text>
      <view class="textarea-card">
        <textarea placeholder="描述一下宝贝的成色、购入时间、转手原因等" v-model="form.desc" maxlength="500" />
        <text class="word-count">{{ form.desc.length }}/500</text>
      </view>
    </view>
    <view class="form-section">
      <text class="section-title">📱 联系方式</text>
      <view class="form-card">
        <view class="form-item">
          <text class="form-label">微信号</text>
          <input placeholder="方便买家联系你" v-model="form.contact" />
        </view>
        <view class="divider"></view>
        <view class="form-item">
          <text class="form-label">公开微信</text>
          <view class="visibility-options">
            <view class="vis-opt" :class="{active: form.contactPublic === 1}" @click="form.contactPublic = 1">
              <text>公开</text>
            </view>
            <view class="vis-opt" :class="{active: form.contactPublic === 0}" @click="form.contactPublic = 0">
              <text>隐藏</text>
            </view>
          </view>
          <text class="vis-hint">{{ form.contactPublic === 1 ? '所有人可见' : '仅点击联系后可见' }}</text>
        </view>
      </view>
    </view>
    <view class="submit-btn" @click="submit">
      <text>发布商品</text>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { callCloud, uploadImages, checkLogin } from '@/utils/cloud'

const images = ref([])
const tempPaths = ref([])
const categories = ['数码', '书籍', '服饰', '生活', '运动', '其他']
const form = reactive({ title: '', price: '', category: '', desc: '', contact: '', deliveryType: 0, contactPublic: 1 })

const removeImage = (i) => {
  images.value.splice(i, 1)
  tempPaths.value.splice(i, 1)
}
const addImage = () => {
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
  if (!form.title || !form.price) {
    uni.showToast({ title: '请填写标题和价格', icon: 'none' })
    return
  }
  if (submitting.value) return
  submitting.value = true
  let imageIds = []
  if (tempPaths.value.length > 0) {
    uni.showLoading({ title: '上传图片中...' })
    imageIds = await uploadImages(tempPaths.value, 'market')
    uni.hideLoading()
  }
  const res = await callCloud('market', 'create', {
    title: form.title,
    price: form.price,
    category: form.category || '其他',
    desc: form.desc,
    images: imageIds,
    deliveryType: form.deliveryType,
    contact: form.contact,
    contactPublic: form.contactPublic
  })
  submitting.value = false
  if (res.code === 0) {
    uni.showToast({ title: '发布成功！', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 1500)
  }
}
</script>

<style scoped>
.create-goods { background: #F5F7FA; min-height: 100vh; padding: 20rpx 24rpx 160rpx; }
.section-title { font-size: 28rpx; font-weight: bold; color: #333; padding: 16rpx 0; display: block; }
.form-section { margin-bottom: 20rpx; }
.img-grid { display: flex; flex-wrap: wrap; gap: 16rpx; }
.img-item { width: 200rpx; height: 200rpx; border-radius: 12rpx; background: #fff; display: flex; align-items: center; justify-content: center; position: relative; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06); }
.img-placeholder { font-size: 60rpx; }
.img-del { position: absolute; top: -10rpx; right: -10rpx; width: 36rpx; height: 36rpx; background: #FF6B6B; border-radius: 50%; color: #fff; font-size: 24rpx; display: flex; align-items: center; justify-content: center; }
.img-add { width: 200rpx; height: 200rpx; border-radius: 12rpx; border: 2rpx dashed #ccc; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.add-icon { font-size: 48rpx; color: #ccc; }
.add-text { font-size: 22rpx; color: #999; margin-top: 8rpx; }
.form-card { background: #fff; border-radius: 16rpx; padding: 0 24rpx; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08); }
.form-item { display: flex; align-items: center; padding: 28rpx 0; }
.form-label { font-size: 28rpx; color: #333; width: 140rpx; flex-shrink: 0; }
.form-item input { flex: 1; font-size: 28rpx; }
.divider { height: 1rpx; background: #f0f0f0; }
.price-input { flex: 1; display: flex; align-items: center; }
.yen { font-size: 32rpx; color: #FF6B6B; font-weight: bold; margin-right: 8rpx; }
.picker-text { font-size: 28rpx; color: #999; }
.delivery-options { flex: 1; display: flex; gap: 16rpx; }
.delivery-opt { padding: 12rpx 32rpx; border-radius: 28rpx; background: #F0F2F5; border: 2rpx solid #E2E8F0; transition: all 0.2s ease; }
.delivery-opt.active { background: #EBF4FF; border-color: #2B6CB0; }
.delivery-opt text { font-size: 26rpx; color: #718096; font-weight: 500; }
.delivery-opt.active text { color: #2B6CB0; font-weight: 600; }
.visibility-options { display: flex; gap: 16rpx; }
.vis-opt { padding: 12rpx 32rpx; border-radius: 28rpx; background: #F0F2F5; border: 2rpx solid #E2E8F0; transition: all 0.2s ease; }
.vis-opt.active { background: #EBF4FF; border-color: #2B6CB0; }
.vis-opt text { font-size: 26rpx; color: #718096; font-weight: 500; }
.vis-opt.active text { color: #2B6CB0; font-weight: 600; }
.vis-hint { font-size: 22rpx; color: #A0AEC0; margin-left: 12rpx; }
.textarea-card { background: #fff; border-radius: 16rpx; padding: 24rpx; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08); }
.textarea-card textarea { width: 100%; height: 200rpx; font-size: 28rpx; }
.word-count { font-size: 22rpx; color: #999; text-align: right; display: block; margin-top: 8rpx; }
.submit-btn { position: fixed; bottom: 40rpx; left: 24rpx; right: 24rpx; background: linear-gradient(135deg, #4A90D9, #357ABD); border-radius: 48rpx; padding: 28rpx; text-align: center; box-shadow: 0 8rpx 24rpx rgba(74,144,217,0.4); }
.submit-btn text { color: #fff; font-size: 32rpx; font-weight: bold; }
</style>
