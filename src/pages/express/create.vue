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

    <!-- 提交按钮 -->
    <view class="submit-btn" @click="submit">
      <text>发布订单 · ¥{{ totalPrice }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { callCloud, checkLogin } from '@/utils/cloud'

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
  pickupPoint: '',
  pickupCode: '',
  expressCompany: '',
  building: '东区六舍男',
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

const selectTip = (t) => {
  customTip.value = false
  form.tip = t
}

// 智能识别快递短信
const onSmsInput = () => {
  var text = smsText.value
  if (!text || text.length < 6) {
    recognized.value = false
    return
  }

  var foundPoint = ''
  var foundCode = ''
  var foundCompany = ''

  // ===== 识别快递公司 =====
  var companies = ['顺丰', '京东', '中通', '韵达', '圆通', '申通', '极兔', '百世', '天天', '邮政', 'EMS', '德邦', '丰网', '众邮', '宅急送']
  for (var ei = 0; ei < companies.length; ei++) {
    if (text.indexOf(companies[ei]) !== -1) {
      foundCompany = companies[ei]
      break
    }
  }
  if (!foundCompany) {
    var signMatch = text.match(/【([^】]{2,10})】/)
    if (signMatch) {
      var sign = signMatch[1]
      for (var si = 0; si < companies.length; si++) {
        if (sign.indexOf(companies[si]) !== -1) {
          foundCompany = companies[si]
          break
        }
      }
      if (!foundCompany && (sign.indexOf('快递') !== -1 || sign.indexOf('速递') !== -1 || sign.indexOf('物流') !== -1)) {
        foundCompany = sign
      }
    }
  }

  // ===== 识别取件码 =====
  // 优先级1: 「」中文书名号中的码（近邻宝）
  var cnBracketMatch = text.match(/凭[「]([A-Za-z0-9\-]{4,20})[」]/)
  if (cnBracketMatch) {
    foundCode = cnBracketMatch[1]
  }
  // 优先级2: 提货码XXXXX（中通超时提醒）
  if (!foundCode) {
    var labelCodeMatch = text.match(/提货码\s*([A-Za-z0-9\-]{4,20})/)
    if (labelCodeMatch) foundCode = labelCodeMatch[1]
  }
  // 优先级3: 凭/请凭 后面的码（最常见格式）
  if (!foundCode) {
    var pingMatch = text.match(/[可请]*凭\s*([A-Za-z]-[\d]-\d{4})/)
    if (pingMatch) foundCode = pingMatch[1]
  }
  if (!foundCode) {
    var pingMatch2 = text.match(/[可请]*凭\s*(\d{1,3}-\d{1,3}-\d{2,8})/)
    if (pingMatch2) foundCode = pingMatch2[1]
  }
  if (!foundCode) {
    var pingMatch3 = text.match(/[可请]*凭\s*([A-Za-z]-\d{2,8})/)
    if (pingMatch3) foundCode = pingMatch3[1]
  }
  if (!foundCode) {
    var pingMatch4 = text.match(/[可请]*凭\s*(\d{6,12})/)
    if (pingMatch4) foundCode = pingMatch4[1]
  }
  // 优先级4: 明确标注的取件码/取货码/验证码等
  if (!foundCode) {
    var labelPatterns = [
      /取件码[：:\s]*([A-Za-z0-9\-]{2,20})/,
      /取货码[：:\s]*([A-Za-z0-9\-]{2,20})/,
      /取件号[：:\s]*([A-Za-z0-9\-]{2,20})/,
      /验证码[：:\s]*([A-Za-z0-9\-]{2,20})/,
      /签收码[：:\s]*([A-Za-z0-9\-]{2,20})/,
      /开柜码[：:\s]*([A-Za-z0-9\-]{2,20})/,
      /开箱码[：:\s]*([A-Za-z0-9\-]{2,20})/
    ]
    for (var ki = 0; ki < labelPatterns.length; ki++) {
      var km = text.match(labelPatterns[ki])
      if (km) { foundCode = km[1]; break }
    }
  }
  // 优先级5: X-X-XXXX 格式兜底
  if (!foundCode) {
    var dashMatch = text.match(/(\d{1,3}-\d{1,3}-\d{2,8})/)
    if (dashMatch) foundCode = dashMatch[1]
  }

  // ===== 识别取件点 =====
  // 策略：根据短信结构分类处理

  // 模式A: "已到XXX，凭YYY到ZZZ取件" — 驿小哥/驿收发/中通柜
  // 取件点是"已到"后面到逗号/句号之间的内容
  var yidaoMatch = text.match(/已到([^,，。！!?？\n]{2,40})[,，]/)
  if (yidaoMatch) {
    foundPoint = yidaoMatch[1].replace(/\s+$/, '')
    // 中通柜特殊处理：已到XXX柜，凭YYY到H28取件 → 取件点拼接柜号
    // 检查"凭XXX到"后面是否跟的是柜号（字母+数字，如H28/K14/F16）而不是地名
    var slotAfterDao = text.match(/凭[^到]*到([A-Z]\d{1,3})取件/)
    if (slotAfterDao) {
      foundPoint = foundPoint + slotAfterDao[1]
    }
  }

  // 模式B: "凭XXX到YYY柜ZZZ取件" — 近邻宝（无"已到"）
  // 取件点是"到"和"取件/领取"之间的内容
  if (!foundPoint) {
    // 近邻宝格式：凭XXX到YYY柜ZZZ取件，ZZZ是字母+数字的柜号
    var guiSlotMatch = text.match(/到([^\s,，。！!?？]{2,30}柜)([A-Z]\d{1,3})取件/)
    if (guiSlotMatch) {
      foundPoint = guiSlotMatch[1] + guiSlotMatch[2]
    }
  }

  // 模式C: "请凭XXX到YYY领取/取件/取" — 菜鸟/圆通/申通/多多代收点
  if (!foundPoint) {
    var qingpingMatch = text.match(/凭[^到]*到([^\s,，。！!?？]{2,40}?)(?:领取|取件|自取|取(?:[,，。\s]|$))/)
    if (qingpingMatch) {
      var pt = qingpingMatch[1]
      // 过滤掉"到店学校-XXX"这种二级地址（驿小哥），只在没有"已到"时才用
      if (pt.indexOf('到店') === -1 && pt.indexOf('店学校') === -1) {
        // 过滤掉纯柜号（如H28），这不是取件点
        if (!/^[A-Z]\d{1,3}$/.test(pt)) {
          foundPoint = pt
        }
      }
    }
  }

  // 模式D: "在<XXX>" — 中通超时提醒
  if (!foundPoint) {
    var angleBracketMatch = text.match(/在<([^>]{2,30})>/)
    if (angleBracketMatch) {
      foundPoint = angleBracketMatch[1]
    }
  }

  // 模式E: "来取" — 驿收发格式（凭XXX来取，取件点在"已到"中已处理）
  // 如果还没找到，尝试"已到"后面不带逗号的情况
  if (!foundPoint) {
    var yidaoMatch2 = text.match(/已到([^,，。！!?？\n]{2,40}?)(?:[,，]|，请|，凭|请)/)
    if (yidaoMatch2) {
      foundPoint = yidaoMatch2[1].replace(/\s+$/, '')
    }
  }

  // 模式F: 品牌名匹配兜底
  if (!foundPoint) {
    var brandPatterns = [
      /菜鸟驿站[A-Za-z0-9\u4e00-\u9fa5（()）]*/,
      /菜鸟[A-Za-z0-9\u4e00-\u9fa5]*驿站/,
      /丰巢[快递柜]*[A-Za-z0-9\u4e00-\u9fa5（()）]*/,
      /速递易[A-Za-z0-9\u4e00-\u9fa5]*/,
      /近邻宝[A-Za-z0-9\u4e00-\u9fa5]*/,
      /驿收发[A-Za-z0-9\u4e00-\u9fa5]*/,
      /妈妈驿站[A-Za-z0-9\u4e00-\u9fa5]*/
    ]
    for (var pi = 0; pi < brandPatterns.length; pi++) {
      var pm = text.match(brandPatterns[pi])
      if (pm) { foundPoint = pm[0]; break }
    }
  }

  // 模式G: "在/放在/存放XXX驿站/柜/站" 通用兜底
  if (!foundPoint) {
    var locMatch = text.match(/(?:已到|已放|已存|存放在?|放在|放到|在)[\s:：]*([^\s,，。！!?？\n]{2,25}(?:驿站|快递柜|快递点|代收点|自提点|服务站|营业部|超市|门店|柜|站点|站))/)
    if (locMatch) foundPoint = locMatch[1]
  }

  // 清理取件点：去掉末尾多余的"地址：XXX"部分
  if (foundPoint) {
    var addrIdx = foundPoint.indexOf('，地址')
    if (addrIdx > 0) foundPoint = foundPoint.substring(0, addrIdx)
    // 去掉末尾的"运单尾号XXXX包裹"
    foundPoint = foundPoint.replace(/运单尾号.*$/, '').replace(/\s+$/, '')
  }

  // 赋值
  if (foundPoint) form.pickupPoint = foundPoint
  if (foundCode) form.pickupCode = foundCode
  if (foundCompany) form.expressCompany = foundCompany

  recognized.value = !!(foundPoint || foundCode)
}

const onColumnChange = (e) => {
  var col = e.detail.column
  var val = e.detail.value
  var newIdx = [buildingIndex.value[0], buildingIndex.value[1]]
  newIdx[col] = val
  if (col === 0) { newIdx[1] = 0 }
  buildingIndex.value = newIdx
}

const onBuildingChange = (e) => {
  var vals = e.detail.value
  var area = areaList[vals[0]]
  var bld = buildingData[area][vals[1]]
  form.building = area + bld
}

const submitting = ref(false)
const submit = async () => {
  if (!checkLogin()) return
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
  if (submitting.value) return
  submitting.value = true
  // 获取当前位置作为收货地址坐标
  var destLat = 0
  var destLng = 0
  try {
    var locRes = await new Promise(function(resolve, reject) {
      uni.getLocation({
        type: 'gcj02',
        success: function(r) { resolve(r) },
        fail: function() { resolve(null) }
      })
    })
    if (locRes) {
      destLat = locRes.latitude
      destLng = locRes.longitude
    }
  } catch (e) {}
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
    destLat: destLat,
    destLng: destLng
  })
  submitting.value = false
  if (res.code === 0) {
    uni.showToast({ title: '发布成功！', icon: 'success' })
    setTimeout(() => { uni.navigateBack() }, 1500)
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
