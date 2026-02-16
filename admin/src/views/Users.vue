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
    </el-row>
    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="_id" label="ID" width="220" />
      <el-table-column prop="name" label="昵称" width="120" />
      <el-table-column prop="phone" label="手机" width="130" />
      <el-table-column prop="openid" label="OpenID" width="200" show-overflow-tooltip />
      <el-table-column label="骑手" width="80">
        <template #default="{ row }">{{ row.isRider ? '是' : '否' }}</template>
      </el-table-column>
      <el-table-column prop="createTime" label="注册时间" width="180">
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

    <el-dialog v-model="editVisible" title="编辑用户" width="500px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="昵称"><el-input v-model="editForm.name" /></el-form-item>
        <el-form-item label="手机"><el-input v-model="editForm.phone" /></el-form-item>
        <el-form-item label="骑手"><el-switch v-model="editForm.isRider" /></el-form-item>
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
const isRider = ref('')
const editVisible = ref(false)
const editForm = ref({})
const editId = ref('')

function formatTime(t) { return t ? new Date(t).toLocaleString('zh-CN') : '' }

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

function openEdit(row) {
  editId.value = row._id
  editForm.value = { name: row.name, phone: row.phone, isRider: !!row.isRider }
  editVisible.value = true
}

async function handleEdit() {
  await api.put(`/admin/users/${editId.value}`, editForm.value)
  ElMessage.success('已更新')
  editVisible.value = false
  loadData()
}

async function handleDelete(row) {
  await ElMessageBox.confirm('删除用户将同时删除其收藏和消息，确认？', '警告', { type: 'warning' })
  await api.delete(`/admin/users/${row._id}`)
  ElMessage.success('已删除')
  loadData()
}

onMounted(loadData)
</script>
