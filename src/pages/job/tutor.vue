<template>
  <view class="tutor-page">
    <!-- 顶部 Tab -->
    <view class="tab-bar">
      <view class="tab-item" :class="{active: activeTab === 'market'}" @click="activeTab = 'market'">
        <text class="tab-text">家教信息</text>
        <view class="tab-line" v-if="activeTab === 'market'"></view>
      </view>
      <view class="tab-item" :class="{active: activeTab === 'demand'}" @click="activeTab = 'demand'">
        <text class="tab-text">家长需求</text>
        <view class="tab-line" v-if="activeTab === 'demand'"></view>
      </view>
    </view>

    <!-- 家教市场 -->
    <view v-if="activeTab === 'market'" class="tab-content">
      <scroll-view scroll-x class="filter-bar">
        <view class="filter-inner">
          <view v-for="f in filters" :key="f" class="filter-chip" :class="{active: marketFilter === f}" @click="marketFilter = f">
            <text>{{ f }}</text>
          </view>
        </view>
      </scroll-view>

      <view v-for="tutor in filteredMarket" :key="tutor.id" class="tutor-card" @click="onTutorTap(tutor)">
        <view class="tutor-avatar-wrap" :style="{background: tutor.avatarBg}">
          <text class="tutor-avatar-emoji">{{ tutor.avatar }}</text>
        </view>
        <view class="tutor-info">
          <view class="tutor-name-row">
            <text class="tutor-name">{{ tutor.name }}</text>
            <view class="tutor-verify" v-if="tutor.verified">
              <text>✅ 已认证</text>
            </view>
          </view>
          <text class="tutor-school">{{ tutor.school }} · {{ tutor.major }}</text>
          <view class="tutor-tags">
            <view v-for="tag in tutor.subjects" :key="tag" class="subject-tag">
              <text>{{ tag }}</text>
            </view>
          </view>
          <view class="tutor-meta">
            <text class="tutor-mode">{{ tutor.mode }}</text>
            <text class="tutor-area">📍 {{ tutor.area }}</text>
          </view>
          <view class="tutor-bottom">
            <text class="tutor-price">¥{{ tutor.price }}/小时</text>
            <text class="tutor-exp">{{ tutor.experience }}</text>
          </view>
        </view>
      </view>

      <view v-if="filteredMarket.length === 0" class="empty-state">
        <text class="empty-emoji">📚</text>
        <text class="empty-text">暂无该科目的家教</text>
      </view>

      <view class="fab-btn" @click="onPostTutor">
        <text class="fab-text">+ 我要当家教</text>
      </view>
    </view>

    <!-- 家长需求 -->
    <view v-if="activeTab === 'demand'" class="tab-content">
      <scroll-view scroll-x class="filter-bar">
        <view class="filter-inner">
          <view v-for="f in filters" :key="f" class="filter-chip" :class="{active: demandFilter === f}" @click="demandFilter = f">
            <text>{{ f }}</text>
          </view>
        </view>
      </scroll-view>

      <view v-for="item in filteredDemand" :key="item.id" class="demand-card" @click="onDemandTap(item)">
        <view class="demand-header">
          <view class="demand-subject-tag" :style="{background: item.tagBg}">
            <text>{{ item.subject }}</text>
          </view>
          <text class="demand-time">{{ item.postTime }}</text>
        </view>
        <text class="demand-title">{{ item.title }}</text>
        <text class="demand-desc">{{ item.desc }}</text>
        <view class="demand-info-grid">
          <view class="demand-info-item">
            <text class="demand-label">学生年级</text>
            <text class="demand-value">{{ item.grade }}</text>
          </view>
          <view class="demand-info-item">
            <text class="demand-label">上课地点</text>
            <text class="demand-value">📍 {{ item.location }}</text>
          </view>
          <view class="demand-info-item">
            <text class="demand-label">上课时间</text>
            <text class="demand-value">{{ item.schedule }}</text>
          </view>
          <view class="demand-info-item">
            <text class="demand-label">薪资预算</text>
            <text class="demand-value price">¥{{ item.budget }}/小时</text>
          </view>
        </view>
        <view class="demand-footer">
          <view class="demand-parent">
            <text>👤 家长（应聘后可见）</text>
          </view>
          <view class="demand-apply-btn" @click.stop="onApplyDemand(item)">
            <text>我要应聘</text>
          </view>
        </view>
      </view>

      <view v-if="filteredDemand.length === 0" class="empty-state">
        <text class="empty-emoji">🔍</text>
        <text class="empty-text">暂无该科目的家长需求</text>
      </view>

      <view class="fab-btn" @click="onPostDemand">
        <text class="fab-text">+ 发布需求</text>
      </view>
    </view>

    <!-- 详情弹出层 -->
    <view class="popup-mask" v-if="showDetail" @click="showDetail = false">
      <view class="popup-body" @click.stop>
        <view class="popup-close" @click="showDetail = false"><text>✕</text></view>

        <!-- 家长需求详情 -->
        <view v-if="detailType === 'demand' && detailData" class="popup-content">
          <view class="popup-tag" :style="{background: detailData.tagBg}"><text>{{ detailData.subject }}</text></view>
          <text class="popup-title">{{ detailData.title }}</text>
          <text class="popup-desc">{{ detailData.desc }}</text>
          <view class="popup-grid">
            <view class="popup-field">
              <text class="popup-label">👨‍🎓 学生年级</text>
              <text class="popup-val">{{ detailData.grade }}</text>
            </view>
            <view class="popup-field">
              <text class="popup-label">📍 上课地点</text>
              <text class="popup-val">{{ detailData.location }}</text>
            </view>
            <view class="popup-field">
              <text class="popup-label">🕐 上课时间</text>
              <text class="popup-val">{{ detailData.schedule }}</text>
            </view>
            <view class="popup-field">
              <text class="popup-label">💰 薪资预算</text>
              <text class="popup-val price">¥{{ detailData.budget }}/小时</text>
            </view>
          </view>
          <!-- 联系方式 - 需付费查看 -->
          <view class="popup-contact-section">
            <text class="popup-contact-title">📞 联系方式</text>
            <view v-if="contactPaid" class="popup-contact-list">
              <view class="popup-contact-item" v-if="paidContact.phone">
                <text class="popup-contact-icon">📱</text>
                <text class="popup-contact-label">手机</text>
                <text class="popup-contact-val" @click.stop="onCopyContact(paidContact.phone)">{{ paidContact.phone }}</text>
              </view>
              <view class="popup-contact-item" v-if="paidContact.wechat">
                <text class="popup-contact-icon">💬</text>
                <text class="popup-contact-label">微信</text>
                <text class="popup-contact-val" @click.stop="onCopyContact(paidContact.wechat)">{{ paidContact.wechat }}</text>
              </view>
              <view class="popup-contact-item" v-if="paidContact.qq">
                <text class="popup-contact-icon">🐧</text>
                <text class="popup-contact-label">QQ</text>
                <text class="popup-contact-val" @click.stop="onCopyContact(paidContact.qq)">{{ paidContact.qq }}</text>
              </view>
              <view class="popup-contact-item" v-if="paidContact.parentName">
                <text class="popup-contact-icon">👤</text>
                <text class="popup-contact-label">家长</text>
                <text class="popup-contact-val">{{ paidContact.parentName }}</text>
              </view>
              <view class="contact-ta-btn" @click.stop="onApplyDemand(detailData)">
                <text>联系TA</text>
              </view>
            </view>
            <view v-else class="pay-lock-box" @click.stop="onPayToView(detailData, 'demand')">
              <text class="pay-lock-icon">🔒</text>
              <text class="pay-lock-text">{{ tutorViewFee > 0 ? '支付 ¥' + tutorViewFee + ' 查看联系方式' : '免费查看联系方式' }}</text>
            </view>
          </view>
          <view class="popup-parent">
            <text>👤 发布者：{{ contactPaid && paidContact.parentName ? paidContact.parentName : '付费后可见' }}</text>
            <text class="popup-time">{{ detailData.postTime }}</text>
          </view>
        </view>

        <!-- 家教自荐详情 -->
        <view v-if="detailType === 'tutor' && detailData" class="popup-content">
          <view class="popup-tutor-top">
            <view class="popup-avatar" :style="{background: detailData.avatarBg}">
              <text class="popup-avatar-emoji">{{ detailData.avatar }}</text>
            </view>
            <view class="popup-tutor-info">
              <view class="popup-tutor-name-row">
                <text class="popup-tutor-name">{{ detailData.name }}</text>
                <view class="popup-verify" v-if="detailData.verified"><text>✅ 已认证</text></view>
              </view>
              <text class="popup-school">{{ detailData.school }} · {{ detailData.major }}</text>
            </view>
          </view>
          <view class="popup-tags">
            <view v-for="tag in detailData.subjects" :key="tag" class="popup-subject-tag"><text>{{ tag }}</text></view>
          </view>
          <view class="popup-grid">
            <view class="popup-field">
              <text class="popup-label">📋 授课模式</text>
              <text class="popup-val">{{ detailData.mode }}</text>
            </view>
            <view class="popup-field">
              <text class="popup-label">📍 授课区域</text>
              <text class="popup-val">{{ detailData.area }}</text>
            </view>
            <view class="popup-field">
              <text class="popup-label">💰 课时费用</text>
              <text class="popup-val price">¥{{ detailData.price }}/小时</text>
            </view>
            <view class="popup-field">
              <text class="popup-label">⏳ 教学经验</text>
              <text class="popup-val">{{ detailData.experience }}</text>
            </view>
          </view>
          <!-- 联系方式 - 需付费查看 -->
          <view class="popup-contact-section">
            <text class="popup-contact-title">📞 联系方式</text>
            <view v-if="contactPaid" class="popup-contact-list">
              <view class="popup-contact-item" v-if="paidContact.phone">
                <text class="popup-contact-icon">📱</text>
                <text class="popup-contact-label">手机</text>
                <text class="popup-contact-val" @click.stop="onCopyContact(paidContact.phone)">{{ paidContact.phone }}</text>
              </view>
              <view class="popup-contact-item" v-if="paidContact.wechat">
                <text class="popup-contact-icon">💬</text>
                <text class="popup-contact-label">微信</text>
                <text class="popup-contact-val" @click.stop="onCopyContact(paidContact.wechat)">{{ paidContact.wechat }}</text>
              </view>
              <view class="popup-contact-item" v-if="paidContact.qq">
                <text class="popup-contact-icon">🐧</text>
                <text class="popup-contact-label">QQ</text>
                <text class="popup-contact-val" @click.stop="onCopyContact(paidContact.qq)">{{ paidContact.qq }}</text>
              </view>
              <view class="contact-ta-btn" @click.stop="onContactTutor(detailData)">
                <text>联系TA</text>
              </view>
            </view>
            <view v-else class="pay-lock-box" @click.stop="onPayToView(detailData, 'tutor')">
              <text class="pay-lock-icon">🔒</text>
              <text class="pay-lock-text">{{ tutorViewFee > 0 ? '支付 ¥' + tutorViewFee + ' 查看联系方式' : '免费查看联系方式' }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 付费确认弹窗 -->
    <view class="popup-mask" v-if="showPayPopup" @click="showPayPopup = false">
      <view class="pay-popup" @click.stop>
        <view class="popup-close" @click="showPayPopup = false"><text>✕</text></view>
        <view class="pay-popup-content">
          <text class="pay-popup-icon">🔐</text>
          <text class="pay-popup-title">查看联系方式</text>
          <text class="pay-popup-desc">支付后即可查看{{ payTarget === 'demand' ? '家长' : '家教' }}的完整联系方式（手机/微信/QQ）</text>
          <view class="pay-popup-price">
            <text class="pay-popup-currency">¥</text>
            <text class="pay-popup-amount">{{ tutorViewFee }}</text>
          </view>
          <text class="pay-popup-note">同一信息仅需支付一次，之后可重复查看</text>
          <view class="pay-popup-btn" @click="onConfirmPay">
            <text>立即支付 ¥{{ tutorViewFee }}</text>
          </view>
          <view class="pay-popup-cancel" @click="showPayPopup = false">
            <text>取消</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { callCloud, checkLogin } from '@/utils/cloud.js'
import { getPriceConfig } from '@/utils/priceConfig'

const tutorViewFee = ref(0.01)
getPriceConfig().then(cfg => { tutorViewFee.value = cfg.tutorViewFee })

const activeTab = ref('market')
const filters = ['全部', '数学', '英语', '物理', '化学', '语文', '编程']
const marketFilter = ref('全部')
const demandFilter = ref('全部')

const tutors = ref([
  { id: 1, name: '张同学', avatar: '👨‍🎓', avatarBg: 'linear-gradient(135deg, #667eea, #764ba2)', school: '北京大学', major: '数学系', subjects: ['数学', '物理'], mode: '线上+线下', area: '海淀区', price: 150, experience: '3年教龄', verified: true },
  { id: 2, name: '李同学', avatar: '👩‍🎓', avatarBg: 'linear-gradient(135deg, #f093fb, #f5576c)', school: '清华大学', major: '英语系', subjects: ['英语'], mode: '线上', area: '朝阳区', price: 120, experience: '2年教龄', verified: true },
  { id: 3, name: '王同学', avatar: '👨‍💻', avatarBg: 'linear-gradient(135deg, #4facfe, #00f2fe)', school: '北航', major: '计算机系', subjects: ['编程', '数学'], mode: '线下', area: '昌平区', price: 180, experience: '4年教龄', verified: false },
  { id: 4, name: '赵同学', avatar: '👩‍🔬', avatarBg: 'linear-gradient(135deg, #a18cd1, #fbc2eb)', school: '北师大', major: '化学系', subjects: ['化学', '物理'], mode: '线上+线下', area: '西城区', price: 130, experience: '1年教龄', verified: true },
  { id: 5, name: '刘同学', avatar: '👨‍🏫', avatarBg: 'linear-gradient(135deg, #ffecd2, #fcb69f)', school: '人民大学', major: '中文系', subjects: ['语文'], mode: '线下', area: '海淀区', price: 100, experience: '2年教龄', verified: false },
  { id: 6, name: '陈同学', avatar: '👩‍💻', avatarBg: 'linear-gradient(135deg, #89f7fe, #66a6ff)', school: '北邮', major: '软件工程', subjects: ['编程'], mode: '线上', area: '不限', price: 160, experience: '3年教龄', verified: true }
])

const demands = ref([
  { id: 1, subject: '数学', tagBg: 'linear-gradient(135deg, #667eea, #764ba2)', title: '初三数学冲刺辅导', desc: '孩子明年中考，数学基础薄弱，需要系统提升', grade: '初三', location: '海淀区中关村', schedule: '周末 14:00-16:00', budget: 150, parentName: '张妈妈', postTime: '2小时前' },
  { id: 2, subject: '英语', tagBg: 'linear-gradient(135deg, #f093fb, #f5576c)', title: '小学英语启蒙', desc: '希望培养孩子英语兴趣，注重口语和听力', grade: '小学三年级', location: '朝阳区望京', schedule: '周三/周五 18:00-19:30', budget: 120, parentName: '李爸爸', postTime: '5小时前' },
  { id: 3, subject: '物理', tagBg: 'linear-gradient(135deg, #4facfe, #00f2fe)', title: '高一物理同步辅导', desc: '刚上高中物理跟不上进度，需要查漏补缺', grade: '高一', location: '西城区', schedule: '周六 09:00-11:00', budget: 160, parentName: '王妈妈', postTime: '1天前' },
  { id: 4, subject: '编程', tagBg: 'linear-gradient(135deg, #a18cd1, #fbc2eb)', title: 'Python编程入门', desc: '孩子对编程感兴趣，想学Python基础', grade: '初一', location: '线上均可', schedule: '周末 10:00-12:00', budget: 180, parentName: '赵爸爸', postTime: '3小时前' },
  { id: 5, subject: '语文', tagBg: 'linear-gradient(135deg, #ffecd2, #fcb69f)', title: '高考语文作文提升', desc: '作文一直是短板，希望找有经验的老师专项辅导', grade: '高三', location: '海淀区', schedule: '周日 14:00-16:00', budget: 140, parentName: '孙妈妈', postTime: '6小时前' }
])

const filteredMarket = computed(() => {
  if (marketFilter.value === '全部') return tutors.value
  return tutors.value.filter(t => t.subjects.includes(marketFilter.value))
})

const filteredDemand = computed(() => {
  if (demandFilter.value === '全部') return demands.value
  return demands.value.filter(d => d.subject === demandFilter.value)
})

const showDetail = ref(false)
const detailType = ref('')
const detailData = ref(null)

// 付费相关状态
const showPayPopup = ref(false)
const payTarget = ref('')
const payPostData = ref(null)
const contactPaid = ref(false)
const paidContact = ref({ phone: '', wechat: '', qq: '', parentName: '' })
const payActionType = ref('')

const checkPostPayment = async (postId) => {
  if (!postId) return
  contactPaid.value = false
  paidContact.value = { phone: '', wechat: '', qq: '', parentName: '' }
  try {
    var res = await callCloud('tutor', 'checkPayment', { postId })
    if (res && res.code === 0 && res.paid) {
      contactPaid.value = true
      paidContact.value = res.contact || {}
    }
  } catch (e) {}
}

const onTutorTap = (tutor) => {
  detailType.value = 'tutor'
  detailData.value = tutor
  showDetail.value = true
  if (tutor._id) checkPostPayment(tutor._id)
}

const onDemandTap = (item) => {
  detailType.value = 'demand'
  detailData.value = item
  showDetail.value = true
  if (item._id) checkPostPayment(item._id)
}

const onPayToView = (data, type) => {
  if (!checkLogin()) return
  payPostData.value = data
  payTarget.value = type
  payActionType.value = ''
  showPayPopup.value = true
}

const onConfirmPay = async () => {
  if (!checkLogin()) return
  var postId = payPostData.value && (payPostData.value._id || payPostData.value.id)
  if (!postId) {
    uni.showToast({ title: '信息异常', icon: 'none' })
    return
  }
  uni.showLoading({ title: '创建订单中...' })
  try {
    // 如果费用为0，直接获取联系方式
    if (tutorViewFee.value <= 0) {
      var freeRes = await callCloud('tutor', 'createPayOrder', {
        postId: postId,
        orderType: 'view_contact'
      })
      uni.hideLoading()
      if (freeRes && freeRes.code === 0 && freeRes.paid) {
        showPayPopup.value = false
        contactPaid.value = true
        paidContact.value = freeRes.contact || {}
        uni.showToast({ title: '已获取联系方式', icon: 'success' })
        if (payActionType.value === 'contact') doContactTutor(payPostData.value)
        else if (payActionType.value === 'apply') doApplyDemand(payPostData.value)
      } else {
        uni.showToast({ title: freeRes && freeRes.msg || '获取失败', icon: 'none' })
      }
      return
    }
    var res = await callCloud('tutor', 'createPayOrder', {
      postId: postId,
      orderType: 'view_contact'
    })
    uni.hideLoading()
    if (!res || res.code !== 0) {
      uni.showToast({ title: res && res.msg || '创建订单失败', icon: 'none' })
      return
    }
    if (res.paid) {
      showPayPopup.value = false
      contactPaid.value = true
      paidContact.value = res.contact || {}
      uni.showToast({ title: '已获取联系方式', icon: 'success' })
      if (payActionType.value === 'contact') doContactTutor(payPostData.value)
      else if (payActionType.value === 'apply') doApplyDemand(payPostData.value)
      return
    }
    var payment = res.payment
    if (!payment) {
      uni.showToast({ title: '支付参数异常', icon: 'none' })
      return
    }
    wx.requestPayment({
      ...payment,
      success: async () => {
        showPayPopup.value = false
        uni.showLoading({ title: '获取联系方式...' })
        await new Promise(r => setTimeout(r, 1000))
        await checkPostPayment(postId)
        uni.hideLoading()
        uni.showToast({ title: '支付成功', icon: 'success' })
        if (payActionType.value === 'contact') doContactTutor(payPostData.value)
        else if (payActionType.value === 'apply') doApplyDemand(payPostData.value)
      },
      fail: (err) => {
        if (err.errMsg && err.errMsg.indexOf('cancel') > -1) {
          uni.showToast({ title: '已取消支付', icon: 'none' })
        } else {
          uni.showToast({ title: '支付失败', icon: 'none' })
        }
      }
    })
  } catch (e) {
    uni.hideLoading()
    uni.showToast({ title: '支付异常', icon: 'none' })
  }
}

const doContactTutor = async (tutor) => {
  if (tutor._id) {
    uni.showLoading({ title: '发送中...' })
    await callCloud('tutor', 'contact', { postId: tutor._id })
    uni.hideLoading()
  }
  uni.showToast({ title: '已发送联系请求', icon: 'success' })
}

const doApplyDemand = async (item) => {
  if (item._id) {
    uni.showLoading({ title: '提交中...' })
    await callCloud('tutor', 'apply', { postId: item._id })
    uni.hideLoading()
  }
  uni.showToast({ title: '已提交应聘申请', icon: 'success' })
}

const onContactTutor = (tutor) => {
  if (!checkLogin()) return
  if (contactPaid.value) {
    showDetail.value = false
    doContactTutor(tutor)
    return
  }
  payPostData.value = tutor
  payTarget.value = 'tutor'
  payActionType.value = 'contact'
  showPayPopup.value = true
}

const onApplyDemand = (item) => {
  if (!checkLogin()) return
  if (contactPaid.value) {
    showDetail.value = false
    uni.showModal({
      title: '确认应聘',
      content: '确定要应聘「' + item.title + '」吗？',
      success: async (res) => {
        if (res.confirm) doApplyDemand(item)
      }
    })
    return
  }
  payPostData.value = item
  payTarget.value = 'demand'
  payActionType.value = 'apply'
  showPayPopup.value = true
}

const onPostTutor = () => {
  if (!checkLogin()) return
  uni.navigateTo({ url: '/pages/job-sub/tutor-create?type=tutor' })
}

const onPostDemand = () => {
  if (!checkLogin()) return
  uni.navigateTo({ url: '/pages/job-sub/tutor-create?type=demand' })
}

const onCopyContact = (val) => {
  uni.setClipboardData({
    data: val,
    success: () => { uni.showToast({ title: '已复制', icon: 'success' }) }
  })
}
</script>

<style scoped>
.tutor-page { background: #F0F2F5; min-height: 100vh; padding-bottom: 120rpx; }

/* Tab Bar */
.tab-bar { display: flex; background: #fff; padding: 0 60rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); position: sticky; top: 0; z-index: 10; }
.tab-item { flex: 1; text-align: center; padding: 28rpx 0 20rpx; position: relative; }
.tab-text { font-size: 30rpx; color: #718096; font-weight: 500; }
.tab-item.active .tab-text { color: #2B6CB0; font-weight: 700; }
.tab-line { position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 48rpx; height: 6rpx; border-radius: 3rpx; background: linear-gradient(135deg, #4299E1, #2B6CB0); }

/* Filter Bar */
.filter-bar { padding: 20rpx 24rpx 0; white-space: nowrap; }
.filter-inner { display: flex; gap: 16rpx; }
.filter-chip { padding: 12rpx 28rpx; border-radius: 28rpx; background: #fff; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.filter-chip text { font-size: 24rpx; color: #718096; }
.filter-chip.active { background: linear-gradient(135deg, #4299E1, #2B6CB0); }
.filter-chip.active text { color: #fff; font-weight: 600; }

/* Tutor Card */
.tutor-card { margin: 20rpx 24rpx 0; background: #fff; border-radius: 20rpx; padding: 28rpx; display: flex; box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04); }
.tutor-avatar-wrap { width: 96rpx; height: 96rpx; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-right: 24rpx; }
.tutor-avatar-emoji { font-size: 44rpx; }
.tutor-info { flex: 1; min-width: 0; }
.tutor-name-row { display: flex; align-items: center; gap: 12rpx; }
.tutor-name { font-size: 30rpx; font-weight: 700; color: #1A1A2E; }
.tutor-verify text { font-size: 20rpx; color: #38A169; }
.tutor-school { font-size: 24rpx; color: #718096; margin-top: 6rpx; display: block; }
.tutor-tags { display: flex; gap: 10rpx; margin-top: 10rpx; flex-wrap: wrap; }
.subject-tag { padding: 4rpx 16rpx; border-radius: 16rpx; background: #EBF4FF; }
.subject-tag text { font-size: 22rpx; color: #2B6CB0; }
.tutor-meta { display: flex; gap: 20rpx; margin-top: 10rpx; }
.tutor-mode { font-size: 22rpx; color: #A0AEC0; background: #F7FAFC; padding: 4rpx 14rpx; border-radius: 12rpx; }
.tutor-area { font-size: 22rpx; color: #A0AEC0; }
.tutor-bottom { display: flex; justify-content: space-between; align-items: center; margin-top: 12rpx; }
.tutor-price { font-size: 30rpx; color: #E53E3E; font-weight: 800; }
.tutor-exp { font-size: 22rpx; color: #A0AEC0; }

/* Demand Card */
.demand-card { margin: 20rpx 24rpx 0; background: #fff; border-radius: 20rpx; padding: 28rpx; box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04); }
.demand-header { display: flex; justify-content: space-between; align-items: center; }
.demand-subject-tag { padding: 6rpx 20rpx; border-radius: 16rpx; }
.demand-subject-tag text { font-size: 22rpx; color: #fff; font-weight: 600; }
.demand-time { font-size: 22rpx; color: #A0AEC0; }
.demand-title { font-size: 30rpx; font-weight: 700; color: #1A1A2E; margin-top: 16rpx; display: block; }
.demand-desc { font-size: 24rpx; color: #718096; margin-top: 8rpx; display: block; line-height: 1.5; }
.demand-info-grid { display: flex; flex-wrap: wrap; gap: 16rpx; margin-top: 16rpx; }
.demand-info-item { width: 320rpx; }
.demand-label { font-size: 22rpx; color: #A0AEC0; display: block; }
.demand-value { font-size: 24rpx; color: #4A5568; margin-top: 4rpx; display: block; }
.demand-value.price { color: #E53E3E; font-weight: 700; }
.demand-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 20rpx; padding-top: 20rpx; border-top: 1rpx solid #EDF2F7; }
.demand-parent text { font-size: 24rpx; color: #718096; }
.demand-apply-btn { padding: 12rpx 32rpx; border-radius: 28rpx; background: linear-gradient(135deg, #4299E1, #2B6CB0); box-shadow: 0 4rpx 12rpx rgba(43,108,176,0.25); }
.demand-apply-btn text { font-size: 24rpx; color: #fff; font-weight: 700; }

/* Empty State */
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 120rpx 0; }
.empty-emoji { font-size: 80rpx; }
.empty-text { font-size: 28rpx; color: #A0AEC0; margin-top: 20rpx; }

/* FAB */
.fab-btn { position: fixed; bottom: 60rpx; right: 40rpx; padding: 24rpx 40rpx; border-radius: 40rpx; background: linear-gradient(135deg, #4299E1, #2B6CB0); box-shadow: 0 8rpx 24rpx rgba(43,108,176,0.35); z-index: 20; }
.fab-text { font-size: 28rpx; color: #fff; font-weight: 700; }

/* Popup */
.popup-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 100; display: flex; align-items: flex-end; justify-content: center; }
.popup-body { width: 100%; max-height: 85vh; background: #fff; border-radius: 32rpx 32rpx 0 0; padding: 40rpx 32rpx; padding-bottom: calc(40rpx + env(safe-area-inset-bottom)); position: relative; overflow-y: auto; animation: slideUp 0.25s ease-out; }
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
.popup-close { position: absolute; top: 24rpx; right: 28rpx; width: 56rpx; height: 56rpx; border-radius: 50%; background: #F0F2F5; display: flex; align-items: center; justify-content: center; }
.popup-close text { font-size: 28rpx; color: #718096; }
.popup-content { padding-top: 8rpx; }
.popup-tag { display: inline-block; padding: 8rpx 24rpx; border-radius: 20rpx; margin-bottom: 20rpx; }
.popup-tag text { font-size: 24rpx; color: #fff; font-weight: 600; }
.popup-title { font-size: 36rpx; font-weight: 800; color: #1A1A2E; display: block; margin-bottom: 12rpx; }
.popup-desc { font-size: 26rpx; color: #718096; line-height: 1.6; display: block; margin-bottom: 24rpx; }
.popup-grid { display: flex; flex-wrap: wrap; gap: 20rpx; margin-bottom: 24rpx; }
.popup-field { width: calc(50% - 10rpx); background: #F7FAFC; border-radius: 16rpx; padding: 20rpx; }
.popup-label { font-size: 22rpx; color: #A0AEC0; display: block; margin-bottom: 6rpx; }
.popup-val { font-size: 28rpx; color: #2D3748; font-weight: 600; display: block; }
.popup-val.price { color: #E53E3E; font-weight: 800; }
.popup-parent { display: flex; justify-content: space-between; align-items: center; padding: 20rpx 0; border-top: 1rpx solid #EDF2F7; margin-bottom: 20rpx; }
.popup-parent text { font-size: 26rpx; color: #718096; }
.popup-time { font-size: 22rpx; color: #A0AEC0; }
.popup-action { background: linear-gradient(135deg, #4299E1, #2B6CB0); padding: 24rpx; border-radius: 16rpx; text-align: center; box-shadow: 0 8rpx 24rpx rgba(43,108,176,0.25); }
.popup-action text { color: #fff; font-size: 30rpx; font-weight: 700; }
/* Tutor detail in popup */
.popup-tutor-top { display: flex; align-items: center; margin-bottom: 24rpx; }
.popup-avatar { width: 112rpx; height: 112rpx; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 24rpx; flex-shrink: 0; }
.popup-avatar-emoji { font-size: 52rpx; }
.popup-tutor-info { flex: 1; }
.popup-tutor-name-row { display: flex; align-items: center; gap: 12rpx; }
.popup-tutor-name { font-size: 34rpx; font-weight: 800; color: #1A1A2E; }
.popup-verify text { font-size: 22rpx; color: #38A169; }
.popup-school { font-size: 26rpx; color: #718096; margin-top: 8rpx; display: block; }
.popup-tags { display: flex; gap: 12rpx; margin-bottom: 24rpx; flex-wrap: wrap; }
.popup-subject-tag { padding: 8rpx 24rpx; border-radius: 20rpx; background: #EBF4FF; }
.popup-subject-tag text { font-size: 24rpx; color: #2B6CB0; font-weight: 600; }
/* Contact section in popup */
.popup-contact-section { margin-bottom: 24rpx; padding: 20rpx; background: #F7FAFC; border-radius: 16rpx; }
.popup-contact-title { font-size: 26rpx; color: #4A5568; font-weight: 700; display: block; margin-bottom: 16rpx; }
.popup-contact-list { display: flex; flex-direction: column; gap: 14rpx; }
.popup-contact-item { display: flex; align-items: center; }
.popup-contact-icon { font-size: 28rpx; margin-right: 12rpx; }
.popup-contact-label { font-size: 24rpx; color: #A0AEC0; width: 72rpx; }
.popup-contact-val { font-size: 26rpx; color: #2B6CB0; font-weight: 600; }
/* Pay Lock Box */
.pay-lock-box { display: flex; flex-direction: column; align-items: center; padding: 32rpx 20rpx; background: linear-gradient(135deg, #F7FAFC, #EDF2F7); border-radius: 16rpx; cursor: pointer; }
.pay-lock-icon { font-size: 48rpx; margin-bottom: 12rpx; }
.pay-lock-text { font-size: 26rpx; color: #4299E1; font-weight: 700; }
/* Contact TA Button */
.contact-ta-btn { margin-top: 20rpx; background: linear-gradient(135deg, #4299E1, #2B6CB0); padding: 20rpx; border-radius: 14rpx; text-align: center; box-shadow: 0 6rpx 20rpx rgba(43,108,176,0.25); }
.contact-ta-btn text { color: #fff; font-size: 28rpx; font-weight: 700; }
/* Pay Popup */
.pay-popup { width: 85%; background: #fff; border-radius: 28rpx; padding: 48rpx 36rpx 36rpx; position: relative; animation: payPopIn 0.3s ease-out; margin: auto; }
@keyframes payPopIn { from { transform: scale(0.85); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.pay-popup-content { display: flex; flex-direction: column; align-items: center; }
.pay-popup-icon { font-size: 72rpx; margin-bottom: 20rpx; }
.pay-popup-title { font-size: 36rpx; font-weight: 800; color: #1A1A2E; margin-bottom: 16rpx; }
.pay-popup-desc { font-size: 26rpx; color: #718096; text-align: center; line-height: 1.6; margin-bottom: 28rpx; }
.pay-popup-price { display: flex; align-items: baseline; margin-bottom: 16rpx; }
.pay-popup-currency { font-size: 36rpx; color: #E53E3E; font-weight: 700; margin-right: 4rpx; }
.pay-popup-amount { font-size: 64rpx; color: #E53E3E; font-weight: 900; }
.pay-popup-note { font-size: 22rpx; color: #A0AEC0; margin-bottom: 32rpx; }
.pay-popup-btn { width: 100%; background: linear-gradient(135deg, #48BB78, #38A169); padding: 28rpx; border-radius: 16rpx; text-align: center; box-shadow: 0 8rpx 24rpx rgba(56,161,105,0.3); margin-bottom: 16rpx; }
.pay-popup-btn text { color: #fff; font-size: 32rpx; font-weight: 700; }
.pay-popup-cancel { text-align: center; padding: 16rpx; }
.pay-popup-cancel text { font-size: 28rpx; color: #A0AEC0; }
</style>
