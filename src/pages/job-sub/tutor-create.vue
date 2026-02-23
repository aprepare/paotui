<template>
  <view class="create-page">
    <view class="top-banner" :style="{background: bannerBg}">
      <text class="banner-emoji">{{ publishType === 'tutor' ? '👨‍🏫' : '📋' }}</text>
      <text class="banner-title">{{ publishType === 'tutor' ? '发布家教信息' : '发布家长需求' }}</text>
    </view>

    <!-- 发布家教 -->
    <view v-if="publishType === 'tutor'" class="form-area">
      <view class="form-card">
        <view class="form-row">
          <text class="form-label">姓名 *</text>
          <input class="form-input" v-model="tutor.name" placeholder="你的称呼" />
        </view>
        <view class="form-row">
          <text class="form-label">学校</text>
          <input class="form-input" v-model="tutor.school" placeholder="就读学校" />
        </view>
        <view class="form-row">
          <text class="form-label">专业</text>
          <input class="form-input" v-model="tutor.major" placeholder="所学专业" />
        </view>
        <view class="form-row">
          <text class="form-label">科目 *</text>
          <view class="chip-row">
            <view v-for="s in subjectOptions" :key="s" class="chip" :class="{active: tutor.subjects.indexOf(s) !== -1}" @click="toggleSubject(s)">
              <text>{{ s }}</text>
            </view>
          </view>
        </view>
        <view class="form-row">
          <text class="form-label">授课模式</text>
          <view class="chip-row">
            <view v-for="m in modeOptions" :key="m" class="chip" :class="{active: tutor.mode === m}" @click="tutor.mode = m">
              <text>{{ m }}</text>
            </view>
          </view>
        </view>
        <view class="form-row">
          <text class="form-label">授课区域</text>
          <input class="form-input" v-model="tutor.area" placeholder="如：海淀区" />
        </view>
        <view class="form-row">
          <text class="form-label">课时费 *</text>
          <input class="form-input" type="digit" v-model="tutor.price" placeholder="元/小时" />
        </view>
        <view class="form-row">
          <text class="form-label">教学经验</text>
          <input class="form-input" v-model="tutor.experience" placeholder="如：3年教龄" />
        </view>
        <view class="form-row">
          <text class="form-label">自我介绍</text>
          <textarea class="form-textarea" v-model="tutor.desc" placeholder="介绍你的教学特点和优势" />
        </view>
        <view class="form-row">
          <text class="form-label">学生证照片 *</text>
          <text class="form-hint">上传学生证用于身份验证</text>
          <view class="upload-area" @click="chooseStudentCard">
            <image v-if="tutor.studentCard" :src="tutor.studentCard" class="upload-preview" mode="aspectFill" />
            <view v-else class="upload-placeholder">
              <text class="upload-icon">🎓</text>
              <text class="upload-text">点击上传学生证</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 发布需求 -->
    <view v-if="publishType === 'demand'" class="form-area">
      <view class="form-card">
        <view class="form-row">
          <text class="form-label">科目 *</text>
          <view class="chip-row">
            <view v-for="s in subjectOptions" :key="s" class="chip" :class="{active: demand.subject === s}" @click="demand.subject = s">
              <text>{{ s }}</text>
            </view>
          </view>
        </view>
        <view class="form-row">
          <text class="form-label">标题 *</text>
          <input class="form-input" v-model="demand.title" placeholder="如：初三数学冲刺辅导" />
        </view>
        <view class="form-row">
          <text class="form-label">详细描述</text>
          <textarea class="form-textarea" v-model="demand.desc" placeholder="描述具体需求" />
        </view>
        <view class="form-row">
          <text class="form-label">学生年级</text>
          <input class="form-input" v-model="demand.grade" placeholder="如：初三" />
        </view>
        <view class="form-row">
          <text class="form-label">上课地点</text>
          <input class="form-input" v-model="demand.location" placeholder="如：海淀区中关村" />
        </view>
        <view class="form-row">
          <text class="form-label">上课时间</text>
          <input class="form-input" v-model="demand.schedule" placeholder="如：周末 14:00-16:00" />
        </view>
        <view class="form-row">
          <text class="form-label">薪资预算 *</text>
          <input class="form-input" type="digit" v-model="demand.budget" placeholder="元/小时" />
        </view>
        <view class="form-row">
          <text class="form-label">联系人</text>
          <input class="form-input" v-model="demand.contactName" placeholder="你的称呼" />
        </view>
        <view class="form-row">
          <text class="form-label">身份证照片 *</text>
          <text class="form-hint">上传身份证用于身份验证</text>
          <view class="upload-area" @click="chooseIdCard">
            <image v-if="demand.idCard" :src="demand.idCard" class="upload-preview" mode="aspectFill" />
            <view v-else class="upload-placeholder">
              <text class="upload-icon">🪪</text>
              <text class="upload-text">点击上传身份证</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view class="submit-bar">
      <view class="submit-btn" @click="onSubmit"><text>发布</text></view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { callCloud, checkLogin, uploadImage } from '@/utils/cloud.js'

const publishType = ref('tutor')
const bannerBg = ref('linear-gradient(135deg, #667eea, #764ba2)')
const subjectOptions = ['数学', '英语', '物理', '化学', '语文', '编程', '其他']
const modeOptions = ['线上', '线下', '线上+线下']

const tutor = reactive({ name: '', school: '', major: '', subjects: [], mode: '线上+线下', area: '', price: '', experience: '', desc: '', studentCard: '' })
const demand = reactive({ subject: '', title: '', desc: '', grade: '', location: '', schedule: '', budget: '', contactName: '', idCard: '' })

const toggleSubject = (s) => {
  var idx = tutor.subjects.indexOf(s)
  if (idx === -1) tutor.subjects.push(s)
  else tutor.subjects.splice(idx, 1)
}

const chooseStudentCard = () => {
  uni.chooseImage({
    count: 1,
    success: (res) => { tutor.studentCard = res.tempFilePaths[0] }
  })
}

const chooseIdCard = () => {
  uni.chooseImage({
    count: 1,
    success: (res) => { demand.idCard = res.tempFilePaths[0] }
  })
}

onLoad((opts) => {
  if (opts && opts.type === 'demand') {
    publishType.value = 'demand'
    bannerBg.value = 'linear-gradient(135deg, #4299E1, #2B6CB0)'
  }
})

const onSubmit = async () => {
  if (!checkLogin()) return
  if (publishType.value === 'tutor') {
    if (!tutor.name || !tutor.subjects.length || !tutor.price) {
      uni.showToast({ title: '请填写姓名、科目和课时费', icon: 'none' }); return
    }
    if (!tutor.studentCard) {
      uni.showToast({ title: '请上传学生证照片', icon: 'none' }); return
    }
    uni.showLoading({ title: '发布中...' })
    var studentCardUrl = ''
    try { studentCardUrl = await uploadImage(tutor.studentCard, 'tutor') } catch (e) {}
    var res = await callCloud('tutor', 'createTutor', {
      name: tutor.name, school: tutor.school, major: tutor.major,
      subjects: tutor.subjects, mode: tutor.mode, area: tutor.area,
      price: tutor.price, experience: tutor.experience, desc: tutor.desc,
      studentCard: studentCardUrl
    })
    uni.hideLoading()
    if (res.code === 0) {
      uni.showToast({ title: '发布成功', icon: 'success' })
      setTimeout(() => { uni.navigateBack() }, 1000)
    } else {
      uni.showToast({ title: res.msg || '发布失败', icon: 'none' })
    }
  } else {
    if (!demand.subject || !demand.title || !demand.budget) {
      uni.showToast({ title: '请填写科目、标题和薪资预算', icon: 'none' }); return
    }
    if (!demand.idCard) {
      uni.showToast({ title: '请上传身份证照片', icon: 'none' }); return
    }
    uni.showLoading({ title: '发布中...' })
    var idCardUrl = ''
    try { idCardUrl = await uploadImage(demand.idCard, 'tutor') } catch (e) {}
    var res2 = await callCloud('tutor', 'createDemand', {
      subject: demand.subject, title: demand.title, desc: demand.desc,
      grade: demand.grade, location: demand.location,
      schedule: demand.schedule, budget: demand.budget,
      contactName: demand.contactName,
      idCard: idCardUrl
    })
    uni.hideLoading()
    if (res2.code === 0) {
      uni.showToast({ title: '发布成功', icon: 'success' })
      setTimeout(() => { uni.navigateBack() }, 1000)
    } else {
      uni.showToast({ title: res2.msg || '发布失败', icon: 'none' })
    }
  }
}
</script>

<style scoped>
.create-page { background: #F0F2F5; min-height: 100vh; padding-bottom: 140rpx; }
.top-banner { padding: 48rpx 32rpx; display: flex; align-items: center; }
.banner-emoji { font-size: 56rpx; margin-right: 20rpx; }
.banner-title { font-size: 36rpx; font-weight: 800; color: #fff; }
.form-area { padding: 20rpx 24rpx 0; }
.form-card { background: #fff; border-radius: 20rpx; padding: 24rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.form-row { margin-bottom: 24rpx; }
.form-label { font-size: 26rpx; color: #4A5568; font-weight: 600; display: block; margin-bottom: 12rpx; }
.form-input { background: #F7FAFC; border-radius: 12rpx; padding: 0 20rpx; font-size: 28rpx; color: #2D3748; width: 100%; box-sizing: border-box; height: 80rpx; line-height: 80rpx; }
.form-textarea { background: #F7FAFC; border-radius: 12rpx; padding: 20rpx; font-size: 28rpx; color: #2D3748; width: 100%; height: 180rpx; box-sizing: border-box; line-height: 1.5; }
.chip-row { display: flex; flex-wrap: wrap; gap: 12rpx; }
.chip { padding: 10rpx 24rpx; border-radius: 24rpx; background: #F7FAFC; border: 2rpx solid #E2E8F0; }
.chip text { font-size: 24rpx; color: #718096; }
.chip.active { background: #EBF4FF; border-color: #2B6CB0; }
.chip.active text { color: #2B6CB0; font-weight: 600; }
.form-hint { font-size: 22rpx; color: #A0AEC0; display: block; margin-bottom: 12rpx; }
.upload-area { width: 100%; height: 320rpx; border-radius: 16rpx; overflow: hidden; background: #F7FAFC; border: 2rpx dashed #CBD5E0; }
.upload-area:active { opacity: 0.8; }
.upload-preview { width: 100%; height: 320rpx; }
.upload-placeholder { width: 100%; height: 320rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.upload-icon { font-size: 64rpx; margin-bottom: 12rpx; }
.upload-text { font-size: 26rpx; color: #A0AEC0; }
.submit-bar { position: fixed; bottom: 0; left: 0; right: 0; padding: 20rpx 24rpx 40rpx; background: #fff; box-shadow: 0 -4rpx 12rpx rgba(0,0,0,0.06); }
.submit-btn { background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 48rpx; padding: 28rpx; text-align: center; }
.submit-btn text { color: #fff; font-size: 32rpx; font-weight: 700; }
</style>
