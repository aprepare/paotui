<template>
  <view class="checkin-page">
    <!-- 打卡统计 -->
    <view class="stats-card">
      <view class="stats-top">
        <text class="stats-title">📅 学习打卡</text>
        <text class="stats-streak">🔥 连续 {{ streak }} 天</text>
      </view>
      <view class="stats-row">
        <view class="stat-item">
          <text class="stat-num">{{ totalDays }}</text>
          <text class="stat-label">累计打卡</text>
        </view>
        <view class="stat-item">
          <text class="stat-num">{{ todayHours }}</text>
          <text class="stat-label">今日学习(h)</text>
        </view>
        <view class="stat-item">
          <text class="stat-num">{{ weekHours }}</text>
          <text class="stat-label">本周学习(h)</text>
        </view>
      </view>
    </view>

    <!-- 今日打卡 -->
    <view class="today-card">
      <text class="card-title">今日打卡</text>
      <view class="subject-list">
        <view v-for="(sub, i) in subjects" :key="i" class="subject-item" :class="{done: sub.done}" @click="toggleSubject(i)">
          <text class="subject-check">{{ sub.done ? '✅' : '⬜' }}</text>
          <text class="subject-name">{{ sub.name }}</text>
          <text class="subject-time" v-if="sub.done">{{ sub.hours }}h</text>
        </view>
      </view>
      <view class="time-picker" v-if="editingIndex >= 0">
        <text class="tp-label">学习时长：</text>
        <view class="tp-btns">
          <view v-for="h in [0.5, 1, 1.5, 2, 3, 4]" :key="h" class="tp-btn" @click="setHours(h)">
            <text>{{ h }}h</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 打卡按钮 -->
    <view class="checkin-btn" :class="{checked: todayChecked}" @click="doCheckin">
      <text class="btn-emoji">{{ todayChecked ? '🎉' : '✅' }}</text>
      <text class="btn-text">{{ todayChecked ? '今日已打卡' : '立即打卡' }}</text>
    </view>

    <!-- 打卡日历 -->
    <view class="calendar-card">
      <text class="card-title">本月打卡记录</text>
      <view class="calendar-grid">
        <view v-for="d in calendarDays" :key="d.day" class="cal-day" :class="{active: d.checked, today: d.isToday}">
          <text>{{ d.day }}</text>
        </view>
      </view>
    </view>

    <!-- 打卡心得 -->
    <view class="note-card">
      <text class="card-title">📝 今日心得</text>
      <textarea class="note-input" placeholder="记录今天的学习感悟..." v-model="note" maxlength="200" />
      <view class="note-save" @click="saveNote" v-if="note">
        <text>保存</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'

const streak = ref(0)
const totalDays = ref(0)
const todayChecked = ref(false)
const note = ref('')
const editingIndex = ref(-1)

const subjects = ref([
  { name: '英语', done: false, hours: 0 },
  { name: '数学', done: false, hours: 0 },
  { name: '政治', done: false, hours: 0 },
  { name: '专业课', done: false, hours: 0 }
])

const todayHours = computed(() => {
  return subjects.value.reduce((sum, s) => sum + (s.done ? s.hours : 0), 0)
})
const weekHours = ref(0)

const toggleSubject = (i) => {
  if (subjects.value[i].done) {
    subjects.value[i].done = false
    subjects.value[i].hours = 0
    editingIndex.value = -1
  } else {
    editingIndex.value = i
  }
}

const setHours = (h) => {
  if (editingIndex.value >= 0) {
    subjects.value[editingIndex.value].done = true
    subjects.value[editingIndex.value].hours = h
    editingIndex.value = -1
  }
}

const calendarDays = computed(() => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = now.getDate()
  const checkedDays = getCheckedDays()
  const days = []
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ day: d, checked: checkedDays.includes(d), isToday: d === today })
  }
  return days
})

const getCheckedDays = () => {
  const data = uni.getStorageSync('checkin_days') || []
  const now = new Date()
  const prefix = now.getFullYear() + '-' + (now.getMonth() + 1) + '-'
  return data.filter(d => d.startsWith(prefix)).map(d => parseInt(d.split('-')[2]))
}

const doCheckin = () => {
  if (todayChecked.value) return
  const hasDone = subjects.value.some(s => s.done)
  if (!hasDone) {
    uni.showToast({ title: '请先选择今日学习科目', icon: 'none' }); return
  }
  const now = new Date()
  const key = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate()
  let days = uni.getStorageSync('checkin_days') || []
  if (!days.includes(key)) days.push(key)
  uni.setStorageSync('checkin_days', days)
  todayChecked.value = true
  totalDays.value = days.length
  calcStreak(days)
  uni.showToast({ title: '打卡成功 🎉', icon: 'success' })
}

const calcStreak = (days) => {
  const sorted = days.map(d => new Date(d)).sort((a, b) => b - a)
  let count = 1
  for (let i = 1; i < sorted.length; i++) {
    const diff = (sorted[i - 1] - sorted[i]) / 86400000
    if (diff === 1) count++
    else break
  }
  streak.value = count
}

const saveNote = () => {
  const now = new Date()
  const key = 'note_' + now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate()
  uni.setStorageSync(key, note.value)
  uni.showToast({ title: '已保存', icon: 'success' })
}

onShow(() => {
  const days = uni.getStorageSync('checkin_days') || []
  totalDays.value = days.length
  const now = new Date()
  const todayKey = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate()
  todayChecked.value = days.includes(todayKey)
  calcStreak(days)
  const noteKey = 'note_' + todayKey
  note.value = uni.getStorageSync(noteKey) || ''
  // 计算本周学习时长（简化：用累计天数*2估算）
  weekHours.value = Math.min(days.filter(d => {
    const dd = new Date(d)
    const diff = (now - dd) / 86400000
    return diff < 7
  }).length * 2, 28)
})
</script>

<style scoped>
.checkin-page { background: #F0F2F5; min-height: 100vh; padding: 20rpx 24rpx 160rpx; }
.stats-card { background: linear-gradient(135deg, #43A047, #2E7D32); border-radius: 20rpx; padding: 32rpx; color: #fff; box-shadow: 0 8rpx 24rpx rgba(67,160,71,0.3); margin-bottom: 20rpx; }
.stats-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24rpx; }
.stats-title { font-size: 32rpx; font-weight: 800; }
.stats-streak { font-size: 26rpx; background: rgba(255,255,255,0.2); padding: 8rpx 20rpx; border-radius: 20rpx; }
.stats-row { display: flex; justify-content: space-around; }
.stat-item { text-align: center; }
.stat-num { font-size: 44rpx; font-weight: 800; display: block; }
.stat-label { font-size: 22rpx; opacity: 0.8; display: block; margin-top: 4rpx; }
.today-card { background: #fff; border-radius: 20rpx; padding: 28rpx; margin-bottom: 20rpx; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.06); }
.card-title { font-size: 28rpx; font-weight: 700; color: #333; display: block; margin-bottom: 20rpx; }
.subject-list { display: flex; flex-direction: column; gap: 16rpx; }
.subject-item { display: flex; align-items: center; padding: 20rpx; background: #F7FAFC; border-radius: 12rpx; }
.subject-item.done { background: #F0FFF4; }
.subject-check { font-size: 28rpx; margin-right: 16rpx; }
.subject-name { flex: 1; font-size: 28rpx; color: #2D3748; font-weight: 600; }
.subject-time { font-size: 26rpx; color: #38A169; font-weight: 700; }
.time-picker { margin-top: 20rpx; padding: 20rpx; background: #FFFFF0; border-radius: 12rpx; }
.tp-label { font-size: 26rpx; color: #718096; display: block; margin-bottom: 12rpx; }
.tp-btns { display: flex; gap: 12rpx; flex-wrap: wrap; }
.tp-btn { padding: 12rpx 28rpx; background: #fff; border: 2rpx solid #E2E8F0; border-radius: 24rpx; }
.tp-btn:active { background: #EBF8FF; border-color: #2B6CB0; }
.tp-btn text { font-size: 26rpx; color: #4A5568; }
.checkin-btn { margin: 0 auto 20rpx; width: 400rpx; padding: 28rpx; border-radius: 48rpx; text-align: center; background: linear-gradient(135deg, #48BB78, #38A169); box-shadow: 0 8rpx 24rpx rgba(56,161,105,0.4); display: flex; align-items: center; justify-content: center; gap: 12rpx; }
.checkin-btn.checked { background: linear-gradient(135deg, #A0AEC0, #718096); box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1); }
.btn-emoji { font-size: 36rpx; }
.btn-text { font-size: 32rpx; color: #fff; font-weight: 700; }
.calendar-card { background: #fff; border-radius: 20rpx; padding: 28rpx; margin-bottom: 20rpx; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.06); }
.calendar-grid { display: flex; flex-wrap: wrap; gap: 8rpx; }
.cal-day { width: 86rpx; height: 86rpx; display: flex; align-items: center; justify-content: center; border-radius: 12rpx; background: #F7FAFC; }
.cal-day.active { background: #C6F6D5; }
.cal-day.today { border: 3rpx solid #38A169; }
.cal-day text { font-size: 26rpx; color: #4A5568; font-weight: 600; }
.cal-day.active text { color: #276749; font-weight: 700; }
.note-card { background: #fff; border-radius: 20rpx; padding: 28rpx; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.06); }
.note-input { width: 100%; height: 160rpx; font-size: 28rpx; background: #F7FAFC; border-radius: 12rpx; padding: 16rpx; }
.note-save { margin-top: 16rpx; text-align: center; padding: 16rpx; background: linear-gradient(135deg, #4299E1, #2B6CB0); border-radius: 28rpx; }
.note-save text { color: #fff; font-size: 28rpx; font-weight: 600; }
</style>
