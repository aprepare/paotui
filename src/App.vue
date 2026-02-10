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
  background-color: #F5F7FA;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 28rpx;
  color: #333333;
  box-sizing: border-box;
}

view, text, image, input, textarea, button {
  box-sizing: border-box;
}

/* 主题色变量 */
:root {
  --primary: #4A90D9;
  --primary-light: #6BA5E3;
  --primary-dark: #3A7BC8;
  --accent: #FF6B6B;
  --accent-light: #FF8A8A;
  --bg: #F5F7FA;
  --card-bg: #FFFFFF;
  --text-primary: #333333;
  --text-secondary: #666666;
  --text-hint: #999999;
  --border: #EEEEEE;
  --success: #52C41A;
  --warning: #FAAD14;
  --shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
  --shadow-light: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

/* 通用卡片样式 */
.card {
  background: #FFFFFF;
  border-radius: 20rpx;
  padding: 28rpx;
  margin: 20rpx 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

/* 按钮样式 */
.btn-primary {
  background: linear-gradient(135deg, #4A90D9, #6BA5E3);
  color: #FFFFFF;
  border: none;
  border-radius: 44rpx;
  padding: 24rpx 48rpx;
  font-size: 30rpx;
  font-weight: 600;
  text-align: center;
  line-height: 1;
}

.btn-primary::after {
  border: none;
}

.btn-accent {
  background: linear-gradient(135deg, #FF6B6B, #FF8A8A);
  color: #FFFFFF;
  border: none;
  border-radius: 44rpx;
  padding: 24rpx 48rpx;
  font-size: 30rpx;
  font-weight: 600;
  text-align: center;
  line-height: 1;
}

.btn-accent::after {
  border: none;
}

/* 安全区域 */
.safe-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}

/* 隐藏滚动条 */
::-webkit-scrollbar {
  display: none;
}
</style>
