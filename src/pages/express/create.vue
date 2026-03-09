<template>
  <view class="create-express">
    <!-- 智能识别短信 -->
    <view class="sms-section">
      <text class="section-title">📱 粘贴快递短信，自动识别</text>
      <view class="sms-input-area">
        <textarea v-model="smsText" placeholder="粘贴快递取件短信内容，自动识别取件点和取件码" @input="onSmsInput" maxlength="500" />
      </view>
      <view v-if="recognized" class="recognized-card">
        <text class="recognized-title">✅ 已自动识别</text>
        <view class="recognized-row">
          <text class="recognized-label">取件点</text>
          <text class="recognized-value">{{ form.pickupPoint }}</text>
        </view>
        <view class="recognized-row">
          <text class="recognized-label">取件码</text>
          <text class="recognized-value">{{ form.pickupCode }}</text>
        </view>
      </view>
    </view>

    <!-- 快递大小 -->
    <view class="form-section">
      <text class="section-title">📦 快递大小</text>
      <view class="size-grid">
        <view v-for="(size, i) in sizes" :key="i" class="size-item" :class="{active: selectedSize === i}" @click="selectSize(i)">
          <text class="size-emoji">{{ size.emoji }}</text>
          <text class="size-name">{{ size.name }}</text>
          <text class="size-price">¥{{ size.price }}起</text>
        </view>
      </view>
    </view>

    <!-- 取件信息 -->
    <view class="form-section">
      <text class="section-title">📍 取件信息</text>
      <view class="form-card">
        <view class="form-item">
          <text class="form-label">取件点</text>
          <input placeholder="如：菜鸟驿站A区" v-model="form.pickupPoint" />
        </view>
        <view class="divider"></view>
        <view class="form-item">
          <text class="form-label">取件码</text>
          <input placeholder="如：5-2-1234" v-model="form.pickupCode" />
        </view>
        <view class="divider"></view>
        <view class="form-item">
          <text class="form-label">快递公司</text>
          <input placeholder="可选，如：顺丰/京东/中通" v-model="form.expressCompany" />
        </view>
      </view>
    </view>

    <!-- 收货信息 -->
    <view class="form-section">
      <text class="section-title">🏠 收货信息</text>
      <view class="form-card">
        <view class="form-item">
          <text class="form-label">宿舍楼</text>
          <picker mode="multiSelector" :range="buildingColumns" :value="buildingIndex" @columnchange="onColumnChange" @change="onBuildingChange">
            <view class="picker-value">
              <text>{{ form.building || '请选择宿舍楼' }}</text>
              <text class="picker-arrow">›</text>
            </view>
          </picker>
        </view>
        <view class="divider"></view>
        <view class="form-item">
          <text class="form-label">房间号</text>
          <input placeholder="如：302" v-model="form.room" />
        </view>
        <view class="divider"></view>
        <view class="form-item">
          <text class="form-label">联系电话</text>
          <input type="number" placeholder="接收快递的电话" v-model="form.phone" />
        </view>
      </view>
    </view>

    <!-- 地图选点：收货位置 -->
    <view class="form-section">
      <text class="section-title">🗺️ 收货位置（骑手导航用）</text>
      <view class="location-picker-wrap">
        <view class="location-display" v-if="destLocation.name">
          <text class="location-display-name">📌 {{ destLocation.name }}</text>
          <text class="location-display-addr" v-if="destLocation.address">{{ destLocation.address }}</text>
          <text class="location-display-coord">✅ ({{ destLocation.lat.toFixed(4) }}, {{ destLocation.lng.toFixed(4) }})</text>
        </view>
        <view class="location-choose-btn" @tap="chooseDestLocation">
          <text>{{ destLocation.name ? '📍 重新选择位置' : '📍 点击选择收货位置' }}</text>
        </view>
        <view class="location-tip" v-if="!destLocation.name">
          <text>⚠️ 建议选择位置，方便骑手准确导航到你宿舍</text>
        </view>
      </view>
    </view>

    <!-- 报酬设置 -->
    <view class="form-section">
      <text class="section-title">💰 配送费 + 小费</text>
      <view class="price-display">
        <view class="base-price">
          <text class="price-label">基础配送费</text>
          <text class="price-value">¥{{ currentSize.price }}</text>
        </view>
      </view>
      <view class="tip-section">
        <text class="tip-label">加小费（可选，吸引骑手更快接单）</text>
        <view class="tip-options">
          <view class="tip-item" :class="{active: form.tip === 0 && !customTip}" @click="selectTip(0)">
            <text>不加</text>
          </view>
          <view v-for="t in tipList" :key="t" class="tip-item" :class="{active: form.tip === t && !customTip}" @click="selectTip(t)">
            <text>+¥{{ t }}</text>
          </view>
          <view class="tip-item custom" :class="{active: customTip}" @click="customTip = true">
            <text>自定义</text>
          </view>
        </view>
        <view v-if="customTip" class="custom-tip-input">
          <text>+¥</text>
          <input type="digit" placeholder="输入小费金额" v-model.number="form.tip" />
        </view>
      </view>
      <view class="total-price">
        <text>合计：</text>
        <text class="total-value">¥{{ totalPrice }}</text>
      </view>
    </view>

    <!-- 备注 -->
    <view class="form-section">
      <text class="section-title">📝 备注</text>
      <view class="form-card">
        <textarea placeholder="可选，如：放门口就行 / 轻拿轻放" v-model="form.remark" maxlength="200" />
      </view>
    </view>

    <!-- 配送时间说明 -->
    <view class="time-notice">
      <text class="notice-title">⏰ 配送时间规定</text>
      <text class="notice-text">1. 工作日配送时间 8:00-22:00，周末 9:00-21:00</text>
      <text class="notice-text">2. 骑手接单后30分钟内取件，1小时内送达</text>
      <text class="notice-text">3. 超大件需骑手确认后方可配送</text>
      <text class="notice-text">4. 恶劣天气配送时效可能延长，请谅解</text>
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

    <!-- 提交按钮 -->
    <view class="submit-btn" :class="{disabled: submitting}" @tap="submit">
      <text>{{ submitting ? '发布中...' : '发布订单 · ¥' + totalPrice }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { callCloud, checkLogin } from '@/utils/cloud'
import { requestOrderSubscribe } from '@/utils/subscribe'

const sizes = [
  { emoji: '📄', name: '小件', price: 2, desc: '信件/小包裹' },
  { emoji: '📦', name: '大件', price: 5, desc: '中型包裹' },
  { emoji: '📦', name: '超大件', price: 20, desc: '大型/重型包裹' }
]
const selectedSize = ref(0)
const currentSize = computed(() => sizes[selectedSize.value])
const tipList = [1, 2, 3, 5]
const customTip = ref(false)

const buildingData = {
  '东区': ['一舍女', '二舍男', '三舍女', '四舍男', '五舍女', '六舍男', '七舍女', '八舍男'],
  '西区': ['一组团男', '二组团女', '二组团男', '三组团女', '三组团男', '四组团男', '五组团男', '六组团女', '七组团男', '八组团男', '九组团女', '十组团女', '十一组团男', '十二组团男', '十二组团女']
}
var areaList = ['东区', '西区']
const buildingIndex = ref([0, 5])
const buildingColumns = computed(() => {
  var area = areaList[buildingIndex.value[0]] || '东区'
  return [areaList, buildingData[area]]
})

const smsText = ref('')
const recognized = ref(false)

const form = reactive({
  pickupPoint: '', pickupCode: '', expressCompany: '',
  building: '东区六舍男', room: '', phone: '', tip: 0, remark: ''
})

// 用户选择的收货位置（地图选点结果）
const destLocation = reactive({ name: '', address: '', lat: 0, lng: 0 })

const totalPrice = computed(() => currentSize.value.price + (form.tip || 0))
const payType = ref('wechat')
const walletBalance = ref('0.00')

const loadWalletBalance = async () => {
  var res = await callCloud('user', 'getWallet')
  if (res.code === 0 && res.data) walletBalance.value = (res.data.balance || 0).toFixed(2)
}
onShow(() => { loadWalletBalance() })

const selectSize = (i) => { selectedSize.value = i }
const selectTip = (t) => { customTip.value = false; form.tip = t }

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
        content: '请在设置中开启位置权限，以便骑手准确导航到你的位置',
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
  // 先获取当前位置作为地图初始中心点
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
      // 获取不到当前位置也尝试打开选点（不传初始坐标）
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

// 智能识别快递短信（保留原有逻辑）
const onSmsInput = () => {
  var text = smsText.value
  if (!text || text.length < 6) { recognized.value = false; return }
  var foundPoint = '', foundCode = '', foundCompany = ''
  var companies = ['顺丰', '京东', '中通', '韵达', '圆通', '申通', '极兔', '百世', '天天', '邮政', 'EMS', '德邦', '丰网', '众邮', '宅急送']
  for (var ei = 0; ei < companies.length; ei++) {
    if (text.indexOf(companies[ei]) !== -1) { foundCompany = companies[ei]; break }
  }
  var cnBracketMatch = text.match(/凭[「]([A-Za-z0-9\-]{4,20})[」]/)
  if (cnBracketMatch) foundCode = cnBracketMatch[1]
  if (!foundCode) { var m = text.match(/提货码\s*([A-Za-z0-9\-]{4,20})/); if (m) foundCode = m[1] }
  if (!foundCode) { var m2 = text.match(/[可请]*凭\s*([A-Za-z]-[\d]-\d{4})/); if (m2) foundCode = m2[1] }
  if (!foundCode) { var m3 = text.match(/[可请]*凭\s*(\d{1,3}-\d{1,3}-\d{2,8})/); if (m3) foundCode = m3[1] }
  if (!foundCode) { var m4 = text.match(/取件码[：:\s]*([A-Za-z0-9\-]{2,20})/); if (m4) foundCode = m4[1] }
  if (!foundCode) { var m5 = text.match(/(\d{1,3}-\d{1,3}-\d{2,8})/); if (m5) foundCode = m5[1] }
  var yidaoMatch = text.match(/已到([^,，。！!?？\n]{2,40})[,，]/)
  if (yidaoMatch) { foundPoint = yidaoMatch[1].replace(/\s+$/, '') }
  if (!foundPoint) { var qm = text.match(/凭[^到]*到([^\s,，。！!?？]{2,40}?)(?:领取|取件|自取)/); if (qm) foundPoint = qm[1] }
  if (!foundPoint) { var bm = text.match(/菜鸟驿站[A-Za-z0-9\u4e00-\u9fa5（()）]*/); if (bm) foundPoint = bm[0] }
  if (foundPoint) form.pickupPoint = foundPoint
  if (foundCode) form.pickupCode = foundCode
  if (foundCompany) form.expressCompany = foundCompany
  recognized.value = !!(foundPoint || foundCode)
}

const onColumnChange = (e) => {
  var col = e.detail.column, val = e.detail.value
  var newIdx = [buildingIndex.value[0], buildingIndex.value[1]]
  newIdx[col] = val
  if (col === 0) newIdx[1] = 0
  buildingIndex.value = newIdx
}
const onBuildingChange = (e) => {
  var vals = e.detail.value
  form.building = areaList[vals[0]] + buildingData[areaList[vals[0]]][vals[1]]
}

const submitting = ref(false)
const submit = async () => {
  if (!checkLogin()) return
  if (!form.pickupPoint) { uni.showToast({ title: '请填写取件点', icon: 'none' }); return }
  if (!form.building || !form.room) { uni.showToast({ title: '请填写收货地址', icon: 'none' }); return }
  if (!form.phone) { uni.showToast({ title: '请填写联系电话', icon: 'none' }); return }
  // Phone format validation (Req 3.2)
  if (!/^1[3-9]\d{9}$/.test(form.phone)) { uni.showToast({ title: '手机号格式不正确', icon: 'none' }); return }
  // Tip range validation (Req 5.2)
  if (customTip.value && (form.tip < 0 || form.tip > 99)) { uni.showToast({ title: '小费金额需在0-99元之间', icon: 'none' }); return }
  // 验证位置坐标
  if (!destLocation.lat || !destLocation.lng) {
    uni.showModal({
      title: '未选择收货位置',
      content: '未选择地图位置，骑手将无法导航。是否继续发布？',
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
  // 请求订阅消息授权（用户可拒绝，不影响下单）
  await requestOrderSubscribe()
  uni.showLoading({ title: '发布中...', mask: true })
  const res = await callCloud('express', 'create', {
    pickupPoint: form.pickupPoint,
    pickupCode: form.pickupCode,
    expressCompany: form.expressCompany,
    sizeType: selectedSize.value,
    building: form.building,
    room: form.room,
    price: currentSize.value.price,
    tip: form.tip || 0,
    remark: form.remark,
    phone: form.phone,
    destLat: lat,
    destLng: lng,
    payType: payType.value
  })
  submitting.value = false
  uni.hideLoading()
  if (res.code === 0) {
    if (res.walletPaid) {
      // 钱包支付成功
      uni.showToast({ title: '发布成功！已从钱包扣款', icon: 'success' })
      setTimeout(() => { uni.navigateBack() }, 1500)
    } else if (res.payment) {
      wx.requestPayment({
        ...res.payment,
        success: () => {
          uni.showToast({ title: '发布成功！', icon: 'success' })
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
      uni.showToast({ title: '发布成功！', icon: 'success' })
      setTimeout(() => { uni.navigateBack() }, 1500)
    }
  } else {
    uni.showToast({ title: res.msg || '发布失败', icon: 'none' })
  }
}
</script>

<style scoped>
.create-express { background: #F5F7FA; min-height: 100vh; padding: 20rpx 24rpx 160rpx; }

.form-section { margin-bottom: 28rpx; }
.section-title { font-size: 28rpx; font-weight: bold; color: #333; padding: 16rpx 0; display: block; }

.sms-section { margin-bottom: 28rpx; }
.sms-input-area { background: #fff; border-radius: 16rpx; padding: 20rpx; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08); }
.sms-input-area textarea { width: 100%; height: 160rpx; font-size: 26rpx; color: #333; }
.recognized-card { background: #E8F5E9; border-radius: 12rpx; padding: 20rpx; margin-top: 16rpx; }
.recognized-title { font-size: 26rpx; font-weight: bold; color: #43A047; display: block; margin-bottom: 12rpx; }
.recognized-row { display: flex; justify-content: space-between; padding: 8rpx 0; }
.recognized-label { font-size: 24rpx; color: #666; }
.recognized-value { font-size: 24rpx; color: #333; font-weight: bold; }

.size-grid { display: flex; gap: 16rpx; }
.size-item { flex: 1; background: #fff; border-radius: 16rpx; padding: 24rpx 0; display: flex; flex-direction: column; align-items: center; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08); border: 2rpx solid transparent; }
.size-item.active { border-color: #4A90D9; background: #E3F2FD; }
.size-emoji { font-size: 44rpx; margin-bottom: 8rpx; }
.size-name { font-size: 26rpx; font-weight: bold; color: #333; }
.size-price { font-size: 22rpx; color: #FF6B6B; margin-top: 4rpx; }

.form-card { background: #fff; border-radius: 16rpx; padding: 0 24rpx; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08); }
.form-item { display: flex; align-items: center; padding: 28rpx 0; }
.form-label { font-size: 28rpx; color: #333; width: 160rpx; flex-shrink: 0; }
.form-item input { flex: 1; font-size: 28rpx; }
.divider { height: 1rpx; background: #f0f0f0; }
.picker-value { flex: 1; display: flex; justify-content: space-between; align-items: center; font-size: 28rpx; color: #333; }
.picker-arrow { font-size: 32rpx; color: #ccc; }

/* 地图选点 */
.location-picker-wrap { margin-bottom: 8rpx; }
.location-display { background: #fff; border-radius: 16rpx; padding: 24rpx; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08); margin-bottom: 16rpx; }
.location-display-name { font-size: 28rpx; color: #333; font-weight: 600; display: block; }
.location-display-addr { font-size: 22rpx; color: #999; display: block; margin-top: 8rpx; }
.location-display-coord { font-size: 22rpx; color: #2E7D32; display: block; margin-top: 8rpx; }
.location-choose-btn { background: linear-gradient(135deg, #4A90D9, #357ABD); border-radius: 12rpx; padding: 24rpx; text-align: center; }
.location-choose-btn text { color: #fff; font-size: 28rpx; font-weight: 600; }
.location-tip { margin-top: 12rpx; padding: 12rpx 16rpx; background: #FFF8E1; border-radius: 10rpx; }
.location-tip text { font-size: 22rpx; color: #E65100; }

.price-display { background: #fff; border-radius: 12rpx; padding: 20rpx 24rpx; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08); margin-bottom: 16rpx; }
.base-price { display: flex; justify-content: space-between; align-items: center; }
.price-label { font-size: 28rpx; color: #333; }
.price-value { font-size: 32rpx; color: #FF6B6B; font-weight: bold; }

.tip-section { margin-bottom: 16rpx; }
.tip-label { font-size: 24rpx; color: #666; display: block; margin-bottom: 12rpx; }
.tip-options { display: flex; gap: 16rpx; flex-wrap: wrap; }
.tip-item { background: #fff; border-radius: 12rpx; padding: 16rpx 28rpx; border: 2rpx solid #e0e0e0; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.tip-item.active { border-color: #FF9800; background: #FFF3E0; }
.tip-item text { font-size: 26rpx; color: #333; font-weight: bold; }
.tip-item.active text { color: #FF9800; }
.custom-tip-input { display: flex; align-items: center; background: #fff; border-radius: 12rpx; padding: 16rpx 24rpx; margin-top: 12rpx; border: 2rpx solid #FF9800; }
.custom-tip-input text { font-size: 28rpx; color: #FF9800; font-weight: bold; margin-right: 8rpx; }
.custom-tip-input input { flex: 1; font-size: 28rpx; }

.total-price { display: flex; justify-content: flex-end; align-items: center; padding: 16rpx 0; }
.total-price text { font-size: 28rpx; color: #333; }
.total-value { font-size: 36rpx; color: #FF6B6B; font-weight: bold; margin-left: 8rpx; }

.form-card textarea { width: 100%; height: 120rpx; font-size: 26rpx; padding: 20rpx 0; }

.time-notice { background: #FFF8E1; border-radius: 12rpx; padding: 20rpx; margin-bottom: 28rpx; }
.notice-title { font-size: 26rpx; font-weight: bold; color: #F57C00; display: block; margin-bottom: 12rpx; }
.notice-text { font-size: 22rpx; color: #795548; display: block; line-height: 36rpx; }

.pay-options { display: flex; gap: 16rpx; }
.pay-item { flex: 1; background: #fff; border-radius: 16rpx; padding: 24rpx; display: flex; align-items: center; gap: 16rpx; border: 2rpx solid #e0e0e0; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.pay-item.active { border-color: #4A90D9; background: #E3F2FD; }
.pay-icon { font-size: 36rpx; }
.pay-name { font-size: 26rpx; color: #333; font-weight: 600; }
.pay-name-row { display: flex; flex-direction: column; }
.pay-balance { font-size: 22rpx; color: #999; margin-top: 4rpx; }

.submit-btn { position: fixed; bottom: 40rpx; left: 24rpx; right: 24rpx; background: linear-gradient(135deg, #4A90D9, #357ABD); border-radius: 48rpx; padding: 28rpx; text-align: center; box-shadow: 0 8rpx 24rpx rgba(74,144,217,0.4); }
.submit-btn.disabled { opacity: 0.5; pointer-events: none; }
.submit-btn text { color: #fff; font-size: 32rpx; font-weight: bold; }
</style>
