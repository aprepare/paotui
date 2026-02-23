<template>
  <view class="empty-state">
    <view class="empty-icon">
      <text class="emoji">{{ emoji }}</text>
    </view>
    <text class="empty-title">{{ title }}</text>
    <text class="empty-desc">{{ description }}</text>
    <view v-if="actions.length > 0" class="empty-actions">
      <button 
        v-for="(action, idx) in actions" 
        :key="idx"
        class="action-btn"
        :class="action.variant || 'primary'"
        @click="action.handler"
      >
        <text>{{ action.label }}</text>
      </button>
    </view>
  </view>
</template>

<script setup>
defineProps({
  emoji: {
    type: String,
    default: '📭'
  },
  title: {
    type: String,
    default: '暂无数据'
  },
  description: {
    type: String,
    default: '还没有找到匹配的内容'
  },
  actions: {
    type: Array,
    default: () => []
    // 格式: { label: '按钮文字', handler: () => {}, variant: 'primary|secondary' }
  }
})
</script>

<style lang="scss" scoped>
@import '@/styles/design-system.scss';

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx $spacing-xl;
  text-align: center;
  background: $color-bg-secondary;
  border-radius: $radius-lg;
  margin: $spacing-lg;
}

.empty-icon {
  width: 160rpx;
  height: 160rpx;
  background: $color-bg-primary;
  border-radius: $radius-full;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: $spacing-xl;
  box-shadow: $shadow-sm;
  animation: float 3s ease-in-out infinite;
}

.emoji {
  font-size: 80rpx;
  line-height: 1;
}

.empty-title {
  font-size: $font-size-2xl;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  margin-bottom: $spacing-base;
  letter-spacing: 0.5rpx;
}

.empty-desc {
  font-size: $font-size-md;
  color: $color-text-tertiary;
  margin-bottom: $spacing-lg;
  line-height: $line-height-normal;
}

.empty-actions {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-md;
  justify-content: center;
  width: 100%;
}

.action-btn {
  padding: $spacing-base $spacing-lg;
  border: none;
  border-radius: $radius-lg;
  font-size: $font-size-md;
  font-weight: $font-weight-semibold;
  transition: all $transition-base;
  cursor: pointer;
  
  &.primary {
    background: $gradient-primary;
    color: #fff;
    
    &:active {
      transform: scale(0.98);
      filter: brightness(0.95);
    }
  }
  
  &.secondary {
    background: $color-bg-primary;
    color: $color-primary;
    border: 2rpx solid $color-primary;
    
    &:active {
      background: $color-primary-light;
    }
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-16rpx);
  }
}
</style>
