<template>
  <view class="withdraw-page">
    <!-- 提现申请表单（未提交时显示） -->
    <view v-if="!showVoucher">
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
          <text class="tip-item tip-warn">· 最低提现金额 100.00 元</text>
          <text class="tip-item tip-warn">· 提现需联系客服线下完成，请截图保存凭证</text>
          <text class="tip-item">· 凭提现凭证联系管理员线下提现</text>
          <text class="tip-item">· 管理员核实后将发放现金/转账</text>
        </view>
        <view class="kefu-tip-bar" @click="goKefu">
          <text class="kefu-tip-icon">💬</text>
          <text class="kefu-tip-text">联系客服完成提现</text>
          <text class="kefu-tip-arrow">›</text>
        </view>
      </view>

      <!-- 提现按钮 -->
      <view class="submit-bar">
        <view class="submit-btn" :class="{disabled: !canSubmit || submitting}" @click="onSubmit">
          <text>{{ submitting ? '提交中...' : '申请提现' }}</text>
        </view>
      </view>
    </view>

    <!-- 提现凭证（提交成功后显示） -->
    <view v-if="showVoucher" class="voucher-wrapper">
      <view class="voucher-tip-top">
        <text class="vt-icon">✅</text>
        <text class="vt-text">提现申请已提交成功</text>
        <text class="vt-sub">请截图保存以下凭证，联系管理员提现</text>
      </view>

      <!-- Canvas 凭证图 -->
      <view class="voucher-canvas-wrap">
        <canvas canvas-id="voucherCanvas" id="voucherCanvas" class="voucher-canvas" style="width:600rpx;height:800rpx;"></canvas>
      </view>

      <view class="voucher-actions">
        <view class="va-btn save-btn" @click="saveVoucher">
          <text>📥 保存凭证到相册</text>
        </view>
        <view class="va-btn back-btn" @click="goBack">
          <text>返回钱包</text>
        </view>
      </view>

      <view class="voucher-notice">
        <text class="vn-title">📌 提现流程</text>
        <text class="vn-item">1. 截图保存上方提现凭证</text>
        <text class="vn-item">2. 联系管理员出示凭证</text>
        <text class="vn-item">3. 管理员核实后发放现金/转账</text>
        <text class="vn-item">4. 完成后管理员会标记为「已提现」</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { callCloud } from '@/utils/cloud.js'

const availableBalance = ref('0.00')
const amount = ref('')
const quickAmounts = [100, 200, 500]
const showVoucher = ref(false)
const voucherData = ref({})

const canSubmit = computed(() => {
  var val = parseFloat(amount.value)
  var max = parseFloat(availableBalance.value)
  return val >= 100 && val <= max
})

const loadBalance = async () => {
  var res = await callCloud('user', 'getWallet')
  if (res.code === 0) {
    availableBalance.value = ((res.data && res.data.balance) || 0).toFixed(2)
  }
}

const submitting = ref(false)
const onSubmit = () => {
  if (!canSubmit.value || submitting.value) {
    if (parseFloat(amount.value) < 100) {
      uni.showToast({ title: '最低提现100元', icon: 'none' })
    } else if (!submitting.value) {
      uni.showToast({ title: '余额不足', icon: 'none' })
    }
    return
  }
  uni.showModal({
    title: '确认提现',
    content: '提现 ¥' + parseFloat(amount.value).toFixed(2) + '？\n提交后请截图保存凭证，联系管理员线下提现。',
    success: async (modalRes) => {
      if (modalRes.confirm) {
        submitting.value = true
        try {
          var res = await callCloud('user', 'applyWithdraw', { amount: parseFloat(amount.value) })
          if (res.code === 0 && res.data) {
            voucherData.value = res.data
            showVoucher.value = true
            await loadBalance()
            await nextTick()
            setTimeout(() => { drawVoucher() }, 300)
          } else {
            uni.showToast({ title: res.msg || '提现失败', icon: 'none' })
          }
        } catch (e) {
          uni.showToast({ title: '提现失败，请重试', icon: 'none' })
        } finally {
          submitting.value = false
        }
      }
    }
  })
}

const drawVoucher = () => {
  const ctx = uni.createCanvasContext('voucherCanvas')
  const w = 300, h = 400 // 实际像素（2x rpx）

  // 背景渐变
  const grd = ctx.createLinearGradient(0, 0, w, h)
  grd.addColorStop(0, '#1A4F8B')
  grd.addColorStop(0.5, '#2B6CB0')
  grd.addColorStop(1, '#4299E1')
  ctx.setFillStyle(grd)
  ctx.fillRect(0, 0, w, h)

  // 装饰圆
  ctx.setGlobalAlpha(0.08)
  ctx.setFillStyle('#ffffff')
  ctx.beginPath(); ctx.arc(w - 30, 50, 80, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(40, h - 60, 60, 0, Math.PI * 2); ctx.fill()
  ctx.setGlobalAlpha(1)

  // 白色凭证区域（圆角矩形）
  const mx = 20, my = 60, mw = w - 40, mh = h - 100
  ctx.setFillStyle('#ffffff')
  roundRect(ctx, mx, my, mw, mh, 12)
  ctx.fill()

  // 标题区域
  ctx.setFillStyle('#2B6CB0')
  roundRect(ctx, mx, my, mw, 50, 12, true) // 只上方圆角
  ctx.fill()

  // 标题文字
  ctx.setFillStyle('#ffffff')
  ctx.setFontSize(18)
  ctx.setTextAlign('center')
  ctx.fillText('提 现 凭 证', w / 2, my + 33)

  // 凭证编号
  ctx.setFillStyle('#1A4F8B')
  ctx.setFontSize(12)
  ctx.setTextAlign('center')
  ctx.fillText('凭证编号', w / 2, my + 78)

  ctx.setFillStyle('#DD6B20')
  ctx.setFontSize(20)
  ctx.fillText(voucherData.value.withdrawCode || 'TX00000000', w / 2, my + 103)

  // 分隔线
  ctx.setStrokeStyle('#E2E8F0')
  ctx.setLineWidth(1)
  // 虚线效果
  var dashY = my + 118
  for (var dx = mx + 10; dx < mx + mw - 10; dx += 8) {
    ctx.beginPath(); ctx.moveTo(dx, dashY); ctx.lineTo(dx + 4, dashY); ctx.stroke()
  }

  // 提现金额
  ctx.setFillStyle('#718096')
  ctx.setFontSize(12)
  ctx.fillText('提现金额', w / 2, my + 143)

  ctx.setFillStyle('#E53E3E')
  ctx.setFontSize(32)
  ctx.fillText('¥' + (voucherData.value.amount || 0).toFixed(2), w / 2, my + 180)

  // 分隔线2
  var dashY2 = my + 195
  ctx.setStrokeStyle('#E2E8F0')
  for (var dx2 = mx + 10; dx2 < mx + mw - 10; dx2 += 8) {
    ctx.beginPath(); ctx.moveTo(dx2, dashY2); ctx.lineTo(dx2 + 4, dashY2); ctx.stroke()
  }

  // 用户名
  ctx.setFillStyle('#4A5568')
  ctx.setFontSize(11)
  ctx.setTextAlign('left')
  ctx.fillText('用户名:', mx + 20, my + 220)
  ctx.setTextAlign('right')
  ctx.fillText(voucherData.value.userName || '用户', mx + mw - 20, my + 220)

  // 申请时间
  ctx.setTextAlign('left')
  ctx.fillText('申请时间:', mx + 20, my + 245)
  ctx.setTextAlign('right')
  var createTime = voucherData.value.createTime ? new Date(voucherData.value.createTime).toLocaleString('zh-CN') : ''
  ctx.fillText(createTime, mx + mw - 20, my + 245)

  // 状态
  ctx.setTextAlign('left')
  ctx.fillText('状态:', mx + 20, my + 270)
  ctx.setFillStyle('#DD6B20')
  ctx.setTextAlign('right')
  ctx.fillText('待提现', mx + mw - 20, my + 270)

  // 底部提示
  ctx.setFillStyle('rgba(255,255,255,0.7)')
  ctx.setFontSize(9)
  ctx.setTextAlign('center')
  ctx.fillText('请持此凭证联系管理员提现', w / 2, h - 22)
  ctx.fillText('校园跑腿 · 提现凭证', w / 2, h - 10)

  ctx.draw()
}

// 绘制圆角矩形
function roundRect(ctx, x, y, w, h, r, topOnly) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  if (topOnly) {
    ctx.lineTo(x + w, y + h)
    ctx.lineTo(x, y + h)
  } else {
    ctx.lineTo(x + w, y + h - r)
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
    ctx.lineTo(x + r, y + h)
    ctx.arcTo(x, y + h, x, y + h - r, r)
  }
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

const saveVoucher = () => {
  uni.canvasToTempFilePath({
    canvasId: 'voucherCanvas',
    success: (res) => {
      uni.saveImageToPhotosAlbum({
        filePath: res.tempFilePath,
        success: () => {
          uni.showToast({ title: '凭证已保存到相册', icon: 'success' })
        },
        fail: (err) => {
          if (err.errMsg && err.errMsg.indexOf('auth deny') > -1) {
            uni.showModal({
              title: '需要相册权限',
              content: '请在设置中允许保存图片到相册',
              confirmText: '去设置',
              success: (r) => { if (r.confirm) uni.openSetting() }
            })
          } else {
            uni.showToast({ title: '保存失败', icon: 'none' })
          }
        }
      })
    },
    fail: () => {
      uni.showToast({ title: '生成图片失败', icon: 'none' })
    }
  })
}

const goBack = () => {
  uni.navigateBack()
}

const goKefu = () => {
  uni.navigateTo({ url: '/pages/kefu/show' })
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
.tip-warn { color: #DD6B20; font-weight: 600; }

.kefu-tip-bar { display: flex; align-items: center; margin-top: 28rpx; padding: 24rpx; background: linear-gradient(135deg, #EBF8FF, #BEE3F8); border-radius: 16rpx; border: 1rpx solid #90CDF4; }
.kefu-tip-icon { font-size: 36rpx; margin-right: 16rpx; }
.kefu-tip-text { flex: 1; font-size: 28rpx; color: #2B6CB0; font-weight: 700; }
.kefu-tip-arrow { font-size: 32rpx; color: #4299E1; font-weight: 700; }

.submit-bar { position: fixed; bottom: 0; left: 0; right: 0; padding: 20rpx 28rpx; padding-bottom: calc(20rpx + env(safe-area-inset-bottom)); background: #fff; box-shadow: 0 -2rpx 8rpx rgba(0,0,0,0.04); }
.submit-btn { background: linear-gradient(135deg, #4299E1, #2B6CB0); border-radius: 48rpx; padding: 28rpx; text-align: center; box-shadow: 0 8rpx 24rpx rgba(43,108,176,0.3); }
.submit-btn text { color: #fff; font-size: 30rpx; font-weight: 700; }
.submit-btn.disabled { background: #E2E8F0; box-shadow: none; }
.submit-btn.disabled text { color: #A0AEC0; }

/* 凭证展示 */
.voucher-wrapper { padding: 28rpx; }

.voucher-tip-top { display: flex; flex-direction: column; align-items: center; padding: 32rpx 0; }
.vt-icon { font-size: 64rpx; margin-bottom: 12rpx; }
.vt-text { font-size: 32rpx; font-weight: 800; color: #38A169; }
.vt-sub { font-size: 24rpx; color: #718096; margin-top: 8rpx; }

.voucher-canvas-wrap { display: flex; justify-content: center; margin: 16rpx 0; }
.voucher-canvas { width: 600rpx; height: 800rpx; border-radius: 16rpx; box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.15); }

.voucher-actions { display: flex; flex-direction: column; gap: 16rpx; margin-top: 32rpx; }
.va-btn { text-align: center; padding: 24rpx; border-radius: 40rpx; }
.save-btn { background: linear-gradient(135deg, #48BB78, #38A169); box-shadow: 0 6rpx 20rpx rgba(56,161,105,0.3); }
.save-btn text { color: #fff; font-size: 30rpx; font-weight: 700; }
.back-btn { background: #fff; border: 2rpx solid #E2E8F0; }
.back-btn text { color: #4A5568; font-size: 28rpx; font-weight: 600; }

.voucher-notice { background: #FFFFF0; border-radius: 16rpx; padding: 28rpx; margin-top: 24rpx; border: 1rpx solid #FEFCBF; }
.vn-title { font-size: 28rpx; font-weight: 700; color: #D69E2E; display: block; margin-bottom: 12rpx; }
.vn-item { font-size: 24rpx; color: #718096; display: block; line-height: 2; }
</style>
