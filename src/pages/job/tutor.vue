<template>
  <view class="tutor-page">
    <!-- 顶部 Tab -->
    <view class="tab-bar">
      <view class="tab-item" :class="{active: activeTab === 'market'}" @click="activeTab = 'market'">
        <text class="tab-text">家教市场</text>
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
            <text>👤 {{ item.parentName }}</text>
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
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

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

const onTutorTap = (tutor) => {
  uni.showModal({
    title: tutor.name,
    content: `学校：${tutor.school}\n专业：${tutor.major}\n科目：${tutor.subjects.join('、')}\n模式：${tutor.mode}\n区域：${tutor.area}\n价格：¥${tutor.price}/小时\n经验：${tutor.experience}`,
    showCancel: false
  })
}

const onDemandTap = (item) => {
  uni.showModal({
    title: item.title,
    content: `科目：${item.subject}\n年级：${item.grade}\n地点：${item.location}\n时间：${item.schedule}\n预算：¥${item.budget}/小时\n\n${item.desc}`,
    showCancel: false
  })
}

const onApplyDemand = (item) => {
  uni.showModal({
    title: '确认应聘',
    content: `确定要应聘「${item.title}」吗？`,
    success: (res) => {
      if (res.confirm) {
        uni.showToast({ title: '已提交应聘申请', icon: 'success' })
      }
    }
  })
}

const onPostTutor = () => {
  uni.showToast({ title: '发布家教功能即将上线', icon: 'none' })
}

const onPostDemand = () => {
  uni.showToast({ title: '发布需求功能即将上线', icon: 'none' })
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
</style>
