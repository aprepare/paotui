<template>
  <view class="create-express">
    <!-- 智能识别提示 -->
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
      <text class="section-title">🏠 收货信息（默认宿舍地址）</text>
      <view class="form-card">
        <view class="form-item">
          <text class="form-label">宿舍楼</text>
          <picker :range="buildingList" @change="onBuildingChange">
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
          <view v-for="t in tipList" :key="t" class="tip-item" :class="{active: form.tip === t}" @click="form.tip = t">
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

    <!-- 提交按钮 -->
    <view class="submit-btn" @click="submit">
      <text>发布订单 · ¥{{ totalPrice }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'

const sizes = [
  { emoji: '📄', name: '小件', price: 2, desc: '信件/小包裹' },
  { emoji: '📦', name: '大件', price: 5, desc: '中型包裹' },
  { emoji: '📦', name: '超大件', price: 20, desc: '大型/重型包裹' }
]
const selectedSize = ref(0)
const currentSize = computed(() => sizes[selectedSize.value])

const tipList = [1, 2, 3, 5]
const customTip = ref(false)

const buildingList = ['1号宿舍楼', '2号宿舍楼', '3号宿舍楼', '5号宿舍楼', '6号宿舍楼', '8号宿舍楼', '10号宿舍楼', '12号宿舍楼']

const smsText = ref('')
const recognized = ref(false)

const form = reactive({
  pickupPoint: '',
  pickupCode: '',
  expressCompany: '',
  building: '6号宿舍楼',
  room: '',
  phone: '',
  tip: 0,
  remark: ''
})

const totalPrice = computed(() => {
  return currentSize.value.price + (form.tip || 0)
})

const selectSize = (i) => {
  selectedSize.value = i
}

// 智能识别快递短信
const onSmsInput = () => {
  const text = smsText.value
  if (!text || text.length < 10) {
    recognized.value = false
    return
  }

  // 识别取件点
  const pointPatterns = [
    /菜鸟驿站[A-Za-z\u4e00-\u9fa5]*/,
    /京东快递[柜站][A-Za-z\u4e00-\u9fa5]*/,
    /顺丰[快递]*[站点柜][A-Za-z\u4e00-\u9fa5]*/,
    /中通[快递]*[站点柜][A-Za-z\u4e00-\u9fa5]*/,
    /韵达[快递]*[站点柜][A-Za-z\u4e00-\u9fa5]*/,
    /圆通[快递]*[站点柜][A-Za-z\u4e00-\u9fa5]*/,
    /申通[快递]*[站点柜][A-Za-z\u4e00-\u9fa5]*/,
    /极兔[快递]*[站点柜][A-Za-z\u4e00-\u9fa5]*/,
    /丰巢[快递柜]*[A-Za-z\u4e00-\u9fa5]*/
  ]

  for (const pattern of pointPatterns) {
    const match = text.match(pattern)
    if (match) {
      form.pickupPoint = match[0]
      break
    }
  }

  // 识别取件码
  const codePatterns = [
    /取件码[：:\s]*([0-9\-]+)/,
    /取货码[：:\s]*([0-9\-]+)/,
    /验证码[：:\s]*([0-9\-]+)/,
    /凭[取取件]*码[：:\s]*([0-9\-]+)/,
    /(\d{1,2}[-\s]\d{1,2}[-\s]\d{2,6})/
  ]

  for (const pattern of codePatterns) {
    const match = text.match(pattern)
    if (match) {
      form.pickupCode = match[1] || match[0]
      break
    }
  }

  // 识别快递公司
  const companyMap = { '顺丰': '顺丰', '京东': '京东', '中通': '中通', '韵达': '韵达', '圆通': '圆通', '申通': '申通', '极兔': '极兔', '邮政': '邮政', 'EMS': 'EMS' }
  for (const [key, val] of Object.entries(companyMap)) {
    if (text.includes(key)) {
      form.expressCompany = val
      break
    }
  }

  if (form.pickupPoint || form.pickupCode) {
    recognized.value = true
  }
}

const onBuildingChange = (e) => {
  form.building = buildingList[e.detail.value]
}

const submit = () => {
  if (!form.pickupPoint) {
    uni.showToast({ title: '请填写取件点', icon: 'none' })
    return
  }
  if (!form.building || !form.room) {
    uni.showToast({ title: '请填写收货地址', icon: 'none' })
    return
  }
  if (!form.phone) {
    uni.showToast({ title: '请填写联系电话', icon: 'none' })
    return
  }
  uni.showToast({ title: '发布成功！', icon: 'success' })
  setTimeout(() => { uni.navigateBack() }, 1500)
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

.submit-btn { position: fixed; bottom: 40rpx; left: 24rpx; right: 24rpx; background: linear-gradient(135deg, #4A90D9, #357ABD); border-radius: 48rpx; padding: 28rpx; text-align: center; box-shadow: 0 8rpx 24rpx rgba(74,144,217,0.4); }
.submit-btn text { color: #fff; font-size: 32rpx; font-weight: bold; }
</style>
