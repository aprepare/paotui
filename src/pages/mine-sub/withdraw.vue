<template>
  <view class="withdraw-page">
    <!-- 可提现金额 -->
    <view class="top-card">
      <text class="top-label">可提现金额（元）</text>
      <text class="top-amount">¥{{ availableBalance }}</text>
    </view>

    <!-- 提现金额输入 -->
    <view class="input-section">
      <text class="input-label">提现金额</text>
      <view class="amount-input-row">
        <text class="input-symbol">¥</text>
        <input class="amount-input" type="digit" v-model="amount" placeholder="请输入提现金额" placeholder-class="input-placeholder" />
      </view>
      <view class="quick-amounts">
        <view v-for="q in quickAmounts" :key="q" class="quick-btn" :class="{active: amount === String(q)}" @click="amount = String(q)">
          <text>{{ q }}元</text>
        </view>
        <view class="quick-btn" :class="{active: amount === availableBalance}" @click="amount = availableBalance">
          <text>全部</text>
        </view>
      </view>
      <view class="input-tips">
        <text class="tip-item">· 最低提现金额 1.00 元</text>
        <text class="tip-item">· 提现将转入您的微信零钱</text>
        <text class="tip-item">· 提现申请提交后，预计 1-3 个工作日到账</text>
        <text class="tip-item">· 如有疑问请联系客服</text>
      </view>
    </view>

    <!-- 提现按钮 -->
    <view class="submit-bar">
      <view class="submit-btn" :class="{disabled: !canSubmit}" @click="onSubmit">
        <text>确认提现</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { callCloud } from '@/utils/cloud.js'

const availableBalance = ref('0.00')
const amount = ref('')
const quickAmounts = [10, 20, 50, 100]

const canSubmit = computed(() => {
  var val = parseFloat(amount.value)
  var max = parseFloat(availableBalance.value)
  return val >= 1 && val <= max
})

const loadBalance = async () => {
  var res = await callCloud('user', 'getWallet')
  if (res.code === 0) {
    availableBalance.value = ((res.data && res.data.balance) || 0).toFixed(2)
  }
}

const onSubmit = () => {
  if (!canSubmit.value) {
    if (parseFloat(amount.value) < 1) {
      uni.showToast({ title: '最低提现1元', icon: 'none' })
    } else {
      uni.showToast({ title: '余额不足', icon: 'none' })
    }
    return
  }
  uni.showModal({
    title: '确认提现',
    content: '提现 ¥' + parseFloat(amount.value).toFixed(2) + ' 到微信零钱？',
    success: async (modalRes) => {
      if (modalRes.confirm) {
        var res = await callCloud('user', 'applyWithdraw', { amount: parseFloat(amount.value) })
        if (res.code === 0) {
          uni.showToast({ title: '提现申请已提交', icon: 'success' })
          setTimeout(function() { uni.navigateBack() }, 1500)
        } else {
          uni.showToast({ title: res.msg || '提现失败', icon: 'none' })
        }
      }
    }
  })
}

onLoad(() => {
  loadBalance()
})
</script>

<style scoped>
.withdraw-page { background: #F0F2F5; min-height: 100vh; padding-bottom: 160rpx; }

.top-card { background: linear-gradient(160deg, #1A4F8B 0%, #2B6CB0 40%, #4299E1 100%); padding: 48rpx 40rpx; }
.top-label { font-size: 26rpx; color: rgba(255,255,255,0.7); display: block; }
.top-amount { font-size: 64rpx; color: #fff; font-weight: 800; display: block; margin-top: 12rpx; }

.input-section { margin: 24rpx 28rpx; background: #fff; border-radius: 20rpx; padding: 32rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.input-label { font-size: 28rpx; color: #1A1A2E; font-weight: 700; display: block; margin-bottom: 20rpx; }
.amount-input-row { display: flex; align-items: center; border-bottom: 2rpx solid #E2E8F0; padding-bottom: 20rpx; margin-bottom: 24rpx; }
.input-symbol { font-size: 48rpx; color: #1A1A2E; font-weight: 800; margin-right: 12rpx; }
.amount-input { flex: 1; font-size: 48rpx; font-weight: 800; color: #1A1A2E; }
.input-placeholder { color: #CBD5E0; font-weight: 400; }

.quick-amounts { display: flex; gap: 16rpx; flex-wrap: wrap; margin-bottom: 28rpx; }
.quick-btn { padding: 16rpx 36rpx; border-radius: 28rpx; background: #F7FAFC; border: 2rpx solid #E2E8F0; }
.quick-btn text { font-size: 26rpx; color: #4A5568; font-weight: 600; }
.quick-btn.active { background: #EBF4FF; border-color: #2B6CB0; }
.quick-btn.active text { color: #2B6CB0; }

.input-tips { padding-top: 20rpx; border-top: 1rpx solid #F0F2F5; }
.tip-item { font-size: 22rpx; color: #A0AEC0; display: block; line-height: 1.8; }

.submit-bar { position: fixed; bottom: 0; left: 0; right: 0; padding: 20rpx 28rpx; padding-bottom: calc(20rpx + env(safe-area-inset-bottom)); background: #fff; box-shadow: 0 -2rpx 8rpx rgba(0,0,0,0.04); }
.submit-btn { background: linear-gradient(135deg, #4299E1, #2B6CB0); border-radius: 48rpx; padding: 28rpx; text-align: center; box-shadow: 0 8rpx 24rpx rgba(43,108,176,0.3); }
.submit-btn text { color: #fff; font-size: 30rpx; font-weight: 700; }
.submit-btn.disabled { background: #E2E8F0; box-shadow: none; }
.submit-btn.disabled text { color: #A0AEC0; }
</style>
