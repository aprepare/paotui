<template>
  <view class="create-errand">
    <!-- 任务标题 -->
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

    <!-- 地点信息 -->
    <view class="form-section">
      <text class="section-title">📍 地点信息</text>
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
          <input placeholder="可选" v-model="form.remark" />
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

    <!-- 提交 -->
    <view class="submit-btn" @click="submit">
      <text>发布任务</text>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue'

const suggestPrices = [5, 8, 10, 15, 20, 30]
const timeOptions = ['不着急', '1小时内', '30分钟内', '立即需要']
const selectedTime = ref(1)

const form = reactive({
  title: '',
  desc: '',
  taskLocation: '',
  deliverLocation: '',
  price: '',
  phone: '',
  remark: ''
})

const submit = () => {
  if (!form.title) {
    uni.showToast({ title: '请填写任务标题', icon: 'none' })
    return
  }
  if (!form.desc) {
    uni.showToast({ title: '请填写任务描述', icon: 'none' })
    return
  }
  if (!form.price || Number(form.price) <= 0) {
    uni.showToast({ title: '请设置报酬金额', icon: 'none' })
    return
  }
  if (!form.phone) {
    uni.showToast({ title: '请填写联系电话', icon: 'none' })
    return
  }
  uni.showToast({ title: '任务发布成功！', icon: 'success' })
  setTimeout(() => { uni.navigateBack() }, 1500)
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

.submit-btn { position: fixed; bottom: 40rpx; left: 24rpx; right: 24rpx; background: linear-gradient(135deg, #FF9800, #F57C00); border-radius: 48rpx; padding: 28rpx; text-align: center; box-shadow: 0 8rpx 24rpx rgba(255,152,0,0.4); }
.submit-btn text { color: #fff; font-size: 32rpx; font-weight: bold; }
</style>
