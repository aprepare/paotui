<template>
  <view class="create-goods">
    <view class="upload-section">
      <text class="section-title">📷 商品图片</text>
      <view class="img-grid">
        <view v-for="(img, i) in images" :key="i" class="img-item">
          <text class="img-placeholder">{{ img }}</text>
          <view class="img-del" @click="images.splice(i, 1)">×</view>
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
      </view>
    </view>
    <view class="submit-btn" @click="submit">
      <text>发布商品</text>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue'

const images = ref(['📱', '📦'])
const categories = ['数码', '书籍', '服饰', '生活', '运动', '其他']
const form = reactive({ title: '', price: '', category: '', desc: '', contact: '' })

const addImage = () => {
  const emojis = ['📷', '🖼️', '📸', '🎨', '🏷️', '📦', '🎁']
  images.value.push(emojis[Math.floor(Math.random() * emojis.length)])
}
const submit = () => {
  if (!form.title || !form.price) {
    uni.showToast({ title: '请填写标题和价格', icon: 'none' })
    return
  }
  uni.showToast({ title: '发布成功！', icon: 'success' })
  setTimeout(() => uni.navigateBack(), 1500)
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
.textarea-card { background: #fff; border-radius: 16rpx; padding: 24rpx; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08); }
.textarea-card textarea { width: 100%; height: 200rpx; font-size: 28rpx; }
.word-count { font-size: 22rpx; color: #999; text-align: right; display: block; margin-top: 8rpx; }
.submit-btn { position: fixed; bottom: 40rpx; left: 24rpx; right: 24rpx; background: linear-gradient(135deg, #4A90D9, #357ABD); border-radius: 48rpx; padding: 28rpx; text-align: center; box-shadow: 0 8rpx 24rpx rgba(74,144,217,0.4); }
.submit-btn text { color: #fff; font-size: 32rpx; font-weight: bold; }
</style>
