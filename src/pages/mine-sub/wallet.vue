<template>
  <view class="wallet-page">
    <!-- 余额卡片 -->
    <view class="balance-card">
      <text class="balance-label">账户余额（元）</text>
      <view class="balance-row">
        <text class="balance-symbol">¥</text>
        <text class="balance-num">{{ balance }}</text>
      </view>
      <view class="balance-actions">
        <view class="bal-btn withdraw-btn" @click="goWithdraw">
          <text>提现</text>
        </view>
      </view>
      <view class="balance-tip">
        <text>收入来自已完成的接单，提现将转入微信零钱</text>
      </view>
    </view>

    <!-- 收支概览 -->
    <view class="overview-section">
      <view class="overview-card">
        <text class="ov-num income">+{{ totalIncome }}</text>
        <text class="ov-label">累计收入</text>
      </view>
      <view class="overview-card">
        <text class="ov-num expense">-{{ totalWithdraw }}</text>
        <text class="ov-label">累计提现</text>
      </view>
      <view class="overview-card">
        <text class="ov-num pending">{{ pendingWithdraw }}</text>
        <text class="ov-label">提现中</text>
      </view>
    </view>

    <!-- 交易明细 -->
    <view class="section">
      <view class="section-head">
        <text class="section-label">交易明细</text>
        <view class="filter-tabs">
          <view class="ftab" :class="{active: filterType === 'all'}" @click="filterType = 'all'"><text>全部</text></view>
          <view class="ftab" :class="{active: filterType === 'income'}" @click="filterType = 'income'"><text>收入</text></view>
          <view class="ftab" :class="{active: filterType === 'withdraw'}" @click="filterType = 'withdraw'"><text>提现</text></view>
        </view>
      </view>

      <view v-for="item in filteredRecords" :key="item.id" class="record-item">
        <view class="record-icon-bg" :style="{background: item.iconBg}">
          <text class="record-icon">{{ item.icon }}</text>
        </view>
        <view class="record-info">
          <text class="record-title">{{ item.title }}</text>
          <text class="record-time">{{ item.time }}</text>
        </view>
        <view class="record-amount">
          <text :class="item.amount > 0 ? 'amount-in' : 'amount-out'">{{ item.amount > 0 ? '+' : '' }}{{ item.amount.toFixed(2) }}</text>
          <text class="record-status" :style="{color: item.statusColor}">{{ item.statusText }}</text>
        </view>
      </view>

      <view v-if="filteredRecords.length === 0" class="empty-state">
        <text class="empty-emoji">💰</text>
        <text class="empty-text">暂无交易记录</text>
        <text class="empty-sub">完成接单后收入将显示在这里</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { callCloud } from '@/utils/cloud.js'

const balance = ref('0.00')
const totalIncome = ref('0.00')
const totalWithdraw = ref('0.00')
const pendingWithdraw = ref('0.00')
const filterType = ref('all')
const records = ref([])

const filteredRecords = computed(() => {
  if (filterType.value === 'all') return records.value
  return records.value.filter(r => r.type === filterType.value)
})

const loadWallet = async () => {
  const res = await callCloud('user', 'getWallet')
  if (res.code === 0) {
    var d = res.data || {}
    balance.value = (d.balance || 0).toFixed(2)
    totalIncome.value = (d.totalIncome || 0).toFixed(2)
    totalWithdraw.value = (d.totalWithdraw || 0).toFixed(2)
    pendingWithdraw.value = (d.pendingWithdraw || 0).toFixed(2)
    records.value = (d.records || []).map(function(r, i) {
      var isIncome = r.type === 'income'
      var isWithdraw = r.type === 'withdraw'
      return {
        id: r._id || i,
        type: r.type,
        icon: isIncome ? '📦' : '💳',
        iconBg: isIncome ? 'linear-gradient(135deg, #48BB78, #38A169)' : 'linear-gradient(135deg, #4299E1, #2B6CB0)',
        title: r.title || (isIncome ? '接单收入' : '提现到微信'),
        time: formatTime(r.createTime),
        amount: isIncome ? (r.amount || 0) : -(r.amount || 0),
        statusText: r.statusText || (isIncome ? '已到账' : (r.status === 0 ? '审核中' : r.status === 1 ? '已到账' : '已拒绝')),
        statusColor: isIncome ? '#38A169' : (r.status === 0 ? '#DD6B20' : r.status === 1 ? '#38A169' : '#E53E3E')
      }
    })
  }
}

const formatTime = (t) => {
  if (!t) return ''
  var d = new Date(t)
  var y = d.getFullYear()
  var m = String(d.getMonth() + 1).padStart(2, '0')
  var day = String(d.getDate()).padStart(2, '0')
  var h = String(d.getHours()).padStart(2, '0')
  var min = String(d.getMinutes()).padStart(2, '0')
  return y + '-' + m + '-' + day + ' ' + h + ':' + min
}

const goWithdraw = () => {
  uni.navigateTo({ url: '/pages/mine-sub/withdraw' })
}

onShow(() => {
  loadWallet()
})
</script>

<style scoped>
.wallet-page { background: #F0F2F5; min-height: 100vh; }

/* 余额卡片 */
.balance-card { background: linear-gradient(160deg, #1A4F8B 0%, #2B6CB0 40%, #4299E1 100%); padding: 60rpx 40rpx 40rpx; position: relative; overflow: hidden; }
.balance-card::after { content: ''; position: absolute; top: -60rpx; right: -40rpx; width: 240rpx; height: 240rpx; border-radius: 50%; background: rgba(255,255,255,0.06); }
.balance-label { font-size: 26rpx; color: rgba(255,255,255,0.7); display: block; }
.balance-row { display: flex; align-items: baseline; margin-top: 16rpx; }
.balance-symbol { font-size: 36rpx; color: #fff; font-weight: 700; margin-right: 8rpx; }
.balance-num { font-size: 72rpx; color: #fff; font-weight: 800; line-height: 1; }
.balance-actions { display: flex; gap: 20rpx; margin-top: 36rpx; }
.bal-btn { padding: 18rpx 56rpx; border-radius: 36rpx; text-align: center; }
.withdraw-btn { background: rgba(255,255,255,0.2); border: 1rpx solid rgba(255,255,255,0.4); }
.withdraw-btn text { color: #fff; font-size: 28rpx; font-weight: 600; }
.balance-tip { margin-top: 20rpx; }
.balance-tip text { font-size: 22rpx; color: rgba(255,255,255,0.45); }

/* 收支概览 */
.overview-section { display: flex; margin: -20rpx 28rpx 24rpx; gap: 16rpx; position: relative; z-index: 1; }
.overview-card { flex: 1; background: #fff; border-radius: 16rpx; padding: 24rpx 16rpx; text-align: center; box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06); }
.ov-num { font-size: 32rpx; font-weight: 800; display: block; }
.ov-num.income { color: #38A169; }
.ov-num.expense { color: #4299E1; }
.ov-num.pending { color: #DD6B20; }
.ov-label { font-size: 22rpx; color: #A0AEC0; margin-top: 6rpx; display: block; }

/* 交易明细 */
.section { padding: 0 28rpx; }
.section-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20rpx; }
.section-label { font-size: 30rpx; font-weight: 700; color: #1A1A2E; }
.filter-tabs { display: flex; gap: 12rpx; }
.ftab { padding: 8rpx 24rpx; border-radius: 20rpx; background: #fff; }
.ftab text { font-size: 24rpx; color: #718096; }
.ftab.active { background: #2B6CB0; }
.ftab.active text { color: #fff; font-weight: 600; }

.record-item { display: flex; align-items: center; background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 12rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.03); }
.record-icon-bg { width: 72rpx; height: 72rpx; border-radius: 18rpx; display: flex; align-items: center; justify-content: center; margin-right: 20rpx; flex-shrink: 0; }
.record-icon { font-size: 32rpx; }
.record-info { flex: 1; }
.record-title { font-size: 28rpx; color: #1A1A2E; font-weight: 600; display: block; }
.record-time { font-size: 22rpx; color: #A0AEC0; margin-top: 4rpx; display: block; }
.record-amount { text-align: right; }
.amount-in { font-size: 32rpx; color: #38A169; font-weight: 800; display: block; }
.amount-out { font-size: 32rpx; color: #4299E1; font-weight: 800; display: block; }
.record-status { font-size: 22rpx; display: block; margin-top: 4rpx; }

/* 空状态 */
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 80rpx 0; }
.empty-emoji { font-size: 72rpx; }
.empty-text { font-size: 28rpx; color: #718096; margin-top: 16rpx; }
.empty-sub { font-size: 24rpx; color: #A0AEC0; margin-top: 8rpx; }
</style>
