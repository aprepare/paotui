<template>
  <view class="campus-page">
    <view class="search-bar">
      <view class="search-input">
        <text class="search-icon">🔍</text>
        <input placeholder="搜索岗位" v-model="keyword" confirm-type="search" @confirm="onSearch"></input>
      </view>
    </view>
    <view class="main-wrap">
      <scroll-view scroll-y class="side-nav">
        <view v-for="(cat, idx) in categories" :key="cat.name" class="nav-item" :class="{active: activeIdx === idx}" @click="activeIdx = idx">
          <text>{{ cat.name }}</text>
        </view>
      </scroll-view>
      <scroll-view scroll-y class="content-area">
        <view class="content-header">
          <text class="content-title">{{ categories[activeIdx].name }}</text>
          <text class="content-count">{{ filteredJobs.length }}个岗位</text>
        </view>
        <view v-for="job in filteredJobs" :key="job.id" class="job-card" @click="onJobTap(job)">
          <view class="job-top">
            <view class="job-emoji-wrap" :style="{background: job.bg}">
              <text class="job-emoji">{{ job.emoji }}</text>
            </view>
            <view class="job-main">
              <text class="job-title">{{ job.title }}</text>
              <text class="job-company">{{ job.company }}</text>
            </view>
            <view class="job-hot" v-if="job.hot"><text>🔥 热招</text></view>
          </view>
          <view class="job-detail-row">
            <text class="job-location">📍 {{ job.location }}</text>
            <text class="job-time">🕐 {{ job.time }}</text>
          </view>
          <view class="job-bottom">
            <text class="job-pay">{{ job.pay }}</text>
            <view class="job-apply-btn"><text>查看详情</text></view>
          </view>
        </view>
        <view v-if="filteredJobs.length === 0" class="empty-state">
          <text class="empty-emoji">📋</text>
          <text class="empty-text">暂无该分类的岗位</text>
        </view>
      </scroll-view>
    </view>

    <!-- 详情弹出层 -->
    <view class="popup-mask" v-if="showDetail" @click="showDetail = false">
      <view class="popup-body" @click.stop>
        <view class="popup-close" @click="showDetail = false"><text>✕</text></view>
        <view class="popup-content" v-if="detailJob">
          <view class="popup-emoji-wrap" :style="{background: detailJob.bg}">
            <text class="popup-emoji-icon">{{ detailJob.emoji }}</text>
          </view>
          <text class="popup-title">{{ detailJob.title }}</text>
          <text class="popup-company">{{ detailJob.company }}</text>
          <view class="popup-grid">
            <view class="popup-field">
              <text class="popup-label">📍 工作地点</text>
              <text class="popup-val">{{ detailJob.location }}</text>
            </view>
            <view class="popup-field">
              <text class="popup-label">🕐 工作时间</text>
              <text class="popup-val">{{ detailJob.time }}</text>
            </view>
            <view class="popup-field">
              <text class="popup-label">💰 薪资待遇</text>
              <text class="popup-val price">{{ detailJob.pay }}</text>
            </view>
            <view class="popup-field">
              <text class="popup-label">🏢 招聘单位</text>
              <text class="popup-val">{{ detailJob.company }}</text>
            </view>
          </view>
          <view class="popup-desc-section">
            <view class="popup-desc-header">
              <text class="popup-desc-icon">📋</text>
              <text class="popup-desc-title">工作详情</text>
            </view>
            <text class="popup-desc-text">{{ detailJob.description }}</text>
          </view>

          <view class="popup-contact-btn" @click="onContactKefu">
            <text class="popup-contact-icon">💬</text>
            <text class="popup-contact-text">联系客服获取详细信息</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

const keyword = ref('')
const activeIdx = ref(0)

const categories = [
  { name: '物业服务', tag: '物业' },
  { name: '商超零售', tag: '商超' },
  { name: '餐饮服务', tag: '餐饮' },
  { name: '教育培训', tag: '教育' },
  { name: '社区活动', tag: '活动' },
  { name: '其他岗位', tag: '其他' }
]

const jobs = ref([
  { id: 1, title: '物业前台接待', company: '阿尔卡迪亚物业', location: '阿尔卡迪亚服务中心', time: '工作日 08:30-17:30', pay: '¥130/天', emoji: '🏢', bg: 'linear-gradient(135deg, #4facfe, #00f2fe)', hot: true, tag: '物业', description: '负责小区业主来访登记，接受报修请求，协助处理基础缴费及查询服务。' },
  { id: 2, title: '社区巡逻协管', company: '阿尔卡迪亚安保', location: '阿尔卡迪亚社区', time: '排班制', pay: '¥140/天', emoji: '🛡️', bg: 'linear-gradient(135deg, #667eea, #764ba2)', hot: false, tag: '物业', description: '协助安保人员进行社区巡视，门岗人员车辆登记管控，维护社区的安全秩序。' },
  { id: 3, title: '绿化养护助理', company: '阿尔卡迪亚物业', location: '社区花园', time: '早班 07:00-12:00', pay: '¥100/半天', emoji: '🌿', bg: 'linear-gradient(135deg, #43e97b, #38f9d7)', hot: false, tag: '物业', description: '协助绿化师傅修剪草坪、浇水、处理落叶，适合喜欢花草植物，能早起的同学。' },
  { id: 4, title: '超市收银员', company: '社区超市', location: '阿尔卡迪亚商业街', time: '排班制', pay: '¥18/小时', emoji: '💰', bg: 'linear-gradient(135deg, #ffecd2, #fcb69f)', hot: true, tag: '商超', description: '负责超市前台的扫码计价和收银结账工作，态度要和善，做事认真不出错。' },
  { id: 5, title: '便利店店员', company: '全家便利店', location: '阿尔卡迪亚北门', time: '晚班 18:00-23:00', pay: '¥16/小时', emoji: '🏪', bg: 'linear-gradient(135deg, #89f7fe, #66a6ff)', hot: false, tag: '商超', description: '负责晚间便利店的商品补货、收银以及鲜食加热，清洁店面环境。' },
  { id: 6, title: '水果店理货', company: '百果园', location: '阿尔卡迪亚商业区', time: '上午 08:00-12:00', pay: '¥15/小时', emoji: '🍎', bg: 'linear-gradient(135deg, #fa709a, #fee140)', hot: false, tag: '商超', description: '负责水果的挑拣、上架陈列及价签更换，保持水果展示区的整洁美观。' },
  { id: 7, title: '快餐店服务员', company: '社区餐饮', location: '阿尔卡迪亚美食街', time: '午/晚餐时段', pay: '¥20/小时', emoji: '🍔', bg: 'linear-gradient(135deg, #f093fb, #f5576c)', hot: false, tag: '餐饮', description: '在快餐店负责收银、打包或者大堂桌面的清洁回收，适合时间较为碎片化的同学。' },
  { id: 8, title: '奶茶店兼职', company: '蜜雪冰城', location: '阿尔卡迪亚南门', time: '排班制', pay: '¥16/小时', emoji: '🧋', bg: 'linear-gradient(135deg, #a18cd1, #fbc2eb)', hot: true, tag: '餐饮', description: '负责按照标准配方制作饮品，点单收银以及门店的卫生维护，排班灵活。' },
  { id: 9, title: '托管班辅导老师', company: '社区教育中心', location: '阿尔卡迪亚教育楼', time: '周一至周五 15:30-18:30', pay: '¥80/次', emoji: '📝', bg: 'linear-gradient(135deg, #a1c4fd, #c2e9fb)', hot: true, tag: '教育', description: '负责小学生放学后的作业辅导与纪律维持，解答简单问题，保障学生安全。' },
  { id: 10, title: '少儿美术助教', company: '创意美术工作室', location: '阿尔卡迪亚二期', time: '周末 09:00-12:00', pay: '¥100/次', emoji: '🎨', bg: 'linear-gradient(135deg, #fbc2eb, #a6c1ee)', hot: false, tag: '教育', description: '协助美术主讲老师发放画材、指导小朋友绘画创作，课后清理画室。' },
  { id: 11, title: '社区运动会志愿者', company: '阿尔卡迪亚居委会', location: '社区广场', time: '活动期间', pay: '¥120/天', emoji: '🏅', bg: 'linear-gradient(135deg, #f5576c, #ff6a88)', hot: false, tag: '活动', description: '协助居委会举办社区趣味运动会，负责场地布置、物资分发及秩序维护。' },
  { id: 12, title: '快递代收点', company: '菜鸟驿站', location: '阿尔卡迪亚东门', time: '每天 10:00-20:00 排班', pay: '¥15/小时', emoji: '📦', bg: 'linear-gradient(135deg, #fddb92, #d1fdff)', hot: false, tag: '其他', description: '负责接收各个快递公司的包裹，按货架号入库及为业主寻找快递出库。' }
])

const filteredJobs = computed(() => {
  const tag = categories[activeIdx.value].tag
  let list = jobs.value.filter(j => j.tag === tag)
  if (keyword.value.trim()) {
    const kw = keyword.value.trim().toLowerCase()
    list = list.filter(j => j.title.toLowerCase().includes(kw) || j.company.toLowerCase().includes(kw))
  }
  return list
})

const onSearch = () => {
  if (!keyword.value.trim()) return
  const kw = keyword.value.trim().toLowerCase()
  const idx = categories.findIndex(cat => jobs.value.some(j => j.tag === cat.tag && (j.title.toLowerCase().includes(kw) || j.company.toLowerCase().includes(kw))))
  if (idx >= 0) activeIdx.value = idx
}

const showDetail = ref(false)
const detailJob = ref(null)

const onJobTap = (job) => {
  detailJob.value = job
  showDetail.value = true
}

const onContactKefu = () => {
  showDetail.value = false
  uni.navigateTo({ url: '/pages/kefu/show?img=' + encodeURIComponent('/static/TeamWork.jpg') })
}
</script>

<style scoped>
.campus-page { background: #F0F2F5; min-height: 100vh; display: flex; flex-direction: column; }
.search-bar { padding: 16rpx 24rpx; background: #fff; }
.search-input { display: flex; align-items: center; background: #F7FAFC; border-radius: 32rpx; padding: 14rpx 24rpx; }
.search-icon { font-size: 28rpx; margin-right: 12rpx; }
.search-input input { flex: 1; font-size: 26rpx; color: #4A5568; }
.main-wrap { display: flex; flex: 1; height: calc(100vh - 100rpx); }
.side-nav { width: 200rpx; background: #F7FAFC; flex-shrink: 0; height: 100%; }
.nav-item { padding: 36rpx 20rpx; text-align: center; position: relative; }
.nav-item text { font-size: 26rpx; color: #718096; }
.nav-item.active { background: #fff; }
.nav-item.active text { color: #2B6CB0; font-weight: 700; }
.nav-item.active::before { content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 6rpx; height: 40rpx; border-radius: 3rpx; background: #2B6CB0; }
.content-area { flex: 1; background: #fff; height: 100%; padding: 0 20rpx 20rpx; }
.content-header { display: flex; justify-content: space-between; align-items: center; padding: 24rpx 8rpx 16rpx; }
.content-title { font-size: 30rpx; font-weight: 700; color: #1A1A2E; }
.content-count { font-size: 22rpx; color: #A0AEC0; }
.job-card { background: #F7FAFC; border-radius: 16rpx; padding: 24rpx; margin-bottom: 16rpx; }
.job-top { display: flex; align-items: center; }
.job-emoji-wrap { width: 72rpx; height: 72rpx; border-radius: 16rpx; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-right: 16rpx; }
.job-emoji { font-size: 32rpx; }
.job-main { flex: 1; min-width: 0; }
.job-title { font-size: 28rpx; font-weight: 700; color: #1A1A2E; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.job-company { font-size: 22rpx; color: #718096; margin-top: 4rpx; display: block; }
.job-hot { background: #FFF5F5; padding: 4rpx 12rpx; border-radius: 12rpx; flex-shrink: 0; }
.job-hot text { font-size: 20rpx; color: #E53E3E; font-weight: 600; }
.job-detail-row { display: flex; gap: 20rpx; margin-top: 12rpx; flex-wrap: wrap; }
.job-location { font-size: 22rpx; color: #A0AEC0; }
.job-time { font-size: 22rpx; color: #A0AEC0; }
.job-bottom { display: flex; justify-content: space-between; align-items: center; margin-top: 12rpx; }
.job-pay { font-size: 28rpx; color: #E53E3E; font-weight: 800; }
.job-apply-btn { padding: 8rpx 24rpx; border-radius: 20rpx; background: linear-gradient(135deg, #4299E1, #2B6CB0); }
.job-apply-btn text { font-size: 22rpx; color: #fff; font-weight: 600; }
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 100rpx 0; }
.empty-emoji { font-size: 72rpx; }
.empty-text { font-size: 26rpx; color: #A0AEC0; margin-top: 16rpx; }

/* Popup */
.popup-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 100; display: flex; align-items: flex-end; justify-content: center; }
.popup-body { width: 100%; max-height: 80vh; background: #fff; border-radius: 32rpx 32rpx 0 0; padding: 40rpx 32rpx; padding-bottom: calc(40rpx + env(safe-area-inset-bottom)); position: relative; overflow-y: auto; animation: slideUp 0.25s ease-out; }
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
.popup-close { position: absolute; top: 24rpx; right: 28rpx; width: 56rpx; height: 56rpx; border-radius: 50%; background: #F0F2F5; display: flex; align-items: center; justify-content: center; }
.popup-close text { font-size: 28rpx; color: #718096; }
.popup-content { display: flex; flex-direction: column; align-items: center; }
.popup-emoji-wrap { width: 120rpx; height: 120rpx; border-radius: 28rpx; display: flex; align-items: center; justify-content: center; margin-bottom: 24rpx; }
.popup-emoji-icon { font-size: 56rpx; }
.popup-title { font-size: 34rpx; font-weight: 800; color: #1A1A2E; margin-bottom: 8rpx; }
.popup-company { font-size: 26rpx; color: #718096; margin-bottom: 28rpx; }
.popup-grid { display: flex; flex-wrap: wrap; gap: 20rpx; width: 100%; margin-bottom: 24rpx; }
.popup-field { width: calc(50% - 10rpx); background: #F7FAFC; border-radius: 16rpx; padding: 20rpx; }
.popup-label { font-size: 22rpx; color: #A0AEC0; display: block; margin-bottom: 6rpx; }
.popup-val { font-size: 28rpx; color: #2D3748; font-weight: 600; display: block; }
.popup-val.price { color: #E53E3E; font-weight: 800; }
.popup-desc-section { width: 100%; background: #F7FAFC; border-radius: 16rpx; padding: 24rpx; margin-bottom: 24rpx; }
.popup-desc-header { display: flex; align-items: center; margin-bottom: 12rpx; }
.popup-desc-icon { font-size: 28rpx; margin-right: 8rpx; }
.popup-desc-title { font-size: 28rpx; font-weight: 700; color: #1A1A2E; }
.popup-desc-text { font-size: 26rpx; color: #4A5568; line-height: 1.7; }
.popup-contact-btn { width: 100%; padding: 24rpx; border-radius: 16rpx; background: linear-gradient(135deg, #4299E1, #2B6CB0); display: flex; align-items: center; justify-content: center; box-shadow: 0 6rpx 20rpx rgba(43,108,176,0.3); }
.popup-contact-btn:active { opacity: 0.85; transform: scale(0.98); }
.popup-contact-icon { font-size: 32rpx; margin-right: 10rpx; }
.popup-contact-text { font-size: 28rpx; color: #fff; font-weight: 700; }
</style>