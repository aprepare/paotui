<template>
  <view class="skill-detail">
    <!-- 头部信息 -->
    <view class="header-card">
      <view class="header-top">
        <view class="skill-avatar" :style="{background: avatarBg}">
          <text class="skill-emoji">🎯</text>
        </view>
        <view class="header-info">
          <text class="skill-title">{{ skill.title }}</text>
          <text class="skill-publisher">{{ skill.publisher }}</text>
        </view>
      </view>
      <view class="price-bar">
        <text class="price-label">服务价格</text>
        <view class="price-value">
          <text class="price-yen">¥</text>
          <text class="price-num">{{ skill.price }}</text>
          <text class="price-unit">/{{ skill.priceUnit }}</text>
        </view>
      </view>
      <view class="stat-row">
        <view class="stat-item">
          <text class="stat-num">{{ skill.views }}</text>
          <text class="stat-label">浏览</text>
        </view>
        <view class="stat-item">
          <text class="stat-num">{{ skill.category }}</text>
          <text class="stat-label">分类</text>
        </view>
      </view>
    </view>

    <!-- 技能简介 -->
    <view class="section-card">
      <text class="card-title">📝 技能简介</text>
      <text class="desc-text">{{ skill.desc || '暂无简介' }}</text>
    </view>

    <!-- 成果展示 -->
    <view class="section-card" v-if="skill.works && skill.works.length > 0">
      <text class="card-title">🏆 成果展示</text>
      <view class="works-grid">
        <view v-for="(img, i) in skill.works" :key="i" class="work-item" @click="previewImage(i)">
          <image v-if="img" class="work-img" :src="img" mode="aspectFill" />
        </view>
      </view>
    </view>

    <!-- 联系方式 -->
    <view class="section-card">
      <text class="card-title">📱 联系方式</text>
      <view v-if="skill.unlocked" class="contact-row">
        <text class="contact-type">{{ skill.contactType || '微信' }}</text>
        <text class="contact-value">{{ skill.contact || '未填写' }}</text>
        <view class="copy-btn" @click="copyContact" v-if="skill.contact">
          <text>复制</text>
        </view>
      </view>
      <view v-else class="contact-locked-section">
        <view class="lock-header">
          <text class="lock-icon">🔒</text>
          <view class="lock-info">
            <text class="lock-text">联系方式已隐藏</text>
            <text class="lock-price">支付 ¥1 查看联系方式</text>
          </view>
        </view>
        <view class="pay-options">
          <view class="pay-item" :class="{active: payType === 'wechat'}" @click="payType = 'wechat'">
            <text class="pay-icon">💚</text>
            <text class="pay-name">微信支付</text>
          </view>
          <view class="pay-item" :class="{active: payType === 'wallet'}" @click="payType = 'wallet'">
            <text class="pay-icon">💰</text>
            <view class="pay-name-row">
              <text class="pay-name">钱包余额</text>
              <text class="pay-balance">¥{{ walletBalance }}</text>
            </view>
          </view>
        </view>
        <view class="unlock-btn" @click="unlockContact">
          <text>立即解锁 ¥1</text>
        </view>
      </view>
    </view>

    <!-- 底部操作 -->
    <view class="bottom-bar">
      <view class="bottom-left">
        <view class="bottom-icon-item" @click="toggleFavorite">
          <text>{{ favorited ? '⭐' : '☆' }}</text>
          <text class="icon-label">{{ favorited ? '已收藏' : '收藏' }}</text>
        </view>
      </view>
      <view class="contact-btn" @click="skill.unlocked ? contactSkiller() : unlockContact()">
        <text>{{ skill.unlocked ? '立即联系' : '🔒 付费查看联系方式 ¥1' }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { callCloud, checkLogin } from '@/utils/cloud'

const avatarBg = 'linear-gradient(135deg, #F687B3, #D53F8C)'
const skill = ref({ title: '', publisher: '', price: 0, priceUnit: '次', desc: '', category: '', views: 0, works: [], contact: '', contactType: '微信', unlocked: false })
const favorited = ref(false)
var skillId = ''
const payType = ref('wechat')
const walletBalance = ref('0.00')

const loadWalletBalance = async () => {
  var res = await callCloud('user', 'getWallet')
  if (res.code === 0 && res.data) walletBalance.value = (res.data.balance || 0).toFixed(2)
}

onLoad((opts) => { if (opts && opts.id) { skillId = opts.id; loadDetail(opts.id) } })
onShow(() => { loadWalletBalance() })

const loadDetail = async (id) => {
  const res = await callCloud('skill', 'detail', { id })
  if (res.code === 0) {
    const d = res.data
    skill.value = {
      id: d._id, title: d.title || '', publisher: d.publisher || '匿名',
      price: d.price || 0, priceUnit: d.priceUnit || '次',
      desc: d.desc || '', category: d.category || '其他',
      views: d.views || 0,
      works: (d.works || []).filter(w => w && typeof w === 'string'),
      contact: d.contact || '', contactType: d.contactType || '微信',
      unlocked: d.unlocked || false
    }
  }
  const favRes = await callCloud('user', 'checkFavorite', { targetId: id, targetType: 'skill' })
  if (favRes.code === 0) favorited.value = favRes.favorited
}

const unlockContact = async () => {
  if (!checkLogin()) return
  if (payType.value === 'wallet') {
    // 钱包支付
    uni.showModal({
      title: '付费查看联系方式',
      content: '将从钱包余额扣除 ¥1，确认解锁？',
      success: async (res) => {
        if (res.confirm) {
          uni.showLoading({ title: '解锁中...' })
          const r = await callCloud('skill', 'unlockContact', { id: skillId, payType: 'wallet' })
          uni.hideLoading()
          if (r.code === 0) {
            skill.value.contact = r.data.contact
            skill.value.contactType = r.data.contactType
            skill.value.unlocked = true
            uni.showToast({ title: '解锁成功', icon: 'success' })
            loadWalletBalance()
          } else {
            uni.showModal({ title: '解锁失败', content: r.msg || '请稍后重试', showCancel: false })
          }
        }
      }
    })
  } else {
    // 微信支付
    uni.showLoading({ title: '创建订单...' })
    const r = await callCloud('skill', 'unlockContact', { id: skillId, payType: 'wechat' })
    uni.hideLoading()
    if (r.code === 0 && r.data && r.data.contact) {
      // 已解锁过，直接返回
      skill.value.contact = r.data.contact
      skill.value.contactType = r.data.contactType
      skill.value.unlocked = true
      uni.showToast({ title: '已解锁', icon: 'success' })
    } else if (r.code === 0 && r.payment) {
      wx.requestPayment({
        ...r.payment,
        success: async () => {
          // 支付成功后重新加载
          const detail = await callCloud('skill', 'detail', { id: skillId })
          if (detail.code === 0) {
            skill.value.contact = detail.data.contact || ''
            skill.value.contactType = detail.data.contactType || '微信'
            skill.value.unlocked = true
          }
          uni.showToast({ title: '解锁成功', icon: 'success' })
        },
        fail: (err) => {
          if (err.errMsg && err.errMsg.indexOf('cancel') > -1) {
            uni.showToast({ title: '已取消支付', icon: 'none' })
          } else {
            uni.showToast({ title: '支付失败', icon: 'none' })
          }
        }
      })
    } else {
      uni.showModal({ title: '解锁失败', content: r.msg || '请稍后重试', showCancel: false })
    }
  }
}

const previewImage = (index) => {
  uni.previewImage({ urls: skill.value.works, current: index })
}

const copyContact = () => {
  uni.setClipboardData({ data: skill.value.contact, success: () => { uni.showToast({ title: '已复制', icon: 'success' }) } })
}

const toggleFavorite = async () => {
  const res = await callCloud('user', 'toggleFavorite', { targetId: skill.value.id, targetType: 'skill' })
  if (res.code === 0) {
    favorited.value = res.favorited
    uni.showToast({ title: res.favorited ? '已收藏' : '取消收藏', icon: 'success' })
  }
}

const contactSkiller = () => {
  const s = skill.value
  uni.showModal({
    title: '联系技能达人',
    content: s.contactType + '：' + (s.contact || '未填写'),
    confirmText: '复制号码',
    success: (res) => { if (res.confirm && s.contact) uni.setClipboardData({ data: s.contact }) }
  })
}
</script>

<style scoped>
.skill-detail { background: #F0F2F5; min-height: 100vh; padding-bottom: 140rpx; }
.header-card { background: #fff; padding: 32rpx 28rpx; margin-bottom: 16rpx; }
.header-top { display: flex; align-items: center; }
.skill-avatar { width: 100rpx; height: 100rpx; border-radius: 24rpx; display: flex; align-items: center; justify-content: center; margin-right: 24rpx; box-shadow: 0 4rpx 12rpx rgba(213,63,140,0.3); }
.skill-emoji { font-size: 48rpx; }
.header-info { flex: 1; }
.skill-title { font-size: 36rpx; font-weight: 800; color: #1A1A2E; display: block; }
.skill-publisher { font-size: 26rpx; color: #A0AEC0; margin-top: 8rpx; display: block; }
.price-bar { display: flex; justify-content: space-between; align-items: center; margin-top: 28rpx; background: #FFF5F7; border-radius: 16rpx; padding: 24rpx; }
.price-label { font-size: 26rpx; color: #718096; }
.price-value { display: flex; align-items: baseline; }
.price-yen { font-size: 28rpx; color: #E53E3E; font-weight: 700; }
.price-num { font-size: 48rpx; color: #E53E3E; font-weight: 800; line-height: 1; }
.price-unit { font-size: 24rpx; color: #A0AEC0; margin-left: 4rpx; }
.stat-row { display: flex; gap: 40rpx; margin-top: 24rpx; }
.stat-item { display: flex; flex-direction: column; align-items: center; }
.stat-num { font-size: 28rpx; font-weight: 700; color: #1A1A2E; }
.stat-label { font-size: 22rpx; color: #A0AEC0; margin-top: 4rpx; }
.section-card { background: #fff; padding: 28rpx; margin-bottom: 16rpx; }
.card-title { font-size: 28rpx; font-weight: bold; color: #333; margin-bottom: 20rpx; display: block; }
.desc-text { font-size: 28rpx; color: #4A5568; line-height: 1.7; }
.works-grid { display: flex; flex-wrap: wrap; gap: 12rpx; }
.work-item { width: 220rpx; height: 220rpx; border-radius: 12rpx; overflow: hidden; }
.work-img { width: 100%; height: 100%; }
.contact-row { display: flex; align-items: center; background: #F7FAFC; border-radius: 12rpx; padding: 24rpx; }
.contact-type { font-size: 26rpx; color: #D53F8C; font-weight: 600; background: #FFF5F7; padding: 8rpx 20rpx; border-radius: 20rpx; margin-right: 16rpx; }
.contact-value { flex: 1; font-size: 28rpx; color: #2D3748; font-weight: 600; }
.copy-btn { padding: 10rpx 24rpx; background: #FFF5F7; border-radius: 20rpx; }
.copy-btn text { font-size: 24rpx; color: #D53F8C; font-weight: 600; }
.contact-locked-section { background: #F7FAFC; border-radius: 12rpx; padding: 24rpx; }
.lock-header { display: flex; align-items: center; margin-bottom: 20rpx; }
.lock-icon { font-size: 40rpx; margin-right: 16rpx; }
.lock-info { flex: 1; }
.lock-text { font-size: 26rpx; color: #718096; display: block; }
.lock-price { font-size: 22rpx; color: #A0AEC0; margin-top: 4rpx; display: block; }
.pay-options { display: flex; gap: 16rpx; margin-bottom: 20rpx; }
.pay-item { flex: 1; background: #fff; border-radius: 16rpx; padding: 20rpx; display: flex; align-items: center; gap: 12rpx; border: 2rpx solid #e0e0e0; }
.pay-item.active { border-color: #D53F8C; background: #FFF5F7; }
.pay-icon { font-size: 32rpx; }
.pay-name { font-size: 24rpx; color: #333; font-weight: 600; }
.pay-name-row { display: flex; flex-direction: column; }
.pay-balance { font-size: 20rpx; color: #999; margin-top: 2rpx; }
.unlock-btn { padding: 20rpx 28rpx; background: linear-gradient(135deg, #F687B3, #D53F8C); border-radius: 24rpx; box-shadow: 0 4rpx 12rpx rgba(213,63,140,0.25); text-align: center; }
.unlock-btn:active { transform: scale(0.95); }
.unlock-btn text { font-size: 28rpx; color: #fff; font-weight: 700; }
.bottom-bar { position: fixed; bottom: 0; left: 0; right: 0; background: #fff; display: flex; align-items: center; padding: 16rpx 24rpx 36rpx; box-shadow: 0 -4rpx 12rpx rgba(0,0,0,0.06); }
.bottom-left { display: flex; gap: 32rpx; margin-right: 24rpx; }
.bottom-icon-item { display: flex; flex-direction: column; align-items: center; }
.icon-label { font-size: 20rpx; color: #999; }
.contact-btn { flex: 1; padding: 24rpx; background: linear-gradient(135deg, #F687B3, #D53F8C); border-radius: 40rpx; text-align: center; box-shadow: 0 8rpx 24rpx rgba(213,63,140,0.3); }
.contact-btn text { color: #fff; font-size: 30rpx; font-weight: bold; }
</style>
