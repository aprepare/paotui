<template>
  <div>
    <h2>消息管理</h2>
    <el-row :gutter="16" style="margin:16px 0">
      <el-col :span="2"><el-button type="primary" @click="loadData">刷新</el-button></el-col>
      <el-col :span="3"><el-button type="success" @click="sendVisible = true">发送系统消息</el-button></el-col>
    </el-row>
    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="_id" label="ID" width="220" show-overflow-tooltip />
      <el-table-column prop="type" label="类型" width="80" />
      <el-table-column prop="title" label="标题" width="140" show-overflow-tooltip />
      <el-table-column prop="content" label="内容" min-width="180" show-overflow-tooltip />
      <el-table-column prop="toOpenid" label="接收者" width="180" show-overflow-tooltip />
      <el-table-column prop="fromName" label="发送者" width="100" />
      <el-table-column label="已读" width="70">
        <template #default="{ row }">{{ row.read ? '是' : '否' }}</template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="180">
        <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="80" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination style="margin-top:16px" :current-page="page" :page-size="pageSize" :total="total" @current-change="p => { page = p; loadData() }" layout="total, prev, pager, next" />

    <el-dialog v-model="sendVisible" title="发送系统消息" width="500px">
      <el-form :model="sendForm" label-width="80px">
        <el-form-item label="接收者"><el-input v-model="sendForm.toOpenid" placeholder="目标用户 openid" /></el-form-item>
        <el-form-item label="标题"><el-input v-model="sendForm.title" /></el-form-item>
        <el-form-item label="内容"><el-input v-model="sendForm.content" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="sendVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSend">发送</el-button>
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
const sendVisible = ref(false)
const sendForm = ref({ toOpenid: '', title: '', content: '' })

function formatTime(t) { return t ? new Date(t).toLocaleString('zh-CN') : '' }

async function loadData() {
  loading.value = true
  try {
    const { data } = await api.get('/admin/messages', { params: { page: page.value, pageSize: pageSize.value } })
    if (data.code === 0) { list.value = data.data; total.value = data.total }
  } finally { loading.value = false }
}

async function handleSend() {
  if (!sendForm.value.toOpenid) return ElMessage.warning('请输入接收者 openid')
  await api.post('/admin/messages', sendForm.value)
  ElMessage.success('已发送')
  sendVisible.value = false
  sendForm.value = { toOpenid: '', title: '', content: '' }
  loadData()
}

async function handleDelete(row) {
  await ElMessageBox.confirm('确认删除该消息？', '警告', { type: 'warning' })
  await api.delete(`/admin/messages/${row._id}`)
  ElMessage.success('已删除')
  loadData()
}

onMounted(loadData)
</script>
