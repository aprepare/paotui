<template>
  <view class="schedule-page">
    <view class="week-header">
      <view v-for="(d, i) in weekDays" :key="i" class="week-day" :class="{today: i === todayIndex}">
        <text class="day-name">{{ d.name }}</text>
        <text class="day-date">{{ d.date }}</text>
      </view>
    </view>

    <view class="time-grid">
      <view v-for="slot in timeSlots" :key="slot.label" class="time-row">
        <view class="time-label">
          <text class="slot-name">{{ slot.label }}</text>
          <text class="slot-time">{{ slot.time }}</text>
        </view>
        <view class="slot-cells">
          <view v-for="(d, i) in weekDays" :key="i" class="slot-cell" :class="{today: i === todayIndex}">
            <view v-if="getCourse(i, slot.index)" class="course-block" :style="{background: getCourse(i, slot.index).color}">
              <text class="course-name">{{ getCourse(i, slot.index).name }}</text>
              <text class="course-room">{{ getCourse(i, slot.index).room }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view class="action-row">
      <view class="import-btn" @click="importExcel">
        <text>📥 导入课程表</text>
      </view>
      <view class="clear-btn" @click="clearSchedule">
        <text>🗑️ 清空</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'

const colorPool = ['linear-gradient(135deg,#63B3ED,#2B6CB0)', 'linear-gradient(135deg,#68D391,#38A169)', 'linear-gradient(135deg,#F6AD55,#DD6B20)', 'linear-gradient(135deg,#F687B3,#D53F8C)', 'linear-gradient(135deg,#B794F4,#805AD5)', 'linear-gradient(135deg,#4FD1C5,#319795)', 'linear-gradient(135deg,#FC8181,#E53E3E)', 'linear-gradient(135deg,#FBD38D,#D69E2E)']

const weekDays = computed(() => {
  const now = new Date()
  const day = now.getDay() || 7
  const names = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  const result = []
  for (let i = 1; i <= 7; i++) {
    const d = new Date(now)
    d.setDate(now.getDate() - day + i)
    result.push({ name: names[i - 1], date: (d.getMonth() + 1) + '/' + d.getDate() })
  }
  return result
})

const todayIndex = computed(() => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1 })

const timeSlots = ref([
  { label: '第1-2节', time: '08:00-09:40', index: 1 },
  { label: '第3-4节', time: '10:00-11:40', index: 2 },
  { label: '第5-6节', time: '14:00-15:40', index: 3 },
  { label: '第7-8节', time: '16:00-17:40', index: 4 },
  { label: '晚上', time: '19:00-20:40', index: 5 }
])

// courses: { dayIndex(0-6), slotIndex(1-5), name, room, color }
const courses = ref([])

onShow(() => {
  const saved = uni.getStorageSync('my_schedule')
  if (saved && saved.length > 0) {
    courses.value = saved
  } else {
    // 示例数据
    courses.value = [
      { dayIndex: 0, slotIndex: 1, name: '高等数学', room: 'A301', color: colorPool[0] },
      { dayIndex: 0, slotIndex: 3, name: '英语精读', room: 'B205', color: colorPool[1] },
      { dayIndex: 1, slotIndex: 2, name: '线性代数', room: 'A402', color: colorPool[2] },
      { dayIndex: 1, slotIndex: 4, name: '政治理论', room: 'C101', color: colorPool[3] },
      { dayIndex: 2, slotIndex: 1, name: '专业课一', room: 'D302', color: colorPool[4] },
      { dayIndex: 2, slotIndex: 3, name: '高等数学', room: 'A301', color: colorPool[0] },
      { dayIndex: 3, slotIndex: 2, name: '英语写作', room: 'B206', color: colorPool[5] },
      { dayIndex: 3, slotIndex: 5, name: '专业课二', room: 'D401', color: colorPool[6] },
      { dayIndex: 4, slotIndex: 1, name: '线性代数', room: 'A402', color: colorPool[2] },
      { dayIndex: 4, slotIndex: 3, name: '政治理论', room: 'C101', color: colorPool[3] }
    ]
  }
})

const getCourse = (dayIndex, slotIndex) => {
  return courses.value.find(c => c.dayIndex === dayIndex && c.slotIndex === slotIndex)
}

const importExcel = () => {
  uni.chooseMessageFile({
    count: 1,
    type: 'file',
    extension: ['.xlsx', '.xls', '.csv'],
    success: (res) => {
      const path = res.tempFiles[0].path
      uni.showModal({
        title: '导入课程表',
        content: '已选择文件：' + res.tempFiles[0].name + '\n\n请将Excel文件发给开发者处理导入，目前支持手动录入。',
        showCancel: false
      })
      // TODO: 解析Excel文件，等用户提供格式后实现
    },
    fail: () => {
      uni.showToast({ title: '请从聊天中选择Excel文件', icon: 'none' })
    }
  })
}

const clearSchedule = () => {
  uni.showModal({
    title: '确认清空',
    content: '确定要清空所有课程吗？',
    success: (res) => {
      if (res.confirm) {
        courses.value = []
        uni.removeStorageSync('my_schedule')
        uni.showToast({ title: '已清空', icon: 'success' })
      }
    }
  })
}
</script>

<style scoped>
.schedule-page { background: #F0F2F5; min-height: 100vh; padding-bottom: 40rpx; }
.week-header { display: flex; background: #fff; padding: 16rpx 8rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06); }
.week-day { flex: 1; text-align: center; padding: 8rpx 0; }
.week-day.today { background: #EBF8FF; border-radius: 12rpx; }
.day-name { font-size: 24rpx; color: #718096; font-weight: 600; display: block; }
.day-date { font-size: 20rpx; color: #A0AEC0; display: block; margin-top: 4rpx; }
.week-day.today .day-name { color: #2B6CB0; }
.time-grid { padding: 16rpx 8rpx; }
.time-row { display: flex; margin-bottom: 12rpx; }
.time-label { width: 110rpx; flex-shrink: 0; padding: 8rpx 0; }
.slot-name { font-size: 22rpx; color: #4A5568; font-weight: 600; display: block; }
.slot-time { font-size: 18rpx; color: #A0AEC0; display: block; margin-top: 4rpx; }
.slot-cells { flex: 1; display: flex; gap: 6rpx; }
.slot-cell { flex: 1; min-height: 120rpx; background: #fff; border-radius: 10rpx; }
.slot-cell.today { background: #F7FAFC; }
.course-block { height: 100%; border-radius: 10rpx; padding: 10rpx 8rpx; display: flex; flex-direction: column; justify-content: center; align-items: center; }
.course-name { font-size: 20rpx; color: #fff; font-weight: 700; text-align: center; display: block; }
.course-room { font-size: 18rpx; color: rgba(255,255,255,0.8); margin-top: 4rpx; display: block; }
.action-row { display: flex; gap: 16rpx; padding: 20rpx 24rpx; }
.import-btn { flex: 1; padding: 24rpx; background: linear-gradient(135deg, #48BB78, #38A169); border-radius: 28rpx; text-align: center; box-shadow: 0 4rpx 12rpx rgba(56,161,105,0.3); }
.import-btn text { color: #fff; font-size: 28rpx; font-weight: 600; }
.clear-btn { padding: 24rpx 32rpx; background: #fff; border-radius: 28rpx; border: 2rpx solid #E2E8F0; }
.clear-btn text { font-size: 28rpx; color: #718096; }
</style>
