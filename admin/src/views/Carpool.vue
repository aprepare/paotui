<template>
  <div>
    <h2>拼车管理</h2>
    <el-row :gutter="16" style="margin:16px 0">
      <el-col :span="5">
        <el-input v-model="keyword" placeholder="搜索出发地/目的地" clearable @clear="loadData" @keyup.enter="loadData" />
      </el-col>
      <el-col :span="2"><el-button type="primary" @click="loadData">搜索</el-button></el-col>
      <el-col :span="3"><el-button type="danger" :disabled="!selected.length" @click="batchDelete">批量删除({{ selected.length }})</el-button></el-col>
    </el-row>
    <el-table :data="list" v-loading="loading" border stripe @selection-change="s => selected = s">
      <el-table-column type="selection" width="40" />
      <el-table-column prop="from" label="出发地" width="120" />
      <el-table-column prop="to" label="目的地" width="120" />
      <el-table-column prop="departTime" label="出发时间" width="160" />
      <el-table-column label="人数" width="100">
        <template #default="{ row }">{{ row.currentPeople || 0 }}/{{ row.maxPeople }}</template>
      </el-table-column>
      <el-table-column prop="publisher" label="发布者" width="100" />
      <el-table-column prop="createTime" label="创建时间" width="170">
        <template #default="{ row }">{{ fmtTime(row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button size="small" link type="warning" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" link type="danger" @click="handleDelete(row)">删除</el-button>
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

const list = ref([]), loading = ref(false), page = ref(1), pageSize = ref(20), total = ref(0)
const keyword = ref(''), selected = ref([])
const editVisible = ref(false), editForm = ref({}), editId = ref('')
const fmtTime = t => t ? new Date(t).toLocaleString('zh-CN') : ''

async function loadData() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value }
    if (keyword.value) params.keyword = keyword.value
    const { data } = await api.get('/admin/carpool', { params })
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
  ElMessage.success('已更新'); editVisible.value = false; loadData()
}

async function handleDelete(row) {
  await ElMessageBox.confirm('确认删除该拼车？', '警告', { type: 'warning' })
  await api.delete(`/admin/carpool/${row._id}`)
  ElMessage.success('已删除'); loadData()
}

async function batchDelete() {
  await ElMessageBox.confirm(`确认删除选中的 ${selected.value.length} 个拼车？`, '警告', { type: 'warning' })
  await Promise.all(selected.value.map(r => api.delete(`/admin/carpool/${r._id}`)))
  ElMessage.success('批量删除完成'); loadData()
}

onMounted(loadData)
</script>
