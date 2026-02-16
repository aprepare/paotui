<template>
  <div>
    <h2>拼车管理</h2>
    <el-button type="primary" style="margin:16px 0" @click="loadData">刷新</el-button>
    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="_id" label="ID" width="220" show-overflow-tooltip />
      <el-table-column prop="from" label="出发地" width="120" />
      <el-table-column prop="to" label="目的地" width="120" />
      <el-table-column prop="departTime" label="出发时间" width="160" />
      <el-table-column label="人数" width="100">
        <template #default="{ row }">{{ row.currentPeople || 0 }}/{{ row.maxPeople }}</template>
      </el-table-column>
      <el-table-column prop="publisher" label="发布者" width="100" />
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

    <el-dialog v-model="editVisible" title="编辑拼车" width="600px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="出发地"><el-input v-model="editForm.from" /></el-form-item>
        <el-form-item label="目的地"><el-input v-model="editForm.to" /></el-form-item>
        <el-form-item label="出发时间"><el-input v-model="editForm.departTime" /></el-form-item>
        <el-form-item label="最大人数"><el-input-number v-model="editForm.maxPeople" :min="1" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="editForm.remark" type="textarea" /></el-form-item>
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
const editVisible = ref(false)
const editForm = ref({})
const editId = ref('')

function formatTime(t) { return t ? new Date(t).toLocaleString('zh-CN') : '' }

async function loadData() {
  loading.value = true
  try {
    const { data } = await api.get('/admin/carpool', { params: { page: page.value, pageSize: pageSize.value } })
    if (data.code === 0) { list.value = data.data; total.value = data.total }
  } finally { loading.value = false }
}

function openEdit(row) {
  editId.value = row._id
  editForm.value = { from: row.from, to: row.to, departTime: row.departTime, maxPeople: row.maxPeople, remark: row.remark }
  editVisible.value = true
}

async function handleEdit() {
  await api.put(`/admin/carpool/${editId.value}`, editForm.value)
  ElMessage.success('已更新')
  editVisible.value = false
  loadData()
}

async function handleDelete(row) {
  await ElMessageBox.confirm('确认删除该拼车？', '警告', { type: 'warning' })
  await api.delete(`/admin/carpool/${row._id}`)
  ElMessage.success('已删除')
  loadData()
}

onMounted(loadData)
</script>
