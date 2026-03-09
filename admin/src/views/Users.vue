<template>
  <div>
    <h2>用户管理</h2>
    <el-row :gutter="16" style="margin:16px 0">
      <el-col :span="6">
        <el-input v-model="keyword" placeholder="搜索姓名/手机/openid" clearable @clear="loadData" @keyup.enter="loadData" />
      </el-col>
      <el-col :span="4">
        <el-select v-model="isRider" placeholder="骑手状态" clearable @change="loadData">
          <el-option label="骑手" value="true" />
          <el-option label="普通用户" value="false" />
        </el-select>
      </el-col>
      <el-col :span="2"><el-button type="primary" @click="loadData">搜索</el-button></el-col>
      <el-col :span="2"><el-button @click="exportCSV">导出</el-button></el-col>
    </el-row>
    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="name" label="昵称" width="120" />
      <el-table-column label="头像" width="60">
        <template #default="{ row }">
          <el-avatar v-if="row.avatar" :src="row.avatar" :size="32" />
          <el-avatar v-else :size="32">{{ (row.name || '?')[0] }}</el-avatar>
        </template>
      </el-table-column>
      <el-table-column prop="phone" label="手机" width="130" />
      <el-table-column prop="openid" label="OpenID" width="180" show-overflow-tooltip />
      <el-table-column label="骑手" width="70">
        <template #default="{ row }">
          <el-tag :type="row.isRider ? 'success' : 'info'" size="small">{{ row.isRider ? '是' : '否' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="余额" width="80">
        <template #default="{ row }">¥{{ (row.balance || 0).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="70">
        <template #default="{ row }">
          <el-tag :type="row.disabled ? 'danger' : 'success'" size="small">{{ row.disabled ? '禁用' : '正常' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="注册时间" width="170">
        <template #default="{ row }">{{ fmtTime(row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button size="small" link type="primary" @click="openDetail(row)">详情</el-button>
          <el-button size="small" link type="warning" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" link :type="row.disabled ? 'success' : 'danger'" @click="toggleDisable(row)">
            {{ row.disabled ? '启用' : '禁用' }}
          </el-button>
          <el-button size="small" link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination style="margin-top:16px" :current-page="page" :page-size="pageSize" :total="total" @current-change="p => { page = p; loadData() }" layout="total, prev, pager, next" />

    <el-dialog v-model="detailVisible" title="用户详情" width="600px">
      <el-descriptions :column="2" border v-if="detailRow">
        <el-descriptions-item label="昵称">{{ detailRow.name }}</el-descriptions-item>
        <el-descriptions-item label="手机">{{ detailRow.phone || '未绑定' }}</el-descriptions-item>
        <el-descriptions-item label="OpenID" :span="2">{{ detailRow.openid }}</el-descriptions-item>
        <el-descriptions-item label="骑手">{{ detailRow.isRider ? '是' : '否' }}</el-descriptions-item>
        <el-descriptions-item label="余额">¥{{ (detailRow.balance || 0).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="detailRow.disabled ? 'danger' : 'success'">{{ detailRow.disabled ? '禁用' : '正常' }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="注册时间">{{ fmtTime(detailRow.createTime) }}</el-descriptions-item>
      </el-descriptions>
      <div v-if="detailRow?.riderInfo" style="margin-top:16px">
        <h4>骑手信息</h4>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="真实姓名">{{ detailRow.riderInfo?.realName }}</el-descriptions-item>
          <el-descriptions-item label="学号">{{ detailRow.riderInfo?.studentId }}</el-descriptions-item>
          <el-descriptions-item label="手机">{{ detailRow.riderInfo?.phone }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

    <el-dialog v-model="editVisible" title="编辑用户" width="500px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="昵称"><el-input v-model="editForm.name" /></el-form-item>
        <el-form-item label="手机"><el-input v-model="editForm.phone" /></el-form-item>
        <el-form-item label="骑手"><el-switch v-model="editForm.isRider" /></el-form-item>
        <el-form-item label="禁用"><el-switch v-model="editForm.disabled" /></el-form-item>
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

const list = ref([]), loading = ref(false), page = ref(1), pageSize = ref(20), total = ref(0)
const keyword = ref(''), isRider = ref('')
const editVisible = ref(false), editForm = ref({}), editId = ref('')
const detailVisible = ref(false), detailRow = ref(null)
const fmtTime = t => t ? new Date(t).toLocaleString('zh-CN') : ''

async function loadData() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value }
    if (keyword.value) params.keyword = keyword.value
    if (isRider.value !== '') params.isRider = isRider.value
    const { data } = await api.get('/admin/users', { params })
    if (data.code === 0) { list.value = data.data; total.value = data.total }
  } finally { loading.value = false }
}

function openDetail(row) { detailRow.value = row; detailVisible.value = true }

function openEdit(row) {
  editId.value = row._id
  editForm.value = { name: row.name, phone: row.phone, isRider: !!row.isRider, disabled: !!row.disabled }
  editVisible.value = true
}

async function handleEdit() {
  await api.put(`/admin/users/${editId.value}`, editForm.value)
  ElMessage.success('已更新')
  editVisible.value = false
  loadData()
}

async function toggleDisable(row) {
  const newState = !row.disabled
  await ElMessageBox.confirm(`确认${newState ? '禁用' : '启用'}该用户？`, '确认', { type: 'warning' })
  await api.put(`/admin/users/${row._id}`, { disabled: newState })
  ElMessage.success(newState ? '已禁用' : '已启用')
  loadData()
}

async function handleDelete(row) {
  await ElMessageBox.confirm('删除用户将同时删除其收藏和消息，确认？', '警告', { type: 'warning' })
  await api.delete(`/admin/users/${row._id}`)
  ElMessage.success('已删除')
  loadData()
}

function exportCSV() {
  const headers = ['昵称', '手机', 'OpenID', '骑手', '余额', '状态', '注册时间']
  const rows = list.value.map(r => [r.name, r.phone, r.openid, r.isRider ? '是' : '否', r.balance || 0, r.disabled ? '禁用' : '正常', fmtTime(r.createTime)])
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `用户列表_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
}

onMounted(loadData)
</script>
