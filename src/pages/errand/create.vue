<template>
  <view class="create-errand">
    <!-- 任务信息 -->
    <view class="form-section">
      <text class="section-title">📝 任务信息</text>
      <view class="form-card">
        <view class="form-item">
          <text class="form-label">任务标题</text>
          <input placeholder="简短描述你需要什么帮助" v-model="form.title" maxlength="30" />
        </view>
        <view class="divider"></view>
        <view class="form-item column">
          <text class="form-label">详细说明</text>
          <textarea placeholder="详细描述任务内容，越具体越好" v-model="form.desc" maxlength="500" />
        </view>
      </view>
    </view>

    <!-- 任务地点 -->
    <view class="form-section">
      <text class="section-title">📍 任务地点</text>
      <view class="form-card">
        <view class="form-item">
          <text class="form-label">任务地点</text>
          <input placeholder="需要去哪里完成任务" v-model="form.taskLocation" />
        </view>
        <view class="divider"></view>
        <view class="form-item">
          <text class="form-label">送达地点</text>
          <input placeholder="送到哪里（可选）" v-model="form.deliverLocation" />
        </view>
      </view>
    </view>

    <!-- 地图选点：送达位置 -->
    <view class="form-section">
      <text class="section-title">🗺️ 送达位置（跑腿员导航用）</text>
      <view class="location-picker-wrap">
        <view class="location-display" v-if="destLocation.name">
          <text class="location-display-name">📌 {{ destLocation.name }}</text>
          <text class="location-display-addr" v-if="destLocation.address">{{ destLocation.address }}</text>
          <text class="location-display-coord">✅ ({{ destLocation.lat.toFixed(4) }}, {{ destLocation.lng.toFixed(4) }})</text>
        </view>
        <view class="location-choose-btn" @tap="chooseDestLocation">
          <text>{{ destLocation.name ? '📍 重新选择位置' : '📍 点击选择送达位置' }}</text>
        </view>
        <view class="location-tip" v-if="!destLocation.name">
          <text>⚠️ 建议选择位置，方便跑腿员准确找到你</text>
        </view>
      </view>
    </view>

    <!-- 报酬 -->
    <view class="form-section">
      <text class="section-title">💰 报酬（自定义）</text>
      <view class="price-input-card">
        <text class="price-prefix">¥</text>
        <input type="digit" placeholder="输入你愿意支付的报酬" v-model="form.price" class="price-input" />
      </view>
      <view class="price-suggest">
        <text class="suggest-label">参考价格：</text>
        <view v-for="p in suggestPrices" :key="p" class="suggest-item" @click="form.price = p">
          <text>¥{{ p }}</text>
        </view>
      </view>
    </view>

    <!-- 联系方式 -->
    <view class="form-section">
      <text class="section-title">📞 联系方式</text>
      <view class="form-card">
        <view class="form-item">
          <text class="form-label">手机号</text>
          <input type="number" placeholder="方便跑腿员联系你" v-model="form.phone" />
        </view>
        <view class="divider"></view>
        <view class="form-item">
          <text class="form-label">备注</text>
          <input placeholder="可选，其他说明" v-model="form.remark" />
        </view>
      </view>
    </view>

    <!-- 时间要求 -->
    <view class="form-section">
      <text class="section-title">⏰ 时间要求</text>
      <view class="time-options">
        <view v-for="(t, i) in timeOptions" :key="i" class="time-item" :class="{active: selectedTime === i}" @click="selectedTime = i">
          <text>{{ t }}</text>
        </view>
      </view>
    </view>

    <!-- 支付方式 -->
    <view class="form-section">
      <text class="section-title">💳 支付方式</text>
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
    </view>

    <!-- 提交 -->
    <view class="submit-btn" :class="{disabled: submitting}" @tap="submit">
      <text>{{ submitting ? '发布中...' : '发布任务' }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { callCloud, checkLogin } from '@/utils/cloud'
import { requestOrderSubscribe } from '@/utils/subscribe'

const suggestPrices = [5, 8, 10, 15, 20, 30]
const timeOptions = ['不着急', '1小时内', '30分钟内', '立即需要']
const selectedTime = ref(1)

const form = reactive({
  title: '', desc: '', taskLocation: '', deliverLocation: '',
  price: '', phone: '', remark: ''
})

// 用户选择的送达位置（地图选点结果）
const destLocation = reactive({ name: '', address: '', lat: 0, lng: 0 })
const payType = ref('wechat')
const walletBalance = ref('0.00')

const loadWalletBalance = async () => {
  var res = await callCloud('user', 'getWallet')
  if (res.code === 0 && res.data) walletBalance.value = (res.data.balance || 0).toFixed(2)
}
onShow(() => { loadWalletBalance() })

// 调用微信地图选点（先授权再打开）
const chooseDestLocation = () => {
  console.log('[chooseDestLocation] 点击了选择位置')
  uni.authorize({
    scope: 'scope.userLocation',
    success: () => {
      console.log('[chooseDestLocation] 授权成功，打开地图')
      openLocationPicker()
    },
    fail: () => {
      console.log('[chooseDestLocation] 授权失败，引导设置')
      uni.showModal({
        title: '需要位置权限',
        content: '请在设置中开启位置权限，以便跑腿员准确导航到你的位置',
        confirmText: '去设置',
        cancelText: '取消',
        success: (r) => {
          if (r.confirm) {
            uni.openSetting({
              success: (settingRes) => {
                if (settingRes.authSetting && settingRes.authSetting['scope.userLocation']) {
                  openLocationPicker()
                }
              }
            })
          }
        }
      })
    }
  })
}

const openLocationPicker = () => {
  uni.getLocation({
    type: 'gcj02',
    success: (loc) => {
      uni.chooseLocation({
        latitude: loc.latitude,
        longitude: loc.longitude,
        success: (res) => {
          console.log('[chooseLocation] 选点成功', res)
          destLocation.name = res.name || res.address || '已选位置'
          destLocation.address = res.address || ''
          destLocation.lat = res.latitude
          destLocation.lng = res.longitude
        },
        fail: (err) => {
          console.log('[chooseLocation] 选点失败或取消', err)
        }
      })
    },
    fail: () => {
      uni.chooseLocation({
        success: (res) => {
          destLocation.name = res.name || res.address || '已选位置'
          destLocation.address = res.address || ''
          destLocation.lat = res.latitude
          destLocation.lng = res.longitude
        },
        fail: (err) => {
          console.log('[chooseLocation] 选点失败', err)
        }
      })
    }
  })
}

const submitting = ref(false)
const submit = async () => {
  if (!checkLogin()) return
  if (!form.title) { uni.showToast({ title: '请填写任务标题', icon: 'none' }); return }
  if (!form.desc) { uni.showToast({ title: '请填写任务描述', icon: 'none' }); return }
  if (!form.price || Number(form.price) <= 0) { uni.showToast({ title: '请设置报酬金额', icon: 'none' }); return }
  // Price upper limit validation (Req 5.1)
  if (Number(form.price) > 999) { uni.showToast({ title: '报酬金额不能超过999元', icon: 'none' }); return }
  if (!form.phone) { uni.showToast({ title: '请填写联系电话', icon: 'none' }); return }
  // Phone format validation (Req 3.3)
  if (!/^1[3-9]\d{9}$/.test(form.phone)) { uni.showToast({ title: '手机号格式不正确', icon: 'none' }); return }

  // 验证位置坐标
  if (!destLocation.lat || !destLocation.lng) {
    uni.showModal({
      title: '未选择送达位置',
      content: '未选择地图位置，跑腿员将无法导航。是否继续发布？',
      confirmText: '继续发布',
      cancelText: '去选位置',
      success: async (r) => {
        if (r.confirm) await doSubmit(0, 0)
        else chooseDestLocation()
      }
    })
    return
  }
  await doSubmit(destLocation.lat, destLocation.lng)
}

const doSubmit = async (lat, lng) => {
  if (submitting.value) return
  submitting.value = true
  await requestOrderSubscribe()
  uni.showLoading({ title: '发布中...', mask: true })
  const res = await callCloud('errand', 'create', {
    title: form.title,
    desc: form.desc,
    fromAddr: form.taskLocation,
    toAddr: form.deliverLocation,
    price: Number(form.price),
    tip: 0,
    phone: form.phone,
    remark: form.remark,
    timeRequire: timeOptions[selectedTime.value],
    destLat: lat,
    destLng: lng,
    payType: payType.value
  })
  submitting.value = false
  uni.hideLoading()
  if (res.code === 0) {
    if (res.walletPaid) {
      uni.showToast({ title: '发布成功！已从钱包扣款', icon: 'success' })
      setTimeout(() => { uni.navigateBack() }, 1500)
    } else if (res.payment) {
      wx.requestPayment({
        ...res.payment,
        success: () => {
          uni.showToast({ title: '任务发布成功！', icon: 'success' })
          setTimeout(() => { uni.navigateBack() }, 1500)
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
      uni.showToast({ title: '任务发布成功！', icon: 'success' })
      setTimeout(() => { uni.navigateBack() }, 1500)
    }
  } else {
    uni.showToast({ title: res.msg || '发布失败', icon: 'none' })
  }
}
</script>

<style scoped>
.create-errand { background: #F5F7FA; min-height: 100vh; padding: 20rpx 24rpx 160rpx; }

.form-section { margin-bottom: 28rpx; }
.section-title { font-size: 28rpx; font-weight: bold; color: #333; padding: 16rpx 0; display: block; }

.form-card { background: #fff; border-radius: 16rpx; padding: 0 24rpx; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08); }
.form-item { display: flex; align-items: center; padding: 28rpx 0; }
.form-item.column { flex-direction: column; align-items: flex-start; }
.form-label { font-size: 28rpx; color: #333; width: 160rpx; flex-shrink: 0; }
.form-item input { flex: 1; font-size: 28rpx; }
.form-item.column .form-label { width: auto; margin-bottom: 12rpx; }
.form-item.column textarea { width: 100%; height: 180rpx; font-size: 26rpx; line-height: 40rpx; }
.divider { height: 1rpx; background: #f0f0f0; }

/* 地图选点 */
.location-picker-wrap { margin-bottom: 8rpx; }
.location-display { background: #fff; border-radius: 16rpx; padding: 24rpx; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08); margin-bottom: 16rpx; }
.location-display-name { font-size: 28rpx; color: #333; font-weight: 600; display: block; }
.location-display-addr { font-size: 22rpx; color: #999; display: block; margin-top: 8rpx; }
.location-display-coord { font-size: 22rpx; color: #2E7D32; display: block; margin-top: 8rpx; }
.location-choose-btn { background: linear-gradient(135deg, #FF9800, #F57C00); border-radius: 12rpx; padding: 24rpx; text-align: center; }
.location-choose-btn text { color: #fff; font-size: 28rpx; font-weight: 600; }
.location-tip { margin-top: 12rpx; padding: 12rpx 16rpx; background: #FFF8E1; border-radius: 10rpx; }
.location-tip text { font-size: 22rpx; color: #E65100; }

.price-input-card { display: flex; align-items: center; background: #fff; border-radius: 16rpx; padding: 24rpx; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08); }
.price-prefix { font-size: 44rpx; color: #FF6B6B; font-weight: bold; margin-right: 12rpx; }
.price-input { flex: 1; font-size: 40rpx; font-weight: bold; }
.price-suggest { display: flex; align-items: center; flex-wrap: wrap; gap: 12rpx; margin-top: 16rpx; }
.suggest-label { font-size: 24rpx; color: #999; }
.suggest-item { padding: 10rpx 24rpx; background: #fff; border-radius: 20rpx; border: 2rpx solid #e0e0e0; }
.suggest-item text { font-size: 24rpx; color: #333; }

.time-options { display: flex; gap: 16rpx; flex-wrap: wrap; }
.time-item { background: #fff; border-radius: 12rpx; padding: 20rpx 28rpx; border: 2rpx solid #e0e0e0; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.time-item.active { border-color: #FF9800; background: #FFF3E0; }
.time-item text { font-size: 26rpx; color: #333; }
.time-item.active text { color: #FF9800; font-weight: bold; }

.pay-options { display: flex; gap: 16rpx; }
.pay-item { flex: 1; background: #fff; border-radius: 16rpx; padding: 24rpx; display: flex; align-items: center; gap: 16rpx; border: 2rpx solid #e0e0e0; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.pay-item.active { border-color: #FF9800; background: #FFF3E0; }
.pay-icon { font-size: 36rpx; }
.pay-name { font-size: 26rpx; color: #333; font-weight: 600; }
.pay-name-row { display: flex; flex-direction: column; }
.pay-balance { font-size: 22rpx; color: #999; margin-top: 4rpx; }

.submit-btn { position: fixed; bottom: 40rpx; left: 24rpx; right: 24rpx; background: linear-gradient(135deg, #FF9800, #F57C00); border-radius: 48rpx; padding: 28rpx; text-align: center; box-shadow: 0 8rpx 24rpx rgba(255,152,0,0.4); }
.submit-btn.disabled { opacity: 0.5; pointer-events: none; }
.submit-btn text { color: #fff; font-size: 32rpx; font-weight: bold; }
</style>
