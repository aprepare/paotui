<template>
  <view class="fab-button" :class="[variant, position]" @click="handleClick">
    <view class="fab-content">
      <text class="fab-icon">{{ icon }}</text>
      <text v-if="label && !isIcon" class="fab-label">{{ label }}</text>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  icon: {
    type: String,
    default: '+'
  },
  label: {
    type: String,
    default: ''
  },
  variant: {
    type: String,
    default: 'primary',
    validator: v => ['primary', 'secondary'].includes(v)
  },
  position: {
    type: String,
    default: 'bottom-right',
    validator: v => ['bottom-right', 'center-right'].includes(v)
  }
})

const emit = defineEmits(['click'])

const isIcon = computed(() => props.label === '')

const handleClick = () => {
  emit('click')
}
</script>

<style lang="scss" scoped>
@import '@/styles/design-system.scss';

.fab-button {
  position: fixed;
  width: 100rpx;
  height: 100rpx;
  border-radius: $radius-full;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: $font-weight-bold;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.15);
  z-index: 98;
  transition: all $transition-base;
  
  /* 位置定位 */
  &.bottom-right {
    bottom: calc(160rpx + env(safe-area-inset-bottom));
    right: $spacing-lg;
  }
  
  &.center-right {
    right: $spacing-lg;
    top: 50%;
    transform: translateY(-50%);
  }
  
  /* 样式变体 */
  &.primary {
    background: $gradient-primary;
    color: #fff;
    
    &:active {
      transform: scale(0.95);
      box-shadow: 0 2rpx 8rpx rgba(43,108,176,0.3);
    }
  }
  
  &.secondary {
    background: $color-bg-primary;
    color: $color-primary;
    box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);
    border: 2rpx solid $color-border;
    
    &:active {
      background: $color-primary-light;
    }
  }
}

.fab-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.fab-icon {
  font-size: 48rpx;
  line-height: 1;
}

.fab-label {
  font-size: $font-size-xs;
  margin-top: 4rpx;
  color: inherit;
  text-align: center;
  line-height: 1.2;
}
</style>
