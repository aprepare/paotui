<template>
  <view class="exp-page">
    <view class="category-bar">
      <view v-for="(cat, i) in categories" :key="i" class="cat-item" :class="{active: currentCat === i}" @click="currentCat = i">
        <text>{{ cat }}</text>
      </view>
    </view>

    <view class="exp-list">
      <view v-for="item in filteredList" :key="item.id" class="exp-card" @click="goDetail(item)">
        <view class="exp-header">
          <view class="author-avatar" :style="{background: item.avatarBg}">
            <text>{{ item.avatarEmoji }}</text>
          </view>
          <view class="author-info">
            <text class="author-name">{{ item.author }}</text>
            <view class="author-tags">
              <text class="author-tag" v-if="item.school">{{ item.school }}</text>
              <text class="author-tag success" v-if="item.admitted">已上岸</text>
            </view>
          </view>
        </view>
        <text class="exp-title">{{ item.title }}</text>
        <text class="exp-summary">{{ item.summary }}</text>
        <view class="exp-footer">
          <view class="exp-stats">
            <text class="exp-stat">👀 {{ item.views }}</text>
            <text class="exp-stat">❤️ {{ item.likes }}</text>
            <text class="exp-stat">💬 {{ item.comments }}</text>
          </view>
          <text class="exp-date">{{ item.date }}</text>
        </view>
      </view>
    </view>

    <view class="fab-btn" @click="goCreate">
      <text>✍️</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

const currentCat = ref(0)
const categories = ref(['全部', '初试经验', '复试经验', '择校建议', '学习方法', '心态调整'])

const expList = ref([
  { id: 1, title: '三跨上岸985，我的考研400+经验分享', summary: '本科双非，跨专业跨学校跨地区，从3月开始备考，最终初试410分上岸。分享我的时间规划、各科复习方法和心态调整经验...', author: '学姐小王', school: '北京大学', admitted: true, views: 2340, likes: 186, comments: 45, date: '2026-01', avatarEmoji: '👩‍🎓', avatarBg: 'linear-gradient(135deg, #F687B3, #D53F8C)', category: '初试经验' },
  { id: 2, title: '考研英语一85分复习全攻略', summary: '从四级刚过到考研英语85分，我用了这些方法：单词背诵用艾宾浩斯遗忘曲线，阅读理解每天精读一篇，作文模板整理...', author: '英语达人', school: '复旦大学', admitted: true, views: 1890, likes: 152, comments: 38, date: '2025-12', avatarEmoji: '🧑‍💻', avatarBg: 'linear-gradient(135deg, #63B3ED, #2B6CB0)', category: '学习方法' },
  { id: 3, title: '复试逆袭：初试倒数第三到最终录取', summary: '初试擦线进复试，但复试表现优异最终被录取。分享复试准备方法、面试技巧、英语口语准备和导师联系经验...', author: '逆袭学长', school: '浙江大学', admitted: true, views: 3120, likes: 234, comments: 67, date: '2026-02', avatarEmoji: '💪', avatarBg: 'linear-gradient(135deg, #68D391, #38A169)', category: '复试经验' },
  { id: 4, title: '二战上岸，给一战失败同学的建议', summary: '一战差10分落榜，二战调整策略成功上岸。分享一战失败的教训、二战如何调整心态、如何高效利用时间...', author: '二战勇士', school: '南京大学', admitted: true, views: 1560, likes: 128, comments: 52, date: '2025-11', avatarEmoji: '🔥', avatarBg: 'linear-gradient(135deg, #F6AD55, #DD6B20)', category: '心态调整' },
  { id: 5, title: '如何选择目标院校？这些数据你必须看', summary: '择校不能只看排名，还要看报录比、复试线趋势、专业课难度。整理了各大高校近三年数据对比和分析方法...', author: '数据分析师', school: '', admitted: false, views: 2780, likes: 198, comments: 43, date: '2026-01', avatarEmoji: '📊', avatarBg: 'linear-gradient(135deg, #B794F4, #805AD5)', category: '择校建议' }
])

const filteredList = computed(() => {
  const cat = categories.value[currentCat.value]
  if (cat === '全部') return expList.value
  return expList.value.filter(e => e.category === cat)
})

const goDetail = (item) => {
  uni.showModal({
    title: item.title,
    content: item.summary + '\n\n作者：' + item.author + (item.school ? ' (' + item.school + ')' : ''),
    showCancel: false
  })
}

const goCreate = () => {
  uni.showModal({
    title: '发布经验帖',
    content: '经验帖发布功能即将上线，敬请期待',
    showCancel: false
  })
}
</script>

<style scoped>
.exp-page { background: #F0F2F5; min-height: 100vh; padding-bottom: 120rpx; }
.category-bar { display: flex; padding: 20rpx 24rpx; gap: 12rpx; overflow-x: auto; white-space: nowrap; background: #fff; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06); }
.cat-item { padding: 10rpx 24rpx; background: #F0F2F5; border-radius: 30rpx; font-size: 24rpx; color: #666; flex-shrink: 0; }
.cat-item.active { background: linear-gradient(135deg, #43A047, #2E7D32); color: #fff; }
.exp-list { padding: 20rpx 24rpx; }
.exp-card { background: #fff; border-radius: 20rpx; padding: 28rpx; margin-bottom: 20rpx; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.06); }
.exp-card:active { transform: scale(0.98); }
.exp-header { display: flex; align-items: center; margin-bottom: 16rpx; }
.author-avatar { width: 72rpx; height: 72rpx; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 16rpx; }
.author-avatar text { font-size: 32rpx; }
.author-info { flex: 1; }
.author-name { font-size: 28rpx; font-weight: 700; color: #1A1A2E; display: block; }
.author-tags { display: flex; gap: 8rpx; margin-top: 6rpx; }
.author-tag { font-size: 20rpx; color: #718096; background: #F0F2F5; padding: 4rpx 12rpx; border-radius: 6rpx; }
.author-tag.success { color: #38A169; background: #F0FFF4; }
.exp-title { font-size: 30rpx; font-weight: 700; color: #1A1A2E; display: block; line-height: 1.4; }
.exp-summary { font-size: 26rpx; color: #718096; margin-top: 12rpx; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.6; }
.exp-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 20rpx; padding-top: 16rpx; border-top: 1rpx solid #F0F2F5; }
.exp-stats { display: flex; gap: 24rpx; }
.exp-stat { font-size: 22rpx; color: #A0AEC0; }
.exp-date { font-size: 22rpx; color: #A0AEC0; }
.fab-btn { position: fixed; right: 40rpx; bottom: 120rpx; width: 100rpx; height: 100rpx; background: linear-gradient(135deg, #43A047, #2E7D32); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 8rpx 24rpx rgba(67,160,71,0.4); }
.fab-btn text { font-size: 40rpx; }
</style>
