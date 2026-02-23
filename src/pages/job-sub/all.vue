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
  </view>
</template>
<script setup>
import { ref, computed } from 'vue'

const keyword = ref('')
const activeFilter = ref('全部')
const filterTags = ['全部', '校内', '家教', '阿那亚', '阿尔卡迪亚', '寒暑假']

const allJobs = ref([
  { id: 1, title: '图书馆整理员', company: '校图书馆', location: '图书馆三楼', pay: '20/小时', emoji: '', bg: 'linear-gradient(135deg, #89f7fe, #66a6ff)', hot: true, category: '校内' },
  { id: 2, title: '食堂帮厨', company: '第一食堂', location: '一食堂后厨', pay: '50/次+免费午餐', emoji: '', bg: 'linear-gradient(135deg, #ffecd2, #fcb69f)', hot: true, category: '校内' },
  { id: 3, title: '快递驿站分拣', company: '菜鸟驿站', location: '校内驿站', pay: '18/小时', emoji: '', bg: 'linear-gradient(135deg, #a1c4fd, #c2e9fb)', hot: true, category: '校内' },
  { id: 4, title: '学院办公室助理', company: '计算机学院', location: '教学楼A栋', pay: '25/小时', emoji: '', bg: 'linear-gradient(135deg, #a18cd1, #fbc2eb)', hot: false, category: '校内' },
  { id: 5, title: '校运会志愿者', company: '体育部', location: '校体育场', pay: '80/天+餐补', emoji: '', bg: 'linear-gradient(135deg, #f5576c, #ff6a88)', hot: false, category: '校内' },
  { id: 6, title: '周末家教 数学辅导', company: '家长直招', location: '线上/线下均可', pay: '120/小时', emoji: '', bg: 'linear-gradient(135deg, #667eea, #764ba2)', hot: true, category: '家教' },
  { id: 7, title: '英语口语陪练', company: '家长直招', location: '线上', pay: '100/小时', emoji: '', bg: 'linear-gradient(135deg, #f093fb, #f5576c)', hot: false, category: '家教' },
  { id: 8, title: 'Python编程家教', company: '家长直招', location: '线上均可', pay: '180/小时', emoji: '', bg: 'linear-gradient(135deg, #4facfe, #00f2fe)', hot: true, category: '家教' },
  { id: 9, title: '民宿前台接待', company: '阿那亚度假区', location: '阿那亚社区', pay: '180/天', emoji: '', bg: 'linear-gradient(135deg, #f093fb, #f5576c)', hot: true, category: '阿那亚' },
  { id: 10, title: '海边咖啡师', company: '孤独图书馆咖啡', location: '阿那亚海边', pay: '200/天', emoji: '', bg: 'linear-gradient(135deg, #ffecd2, #fcb69f)', hot: true, category: '阿那亚' },
  { id: 11, title: '沙滩活动执行', company: '阿那亚活动部', location: '阿那亚沙滩', pay: '250/天', emoji: '', bg: 'linear-gradient(135deg, #f5576c, #ff6a88)', hot: false, category: '阿那亚' },
  { id: 12, title: '摄影跟拍助理', company: '海边摄影工作室', location: '阿那亚全区', pay: '300/天', emoji: '', bg: 'linear-gradient(135deg, #d4fc79, #96e6a1)', hot: true, category: '阿那亚' },
  { id: 13, title: '物业前台接待', company: '阿尔卡迪亚物业', location: '服务中心', pay: '130/天', emoji: '', bg: 'linear-gradient(135deg, #4facfe, #00f2fe)', hot: true, category: '阿尔卡迪亚' },
  { id: 14, title: '奶茶店兼职', company: '蜜雪冰城', location: '阿尔卡迪亚南门', pay: '16/小时', emoji: '', bg: 'linear-gradient(135deg, #a18cd1, #fbc2eb)', hot: true, category: '阿尔卡迪亚' },
  { id: 15, title: '托管班辅导老师', company: '社区教育中心', location: '阿尔卡迪亚', pay: '80/次', emoji: '', bg: 'linear-gradient(135deg, #a1c4fd, #c2e9fb)', hot: false, category: '阿尔卡迪亚' },
  { id: 16, title: '电子厂暑期工', company: '富士康科技', location: '开发区工业园', pay: '5500-7000/月', emoji: '', bg: 'linear-gradient(135deg, #667eea, #764ba2)', hot: true, category: '寒暑假' },
  { id: 17, title: '火锅店暑期服务员', company: '海底捞', location: '市中心商圈', pay: '4500/月+餐补', emoji: '', bg: 'linear-gradient(135deg, #f5576c, #ff6a88)', hot: true, category: '寒暑假' },
  { id: 18, title: '快递分拣员', company: '顺丰速运', location: '物流园区', pay: '200/天', emoji: '', bg: 'linear-gradient(135deg, #43e97b, #38f9d7)', hot: false, category: '寒暑假' },
  { id: 19, title: '商场促销员', company: '万达百货', location: '万达广场', pay: '150/天+提成', emoji: '', bg: 'linear-gradient(135deg, #fbc2eb, #a6c1ee)', hot: false, category: '寒暑假' },
  { id: 20, title: '景区讲解员', company: '文旅集团', location: '本地景区', pay: '180/天', emoji: '', bg: 'linear-gradient(135deg, #fddb92, #d1fdff)', hot: true, category: '寒暑假' }
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

const onJobTap = (job) => {
  uni.showModal({ title: job.title, content: '单位：' + job.company + '\n地点：' + job.location + '\n薪资：' + job.pay + '\n分类：' + job.category + '\n\n详细信息即将上线', showCancel: false })
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
</style>