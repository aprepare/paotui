<template>
  <div>
    <h2>美食管理</h2>
    <el-tabs v-model="activeTab" @tab-change="onTabChange">
      <!-- 商家管理 -->
      <el-tab-pane label="商家管理" name="shops">
        <el-row :gutter="16" style="margin:12px 0">
          <el-col :span="5"><el-input v-model="shopKeyword" placeholder="搜索商家名称" clearable @keyup.enter="loadShops" /></el-col>
          <el-col :span="2"><el-button type="primary" @click="loadShops">搜索</el-button></el-col>
          <el-col :span="3"><el-button type="success" @click="openShopForm()">添加商家</el-button></el-col>
        </el-row>
        <el-table :data="shops" v-loading="shopsLoading" border stripe>
          <el-table-column prop="name" label="商家名称" width="140" />
          <el-table-column prop="category" label="分类" width="80" />
          <el-table-column prop="phone" label="电话" width="120" />
          <el-table-column prop="address" label="地址" width="150" show-overflow-tooltip />
          <el-table-column label="配送费" width="80"><template #default="{ row }">¥{{ row.deliveryFee }}</template></el-table-column>
          <el-table-column label="起送价" width="80"><template #default="{ row }">¥{{ row.minOrder }}</template></el-table-column>
          <el-table-column label="营业时间" width="130"><template #default="{ row }">{{ row.openTime }}-{{ row.closeTime }}</template></el-table-column>
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '营业' : '休息' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button size="small" link type="primary" @click="viewItems(row)">菜品</el-button>
              <el-button size="small" link type="warning" @click="openShopForm(row)">编辑</el-button>
              <el-button size="small" link type="danger" @click="deleteShop(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination style="margin-top:16px" :current-page="shopPage" :page-size="20" :total="shopTotal" @current-change="p => { shopPage = p; loadShops() }" layout="total, prev, pager, next" />
      </el-tab-pane>

      <!-- 菜品管理 -->
      <el-tab-pane label="菜品管理" name="items">
        <el-row :gutter="16" style="margin:12px 0">
          <el-col :span="5">
            <el-select v-model="itemShopFilter" placeholder="选择商家" clearable @change="loadItems">
              <el-option v-for="s in allShops" :key="s._id" :label="s.name" :value="s._id" />
            </el-select>
          </el-col>
          <el-col :span="5"><el-input v-model="itemKeyword" placeholder="搜索菜品名" clearable @keyup.enter="loadItems" /></el-col>
          <el-col :span="2"><el-button type="primary" @click="loadItems">搜索</el-button></el-col>
          <el-col :span="3"><el-button type="success" @click="openItemForm()">添加菜品</el-button></el-col>
        </el-row>
        <el-table :data="items" v-loading="itemsLoading" border stripe>
          <el-table-column prop="name" label="菜品名" width="140" />
          <el-table-column label="图片" width="80">
            <template #default="{ row }">
              <el-image v-if="row.image" :src="row.image" style="width:40px;height:40px" fit="cover" />
              <span v-else>无</span>
            </template>
          </el-table-column>
          <el-table-column label="价格" width="80"><template #default="{ row }">¥{{ row.price }}</template></el-table-column>
          <el-table-column prop="category" label="分类" width="80" />
          <el-table-column prop="sales" label="销量" width="70" />
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '上架' : '下架' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="140" fixed="right">
            <template #default="{ row }">
              <el-button size="small" link type="warning" @click="openItemForm(row)">编辑</el-button>
              <el-button size="small" link type="danger" @click="deleteItem(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination style="margin-top:16px" :current-page="itemPage" :page-size="50" :total="itemTotal" @current-change="p => { itemPage = p; loadItems() }" layout="total, prev, pager, next" />
      </el-tab-pane>

      <!-- 订单管理 -->
      <el-tab-pane label="订单管理" name="orders">
        <el-row :gutter="16" style="margin:12px 0">
          <el-col :span="4">
            <el-select v-model="orderStatusFilter" placeholder="状态筛选" clearable @change="loadOrders">
              <el-option label="待确认" :value="0" />
              <el-option label="已确认" :value="1" />
              <el-option label="配送中" :value="2" />
              <el-option label="已完成" :value="3" />
              <el-option label="已取消" :value="4" />
            </el-select>
          </el-col>
          <el-col :span="2"><el-button type="primary" @click="loadOrders">刷新</el-button></el-col>
        </el-row>
        <el-table :data="orders" v-loading="ordersLoading" border stripe>
          <el-table-column prop="shopName" label="商家" width="120" />
          <el-table-column label="菜品" min-width="200">
            <template #default="{ row }">
              <span v-for="(it, i) in row.items" :key="i">{{ it.name }}x{{ it.quantity }}<span v-if="i < row.items.length - 1">、</span></span>
            </template>
          </el-table-column>
          <el-table-column label="总价" width="80"><template #default="{ row }">¥{{ row.totalPrice }}</template></el-table-column>
          <el-table-column prop="userName" label="用户" width="80" />
          <el-table-column prop="phone" label="电话" width="120" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="orderStatusType(row.status)">{{ orderStatusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="下单时间" width="170">
            <template #default="{ row }">{{ fmtTime(row.createTime) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button size="small" link type="warning" @click="openOrderEdit(row)">修改状态</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination style="margin-top:16px" :current-page="orderPage" :page-size="20" :total="orderTotal" @current-change="p => { orderPage = p; loadOrders() }" layout="total, prev, pager, next" />
      </el-tab-pane>
    </el-tabs>

    <!-- 商家表单 -->
    <el-dialog v-model="shopFormVisible" :title="shopFormId ? '编辑商家' : '添加商家'" width="600px">
      <el-form :model="shopForm" label-width="80px">
        <el-form-item label="名称"><el-input v-model="shopForm.name" /></el-form-item>
        <el-form-item label="Logo"><el-input v-model="shopForm.logo" placeholder="图片URL" /></el-form-item>
        <el-form-item label="分类"><el-input v-model="shopForm.category" /></el-form-item>
        <el-form-item label="电话"><el-input v-model="shopForm.phone" /></el-form-item>
        <el-form-item label="地址"><el-input v-model="shopForm.address" /></el-form-item>
        <el-form-item label="配送费"><el-input-number v-model="shopForm.deliveryFee" :min="0" :precision="2" /></el-form-item>
        <el-form-item label="起送价"><el-input-number v-model="shopForm.minOrder" :min="0" :precision="2" /></el-form-item>
        <el-form-item label="开始时间"><el-input v-model="shopForm.openTime" placeholder="08:00" /></el-form-item>
        <el-form-item label="结束时间"><el-input v-model="shopForm.closeTime" placeholder="22:00" /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="shopForm.status">
            <el-option label="营业" :value="1" />
            <el-option label="休息" :value="0" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="shopFormVisible = false">取消</el-button>
        <el-button type="primary" @click="saveShop">保存</el-button>
      </template>
    </el-dialog>

    <!-- 菜品表单 -->
    <el-dialog v-model="itemFormVisible" :title="itemFormId ? '编辑菜品' : '添加菜品'" width="600px">
      <el-form :model="itemForm" label-width="80px">
        <el-form-item label="所属商家" v-if="!itemFormId">
          <el-select v-model="itemForm.shopId" placeholder="选择商家">
            <el-option v-for="s in allShops" :key="s._id" :label="s.name" :value="s._id" />
          </el-select>
        </el-form-item>
        <el-form-item label="名称"><el-input v-model="itemForm.name" /></el-form-item>
        <el-form-item label="图片"><el-input v-model="itemForm.image" placeholder="图片URL" /></el-form-item>
        <el-form-item label="价格"><el-input-number v-model="itemForm.price" :min="0" :precision="2" /></el-form-item>
        <el-form-item label="分类"><el-input v-model="itemForm.category" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="itemForm.desc" type="textarea" /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="itemForm.status">
            <el-option label="上架" :value="1" />
            <el-option label="下架" :value="0" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="itemFormVisible = false">取消</el-button>
        <el-button type="primary" @click="saveItem">保存</el-button>
      </template>
    </el-dialog>

    <!-- 订单状态修改 -->
    <el-dialog v-model="orderEditVisible" title="修改订单状态" width="400px">
      <el-form label-width="80px">
        <el-form-item label="状态">
          <el-select v-model="orderEditStatus">
            <el-option label="待确认" :value="0" />
            <el-option label="已确认" :value="1" />
            <el-option label="配送中" :value="2" />
            <el-option label="已完成" :value="3" />
            <el-option label="已取消" :value="4" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="orderEditVisible = false">取消</el-button>
        <el-button type="primary" @click="saveOrderStatus">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../api/index'

const activeTab = ref('shops')
const fmtTime = t => t ? new Date(t).toLocaleString('zh-CN') : ''

const shops = ref([]), shopsLoading = ref(false), shopPage = ref(1), shopTotal = ref(0), shopKeyword = ref('')
const allShops = ref([])
const shopFormVisible = ref(false), shopForm = ref({}), shopFormId = ref('')

const items = ref([]), itemsLoading = ref(false), itemPage = ref(1), itemTotal = ref(0)
const itemShopFilter = ref(''), itemKeyword = ref('')
const itemFormVisible = ref(false), itemForm = ref({}), itemFormId = ref('')

const orders = ref([]), ordersLoading = ref(false), orderPage = ref(1), orderTotal = ref(0)
const orderStatusFilter = ref('')
const orderEditVisible = ref(false), orderEditId = ref(''), orderEditStatus = ref(0)

const orderStatusMap = { 0: '待确认', 1: '已确认', 2: '配送中', 3: '已完成', 4: '已取消' }
const orderStatusTypeMap = { 0: 'info', 1: 'warning', 2: '', 3: 'success', 4: 'danger' }
function orderStatusText(s) { return orderStatusMap[s] || '未知' }
function orderStatusType(s) { return orderStatusTypeMap[s] || 'info' }

function onTabChange(tab) {
  if (tab === 'shops') loadShops()
  else if (tab === 'items') loadItems()
  else if (tab === 'orders') loadOrders()
}

async function loadShops() {
  shopsLoading.value = true
  try {
    const params = { page: shopPage.value, pageSize: 20 }
    if (shopKeyword.value) params.keyword = shopKeyword.value
    const { data } = await api.get('/admin/food/shops', { params })
    if (data.code === 0) { shops.value = data.data; shopTotal.value = data.total }
  } finally { shopsLoading.value = false }
}

async function loadAllShops() {
  const { data } = await api.get('/admin/food/shops', { params: { pageSize: 200 } })
  if (data.code === 0) allShops.value = data.data
}

function openShopForm(row) {
  if (row) {
    shopFormId.value = row._id
    shopForm.value = { name: row.name, logo: row.logo, category: row.category, phone: row.phone, address: row.address, deliveryFee: row.deliveryFee, minOrder: row.minOrder, openTime: row.openTime, closeTime: row.closeTime, status: row.status }
  } else {
    shopFormId.value = ''
    shopForm.value = { name: '', logo: '', category: '快餐', phone: '', address: '', deliveryFee: 0, minOrder: 0, openTime: '08:00', closeTime: '22:00', status: 1 }
  }
  shopFormVisible.value = true
}

async function saveShop() {
  if (!shopForm.value.name) return ElMessage.warning('请输入商家名称')
  if (shopFormId.value) {
    await api.put(`/admin/food/shops/${shopFormId.value}`, shopForm.value)
  } else {
    await api.post('/admin/food/shops', shopForm.value)
  }
  ElMessage.success('已保存')
  shopFormVisible.value = false
  loadShops()
  loadAllShops()
}

async function deleteShop(row) {
  await ElMessageBox.confirm('删除商家将同时删除其所有菜品，确认？', '警告', { type: 'warning' })
  await api.delete(`/admin/food/shops/${row._id}`)
  ElMessage.success('已删除')
  loadShops()
  loadAllShops()
}

function viewItems(row) {
  activeTab.value = 'items'
  itemShopFilter.value = row._id
  loadItems()
}

async function loadItems() {
  itemsLoading.value = true
  try {
    const params = { page: itemPage.value, pageSize: 50 }
    if (itemShopFilter.value) params.shopId = itemShopFilter.value
    if (itemKeyword.value) params.keyword = itemKeyword.value
    const { data } = await api.get('/admin/food/items', { params })
    if (data.code === 0) { items.value = data.data; itemTotal.value = data.total }
  } finally { itemsLoading.value = false }
}

function openItemForm(row) {
  if (row) {
    itemFormId.value = row._id
    itemForm.value = { name: row.name, image: row.image, price: row.price, category: row.category, desc: row.desc, status: row.status }
  } else {
    itemFormId.value = ''
    itemForm.value = { shopId: itemShopFilter.value || '', name: '', image: '', price: 0, category: '热销', desc: '', status: 1 }
  }
  itemFormVisible.value = true
}

async function saveItem() {
  if (!itemForm.value.name) return ElMessage.warning('请输入菜品名称')
  if (!itemFormId.value && !itemForm.value.shopId) return ElMessage.warning('请选择商家')
  if (itemFormId.value) {
    await api.put(`/admin/food/items/${itemFormId.value}`, itemForm.value)
  } else {
    await api.post('/admin/food/items', itemForm.value)
  }
  ElMessage.success('已保存')
  itemFormVisible.value = false
  loadItems()
}

async function deleteItem(row) {
  await ElMessageBox.confirm('确认删除该菜品？', '警告', { type: 'warning' })
  await api.delete(`/admin/food/items/${row._id}`)
  ElMessage.success('已删除')
  loadItems()
}

async function loadOrders() {
  ordersLoading.value = true
  try {
    const params = { page: orderPage.value, pageSize: 20 }
    if (orderStatusFilter.value !== '' && orderStatusFilter.value !== null) params.status = orderStatusFilter.value
    const { data } = await api.get('/admin/food/orders', { params })
    if (data.code === 0) { orders.value = data.data; orderTotal.value = data.total }
  } finally { ordersLoading.value = false }
}

function openOrderEdit(row) {
  orderEditId.value = row._id
  orderEditStatus.value = row.status
  orderEditVisible.value = true
}

async function saveOrderStatus() {
  await api.put(`/admin/food/orders/${orderEditId.value}`, { status: orderEditStatus.value })
  ElMessage.success('已更新')
  orderEditVisible.value = false
  loadOrders()
}

onMounted(async () => {
  await loadAllShops()
  loadShops()
})
</script>
