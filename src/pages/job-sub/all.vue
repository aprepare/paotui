<template>
  <view class="all-page">
    <view class="search-bar">
      <view class="search-input">
        <text class="search-icon"></text>
        <input placeholder="搜索所有兼职" v-model="keyword" confirm-type="search"></input>
      </view>
    </view>
    <scroll-view scroll-x class="filter-bar">
      <view class="filter-inner">
        <view v-for="f in filterTags" :key="f" class="filter-chip" :class="{active: activeFilter === f}" @click="activeFilter = f">
          <text>{{ f }}</text>
        </view>
      </view>
    </scroll-view>
    <scroll-view scroll-y class="job-list">
      <view v-for="job in filteredJobs" :key="job.id" class="job-card" @click="onJobTap(job)">
        <view class="job-top">
          <view class="job-emoji-wrap" :style="{background: job.bg}">
            <text class="job-emoji">{{ job.emoji }}</text>
          </view>
          <view class="job-main">
            <text class="job-title">{{ job.title }}</text>
            <text class="job-company">{{ job.company }}</text>
          </view>
          <view class="job-hot" v-if="job.hot"><text> 热招</text></view>
        </view>
        <view class="job-detail-row">
          <text class="job-location"> {{ job.location }}</text>
          <view class="job-cat-tag"><text>{{ job.category }}</text></view>
        </view>
        <view class="job-bottom">
          <text class="job-pay">{{ job.pay }}</text>
          <view class="job-apply-btn"><text>查看详情</text></view>
        </view>
      </view>
      <view v-if="filteredJobs.length === 0" class="empty-state">
        <text class="empty-emoji"></text>
        <text class="empty-text">没有找到相关兼职</text>
      </view>
    </scroll-view>

    <!-- 详情弹出层 -->
    <view class="popup-mask" v-if="showDetail" @click="showDetail = false">
      <view class="popup-body" @click.stop>
        <view class="popup-close" @click="showDetail = false"><text>✕</text></view>
        <view class="popup-content" v-if="detailJob">
          <view class="popup-emoji-wrap" :style="{background: detailJob.bg}">
            <text class="popup-emoji-icon">{{ detailJob.emoji || '💼' }}</text>
          </view>
          <text class="popup-title">{{ detailJob.title }}</text>
          <text class="popup-company">{{ detailJob.company }}</text>
          <view class="popup-grid">
            <view class="popup-field">
              <text class="popup-label">📍 工作地点</text>
              <text class="popup-val">{{ detailJob.location }}</text>
            </view>
            <view class="popup-field">
              <text class="popup-label">🏷️ 岗位分类</text>
              <text class="popup-val">{{ detailJob.category }}</text>
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
const activeFilter = ref('全部')
const filterTags = ['全部', '校内', '家教', '阿那亚', '阿尔卡迪亚', '寒暑假']

const allJobs = ref([
  { id: 1, title: '图书馆整理员', company: '校图书馆', location: '图书馆三楼', pay: '20/小时', emoji: '', bg: 'linear-gradient(135deg, #89f7fe, #66a6ff)', hot: true, category: '校内', description: '负责图书馆三楼书籍的分类整理、上架归位及环境维护，需要细心耐心，能够按照图书编号准确归类。' },
  { id: 2, title: '食堂帮厨', company: '第一食堂', location: '一食堂后厨', pay: '50/次+免费午餐', emoji: '', bg: 'linear-gradient(135deg, #ffecd2, #fcb69f)', hot: true, category: '校内', description: '协助食堂师傅进行午餐备餐工作，包括洗菜、配菜、餐具整理等，提供免费工作餐。' },
  { id: 3, title: '快递驿站分拣', company: '菜鸟驿站', location: '校内驿站', pay: '18/小时', emoji: '', bg: 'linear-gradient(135deg, #a1c4fd, #c2e9fb)', hot: true, category: '校内', description: '负责快递包裹的扫码入库、分区摆放和取件核验，需要手脚麻利，能适应快节奏工作。' },
  { id: 4, title: '学院办公室助理', company: '计算机学院', location: '教学楼A栋', pay: '25/小时', emoji: '', bg: 'linear-gradient(135deg, #a18cd1, #fbc2eb)', hot: false, category: '校内', description: '协助学院老师处理日常行政事务，包括文件打印、资料归档、通知发布等，需熟练使用办公软件。' },
  { id: 5, title: '校运会志愿者', company: '体育部', location: '校体育场', pay: '80/天+餐补', emoji: '', bg: 'linear-gradient(135deg, #f5576c, #ff6a88)', hot: false, category: '校内', description: '协助校运会的赛事组织工作，包括检录、计时、引导观众等，需要有责任心和团队协作精神。' },
  { id: 6, title: '周末家教 数学辅导', company: '家长直招', location: '线上/线下均可', pay: '120/小时', emoji: '', bg: 'linear-gradient(135deg, #667eea, #764ba2)', hot: true, category: '家教', description: '辅导初中高中数学，针对薄弱环节进行讲解，传授解题技巧，时间灵活匹配。' },
  { id: 7, title: '英语口语陪练', company: '家长直招', location: '线上', pay: '100/小时', emoji: '', bg: 'linear-gradient(135deg, #f093fb, #f5576c)', hot: false, category: '家教', description: '在线上与学生进行全英文对话交流，纠正发音问题，提高语言运用能力与自信心。' },
  { id: 8, title: 'Python编程家教', company: '家长直招', location: '线上均可', pay: '180/小时', emoji: '', bg: 'linear-gradient(135deg, #4facfe, #00f2fe)', hot: true, category: '家教', description: '教授Python基础及进阶知识，指导完成简单爬虫及数据分析项目。' },
  { id: 9, title: '民宿前台接待', company: '阿那亚度假区', location: '阿那亚社区', pay: '180/天', emoji: '', bg: 'linear-gradient(135deg, #f093fb, #f5576c)', hot: true, category: '阿那亚', description: '负责办理客人的入住和退房手续，解答客人关于游玩设施的疑问，态度要亲切热情。' },
  { id: 10, title: '海边咖啡师', company: '孤独图书馆咖啡', location: '阿那亚海边', pay: '200/天', emoji: '', bg: 'linear-gradient(135deg, #ffecd2, #fcb69f)', hot: true, category: '阿那亚', description: '负责制作咖啡、冷饮及简餐，清理水吧台面。有过咖啡店工作经验者优先。' },
  { id: 11, title: '沙滩活动执行', company: '阿那亚活动部', location: '阿那亚沙滩', pay: '250/天', emoji: '', bg: 'linear-gradient(135deg, #f5576c, #ff6a88)', hot: false, category: '阿那亚', description: '协助组织沙滩排球、飞盘等活动，现场布置及设施维护，需要户外工作能力强。' },
  { id: 12, title: '摄影跟拍助理', company: '海边摄影工作室', location: '阿那亚全区', pay: '300/天', emoji: '', bg: 'linear-gradient(135deg, #d4fc79, #96e6a1)', hot: true, category: '阿那亚', description: '协助摄影师拿器材、打反光板，安排客人的拍摄行程，可学习专业摄影技巧。' },
  { id: 13, title: '物业前台接待', company: '阿尔卡迪亚物业', location: '服务中心', pay: '130/天', emoji: '', bg: 'linear-gradient(135deg, #4facfe, #00f2fe)', hot: true, category: '阿尔卡迪亚', description: '负责小区业主来访登记，接受报修请求，协助处理基础缴费及查询服务。' },
  { id: 14, title: '奶茶店兼职', company: '蜜雪冰城', location: '阿尔卡迪亚南门', pay: '16/小时', emoji: '', bg: 'linear-gradient(135deg, #a18cd1, #fbc2eb)', hot: true, category: '阿尔卡迪亚', description: '负责按照标准配方制作饮品，点单收银以及门店的卫生维护，排班灵活。' },
  { id: 15, title: '托管班辅导老师', company: '社区教育中心', location: '阿尔卡迪亚', pay: '80/次', emoji: '', bg: 'linear-gradient(135deg, #a1c4fd, #c2e9fb)', hot: false, category: '阿尔卡迪亚', description: '负责小学生放学后的作业辅导与纪律维持，保障学生安全。' },
  { id: 16, title: '电子厂暑期工', company: '富士康科技', location: '开发区工业园', pay: '5500-7000/月', emoji: '', bg: 'linear-gradient(135deg, #667eea, #764ba2)', hot: true, category: '寒暑假', description: '从事电子产线产品的插件、组装及测试，有加班补贴及综合工时制度，包吃住。' },
  { id: 17, title: '火锅店暑期服务员', company: '海底捞', location: '市中心商圈', pay: '4500/月+餐补', emoji: '', bg: 'linear-gradient(135deg, #f5576c, #ff6a88)', hot: true, category: '寒暑假', description: '负责餐厅桌面清理、传菜及顾客服务，提供优质的就餐体验，员工氛围好。' },
  { id: 18, title: '快递分拣员', company: '顺丰速运', location: '物流园区', pay: '200/天', emoji: '', bg: 'linear-gradient(135deg, #43e97b, #38f9d7)', hot: false, category: '寒暑假', description: '夜班或者白班的分拣工作，按照区片及编号对包裹进行快速分类装车。' },
  { id: 19, title: '商场促销员', company: '万达百货', location: '万达广场', pay: '150/天+提成', emoji: '', bg: 'linear-gradient(135deg, #fbc2eb, #a6c1ee)', hot: false, category: '寒暑假', description: '在商场内向顾客推销指定品牌的商品，解答顾客疑问，达成销售任务。' },
  { id: 20, title: '景区讲解员', company: '文旅集团', location: '本地景区', pay: '180/天', emoji: '', bg: 'linear-gradient(135deg, #fddb92, #d1fdff)', hot: true, category: '寒暑假', description: '带领游客游览景区，生动讲解历史背景及景点特色，应对游客基本咨询。' }
])

const filteredJobs = computed(() => {
  let list = allJobs.value
  if (activeFilter.value !== '全部') list = list.filter(j => j.category === activeFilter.value)
  if (keyword.value.trim()) {
    const kw = keyword.value.trim().toLowerCase()
    list = list.filter(j => j.title.toLowerCase().includes(kw) || j.company.toLowerCase().includes(kw))
  }
  return list
})

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
.all-page { background: #F0F2F5; min-height: 100vh; display: flex; flex-direction: column; }
.search-bar { padding: 16rpx 24rpx; background: #fff; }
.search-input { display: flex; align-items: center; background: #F7FAFC; border-radius: 32rpx; padding: 14rpx 24rpx; }
.search-icon { font-size: 28rpx; margin-right: 12rpx; }
.search-input input { flex: 1; font-size: 26rpx; color: #4A5568; }
.filter-bar { padding: 16rpx 24rpx 0; white-space: nowrap; background: #fff; }
.filter-inner { display: flex; gap: 16rpx; padding-bottom: 16rpx; }
.filter-chip { padding: 12rpx 28rpx; border-radius: 28rpx; background: #F7FAFC; }
.filter-chip text { font-size: 24rpx; color: #718096; }
.filter-chip.active { background: linear-gradient(135deg, #4299E1, #2B6CB0); }
.filter-chip.active text { color: #fff; font-weight: 600; }
.job-list { flex: 1; height: calc(100vh - 200rpx); padding: 16rpx 24rpx; }
.job-card { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 16rpx; box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04); }
.job-top { display: flex; align-items: center; }
.job-emoji-wrap { width: 72rpx; height: 72rpx; border-radius: 16rpx; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-right: 16rpx; }
.job-emoji { font-size: 32rpx; }
.job-main { flex: 1; min-width: 0; }
.job-title { font-size: 28rpx; font-weight: 700; color: #1A1A2E; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.job-company { font-size: 22rpx; color: #718096; margin-top: 4rpx; display: block; }
.job-hot { background: #FFF5F5; padding: 4rpx 12rpx; border-radius: 12rpx; flex-shrink: 0; }
.job-hot text { font-size: 20rpx; color: #E53E3E; font-weight: 600; }
.job-detail-row { display: flex; justify-content: space-between; align-items: center; margin-top: 12rpx; }
.job-location { font-size: 22rpx; color: #A0AEC0; }
.job-cat-tag { padding: 4rpx 14rpx; border-radius: 12rpx; background: #EBF4FF; }
.job-cat-tag text { font-size: 20rpx; color: #2B6CB0; }
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