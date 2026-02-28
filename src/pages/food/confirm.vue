<template>
  <view class="confirm-page">
    <!-- 配送模式 -->
    <view class="section">
      <view class="section-title"><text>🚀 配送方式</text></view>
      <view class="mode-selector">
        <view class="mode-opt" :class="{ active: deliveryMode === 'delivery' }" @click="deliveryMode = 'delivery'">
          <text class="mode-icon">🚴</text>
          <text class="mode-text">骑手配送</text>
        </view>
        <view class="mode-opt" :class="{ active: deliveryMode === 'self_pickup' }" @click="deliveryMode = 'self_pickup'">
          <text class="mode-icon">🏪</text>
          <text class="mode-text">到店自取</text>
        </view>
      </view>
    </view>

    <!-- 收货信息 -->
    <view class="section">
      <view class="section-title"><text>📍 {{ deliveryMode === 'self_pickup' ? '联系信息' : '收货信息' }}</text></view>
      <view class="form-row">
        <text class="form-lbl">姓名</text>
        <input class="form-ipt" v-model="userName" placeholder="收货人姓名" />
      </view>
      <view class="form-row">
        <text class="form-lbl">电话</text>
        <input class="form-ipt" v-model="phone" placeholder="联系电话" type="number" />
      </view>
      <view class="form-row" v-if="deliveryMode === 'delivery'">
        <text class="form-lbl">地址</text>
        <input class="form-ipt" v-model="address" placeholder="如：3号楼 502" />
      </view>
      <view class="form-row">
        <text class="form-lbl">备注</text>
        <input class="form-ipt" v-model="remark" placeholder="口味偏好、特殊要求等" />
      </view>
    </view>

    <!-- 商品清单 -->
    <view class="section">
      <view class="section-title"><text>🛒 {{ cartData.shopName }}</text></view>
      <view class="order-item" v-for="(item, idx) in cartData.items" :key="idx">
        <text class="oi-name">{{ item.name }}</text>
        <text class="oi-qty">x{{ item.quantity }}</text>
        <text class="oi-price">¥{{ (item.price * item.quantity).toFixed(1) }}</text>
      </view>
    </view>

    <!-- 费用明细 -->
    <view class="section">
      <view class="fee-row">
        <text class="fee-label">商品小计</text>
        <text class="fee-value">¥{{ itemsTotal.toFixed(2) }}</text>
      </view>
      <view class="fee-row">
        <text class="fee-label">配送费</text>
        <text class="fee-value">{{ deliveryMode === 'self_pickup' ? '免配送费' : '¥' + actualDeliveryFee.toFixed(2) }}</text>
      </view>
      <view class="fee-row total">
        <text class="fee-label">合计</text>
        <text class="fee-total">¥{{ totalPrice.toFixed(2) }}</text>
      </view>
    </view>

    <!-- 提交按钮 -->
    <view class="submit-bar">
      <view class="submit-left">
        <text class="submit-total">¥{{ totalPrice.toFixed(2) }}</text>
      </view>
      <view class="submit-btn" :class="{disabled: submitting}" @click="submitOrder">
        <text>{{ submitting ? '提交中...' : '提交订单' }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { callCloud } from '@/utils/cloud.js'
import { requestOrderSubscribe } from '@/utils/subscribe'

const cartData = ref({ shopId: '', shopName: '', deliveryFee: 0, items: [] })
const userName = ref('')
const phone = ref('')
const address = ref('')
const remark = ref('')
const submitting = ref(false)
const deliveryMode = ref('delivery')

const itemsTotal = computed(() => {
  return (cartData.value.items || []).reduce((s, i) => s + i.price * i.quantity, 0)
})
const actualDeliveryFee = computed(() => deliveryMode.value === 'self_pickup' ? 0 : (cartData.value.deliveryFee || 0))
const totalPrice = computed(() => itemsTotal.value + actualDeliveryFee.value)

const submitOrder = async () => {
  if (submitting.value) return
  if (!userName.value.trim()) { uni.showToast({ title: '请填写姓名', icon: 'none' }); return }
  if (!phone.value.trim()) { uni.showToast({ title: '请填写电话', icon: 'none' }); return }
  if (deliveryMode.value === 'delivery' && !address.value.trim()) { uni.showToast({ title: '请填写地址', icon: 'none' }); return }

  submitting.value = true
  // 请求订阅消息授权
  await requestOrderSubscribe()
  const orderItems = cartData.value.items.map(i => ({ itemId: i.itemId, name: i.name, price: i.price, image: i.image || '', quantity: i.quantity }))
  const res = await callCloud('food', 'createOrder', {
    shopId: cartData.value.shopId,
    items: orderItems,
    address: deliveryMode.value === 'self_pickup' ? '' : address.value.trim(),
    phone: phone.value.trim(),
    userName: userName.value.trim(),
    remark: remark.value.trim(),
    deliveryMode: deliveryMode.value
  })
  submitting.value = false

  if (res.code === 0) {
    uni.removeStorageSync('food_cart')
    uni.showToast({ title: '下单成功', icon: 'success' })
    setTimeout(() => {
      uni.redirectTo({ url: '/pages/food/detail?id=' + res.data.orderId })
    }, 1200)
  } else {
    uni.showToast({ title: res.msg || '下单失败', icon: 'none' })
  }
}

onLoad(() => {
  const data = uni.getStorageSync('food_cart')
  if (data && data.items && data.items.length) {
    cartData.value = data
  } else {
    uni.showToast({ title: '购物车为空', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 1000)
  }
  // 预填用户信息
  const userInfo = uni.getStorageSync('userInfo')
  if (userInfo) {
    userName.value = userInfo.name || ''
    phone.value = userInfo.phone || ''
    address.value = userInfo.building ? (userInfo.building + ' ' + (userInfo.room || '')) : ''
  }
})
</script>

<style scoped>
.confirm-page { background: #F0F2F5; min-height: 100vh; padding: 20rpx 24rpx 160rpx; }
.section { background: #fff; border-radius: 20rpx; padding: 24rpx; margin-bottom: 20rpx; }
.section-title { margin-bottom: 16rpx; }
.section-title text { font-size: 30rpx; font-weight: 700; color: #1A1A2E; }

.mode-selector { display: flex; gap: 20rpx; }
.mode-opt { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 24rpx 0; border-radius: 16rpx; border: 2rpx solid #E2E8F0; background: #F7FAFC; }
.mode-opt.active { border-color: #DD6B20; background: #FFFAF0; }
.mode-icon { font-size: 40rpx; margin-bottom: 8rpx; }
.mode-text { font-size: 26rpx; color: #4A5568; }
.mode-opt.active .mode-text { color: #DD6B20; font-weight: 600; }
.form-row { display: flex; align-items: center; padding: 16rpx 0; border-bottom: 1rpx solid #F7FAFC; }
.form-row:last-child { border-bottom: none; }
.form-lbl { font-size: 26rpx; color: #4A5568; width: 100rpx; flex-shrink: 0; }
.form-ipt { flex: 1; font-size: 26rpx; color: #2D3748; }

.order-item { display: flex; align-items: center; padding: 14rpx 0; border-bottom: 1rpx solid #F7FAFC; }
.order-item:last-child { border-bottom: none; }
.oi-name { flex: 1; font-size: 26rpx; color: #2D3748; }
.oi-qty { font-size: 24rpx; color: #A0AEC0; margin: 0 20rpx; }
.oi-price { font-size: 26rpx; color: #DD6B20; font-weight: 600; }

.fee-row { display: flex; justify-content: space-between; padding: 12rpx 0; }
.fee-label { font-size: 26rpx; color: #718096; }
.fee-value { font-size: 26rpx; color: #2D3748; }
.fee-row.total { border-top: 1rpx solid #EDF2F7; padding-top: 16rpx; margin-top: 8rpx; }
.fee-total { font-size: 34rpx; font-weight: 800; color: #DD6B20; }

.submit-bar { position: fixed; bottom: 0; left: 0; right: 0; height: 120rpx; background: #fff; display: flex; align-items: center; padding: 0 24rpx; box-shadow: 0 -2rpx 12rpx rgba(0,0,0,0.06); }
.submit-left { flex: 1; }
.submit-total { font-size: 36rpx; font-weight: 800; color: #DD6B20; }
.submit-btn { background: linear-gradient(135deg, #ED8936, #DD6B20); padding: 20rpx 48rpx; border-radius: 36rpx; }
.submit-btn text { color: #fff; font-size: 30rpx; font-weight: 700; }
.submit-btn.disabled { opacity: 0.6; }
</style>
