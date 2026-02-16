<template>
  <div>
    <h2>快递订单管理</h2>
    <el-row :gutter="16" style="margin:16px 0">
      <el-col :span="4">
        <el-select v-model="statusFilter" placeholder="状态筛选" clearable @change="loadData">
          <el-option label="待接单" :value="0" />
          <el-option label="已接单" :value="1" />
          <el-option label="配送中" :value="2" />
          <el-option label="已完成" :value="3" />
          <el-option label="已取消" :value="4" />
        </el-select>
      </el-col>
      <el-col :span="2"><el-button type="primary" @click="loadData">刷新</el-button></el-col>
    </el-row>
    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="_id" label="ID" width="220" show-overflow-tooltip />
      <el-table-column prop="pickupPoint" label="取件点" width="120" />
      <el-table-column prop="building" label="楼栋" width="80" />
      <el-table-column prop="room" label="房间" width="80" />
      <el-table-column prop="price" label="价格" width="80" />
      <el-table-column prop="tip" label="小费" width="80" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="180">
        <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination style="margin-top:16px" :current-page="page" :page-size="pageSize" :total="total" @current-change="p => { page = p; loadData() }" layout="total, prev, pager, next" />

    <el-dialog v-model="editVisible" title="编辑快递订单" width="600px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="取件点"><el-input v-model="editForm.pickupPoint" /></el-form-item>
        <el-form-item label="楼栋"><el-input v-model="editForm.building" /></el-form-item>
        <el-form-item label="房间"><el-input v-model="editForm.room" /></el-form-item>
        <el-form-item label="价格"><el-input-number v-model="editForm.price" :min="0" :precision="2" /></el-form-item>
        <el-form-item label="小费"><el-input-number v-model="editForm.tip" :min="0" :precision="2" /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="editForm.status">
            <el-option label="待接单" :value="0" />
            <el-option label="已接单" :value="1" />
            <el-option label="配送中" :value="2" />
            <el-option label="已完成" :value="3" />
            <el-option label="已取消" :value="4" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="handleEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../api/index'

const list = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const statusFilter = ref('')
const editVisible = ref(false)
const editForm = ref({})
const editId = ref('')

const statusMap = { 0: '待接单', 1: '已接单', 2: '配送中', 3: '已完成', 4: '已取消' }
const statusTypeMap = { 0: 'info', 1: 'warning', 2: '', 3: 'success', 4: 'danger' }
function statusText(s) { return statusMap[s] || '未知' }
function statusType(s) { return statusTypeMap[s] || 'info' }
function formatTime(t) { return t ? new Date(t).toLocaleString('zh-CN') : '' }

async function loadData() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value }
    if (statusFilter.value !== '' && statusFilter.value !== null) params.status = statusFilter.value
    const { data } = await api.get('/admin/express-orders', { params })
    if (data.code === 0) { list.value = data.data; total.value = data.total }
  } finally { loading.value = false }
}

function openEdit(row) {
  editId.value = row._id
  editForm.value = { pickupPoint: row.pickupPoint, building: row.building, room: row.room, price: row.price, tip: row.tip, status: row.status }
  editVisible.value = true
}

async function handleEdit() {
  await api.put(`/admin/express-orders/${editId.value}`, editForm.value)
  ElMessage.success('已更新')
  editVisible.value = false
  loadData()
}

async function handleDelete(row) {
  await ElMessageBox.confirm('确认删除该订单？', '警告', { type: 'warning' })
  await api.delete(`/admin/express-orders/${row._id}`)
  ElMessage.success('已删除')
  loadData()
}

onMounted(loadData)
</script>
