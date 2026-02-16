<template>
  <view class="welfare-page">
    <!-- 顶部轮播图 -->
    <view class="banner-wrap">
      <swiper class="banner-swiper" indicator-dots autoplay circular :interval="3500"
        indicator-color="rgba(255,255,255,0.4)" indicator-active-color="#fff">
        <swiper-item v-for="(item, index) in banners" :key="index">
          <view class="banner-item" :style="{background: item.bg}">
            <view class="banner-content">
              <text class="banner-emoji">{{ item.emoji }}</text>
              <view class="banner-text-area">
                <text class="banner-title">{{ item.title }}</text>
                <text class="banner-desc">{{ item.desc }}</text>
              </view>
            </view>
          </view>
        </swiper-item>
      </swiper>
    </view>

    <!-- 服务入口 -->
    <view class="service-section">
      <text class="section-label">校园福利</text>
      <view class="service-grid">
        <view class="service-card" v-for="s in services" :key="s.text" @click="goPage(s)">
          <view class="service-icon-wrap" :style="{background: s.gradient}">
            <text class="service-emoji">{{ s.icon }}</text>
          </view>
          <view class="service-text-area">
            <text class="service-name">{{ s.text }}</text>
            <text class="service-desc">{{ s.desc }}</text>
          </view>
        </view>
      </view>
    </view>

    <MsgNotify />
  </view>
</template>

<script setup>
import { ref } from 'vue'
import MsgNotify from '@/components/MsgNotify.vue'

const banners = ref([
  { emoji: '\u{1F389}', title: '\u65B0\u5B66\u671F\u798F\u5229\u5927\u653E\u9001', desc: '\u591A\u91CD\u4F18\u60E0\u7B49\u4F60\u6765\u9886', bg: 'linear-gradient(135deg, #F6AD55 0%, #ED8936 50%, #DD6B20 100%)' },
  { emoji: '\u{1F4E6}', title: '\u5FEB\u9012\u4EE3\u53D6 \u9996\u5355\u7ACB\u51CF', desc: '\u65B0\u7528\u6237\u4E13\u4EAB\u4F18\u60E0', bg: 'linear-gradient(135deg, #63B3ED 0%, #4299E1 50%, #2B6CB0 100%)' },
  { emoji: '\u{1F697}', title: '\u62FC\u8F66\u51FA\u884C \u5B89\u5168\u7701\u94B1', desc: '\u6821\u56ED\u51FA\u884C\u597D\u5E2E\u624B', bg: 'linear-gradient(135deg, #68D391 0%, #48BB78 50%, #38A169 100%)' },
  { emoji: '\u{1F4BC}', title: '\u6821\u56ED\u517C\u804C \u8F7B\u677E\u8D5A\u96F6\u82B1', desc: '\u6D77\u91CF\u5C97\u4F4D\u7B49\u4F60\u6765', bg: 'linear-gradient(135deg, #F687B3 0%, #ED64A6 50%, #D53F8C 100%)' }
])

const services = ref([
  { icon: '\u{1F91D}', text: '\u6821\u56ED\u642D\u5B50', desc: '\u627E\u642D\u5B50\u4E00\u8D77', url: '/pages/team/index', gradient: 'linear-gradient(135deg, #63B3ED, #2B6CB0)' },
  { icon: '\u{1F9FC}', text: '\u840C\u9A6C\u6D17\u62A4', desc: '\u6D17\u62A4\u670D\u52A1', url: '/pages/market/index', gradient: 'linear-gradient(135deg, #F6AD55, #DD6B20)' },
  { icon: '\u{1F697}', text: '\u6821\u56ED\u62FC\u8F66', desc: '\u62FC\u8F66\u7701\u94B1', url: '/pages/carpool/index', gradient: 'linear-gradient(135deg, #68D391, #38A169)' },
  { icon: '\u{1F3AF}', text: '技能出租', desc: '技能变现', url: '/pages/skill/index', gradient: 'linear-gradient(135deg, #F687B3, #D53F8C)' },
  { icon: '\u{1F4DA}', text: '\u8003\u7814\u670D\u52A1', desc: '\u8003\u7814\u52A0\u6CB9', url: '/pages/graduate/index', gradient: 'linear-gradient(135deg, #4FD1C5, #319795)' },
  { icon: '\u{1F6D2}', text: '\u4E8C\u624B\u5E02\u573A', desc: '\u95F2\u7F6E\u6362\u94B1', url: '/pages/market/index', gradient: 'linear-gradient(135deg, #FC8181, #E53E3E)' },
  { icon: '\u{1F68C}', text: '\u5C0F\u5C9B\u5DF4\u58EB', desc: '\u6821\u56ED\u51FA\u884C', url: '/pages/carpool/index', gradient: 'linear-gradient(135deg, #B794F4, #805AD5)' },
  { icon: '\u{1F355}', text: '福利外卖', desc: '优惠点餐', url: '/pages/market/index', gradient: 'linear-gradient(135deg, #FBD38D, #DD6B20)' }
])

const goPage = (service) => {
  if (service.isTab) {
    uni.switchTab({ url: service.url })
  } else {
    uni.navigateTo({ url: service.url })
  }
}
</script>

<style scoped>
.welfare-page { background: #F0F2F5; min-height: 100vh; }

/* 轮播 */
.banner-wrap { padding: 0; }
.banner-swiper { width: 100%; height: 340rpx; }
.banner-item { width: 100%; height: 340rpx; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
.banner-content { display: flex; align-items: center; padding: 0 60rpx; width: 100%; }
.banner-emoji { font-size: 72rpx; margin-right: 32rpx; }
.banner-text-area { display: flex; flex-direction: column; }
.banner-title { font-size: 36rpx; color: #fff; font-weight: 800; letter-spacing: 1rpx; }
.banner-desc { font-size: 24rpx; color: rgba(255,255,255,0.8); margin-top: 8rpx; font-weight: 500; }

/* 服务区 */
.service-section { padding: 32rpx 28rpx; }
.section-label { font-size: 32rpx; font-weight: 700; color: #1A1A2E; display: block; margin-bottom: 24rpx; letter-spacing: 1rpx; }
.service-grid { display: flex; flex-wrap: wrap; justify-content: space-between; }
.service-card { width: 335rpx; background: #fff; border-radius: 20rpx; padding: 28rpx; display: flex; align-items: center; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04), 0 1rpx 3rpx rgba(0,0,0,0.06); transition: transform 0.2s ease, box-shadow 0.2s ease; margin-bottom: 20rpx; }
.service-card:active { transform: scale(0.96); box-shadow: 0 1rpx 4rpx rgba(0,0,0,0.08); }
.service-icon-wrap { width: 80rpx; height: 80rpx; border-radius: 20rpx; display: flex; align-items: center; justify-content: center; margin-right: 20rpx; flex-shrink: 0; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08); }
.service-emoji { font-size: 36rpx; }
.service-text-area { display: flex; flex-direction: column; }
.service-name { font-size: 28rpx; color: #1A1A2E; font-weight: 700; }
.service-desc { font-size: 22rpx; color: #A0AEC0; margin-top: 4rpx; }
</style>
