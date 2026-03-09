<template>
  <div>
    <h2>洗护管理</h2>
    <el-tabs v-model="activeTab" @tab-change="onTabChange">
      <!-- 商品管理 -->
      <el-tab-pane label="商品管理" name="products">
        <el-row :gutter="16" style="margin:12px 0">
          <el-col :span="2"><el-button type="primary" @click="loadProducts">刷新</el-button></el-col>
          <el-col :span="3"><el-button type="success" @click="openProductForm()">添加商品</el-button></el-col>
        </el-row>
        <el-table :data="products" v-loading="productsLoading" border stripe>
          <el-table-column prop="name" label="商品名称" width="160" />
          <el-table-column label="图片" width="80">
            <template #default="{ row }">
              <el-image v-if="row.image" :src="row.image" style="width:40px;height:40px" fit="cover" />
              <span v-else>无</span>
            </template>
          </el-table-column>
          <el-table-column label="原价" width="80"><template #default="{ row }">¥{{ row.originalPrice }}</template></el-table-column>
          <el-table-column label="拼团价" width="80"><template #default="{ row }">¥{{ row.groupPrice }}</template></el-table-column>
          <el-table-column prop="groupSize" label="拼团人数" width="90" />
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '上架' : '下架' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="desc" label="描述" min-width="150" show-overflow-tooltip />
          <el-table-column label="操作" width="140" fixed="right">
            <template #default="{ row }">
              <el-button size="small" link type="warning" @click="openProductForm(row)">编辑</el-button>
              <el-button size="small" link type="danger" @click="deleteProduct(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination style="margin-top:16px" :current-page="prodPage" :page-size="20" :total="prodTotal" @current-change="p => { prodPage = p; loadProducts() }" layout="total, prev, pager, next" />
      </el-tab-pane>

      <!-- 订单管理 -->
      <el-tab-pane label="订单管理" name="orders">
        <el-row :gutter="16" style="margin:12px 0">
          <el-col :span="4">
            <el-select v-model="orderStatusFilter" placeholder="状态筛选" clearable @change="loadOrders">
              <el-option label="待处理" :value="0" />
              <el-option label="处理中" :value="1" />
              <el-option label="已完成" :value="2" />
              <el-option label="已取消" :value="3" />
            </el-select>
          </el-col>
          <el-col :span="2"><el-button type="primary" @click="loadOrders">刷新</el-button></el-col>
        </el-row>
        <el-table :data="orders" v-loading="ordersLoading" border stripe>
          <el-table-column prop="productName" label="商品" width="160" />
          <el-table-column prop="quantity" label="数量" width="60" />
          <el-table-column label="单价" width="80"><template #default="{ row }">¥{{ row.unitPrice }}</template></el-table-column>
          <el-table-column label="总价" width="80"><template #default="{ row }">¥{{ row.totalPrice }}</template></el-table-column>
          <el-table-column prop="userName" label="用户" width="80" />
          <el-table-column prop="phone" label="电话" width="120" />
          <el-table-column prop="address" label="地址" width="150" show-overflow-tooltip />
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="washStatusType(row.status)">{{ washStatusText(row.status) }}</el-tag>
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

    <!-- 商品表单 -->
    <el-dialog v-model="prodFormVisible" :title="prodFormId ? '编辑商品' : '添加商品'" width="600px">
      <el-form :model="prodForm" label-width="90px">
        <el-form-item label="名称"><el-input v-model="prodForm.name" /></el-form-item>
        <el-form-item label="图片"><el-input v-model="prodForm.image" placeholder="图片URL" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="prodForm.desc" type="textarea" /></el-form-item>
        <el-form-item label="原价"><el-input-number v-model="prodForm.originalPrice" :min="0" :precision="2" /></el-form-item>
        <el-form-item label="拼团价"><el-input-number v-model="prodForm.groupPrice" :min="0" :precision="2" /></el-form-item>
        <el-form-item label="拼团人数"><el-input-number v-model="prodForm.groupSize" :min="2" /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="prodForm.status">
            <el-option label="上架" :value="1" />
            <el-option label="下架" :value="0" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="prodFormVisible = false">取消</el-button>
        <el-button type="primary" @click="saveProduct">保存</el-button>
      </template>
    </el-dialog>

    <!-- 订单状态修改 -->
    <el-dialog v-model="orderEditVisible" title="修改订单状态" width="400px">
      <el-form label-width="80px">
        <el-form-item label="状态">
          <el-select v-model="orderEditStatus">
            <el-option label="待处理" :value="0" />
            <el-option label="处理中" :value="1" />
            <el-option label="已完成" :value="2" />
            <el-option label="已取消" :value="3" />
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

const activeTab = ref('products')
const fmtTime = t => t ? new Date(t).toLocaleString('zh-CN') : ''

const washStatusMap = { 0: '待处理', 1: '处理中', 2: '已完成', 3: '已取消' }
const washStatusTypeMap = { 0: 'info', 1: 'warning', 2: 'success', 3: 'danger' }
function washStatusText(s) { return washStatusMap[s] || '未知' }
function washStatusType(s) { return washStatusTypeMap[s] || 'info' }

const products = ref([]), productsLoading = ref(false), prodPage = ref(1), prodTotal = ref(0)
const prodFormVisible = ref(false), prodForm = ref({}), prodFormId = ref('')

const orders = ref([]), ordersLoading = ref(false), orderPage = ref(1), orderTotal = ref(0)
const orderStatusFilter = ref('')
const orderEditVisible = ref(false), orderEditId = ref(''), orderEditStatus = ref(0)

function onTabChange(tab) {
  if (tab === 'products') loadProducts()
  else if (tab === 'orders') loadOrders()
}

async function loadProducts() {
  productsLoading.value = true
  try {
    const { data } = await api.get('/admin/wash/products', { params: { page: prodPage.value, pageSize: 20 } })
    if (data.code === 0) { products.value = data.data; prodTotal.value = data.total }
  } finally { productsLoading.value = false }
}

function openProductForm(row) {
  if (row) {
    prodFormId.value = row._id
    prodForm.value = { name: row.name, image: row.image, desc: row.desc, originalPrice: row.originalPrice, groupPrice: row.groupPrice, groupSize: row.groupSize, status: row.status }
  } else {
    prodFormId.value = ''
    prodForm.value = { name: '', image: '', desc: '', originalPrice: 0, groupPrice: 0, groupSize: 3, status: 1 }
  }
  prodFormVisible.value = true
}

async function saveProduct() {
  if (!prodForm.value.name) return ElMessage.warning('请输入商品名称')
  if (prodFormId.value) {
    await api.put(`/admin/wash/products/${prodFormId.value}`, prodForm.value)
  } else {
    await api.post('/admin/wash/products', prodForm.value)
  }
  ElMessage.success('已保存')
  prodFormVisible.value = false
  loadProducts()
}

async function deleteProduct(row) {
  await ElMessageBox.confirm('确认删除该商品？', '警告', { type: 'warning' })
  await api.delete(`/admin/wash/products/${row._id}`)
  ElMessage.success('已删除')
  loadProducts()
}

async function loadOrders() {
  ordersLoading.value = true
  try {
    const params = { page: orderPage.value, pageSize: 20 }
    if (orderStatusFilter.value !== '' && orderStatusFilter.value !== null) params.status = orderStatusFilter.value
    const { data } = await api.get('/admin/wash/orders', { params })
    if (data.code === 0) { orders.value = data.data; orderTotal.value = data.total }
  } finally { ordersLoading.value = false }
}

function openOrderEdit(row) {
  orderEditId.value = row._id
  orderEditStatus.value = row.status
  orderEditVisible.value = true
}

async function saveOrderStatus() {
  await api.put(`/admin/wash/orders/${orderEditId.value}`, { status: orderEditStatus.value })
  ElMessage.success('已更新')
  orderEditVisible.value = false
  loadOrders()
}

onMounted(loadProducts)
</script>
