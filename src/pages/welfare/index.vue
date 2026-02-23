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
    <view class="service-loading" v-if="!configLoaded"><text>加载中...</text></view>
    <view class="service-section" v-if="configLoaded">
      <text class="section-label">校园福利</text>
      <view class="service-grid">
        <view class="service-item" v-for="s in services" :key="s.text" @click="goPage(s)">
          <image v-if="s.iconUrl" class="service-icon-img" :src="s.iconUrl" mode="aspectFit" />
          <text v-else class="service-emoji">{{ s.icon }}</text>
          <view class="service-text-area">
            <text class="service-name">{{ s.text }}</text>
            <text class="service-desc">{{ s.desc }}</text>
          </view>
        </view>
      </view>
    </view>

    <MsgNotify />
      <CustomTabBar :current="3" />
  </view>
</template>

<script setup>
import CustomTabBar from '@/components/CustomTabBar.vue'
import { ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { callCloud } from '@/utils/cloud.js'
import MsgNotify from '@/components/MsgNotify.vue'

const banners = ref([
  { emoji: '\u{1F389}', title: '\u65B0\u5B66\u671F\u798F\u5229\u5927\u653E\u9001', desc: '\u591A\u91CD\u4F18\u60E0\u7B49\u4F60\u6765\u9886', bg: 'linear-gradient(135deg, #F6AD55 0%, #ED8936 50%, #DD6B20 100%)' },
  { emoji: '\u{1F4E6}', title: '\u5FEB\u9012\u4EE3\u53D6 \u9996\u5355\u7ACB\u51CF', desc: '\u65B0\u7528\u6237\u4E13\u4EAB\u4F18\u60E0', bg: 'linear-gradient(135deg, #63B3ED 0%, #4299E1 50%, #2B6CB0 100%)' },
  { emoji: '\u{1F697}', title: '\u62FC\u8F66\u51FA\u884C \u5B89\u5168\u7701\u94B1', desc: '\u6821\u56ED\u51FA\u884C\u597D\u5E2E\u624B', bg: 'linear-gradient(135deg, #68D391 0%, #48BB78 50%, #38A169 100%)' },
  { emoji: '\u{1F4BC}', title: '\u6821\u56ED\u517C\u804C \u8F7B\u677E\u8D5A\u96F6\u82B1', desc: '\u6D77\u91CF\u5C97\u4F4D\u7B49\u4F60\u6765', bg: 'linear-gradient(135deg, #F687B3 0%, #ED64A6 50%, #D53F8C 100%)' }
])

const defaultServices = [
  { icon: '\u{1F91D}', iconUrl: '/static/welfare/dazi.png', text: '\u6821\u56ED\u642D\u5B50', desc: '\u627E\u642D\u5B50\u4E00\u8D77', url: '/pages/team/index', gradient: 'linear-gradient(135deg, #63B3ED, #2B6CB0)' },
  { icon: '\u{1F9FC}', iconUrl: '/static/welfare/xihu.png', text: '\u840C\u9A6C\u6D17\u62A4', desc: '\u6D17\u978B\u56E2\u8D2D', url: '/pages/wash/index', gradient: 'linear-gradient(135deg, #F6AD55, #DD6B20)' },
  { icon: '\u{1F697}', iconUrl: '/static/welfare/pinche.png', text: '\u6821\u56ED\u62FC\u8F66', desc: '\u62FC\u8F66\u7701\u94B1', url: '/pages/carpool/index', gradient: 'linear-gradient(135deg, #68D391, #38A169)' },
  { icon: '\u{1F3AF}', iconUrl: '/static/welfare/jineng.png', text: '\u6280\u80FD\u51FA\u79DF', desc: '\u6280\u80FD\u53D8\u73B0', url: '/pages/skill/index', gradient: 'linear-gradient(135deg, #F687B3, #D53F8C)' },
  { icon: '\u{1F4DA}', iconUrl: '/static/welfare/kaoyan.png', text: '\u8003\u7814\u670D\u52A1', desc: '\u8003\u7814\u52A0\u6CB9', url: '/pages/graduate/index', gradient: 'linear-gradient(135deg, #4FD1C5, #319795)' },
  { icon: '\u{1F6D2}', iconUrl: '/static/welfare/ershou.png', text: '\u4E8C\u624B\u5E02\u573A', desc: '\u95F2\u7F6E\u6362\u94B1', url: '/pages/market/index', gradient: 'linear-gradient(135deg, #FC8181, #E53E3E)' },
  { icon: '\u{1F68C}', iconUrl: '/static/welfare/bashi.png', text: '\u5C0F\u5C9B\u5DF4\u58EB', desc: '\u6821\u56ED\u51FA\u884C', url: '/pages/carpool/index', gradient: 'linear-gradient(135deg, #B794F4, #805AD5)' },
  { icon: '\u{1F355}', iconUrl: '/static/welfare/waimai.png', text: '\u798F\u5229\u5916\u5356', desc: '\u4F18\u60E0\u70B9\u9910', url: '/pages/food/index', gradient: 'linear-gradient(135deg, #FBD38D, #DD6B20)' }
]

const services = ref([])
const configLoaded = ref(false)

const loadWelfareConfig = async () => {
  try {
    var res = await callCloud('admin', 'getWelfarePublic')
    if (res.code === 0 && res.data && res.data.services && res.data.services.length) {
      services.value = res.data.services
    } else {
      services.value = defaultServices
    }
  } catch (e) {
    console.log('[welfare] load config error', e)
    services.value = defaultServices
  }
  configLoaded.value = true
}

const goPage = (service) => {
  if (service.isTab) {
    uni.switchTab({ url: service.url })
  } else {
    uni.navigateTo({ url: service.url })
  }
}

onShow(() => {
  uni.hideTabBar({ animation: false })
  loadWelfareConfig()
})
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
.service-item { width: 335rpx; display: flex; align-items: center; padding: 24rpx 0; margin-bottom: 12rpx; }
.service-item:active { opacity: 0.7; }
.service-icon-img { width: 125rpx; height: 125rpx; margin-right: 20rpx; flex-shrink: 0; }
.service-emoji { font-size: 64rpx; margin-right: 20rpx; }
.service-name { font-size: 28rpx; color: #1A1A2E; font-weight: 700; }
.service-text-area { display: flex; flex-direction: column; }
.service-desc { font-size: 22rpx; color: #A0AEC0; margin-top: 4rpx; }
.service-loading { padding: 60rpx 0; text-align: center; }
.service-loading text { font-size: 26rpx; color: #A0AEC0; }
</style>
