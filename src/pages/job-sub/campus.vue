<template>
  <view class="campus-page">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <view class="search-input">
        <text class="search-icon">🔍</text>
        <input placeholder="搜索岗位" v-model="keyword" confirm-type="search" @confirm="onSearch"></input>
      </view>
    </view>

    <!-- 左右分栏 -->
    <view class="main-wrap">
      <!-- 左侧分类 -->
      <scroll-view scroll-y class="side-nav">
        <view
          v-for="(cat, idx) in categories"
          :key="cat.name"
          class="nav-item"
          :class="{active: activeIdx === idx}"
          @click="activeIdx = idx"
        >
          <text>{{ cat.name }}</text>
        </view>
      </scroll-view>

      <!-- 右侧内容 -->
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
            <view class="job-hot" v-if="job.hot">
              <text>🔥 热招</text>
            </view>
          </view>
          <view class="job-detail-row">
            <text class="job-location">📍 {{ job.location }}</text>
            <text class="job-time">🕐 {{ job.time }}</text>
          </view>
          <view class="job-bottom">
            <text class="job-pay">{{ job.pay }}</text>
            <view class="job-apply-btn">
              <text>查看详情</text>
            </view>
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
  { name: '图书馆', tag: '图书馆' },
  { name: '食堂餐厅', tag: '食堂' },
  { name: '行政助理', tag: '行政' },
  { name: '实验室', tag: '实验室' },
  { name: '校园活动', tag: '活动' },
  { name: '勤工俭学', tag: '勤工' },
  { name: '其他岗位', tag: '其他' }
]

const jobs = ref([
  { id: 1, title: '图书馆整理员', company: '校图书馆', location: '图书馆三楼', time: '周一至周五 14:00-18:00', pay: '¥20/小时', emoji: '📖', bg: 'linear-gradient(135deg, #89f7fe, #66a6ff)', hot: true, tag: '图书馆', description: '负责图书馆三楼书籍的分类整理、上架归位及环境维护，需要细心耐心，能够按照图书编号准确归类。' },
  { id: 2, title: '图书馆前台值班', company: '校图书馆', location: '图书馆一楼', time: '周末 09:00-17:00', pay: '¥18/小时', emoji: '🏛️', bg: 'linear-gradient(135deg, #a1c4fd, #c2e9fb)', hot: false, tag: '图书馆', description: '负责图书馆前台的借还书登记、读者咨询引导及入馆管理，需熟悉图书馆基本规则。' },
  { id: 3, title: '图书上架归还', company: '校图书馆', location: '图书馆各楼层', time: '周二/周四 15:00-18:00', pay: '¥15/小时', emoji: '📚', bg: 'linear-gradient(135deg, #667eea, #764ba2)', hot: false, tag: '图书馆', description: '将归还的图书按编号分类并送回对应楼层书架，需要一定体力，工作简单易上手。' },
  { id: 4, title: '食堂帮厨', company: '第一食堂', location: '一食堂后厨', time: '午餐 10:30-13:00', pay: '¥50/次+免费午餐', emoji: '🍳', bg: 'linear-gradient(135deg, #ffecd2, #fcb69f)', hot: true, tag: '食堂', description: '协助食堂师傅进行午餐备餐工作，包括洗菜、配菜、餐具整理等，提供免费工作餐。' },
  { id: 5, title: '餐厅收银员', company: '第二食堂', location: '二食堂一楼', time: '午/晚餐时段', pay: '¥22/小时', emoji: '💰', bg: 'linear-gradient(135deg, #f093fb, #f5576c)', hot: false, tag: '食堂', description: '负责餐厅窗口的收银结算工作，需要熟练操作收银系统，态度热情，有责任心。' },
  { id: 6, title: '窗口打饭', company: '第三食堂', location: '三食堂二楼', time: '午餐 11:00-13:00', pay: '¥40/次+免费午餐', emoji: '🍚', bg: 'linear-gradient(135deg, #fddb92, #d1fdff)', hot: false, tag: '食堂', description: '在食堂窗口为同学打饭，按份量标准操作，保持窗口卫生整洁，提供免费工作餐。' },
  { id: 7, title: '学院办公室助理', company: '计算机学院', location: '教学楼A栋', time: '工作日 09:00-12:00', pay: '¥25/小时', emoji: '💼', bg: 'linear-gradient(135deg, #a18cd1, #fbc2eb)', hot: false, tag: '行政', description: '协助学院老师处理日常行政事务，包括文件打印、资料归档、通知发布等，需熟练使用办公软件。' },
  { id: 8, title: '教务处文件整理', company: '教务处', location: '行政楼二楼', time: '周三/周五 14:00-17:00', pay: '¥20/小时', emoji: '📁', bg: 'linear-gradient(135deg, #d4fc79, #96e6a1)', hot: false, tag: '行政', description: '负责教务处各类文件的分类、归档和电子化录入工作，要求做事认真细致。' },
  { id: 9, title: '招生办接待', company: '招生办', location: '行政楼一楼', time: '寒暑假期间', pay: '¥100/天', emoji: '🎓', bg: 'linear-gradient(135deg, #4facfe, #00f2fe)', hot: true, tag: '行政', description: '在招生季接待来访家长和考生，解答招生政策咨询，引导参观校园，需形象良好、表达流利。' },
  { id: 10, title: '实验室器材管理', company: '物理实验中心', location: '实验楼B栋', time: '周一至周五 16:00-18:00', pay: '¥22/小时', emoji: '🔬', bg: 'linear-gradient(135deg, #43e97b, #38f9d7)', hot: false, tag: '实验室', description: '负责实验室器材的清点、维护和借还登记，确保实验器材完好可用，需了解基本实验器材。' },
  { id: 11, title: '化学实验准备', company: '化学系', location: '实验楼C栋', time: '周二/周四 08:00-10:00', pay: '¥25/小时', emoji: '🧪', bg: 'linear-gradient(135deg, #fa709a, #fee140)', hot: false, tag: '实验室', description: '协助老师准备化学实验所需的试剂和器材，实验后清洗整理，需有化学基础知识。' },
  { id: 12, title: '校运会志愿者', company: '体育部', location: '校体育场', time: '运动会期间', pay: '¥80/天+餐补', emoji: '🏅', bg: 'linear-gradient(135deg, #f5576c, #ff6a88)', hot: true, tag: '活动', description: '协助校运会的赛事组织工作，包括检录、计时、引导观众等，需要有责任心和团队协作精神。' },
  { id: 13, title: '迎新晚会工作人员', company: '学生会', location: '大礼堂', time: '演出当天全天', pay: '¥120/天', emoji: '🎤', bg: 'linear-gradient(135deg, #fbc2eb, #a6c1ee)', hot: false, tag: '活动', description: '负责迎新晚会的舞台搭建、灯光音响调试、现场秩序维护等后勤保障工作。' },
  { id: 14, title: '校园导览员', company: '校办', location: '校园各处', time: '开放日/周末', pay: '¥100/天', emoji: '🗺️', bg: 'linear-gradient(135deg, #667eea, #764ba2)', hot: false, tag: '勤工', description: '带领来访者参观校园，介绍学校历史、院系分布和校园设施，需熟悉校园环境、普通话标准。' },
  { id: 15, title: '宿舍楼值班', company: '后勤处', location: '各宿舍楼', time: '晚间 20:00-22:00', pay: '¥30/次', emoji: '🏠', bg: 'linear-gradient(135deg, #89f7fe, #66a6ff)', hot: false, tag: '勤工', description: '负责宿舍楼晚间的安全巡查和出入登记，处理突发情况并及时上报，工作轻松。' },
  { id: 16, title: '快递驿站分拣', company: '菜鸟驿站', location: '校内驿站', time: '每天 12:00-14:00', pay: '¥18/小时', emoji: '📦', bg: 'linear-gradient(135deg, #ffecd2, #fcb69f)', hot: true, tag: '其他', description: '负责快递包裹的扫码入库、分区摆放和取件核验，需要手脚麻利，能适应快节奏工作。' },
  { id: 17, title: '校园摄影师', company: '宣传部', location: '校园各处', time: '活动期间', pay: '¥200/场', emoji: '📸', bg: 'linear-gradient(135deg, #a18cd1, #fbc2eb)', hot: false, tag: '其他', description: '负责校园活动的现场拍摄和后期修图，需自备相机，有摄影经验者优先。' }
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
  // 搜索时切到包含结果的第一个分类
  if (!keyword.value.trim()) return
  const kw = keyword.value.trim().toLowerCase()
  const idx = categories.findIndex(cat => {
    return jobs.value.some(j => j.tag === cat.tag && (j.title.toLowerCase().includes(kw) || j.company.toLowerCase().includes(kw)))
  })
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

/* 搜索栏 */
.search-bar { padding: 16rpx 24rpx; background: #fff; }
.search-input { display: flex; align-items: center; background: #F7FAFC; border-radius: 32rpx; padding: 14rpx 24rpx; }
.search-icon { font-size: 28rpx; margin-right: 12rpx; }
.search-input input { flex: 1; font-size: 26rpx; color: #4A5568; }

/* 左右分栏 */
.main-wrap { display: flex; flex: 1; height: calc(100vh - 100rpx); }

/* 左侧导航 */
.side-nav { width: 200rpx; background: #F7FAFC; flex-shrink: 0; height: 100%; }
.nav-item { padding: 36rpx 20rpx; text-align: center; position: relative; }
.nav-item text { font-size: 26rpx; color: #718096; }
.nav-item.active { background: #fff; }
.nav-item.active text { color: #2B6CB0; font-weight: 700; }
.nav-item.active::before { content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 6rpx; height: 40rpx; border-radius: 3rpx; background: #2B6CB0; }

/* 右侧内容 */
.content-area { flex: 1; background: #fff; height: 100%; padding: 0 20rpx 20rpx; }
.content-header { display: flex; justify-content: space-between; align-items: center; padding: 24rpx 8rpx 16rpx; }
.content-title { font-size: 30rpx; font-weight: 700; color: #1A1A2E; }
.content-count { font-size: 22rpx; color: #A0AEC0; }

/* 岗位卡片 */
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

/* 空状态 */
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

/* 工作详情 */
.popup-desc-section { width: 100%; background: #F7FAFC; border-radius: 16rpx; padding: 24rpx; margin-bottom: 24rpx; }
.popup-desc-header { display: flex; align-items: center; margin-bottom: 12rpx; }
.popup-desc-icon { font-size: 28rpx; margin-right: 8rpx; }
.popup-desc-title { font-size: 28rpx; font-weight: 700; color: #1A1A2E; }
.popup-desc-text { font-size: 26rpx; color: #4A5568; line-height: 1.7; }

/* 联系客服按钮 */
.popup-contact-btn { width: 100%; padding: 24rpx; border-radius: 16rpx; background: linear-gradient(135deg, #4299E1, #2B6CB0); display: flex; align-items: center; justify-content: center; box-shadow: 0 6rpx 20rpx rgba(43,108,176,0.3); }
.popup-contact-btn:active { opacity: 0.85; transform: scale(0.98); }
.popup-contact-icon { font-size: 32rpx; margin-right: 10rpx; }
.popup-contact-text { font-size: 28rpx; color: #fff; font-weight: 700; }
</style>
