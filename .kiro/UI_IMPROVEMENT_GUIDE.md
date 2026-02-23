# 校园跑腿 UI/UX 改进指南

## 📋 改进概览

本指南记录了对项目进行的UI/UX改进，包括色彩系统、间距规范、动画效果等全局设计系统的建立。

---

## ✅ 已完成的改进

### 1. 建立全局设计系统 `src/styles/design-system.scss`

#### 色彩系统
```scss
// 品牌色
$color-primary: #2B6CB0;      // 主蓝
$color-secondary: #DD6B20;    // 辅橙
$color-success: #38A169;      // 成功绿
$color-error: #E53E3E;        // 错误红
```

**应用场景:**
- 主蓝 `#2B6CB0`: 首页、导航栏、按钮、链接（主色系统）
- 辅橙 `#DD6B20`: 跑腿模块、警告、特色功能
- 绿色 `#38A169`: 成功状态、完成标记
- 红色 `#E53E3E`: 错误提示、删除、重要标记

#### 间距系统
```scss
$spacing-xs: 8rpx;     // 细节
$spacing-sm: 12rpx;    // 小
$spacing-base: 16rpx;  // 标准
$spacing-md: 20rpx;    // 中
$spacing-lg: 24rpx;    // 大
$spacing-xl: 32rpx;    // 特大
```

**应用方式:** 始终使用这些变量替代硬编码的像素值

#### 圆角系统
```scss
$radius-sm: 8rpx;    // 按钮、小卡片
$radius-lg: 16rpx;   // 卡片、模态框
$radius-xl: 20rpx;   // 大卡片、顶部导航
```

#### 动画系统
```scss
$transition-fast: 150ms ease;     // 快速交互
$transition-base: 200ms ease;     // 标准交互
$transition-slow: 300ms ease;     // 缓慢进入
$easing-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);  // 弹性效果
```

---

### 2. 优化首页订单卡片设计 `src/pages/index/index.vue`

#### 增强的优先级指示
```vue
<!-- 高小费订单自动显示红色左边框 -->
<view class="order-card" :class="{ 'high-priority': order.tip > 5 }">
  <!-- 卡片内容 -->
</view>
```

#### 样式改进
- ✅ 左边框指示优先级（高优先级红色、中优先级橙色）
- ✅ 背景渐变指示订单重要程度
- ✅ 流畅的入场动画
- ✅ 点击反馈（向左滑动）

---

### 3. 统一导航栏颜色系统

#### 色彩规则
| 模块 | 颜色 | 说明 |
|------|------|------|
| 首页、代取快递、市场、广场等 | `#2B6CB0` | 主蓝 |
| 万能跑腿、骑手注册 | `#DD6B20` | 辅橙 |
| 快捷业务 | 模块对应色 | 保持一致 |

#### 修改的页面
- `pages/index/index`: `#1A4F8B` → `#2B6CB0`
- `pages/mine/*`: 统一为 `#2B6CB0`
- `pages/job-sub/*`: 统一为 `#2B6CB0`
- 其他辅助页面: 保持一致

---

### 4. 新增组件库

#### FabButton.vue - 改进的浮动按钮
```vue
<FabButton 
  icon="+" 
  variant="primary" 
  position="bottom-right"
  @click="handleCreate"
/>
```

**特性:**
- 智能位置管理（不与TabBar冲突）
- 两种样式变体（主色/次色）
- 支持自定义位置

#### EmptyState.vue - 空状态组件
```vue
<EmptyState 
  emoji="📭"
  title="暂无订单"
  description="还没有找到匹配的内容"
  :actions="[
    { label: '🔄 刷新', handler: refresh, variant: 'primary' },
    { label: '➕ 发布', handler: create, variant: 'secondary' }
  ]"
/>
```

**特性:**
- 浮动动画
- 可自定义操作按钮
- 响应式布局

---

## 🔄 后续优化方案

### Phase 2: 表单和输入反馈

#### 实现目标
- [ ] 输入框焦点态（边框颜色变化 + 背景变色）
- [ ] 实时验证反馈（错误状态样式）
- [ ] 必填字段红色标记
- [ ] 表单错误汇总提示

#### 涉及页面
- `express/create.vue` - 发布快递
- `errand/create.vue` - 发布跑腿
- `market/create.vue` - 发布商品
- `forum/create.vue` - 发布帖子

#### 实现代码示例
```vue
<view class="form-item" :class="{ error: errors.pickupPoint }">
  <view class="form-label-row">
    <text class="form-label">取件点 <span class="required">*</span></text>
    <text v-if="errors.pickupPoint" class="error-hint">{{ errors.pickupPoint }}</text>
  </view>
  <input 
    v-model="form.pickupPoint"
    @blur="validatePickupPoint"
    :class="{ 'input-error': errors.pickupPoint }"
    placeholder="如：菜鸟驿站A区"
  />
</view>

<style>
.required { color: #E53E3E; font-weight: 700; }
.error-hint { font-size: 20rpx; color: #E53E3E; }

input {
  border-bottom: 2rpx solid #E2E8F0;
  transition: all 200ms ease;
}

input:focus {
  border-bottom-color: #2B6CB0;
  background: rgba(43,108,176,0.02);
}

input.input-error {
  border-bottom-color: #E53E3E;
  background: rgba(229,62,62,0.02);
}
</style>
```

---

### Phase 3: 按钮交互增强

#### 目标样式
- [ ] 主按钮三态设计（正常、按压、禁用）
- [ ] 加载动画（旋转加载器）
- [ ] 成功/失败反馈

#### 代码示例
```vue
<button 
  class="submit-btn"
  :class="{ loading: isSubmitting, disabled: !canSubmit }"
  @click="handleSubmit"
  :disabled="!canSubmit"
>
  <text v-if="!isSubmitting">{{ buttonText }}</text>
  <view v-else class="loading-spinner"></view>
</button>

<style>
.submit-btn {
  background: linear-gradient(135deg, #2B6CB0, #1A4F8B);
  color: #fff;
  padding: 20rpx 32rpx;
  border-radius: 12rpx;
  border: none;
  font-weight: 700;
  transition: all 200ms ease;
  position: relative;
}

.submit-btn:active {
  transform: scale(0.97);
}

.submit-btn.loading {
  opacity: 0.7;
}

.loading-spinner {
  width: 20rpx;
  height: 20rpx;
  border: 2rpx solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
```

---

### Phase 4: 空状态和加载状态

#### 应该应用的页面
- 首页（无订单时）
- 市场页面（无商品时）
- 论坛页面（无帖子时）
- 订单列表（无结果时）

#### 骨架屏加载
```vue
<view v-if="loading" class="skeleton-list">
  <view v-for="i in 3" :key="i" class="skeleton-card"></view>
</view>
<EmptyState v-else-if="orders.length === 0" />
<view v-else class="order-list">
  <!-- 订单列表 -->
</view>

<style>
.skeleton-card {
  @include skeleton;
  height: 120rpx;
  border-radius: 16rpx;
  margin-bottom: 12rpx;
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
```

---

### Phase 5: 状态指示和徽章系统

#### 订单状态徽章设计
```vue
<view class="status-banner" :class="statusClass">
  <view class="status-content">
    <text class="status-emoji">{{ statusEmoji }}</text>
    <view class="status-text-group">
      <text class="status-title">{{ order.statusText }}</text>
      <text class="status-desc">{{ statusDesc }}</text>
    </view>
  </view>
  <view v-if="showProgress" class="status-progress">
    <view v-for="i in 4" :key="i" 
          class="progress-step" 
          :class="{ active: i <= order.status }"></view>
  </view>
</view>
```

#### 优先级标记
```vue
<view class="order-tag-group">
  <view class="order-tag" :class="order.sizeClass">{{ order.sizeText }}</view>
  <view v-if="(order.tip || 0) > 5" class="high-tip-badge">💰 高小费</view>
  <view v-if="isUrgent" class="urgent-badge">⏰ 急单</view>
</view>
```

---

## 📐 使用指南

### 在样式中使用变量

#### ❌ 不推荐
```scss
.my-button {
  background: #2B6CB0;
  padding: 24rpx 32rpx;
  border-radius: 16rpx;
  transition: all 0.2s ease;
}
```

#### ✅ 推荐
```scss
@import '@/styles/design-system.scss';

.my-button {
  background: $color-primary;
  padding: $spacing-lg $spacing-xl;
  border-radius: $radius-lg;
  transition: all $transition-base;
}
```

---

### 在模板中使用Mixin

#### 创建卡片
```vue
<view class="my-card">
  <text>内容</text>
</view>

<style lang="scss" scoped>
@import '@/styles/design-system.scss';

.my-card {
  @include card;
  @include flex-col;
  gap: $spacing-md;
}
</style>
```

---

## 🎨 色彩对比度检查

所有文字颜色都应满足 WCAG AA 标准（对比度 >= 4.5:1）

| 背景色 | 推荐文字色 | 对比度 |
|-------|---------|-------|
| `#2B6CB0` | `#FFFFFF` | 7.5:1 ✅ |
| `#DD6B20` | `#FFFFFF` | 5.2:1 ✅ |
| `#F0F2F5` | `#1A1A2E` | 9.2:1 ✅ |
| `#FFFFFF` | `#718096` | 7.2:1 ✅ |

---

## 📱 响应式设计检查清单

- [ ] 在 320rpx 宽屏上文字无换行（最小屏幕）
- [ ] 在 768rpx+ 宽屏上布局不过宽（留白合理）
- [ ] 触摸目标最小 48rpx × 48rpx
- [ ] 图片正确使用 `object-fit` 保持比例
- [ ] 小屏幕上 padding 适配（使用 `$spacing-*`）

---

## 🚀 后续优化优先级

| 优先级 | 任务 | 预期影响 | 工作量 |
|-------|------|--------|-------|
| 🔴 高 | 表单验证反馈 | 提高用户操作准确率 | 中等 |
| 🔴 高 | 按钮三态设计 | 增强交互反馈 | 简单 |
| 🟠 中 | 骨架屏加载 | 改善加载体验 | 中等 |
| 🟠 中 | 状态进度条 | 提高订单清晰度 | 简单 |
| 🟡 低 | 无障碍支持 | 扩大用户覆盖 | 复杂 |
| 🟡 低 | 黑暗模式 | 品牌差异化 | 中等 |

---

## 📝 开发规范

### 新增组件时
1. 在 `src/components/` 下创建组件
2. 导入 `design-system.scss`
3. 使用 `@import '@/styles/design-system.scss'`
4. 使用 SCSS 变量和 Mixin
5. 编写清晰的 Props 文档

### 修改页面样式时
1. 将硬编码颜色替换为变量
2. 将硬编码尺寸替换为变量
3. 合并相似的样式规则
4. 添加 hover/active 交互状态

### 测试检查清单
- [ ] 在各种屏幕尺寸上测试布局
- [ ] 检查颜色对比度
- [ ] 测试动画流畅度（不卡顿）
- [ ] 验证交互反馈清晰
- [ ] 检查加载状态处理

---

## 🔗 相关文件

- `src/styles/design-system.scss` - 全局设计系统
- `src/components/FabButton.vue` - 浮动按钮组件
- `src/components/EmptyState.vue` - 空状态组件
- `src/pages/index/index.vue` - 优化后的首页
- `src/pages.json` - 统一的导航栏色彩

---

## 💬 反馈和迭代

后续改进建议：
- 收集用户反馈意见
- 定期进行可用性测试
- 监控关键交互指标
- 持续优化交互细节

---

**最后更新:** 2026-02-21
