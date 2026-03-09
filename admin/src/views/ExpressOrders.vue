<template>
  <div>
    <h2>快递订单管理</h2>
    <el-row :gutter="16" style="margin:16px 0">
      <el-col :span="5">
        <el-input v-model="keyword" placeholder="搜索取件点/楼栋/openid" clearable @clear="loadData" @keyup.enter="loadData" />
      </el-col>
      <el-col :span="4">
        <el-select v-model="statusFilter" placeholder="状态筛选" clearable @change="loadData">
          <el-option label="待接单" :value="0" />
          <el-option label="已接单" :value="1" />
          <el-option label="配送中" :value="2" />
          <el-option label="已完成" :value="3" />
          <el-option label="已取消" :value="4" />
        </el-select>
      </el-col>
      <el-col :span="2"><el-button type="primary" @click="loadData">搜索</el-button></el-col>
      <el-col :span="3"><el-button type="danger" :disabled="!selected.length" @click="batchDelete">批量删除({{ selected.length }})</el-button></el-col>
      <el-col :span="2"><el-button @click="exportCSV">导出</el-button></el-col>
    </el-row>
    <el-table :data="list" v-loading="loading" border stripe @selection-change="handleSelect">
      <el-table-column type="selection" width="40" />
      <el-table-column prop="pickupPoint" label="取件点" width="120" />
      <el-table-column prop="building" label="楼栋" width="80" />
      <el-table-column prop="room" label="房间" width="80" />
      <el-table-column prop="phone" label="手机号" width="120" />
      <el-table-column label="价格" width="80">
        <template #default="{ row }">¥{{ row.price }}</template>
      </el-table-column>
      <el-table-column label="小费" width="70">
        <template #default="{ row }">¥{{ row.tip || 0 }}</template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="170">
        <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button size="small" link type="primary" @click="openDetail(row)">详情</el-button>
          <el-button size="small" link type="warning" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination style="margin-top:16px" :current-page="page" :page-size="pageSize" :total="total" @current-change="p => { page = p; loadData() }" layout="total, prev, pager, next" />

    <el-dialog v-model="detailVisible" title="订单详情" width="600px">
      <el-descriptions :column="2" border v-if="detailRow">
        <el-descriptions-item label="订单ID">{{ detailRow._id }}</el-descriptions-item>
        <el-descriptions-item label="状态"><el-tag :type="statusType(detailRow.status)">{{ statusText(detailRow.status) }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="取件点">{{ detailRow.pickupPoint }}</el-descriptions-item>
        <el-descriptions-item label="取件码">{{ detailRow.pickupCode }}</el-descriptions-item>
        <el-descriptions-item label="快递公司">{{ detailRow.expressCompany }}</el-descriptions-item>
        <el-descriptions-item label="尺寸">{{ detailRow.sizeText }}</el-descriptions-item>
        <el-descriptions-item label="楼栋">{{ detailRow.building }}</el-descriptions-item>
        <el-descriptions-item label="房间">{{ detailRow.room }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ detailRow.phone }}</el-descriptions-item>
        <el-descriptions-item label="价格">¥{{ detailRow.price }}</el-descriptions-item>
        <el-descriptions-item label="小费">¥{{ detailRow.tip || 0 }}</el-descriptions-item>
        <el-descriptions-item label="总价">¥{{ detailRow.totalPrice }}</el-descriptions-item>
        <el-descriptions-item label="用户OpenID" :span="2">{{ detailRow.openid }}</el-descriptions-item>
        <el-descriptions-item label="骑手ID">{{ detailRow.riderId || '无' }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ detailRow.remark || '无' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatTime(detailRow.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="完成时间">{{ formatTime(detailRow.completeTime) }}</el-descriptions-item>
      </el-descriptions>
      <div v-if="detailRow?.pickupPhoto" style="margin-top:12px">
        <span style="font-weight:bold">取件照片：</span>
        <el-image :src="detailRow.pickupPhoto" style="width:120px;height:120px;margin-top:6px" fit="cover" :preview-src-list="[detailRow.pickupPhoto]" />
      </div>
      <div v-if="detailRow?.deliverPhoto" style="margin-top:12px">
        <span style="font-weight:bold">送达照片：</span>
        <el-image :src="detailRow.deliverPhoto" style="width:120px;height:120px;margin-top:6px" fit="cover" :preview-src-list="[detailRow.deliverPhoto]" />
      </div>
    </el-dialog>

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
const keyword = ref('')
const statusFilter = ref('')
const selected = ref([])
const editVisible = ref(false)
const editForm = ref({})
const editId = ref('')
const detailVisible = ref(false)
const detailRow = ref(null)

const statusMap = { 0: '待接单', 1: '已接单', 2: '配送中', 3: '已完成', 4: '已取消' }
const statusTypeMap = { 0: 'info', 1: 'warning', 2: '', 3: 'success', 4: 'danger' }
function statusText(s) { return statusMap[s] || '未知' }
function statusType(s) { return statusTypeMap[s] || 'info' }
function formatTime(t) { return t ? new Date(t).toLocaleString('zh-CN') : '' }

function handleSelect(rows) { selected.value = rows }

async function loadData() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value }
    if (statusFilter.value !== '' && statusFilter.value !== null) params.status = statusFilter.value
    if (keyword.value) params.keyword = keyword.value
    const { data } = await api.get('/admin/express-orders', { params })
    if (data.code === 0) { list.value = data.data; total.value = data.total }
  } finally { loading.value = false }
}

function openDetail(row) { detailRow.value = row; detailVisible.value = true }

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

async function batchDelete() {
  await ElMessageBox.confirm(`确认删除选中的 ${selected.value.length} 个订单？`, '警告', { type: 'warning' })
  await Promise.all(selected.value.map(r => api.delete(`/admin/express-orders/${r._id}`)))
  ElMessage.success('批量删除完成')
  loadData()
}

function exportCSV() {
  const headers = ['ID', '取件点', '楼栋', '房间', '手机', '价格', '小费', '状态', '创建时间']
  const rows = list.value.map(r => [r._id, r.pickupPoint, r.building, r.room, r.phone, r.price, r.tip || 0, statusText(r.status), formatTime(r.createTime)])
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `快递订单_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
}

onMounted(loadData)
</script>
