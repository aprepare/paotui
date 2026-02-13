<script setup>
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'

onLaunch(() => {
  console.log('App Launch')
})

onShow(() => {
  console.log('App Show')
})

onHide(() => {
  console.log('App Hide')
})
</script>

<style>
/* 全局样式 */
page {
  background-color: #F0F2F5;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif;
  font-size: 28rpx;
  color: #1A1A2E;
  box-sizing: border-box;
  -webkit-font-smoothing: antialiased;
}

view, text, image, input, textarea, button {
  box-sizing: border-box;
}

/* 主题色变量 */
:root {
  --primary: #2B6CB0;
  --primary-light: #4299E1;
  --primary-dark: #1A4F8B;
  --primary-bg: #EBF4FF;
  --accent: #E53E3E;
  --accent-light: #FC8181;
  --bg: #F0F2F5;
  --card-bg: #FFFFFF;
  --text-primary: #1A1A2E;
  --text-secondary: #4A5568;
  --text-hint: #A0AEC0;
  --border: #E2E8F0;
  --success: #38A169;
  --warning: #DD6B20;
  --shadow-sm: 0 1rpx 3rpx rgba(0,0,0,0.04), 0 1rpx 2rpx rgba(0,0,0,0.06);
  --shadow: 0 4rpx 6rpx rgba(0,0,0,0.04), 0 2rpx 4rpx rgba(0,0,0,0.06);
  --shadow-md: 0 8rpx 24rpx rgba(0,0,0,0.06), 0 4rpx 8rpx rgba(0,0,0,0.04);
  --shadow-lg: 0 16rpx 48rpx rgba(0,0,0,0.08), 0 8rpx 16rpx rgba(0,0,0,0.04);
}

/* 全局动画 - 点击反馈 */
.tap-active { transition: transform 0.15s ease, opacity 0.15s ease; }
.tap-active:active { transform: scale(0.96); opacity: 0.85; }
</style>
