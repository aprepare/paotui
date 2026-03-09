<template>
  <view class="menu-page">
    <!-- 商家头部 -->
    <view class="shop-header">
      <image class="shop-logo" :src="shop.logo || '/static/welfare/waimai.png'" mode="aspectFill" />
      <view class="shop-info">
        <text class="shop-name">{{ shop.name || shopName }}</text>
        <text class="shop-time">🕐 {{ shop.openTime || '08:00' }}-{{ shop.closeTime || '22:00' }}  ·  配送费¥{{ (shop.deliveryFee || 0).toFixed(1) }}</text>
      </view>
    </view>

    <!-- 主体：左分类 + 右菜品 -->
    <view class="menu-body">
      <!-- 左侧分类 -->
      <scroll-view :scroll-y="true" class="cat-nav">
        <view class="cat-item" :class="{active: currentCat === c}" v-for="c in catList" :key="c" @click="currentCat = c">
          <text>{{ c }}</text>
        </view>
      </scroll-view>

      <!-- 右侧菜品 -->
      <scroll-view :scroll-y="true" class="item-list">
        <view class="item-card" v-for="item in filteredItems" :key="item._id">
          <image class="item-img" :src="item.image || '/static/welfare/waimai.png'" mode="aspectFill" />
          <view class="item-info">
            <text class="item-name">{{ item.name }}</text>
            <text class="item-desc" v-if="item.desc">{{ item.desc }}</text>
            <view class="item-bottom">
              <text class="item-price">¥{{ item.price.toFixed(1) }}</text>
            </view>
          </view>
        </view>
        <view class="empty-items" v-if="!filteredItems.length">
          <text>暂无菜品</text>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { callCloud, checkLogin } from '@/utils/cloud.js'

const shopId = ref('')
const shopName = ref('')
const shop = ref({})
const items = ref([])
const currentCat = ref('')
const cart = reactive({}) // { itemId: quantity }

const catList = computed(() => {
  const cats = [...new Set(items.value.map(i => i.category || '其他'))]
  return cats.length ? cats : ['热销']
})

const filteredItems = computed(() => {
  if (!currentCat.value) return items.value
  return items.value.filter(i => (i.category || '其他') === currentCat.value)
})

const getQty = (itemId) => cart[itemId] || 0

const changeQty = (item, delta) => {
  const cur = cart[item._id] || 0
  const next = cur + delta
  if (next <= 0) { delete cart[item._id] }
  else { cart[item._id] = next }
}

const cartItems = computed(() => {
  return Object.keys(cart).map(id => ({
    item: items.value.find(i => i._id === id) || { _id: id, name: '?', price: 0 },
    qty: cart[id]
  })).filter(ci => ci.qty > 0)
})

const totalCount = computed(() => Object.values(cart).reduce((s, q) => s + q, 0))
const totalPrice = computed(() => {
  return cartItems.value.reduce((s, ci) => s + ci.item.price * ci.qty, 0)
})
const canOrder = computed(() => {
  return !shop.value.minOrder || totalPrice.value >= shop.value.minOrder
})

const showCartPopup = ref(false)

const clearCart = () => {
  Object.keys(cart).forEach(k => delete cart[k])
  showCartPopup.value = false
}

const goConfirm = () => {
  if (!canOrder.value) return
  if (!checkLogin()) return
  // 将购物车数据存到 storage 传递
  const cartData = cartItems.value.map(ci => ({
    itemId: ci.item._id,
    name: ci.item.name,
    price: ci.item.price,
    image: ci.item.image || '',
    quantity: ci.qty
  }))
  uni.setStorageSync('food_cart', {
    shopId: shopId.value,
    shopName: shop.value.name || shopName.value,
    deliveryFee: shop.value.deliveryFee || 0,
    minOrder: shop.value.minOrder || 0,
    items: cartData
  })
  uni.navigateTo({ url: '/pages/food/confirm' })
}

const loadMenu = async () => {
  uni.showLoading({ title: '加载中' })
  const res = await callCloud('food', 'getShopMenu', { shopId: shopId.value })
  uni.hideLoading()
  if (res.code === 0 && res.data) {
    shop.value = res.data.shop || {}
    items.value = res.data.items || []
    if (catList.value.length) currentCat.value = catList.value[0]
  }
}

onLoad((opts) => {
  shopId.value = opts.shopId || ''
  shopName.value = decodeURIComponent(opts.shopName || '')
  if (shopId.value) loadMenu()
})
</script>

<style scoped>
.menu-page { background: #F0F2F5; min-height: 100vh; display: flex; flex-direction: column; }
.shop-header { display: flex; align-items: center; background: #fff; padding: 24rpx; }
.shop-logo { width: 90rpx; height: 90rpx; border-radius: 14rpx; flex-shrink: 0; }
.shop-info { margin-left: 20rpx; }
.shop-name { font-size: 30rpx; font-weight: 700; color: #1A1A2E; display: block; }
.shop-time { font-size: 22rpx; color: #A0AEC0; margin-top: 6rpx; display: block; }

.menu-body { flex: 1; display: flex; overflow: hidden; height: calc(100vh - 240rpx); }
.cat-nav { width: 160rpx; background: #F7FAFC; flex-shrink: 0; }
.cat-item { padding: 28rpx 16rpx; text-align: center; font-size: 24rpx; color: #718096; border-left: 4rpx solid transparent; }
.cat-item.active { background: #fff; color: #DD6B20; font-weight: 700; border-left-color: #DD6B20; }
.item-list { flex: 1; padding: 16rpx; }

.item-card { display: flex; background: #fff; border-radius: 16rpx; padding: 20rpx; margin-bottom: 16rpx; }
.item-img { width: 120rpx; height: 120rpx; border-radius: 12rpx; flex-shrink: 0; background: #F7FAFC; }
.item-info { flex: 1; margin-left: 16rpx; display: flex; flex-direction: column; justify-content: space-between; }
.item-name { font-size: 28rpx; font-weight: 600; color: #2D3748; }
.item-desc { font-size: 22rpx; color: #A0AEC0; margin-top: 4rpx; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.item-bottom { display: flex; align-items: center; justify-content: space-between; margin-top: 8rpx; }
.item-price { font-size: 30rpx; font-weight: 800; color: #DD6B20; }

.qty-ctrl { display: flex; align-items: center; gap: 12rpx; }
.qty-ctrl.sm { gap: 8rpx; }
.qty-btn { width: 44rpx; height: 44rpx; border-radius: 22rpx; display: flex; align-items: center; justify-content: center; }
.qty-btn text { font-size: 28rpx; font-weight: 700; line-height: 1; }
.qty-btn.plus { background: #DD6B20; }
.qty-btn.plus text { color: #fff; }
.qty-btn.minus { background: #F7FAFC; border: 2rpx solid #E2E8F0; }
.qty-btn.minus text { color: #718096; }
.qty-num { font-size: 28rpx; font-weight: 700; color: #2D3748; min-width: 32rpx; text-align: center; }
.empty-items { text-align: center; padding: 80rpx 0; }
.empty-items text { font-size: 26rpx; color: #A0AEC0; }

.cart-bar { position: fixed; bottom: 0; left: 0; right: 0; height: 110rpx; background: #2D3748; display: flex; align-items: center; padding: 0 24rpx; z-index: 100; }
.cart-left { flex: 1; display: flex; align-items: center; gap: 12rpx; position: relative; }
.cart-icon { font-size: 40rpx; }
.cart-badge { position: absolute; top: -10rpx; left: 36rpx; background: #E53E3E; border-radius: 20rpx; padding: 0 10rpx; min-width: 32rpx; height: 32rpx; display: flex; align-items: center; justify-content: center; z-index: 1; }
.badge-num { font-size: 20rpx; color: #fff; font-weight: 700; }
.cart-total { font-size: 34rpx; font-weight: 800; color: #fff; margin-left: 8rpx; }
.cart-btn { background: #DD6B20; padding: 16rpx 40rpx; border-radius: 30rpx; }
.cart-btn text { color: #fff; font-size: 28rpx; font-weight: 700; }
.cart-btn.disabled { background: #718096; }

.cart-popup-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 110rpx; background: rgba(0,0,0,0.5); z-index: 98; }
.cart-popup { position: fixed; bottom: 110rpx; left: 0; right: 0; background: #fff; border-radius: 24rpx 24rpx 0 0; max-height: 60vh; z-index: 99; }
.popup-header { display: flex; justify-content: space-between; align-items: center; padding: 24rpx 32rpx; border-bottom: 1rpx solid #EDF2F7; }
.popup-title { font-size: 30rpx; font-weight: 700; color: #2D3748; }
.popup-clear { font-size: 26rpx; color: #E53E3E; }
.popup-list { max-height: 50vh; padding: 0 32rpx; }
.popup-item { display: flex; align-items: center; justify-content: space-between; padding: 20rpx 0; border-bottom: 1rpx solid #F7FAFC; }
.pi-name { font-size: 28rpx; color: #2D3748; flex: 1; }
.pi-right { display: flex; align-items: center; gap: 16rpx; }
.pi-price { font-size: 26rpx; color: #DD6B20; font-weight: 600; }
</style>
