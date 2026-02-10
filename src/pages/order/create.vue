<template>
  <view class="create-order">
    <view class="form-section">
      <text class="section-title">📦 订单类型</text>
      <view class="type-grid">
        <view v-for="(type, i) in types" :key="i" class="type-item" :class="{active: selectedType === i}" @click="selectedType = i">
          <text class="type-emoji">{{ type.emoji }}</text>
          <text class="type-name">{{ type.name }}</text>
        </view>
      </view>
    </view>
    <view class="form-section">
      <text class="section-title">📍 地址信息</text>
      <view class="form-card">
        <view class="form-item">
          <text class="form-label">取件地址</text>
          <input placeholder="如：菜鸟驿站3号架" v-model="form.fromAddr" />
        </view>
        <view class="divider"></view>
        <view class="form-item">
          <text class="form-label">送达地址</text>
          <input placeholder="如：6号宿舍楼302" v-model="form.toAddr" />
        </view>
      </view>
    </view>
    <view class="form-section">
      <text class="section-title">📝 详细信息</text>
      <view class="form-card">
        <view class="form-item">
          <text class="form-label">物品描述</text>
          <input placeholder="如：一个中号快递" v-model="form.desc" />
        </view>
        <view class="divider"></view>
        <view class="form-item">
          <text class="form-label">备注</text>
          <input placeholder="可选，如：放门口就行" v-model="form.remark" />
        </view>
      </view>
    </view>
    <view class="form-section">
      <text class="section-title">💰 报酬</text>
      <view class="price-options">
        <view v-for="p in priceList" :key="p" class="price-item" :class="{active: form.price === p}" @click="form.price = p">
          <text>¥{{ p }}</text>
        </view>
        <view class="price-item custom" :class="{active: customPrice}" @click="customPrice = true">
          <text>自定义</text>
        </view>
      </view>
      <view v-if="customPrice" class="custom-price-input">
        <text>¥</text>
        <input type="digit" placeholder="输入金额" v-model="form.price" />
      </view>
    </view>
    <view class="submit-btn" @click="submit">
      <text>发布订单</text>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue'

const types = [
  { emoji: '📦', name: '代取快递' },
  { emoji: '🛒', name: '代买东西' },
  { emoji: '📄', name: '代打印' },
  { emoji: '🔧', name: '其他跑腿' }
]
const selectedType = ref(0)
const customPrice = ref(false)
const priceList = [3, 5, 8, 10]

const form = reactive({
  fromAddr: '',
  toAddr: '',
  desc: '',
  remark: '',
  price: 5
})

const submit = () => {
  if (!form.fromAddr || !form.toAddr) {
    uni.showToast({ title: '请填写地址信息', icon: 'none' })
    return
  }
  uni.showToast({ title: '发布成功！', icon: 'success' })
  setTimeout(() => { uni.navigateBack() }, 1500)
}
</script>

<style scoped>
.create-order { background: #F5F7FA; min-height: 100vh; padding: 20rpx 24rpx 160rpx; }
.form-section { margin-bottom: 28rpx; }
.section-title { font-size: 28rpx; font-weight: bold; color: #333; padding: 16rpx 0; }
.type-grid { display: flex; gap: 16rpx; }
.type-item { flex: 1; background: #fff; border-radius: 16rpx; padding: 24rpx 0; display: flex; flex-direction: column; align-items: center; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08); border: 2rpx solid transparent; }
.type-item.active { border-color: #4A90D9; background: #E3F2FD; }
.type-emoji { font-size: 44rpx; margin-bottom: 8rpx; }
.type-name { font-size: 24rpx; color: #333; }
.form-card { background: #fff; border-radius: 16rpx; padding: 0 24rpx; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08); }
.form-item { display: flex; align-items: center; padding: 28rpx 0; }
.form-label { font-size: 28rpx; color: #333; width: 160rpx; flex-shrink: 0; }
.form-item input { flex: 1; font-size: 28rpx; }
.divider { height: 1rpx; background: #f0f0f0; }
.price-options { display: flex; gap: 16rpx; flex-wrap: wrap; }
.price-item { background: #fff; border-radius: 12rpx; padding: 20rpx 40rpx; border: 2rpx solid #e0e0e0; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.price-item.active { border-color: #4A90D9; background: #E3F2FD; }
.price-item text { font-size: 28rpx; color: #333; font-weight: bold; }
.price-item.active text { color: #4A90D9; }
.custom-price-input { display: flex; align-items: center; background: #fff; border-radius: 12rpx; padding: 16rpx 24rpx; margin-top: 16rpx; border: 2rpx solid #4A90D9; }
.custom-price-input text { font-size: 32rpx; color: #FF6B6B; font-weight: bold; margin-right: 8rpx; }
.custom-price-input input { flex: 1; font-size: 32rpx; }
.submit-btn { position: fixed; bottom: 40rpx; left: 24rpx; right: 24rpx; background: linear-gradient(135deg, #4A90D9, #357ABD); border-radius: 48rpx; padding: 28rpx; text-align: center; box-shadow: 0 8rpx 24rpx rgba(74,144,217,0.4); }
.submit-btn text { color: #fff; font-size: 32rpx; font-weight: bold; }
</style>
