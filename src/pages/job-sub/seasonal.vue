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
  { name: '工厂制造', tag: '工厂' },
  { name: '餐饮服务', tag: '餐饮' },
  { name: '物流仓储', tag: '物流' },
  { name: '促销导购', tag: '促销' },
  { name: '景区旅游', tag: '景区' },
  { name: '其他岗位', tag: '其他' }
]

const jobs = ref([
  { id: 1, title: '电子厂暑期工', company: '富士康科技', location: '开发区工业园', time: '两班倒 综合工时', pay: '¥5500-7000/月', emoji: '🏭', bg: 'linear-gradient(135deg, #667eea, #764ba2)', hot: true, tag: '工厂', description: '从事电子产线产品的插件、组装及测试，有加班补贴及综合工时制度，包吃住。' },
  { id: 2, title: '食品厂包装工', company: '达利食品', location: '经济开发区', time: '白班 08:00-17:00', pay: '¥4500-5500/月', emoji: '📦', bg: 'linear-gradient(135deg, #a1c4fd, #c2e9fb)', hot: false, tag: '工厂', description: '负责食品生产线末端的装袋、封口及装箱工作，对卫生要求高，需要办理健康证。' },
  { id: 3, title: '服装厂质检员', company: '纺织工业园', location: '工业园区', time: '白班制', pay: '¥4000-5000/月', emoji: '👔', bg: 'linear-gradient(135deg, #89f7fe, #66a6ff)', hot: false, tag: '工厂', description: '对加工好的服装进行线头修剪和质量检查，找出残次品，要求视力好、做事细心。' },
  { id: 4, title: '火锅店暑期服务员', company: '海底捞', location: '市中心商圈', time: '排班制', pay: '¥4500/月+餐补', emoji: '🍲', bg: 'linear-gradient(135deg, #f5576c, #ff6a88)', hot: true, tag: '餐饮', description: '负责餐厅桌面清理、传菜及顾客服务，提供优质的就餐体验，员工氛围好，包吃。' },
  { id: 5, title: '奶茶店寒假工', company: '喜茶', location: '万达广场', time: '排班制', pay: '¥18/小时', emoji: '🧋', bg: 'linear-gradient(135deg, #a18cd1, #fbc2eb)', hot: false, tag: '餐饮', description: '负责饮品配料制作、前台收银以及店面卫生打扫，能适应快节奏工作。' },
  { id: 6, title: '西餐厅假期兼职', company: '必胜客', location: '大学城商业街', time: '午/晚餐时段', pay: '¥16/小时', emoji: '🍕', bg: 'linear-gradient(135deg, #ffecd2, #fcb69f)', hot: false, tag: '餐饮', description: '主要负责迎宾、送餐以及餐桌清洁工作，带薪培训，时间段灵活可选。' },
  { id: 7, title: '快递分拣员', company: '顺丰速运', location: '物流园区', time: '夜班 20:00-06:00', pay: '¥200/天', emoji: '📮', bg: 'linear-gradient(135deg, #4facfe, #00f2fe)', hot: true, tag: '物流', description: '夜班的快递分拣工作，按照区片及编号对包裹进行快速分类装车，体能要求较高。' },
  { id: 8, title: '仓库理货员', company: '京东物流', location: '电商产业园', time: '白班/夜班可选', pay: '¥180/天', emoji: '🏗️', bg: 'linear-gradient(135deg, #43e97b, #38f9d7)', hot: false, tag: '物流', description: '通过PDA扫码设备在大型仓库内进行货物的上架和拣货配送，需要一定的方向感和体力。' },
  { id: 9, title: '商场促销员', company: '万达百货', location: '万达广场', time: '周末/节假日', pay: '¥150/天+提成', emoji: '🛍️', bg: 'linear-gradient(135deg, #f093fb, #f5576c)', hot: false, tag: '促销', description: '在商场内向顾客推销指定品牌的商品，解答顾客疑问，达成销售任务，锻炼交际能力。' },
  { id: 10, title: '手机卖场导购', company: '华为体验店', location: '步行街', time: '排班制', pay: '¥160/天+提成', emoji: '📱', bg: 'linear-gradient(135deg, #fbc2eb, #a6c1ee)', hot: true, tag: '促销', description: '接待进店顾客，介绍最新款手机及数码产品的功能亮点，促成销售业绩达成。' },
  { id: 11, title: '景区检票员', company: '旅游景区', location: '本地景区', time: '旺季全天', pay: '¥140/天', emoji: '🎫', bg: 'linear-gradient(135deg, #d4fc79, #96e6a1)', hot: false, tag: '景区', description: '在景区入口负责对游客门票进行核销和检票，维持入园秩序。' },
  { id: 12, title: '景区讲解员', company: '文旅集团', location: '本地景区', time: '排班制', pay: '¥180/天', emoji: '🗣️', bg: 'linear-gradient(135deg, #fddb92, #d1fdff)', hot: true, tag: '景区', description: '带领游客游览景区，生动讲解历史背景及景点特色，应对游客基本咨询及突发情况处理。' },
  { id: 13, title: '暑期游泳教练助理', company: '市体育馆', location: '体育中心', pay: '¥150/天', time: '暑期 09:00-17:00', emoji: '🏊', bg: 'linear-gradient(135deg, #fa709a, #fee140)', hot: false, tag: '其他', description: '配合主教练进行少儿游泳教学工作，监督学员水上安全，收拾整理浮板等教学辅助器具。' }
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