<template>
  <view class="create-skill">
    <view class="form-section">
      <text class="section-title">🎯 技能信息</text>
      <view class="form-card">
        <view class="form-item">
          <text class="form-label">技能名称</text>
          <input placeholder="例如：PS修图、视频剪辑" v-model="form.title" maxlength="30"></input>
        </view>
        <view class="divider"></view>
        <view class="form-item">
          <text class="form-label">技能分类</text>
          <picker :range="categories" @change="form.category = categories[$event.detail.value]">
            <text class="picker-text">{{ form.category || '请选择分类' }}</text>
          </picker>
        </view>
        <view class="divider"></view>
        <view class="form-item">
          <text class="form-label">收费价格</text>
          <view class="price-row">
            <text class="yen">¥</text>
            <input type="digit" placeholder="0" v-model="form.price" class="price-input"></input>
            <text class="price-sep">/</text>
            <picker :range="priceUnits" @change="form.priceUnit = priceUnits[$event.detail.value]">
              <text class="unit-picker">{{ form.priceUnit }}</text>
            </picker>
          </view>
        </view>
      </view>
    </view>

    <view class="form-section">
      <text class="section-title">📝 技能简介</text>
      <view class="textarea-card">
        <textarea placeholder="介绍一下你的技能水平、擅长方向、服务内容等" v-model="form.desc" maxlength="500" />
        <text class="word-count">{{ form.desc.length }}/500</text>
      </view>
    </view>

    <view class="form-section">
      <text class="section-title">🏆 成果展示</text>
      <view class="img-grid">
        <view v-for="(img, i) in images" :key="i" class="img-item">
          <text class="img-placeholder">🖼️</text>
          <view class="img-del" @click="removeImage(i)">×</view>
        </view>
        <view v-if="images.length < 9" class="img-add" @click="addImage">
          <text class="add-icon">+</text>
          <text class="add-text">{{ images.length }}/9</text>
        </view>
      </view>
    </view>

    <view class="form-section">
      <text class="section-title">📱 联系方式</text>
      <view class="form-card">
        <view class="form-item">
          <text class="form-label">联系类型</text>
          <view class="contact-types">
            <view class="ct-opt" :class="{active: form.contactType === '微信'}" @click="form.contactType = '微信'"><text>微信</text></view>
            <view class="ct-opt" :class="{active: form.contactType === 'QQ'}" @click="form.contactType = 'QQ'"><text>QQ</text></view>
            <view class="ct-opt" :class="{active: form.contactType === '手机'}" @click="form.contactType = '手机'"><text>手机</text></view>
          </view>
        </view>
        <view class="divider"></view>
        <view class="form-item">
          <text class="form-label">{{ form.contactType }}号</text>
          <input :placeholder="'输入你的' + form.contactType + '号'" v-model="form.contact"></input>
        </view>
      </view>
    </view>

    <view class="submit-btn" @click="submit">
      <text>发布技能</text>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { callCloud, uploadImages, checkLogin } from '@/utils/cloud'

const categories = ['PS/设计', '视频剪辑', '编程开发', '翻译写作', '音乐舞蹈', '摄影', '其他']
const priceUnits = ['小时', '次', '件', '天']
const images = ref([])
const tempPaths = ref([])
const form = reactive({ title: '', category: '', desc: '', price: '', priceUnit: '小时', contact: '', contactType: '微信' })

const removeImage = (i) => { images.value.splice(i, 1); tempPaths.value.splice(i, 1) }
const addImage = () => {
  uni.chooseImage({
    count: 9 - images.value.length,
    success: (res) => { res.tempFilePaths.forEach(p => { images.value.push('🖼️'); tempPaths.value.push(p) }) }
  })
}

const submitting = ref(false)
const submit = async () => {
  if (!checkLogin()) return
  if (!form.title || !form.price) {
    uni.showToast({ title: '请填写技能名称和价格', icon: 'none' }); return
  }
  if (!form.contact) {
    uni.showToast({ title: '请填写联系方式', icon: 'none' }); return
  }
  if (submitting.value) return
  submitting.value = true
  let workIds = []
  if (tempPaths.value.length > 0) {
    uni.showLoading({ title: '上传图片中...' })
    workIds = await uploadImages(tempPaths.value, 'skill')
    uni.hideLoading()
  }
  const res = await callCloud('skill', 'create', {
    title: form.title, category: form.category || '其他',
    desc: form.desc, price: form.price,
    priceUnit: form.priceUnit, works: workIds,
    contact: form.contact, contactType: form.contactType
  })
  submitting.value = false
  if (res.code === 0) {
    uni.showToast({ title: '发布成功！', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 1500)
  }
}
</script>

<style scoped>
.create-skill { background: #F0F2F5; min-height: 100vh; padding: 20rpx 24rpx 160rpx; }
.section-title { font-size: 28rpx; font-weight: bold; color: #333; padding: 16rpx 0; display: block; }
.form-section { margin-bottom: 20rpx; }
.form-card { background: #fff; border-radius: 16rpx; padding: 0 24rpx; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08); }
.form-item { display: flex; align-items: center; padding: 28rpx 0; }
.form-label { font-size: 28rpx; color: #333; width: 140rpx; flex-shrink: 0; }
.form-item input { flex: 1; font-size: 28rpx; }
.divider { height: 1rpx; background: #f0f0f0; }
.picker-text { font-size: 28rpx; color: #999; }
.price-row { flex: 1; display: flex; align-items: center; }
.yen { font-size: 32rpx; color: #E53E3E; font-weight: bold; margin-right: 8rpx; }
.price-input { width: 120rpx; font-size: 28rpx; }
.price-sep { font-size: 28rpx; color: #999; margin: 0 8rpx; }
.unit-picker { font-size: 28rpx; color: #D53F8C; background: #FFF5F7; padding: 8rpx 20rpx; border-radius: 20rpx; }
.textarea-card { background: #fff; border-radius: 16rpx; padding: 24rpx; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08); }
.textarea-card textarea { width: 100%; height: 200rpx; font-size: 28rpx; }
.word-count { font-size: 22rpx; color: #999; text-align: right; display: block; margin-top: 8rpx; }
.img-grid { display: flex; flex-wrap: wrap; gap: 16rpx; }
.img-item { width: 200rpx; height: 200rpx; border-radius: 12rpx; background: #fff; display: flex; align-items: center; justify-content: center; position: relative; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06); }
.img-placeholder { font-size: 60rpx; }
.img-del { position: absolute; top: -10rpx; right: -10rpx; width: 36rpx; height: 36rpx; background: #FF6B6B; border-radius: 50%; color: #fff; font-size: 24rpx; display: flex; align-items: center; justify-content: center; }
.img-add { width: 200rpx; height: 200rpx; border-radius: 12rpx; border: 2rpx dashed #ccc; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.add-icon { font-size: 48rpx; color: #ccc; }
.add-text { font-size: 22rpx; color: #999; margin-top: 8rpx; }
.contact-types { flex: 1; display: flex; gap: 16rpx; }
.ct-opt { padding: 12rpx 32rpx; border-radius: 28rpx; background: #F0F2F5; border: 2rpx solid #E2E8F0; }
.ct-opt.active { background: #FFF5F7; border-color: #D53F8C; }
.ct-opt text { font-size: 26rpx; color: #718096; font-weight: 500; }
.ct-opt.active text { color: #D53F8C; font-weight: 600; }
.submit-btn { position: fixed; bottom: 40rpx; left: 24rpx; right: 24rpx; background: linear-gradient(135deg, #F687B3, #D53F8C); border-radius: 48rpx; padding: 28rpx; text-align: center; box-shadow: 0 8rpx 24rpx rgba(213,63,140,0.4); }
.submit-btn text { color: #fff; font-size: 32rpx; font-weight: bold; }
</style>
