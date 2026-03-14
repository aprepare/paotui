<template>
  <view class="publish-page">
    <view class="page-header">
      <text class="page-title">📮 发布邮政取件条幅</text>
      <text class="page-desc">发布后需等待管理员审核通过</text>
    </view>

    <view class="form-section">
      <view class="form-item">
        <text class="form-label">条幅标题</text>
        <input class="form-input" v-model="form.title" placeholder="寄邮政快递免费上组团门口取件" />
      </view>
      <view class="form-item">
        <text class="form-label">详细内容（选填）</text>
        <textarea class="form-textarea" v-model="form.content" placeholder="可填写取件时间、服务范围等信息" :maxlength="200" />
      </view>
      <view class="form-item">
        <text class="form-label">微信号 <text class="required">*</text></text>
        <input class="form-input" v-model="form.wechat" placeholder="请填写您的微信号" />
      </view>
    </view>

    <view class="tip-card">
      <text class="tip-icon">💡</text>
      <text class="tip-text">条幅审核通过后将展示在首页，其他同学可以通过条幅联系您寄快递</text>
    </view>

    <view class="submit-btn" :class="{disabled: submitting}" @click="onSubmit">
      <text class="submit-text">{{ submitting ? '提交中...' : '提交发布' }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { callCloud, checkLogin } from '@/utils/cloud'

const form = reactive({
  title: '寄邮政快递免费上组团门口取件',
  content: '',
  wechat: ''
})
const submitting = ref(false)

const onSubmit = async () => {
  if (!checkLogin()) return
  if (!form.wechat.trim()) {
    uni.showToast({ title: '请填写微信号', icon: 'none' })
    return
  }
  if (submitting.value) return
  submitting.value = true
  try {
    const res = await callCloud('home', 'publishExpressBanner', {
      title: form.title || '寄邮政快递免费上组团门口取件',
      content: form.content,
      wechat: form.wechat.trim()
    })
    if (res.code === 0) {
      uni.showModal({
        title: '发布成功',
        content: '条幅已提交，等待管理员审核通过后将展示在首页',
        showCancel: false,
        success: () => {
          uni.navigateBack()
        }
      })
    }
  } catch (e) {
    uni.showToast({ title: '提交失败，请重试', icon: 'none' })
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.publish-page { background: #F0F2F5; min-height: 100vh; padding-bottom: 60rpx; }

.page-header { background: linear-gradient(135deg, #43A047, #2E7D32); padding: 40rpx 32rpx; }
.page-title { font-size: 36rpx; font-weight: 800; color: #fff; display: block; }
.page-desc { font-size: 24rpx; color: rgba(255,255,255,0.8); display: block; margin-top: 8rpx; }

.form-section { margin: 24rpx; background: #fff; border-radius: 20rpx; padding: 8rpx 28rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.form-item { padding: 24rpx 0; border-bottom: 1rpx solid #F0F2F5; }
.form-item:last-child { border-bottom: none; }
.form-label { font-size: 28rpx; font-weight: 600; color: #1A1A2E; display: block; margin-bottom: 16rpx; }
.required { color: #E53E3E; }
.form-input { width: 100%; height: 80rpx; background: #F7FAFC; border-radius: 12rpx; padding: 0 20rpx; font-size: 28rpx; color: #2D3748; box-sizing: border-box; }
.form-textarea { width: 100%; height: 160rpx; background: #F7FAFC; border-radius: 12rpx; padding: 20rpx; font-size: 28rpx; color: #2D3748; box-sizing: border-box; }

.tip-card { margin: 24rpx; background: #FFF8E1; border-radius: 16rpx; padding: 24rpx; display: flex; align-items: flex-start; }
.tip-icon { font-size: 32rpx; margin-right: 12rpx; flex-shrink: 0; }
.tip-text { font-size: 24rpx; color: #F57C00; line-height: 36rpx; }

.submit-btn { margin: 40rpx 24rpx; background: linear-gradient(135deg, #43A047, #2E7D32); padding: 28rpx; border-radius: 48rpx; text-align: center; box-shadow: 0 8rpx 24rpx rgba(67,160,71,0.3); }
.submit-btn:active { transform: scale(0.98); }
.submit-btn.disabled { opacity: 0.6; }
.submit-text { font-size: 30rpx; color: #fff; font-weight: 700; }
</style>
