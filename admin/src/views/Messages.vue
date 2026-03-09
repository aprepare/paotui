<template>
  <div>
    <h2>消息管理</h2>
    <el-row :gutter="16" style="margin:16px 0">
      <el-col :span="5">
        <el-input v-model="keyword" placeholder="搜索标题/内容" clearable @clear="loadData" @keyup.enter="loadData" />
      </el-col>
      <el-col :span="2"><el-button type="primary" @click="loadData">搜索</el-button></el-col>
      <el-col :span="3"><el-button type="success" @click="sendVisible = true">发送系统消息</el-button></el-col>
      <el-col :span="3"><el-button type="danger" :disabled="!selected.length" @click="batchDelete">批量删除({{ selected.length }})</el-button></el-col>
    </el-row>
    <el-table :data="list" v-loading="loading" border stripe @selection-change="s => selected = s">
      <el-table-column type="selection" width="40" />
      <el-table-column prop="type" label="类型" width="80" />
      <el-table-column prop="title" label="标题" width="140" show-overflow-tooltip />
      <el-table-column prop="content" label="内容" min-width="180" show-overflow-tooltip />
      <el-table-column prop="toOpenid" label="接收者" width="180" show-overflow-tooltip />
      <el-table-column prop="fromName" label="发送者" width="100" />
      <el-table-column label="已读" width="70">
        <template #default="{ row }">{{ row.read ? '是' : '否' }}</template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="170">
        <template #default="{ row }">{{ fmtTime(row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="80" fixed="right">
        <template #default="{ row }">
          <el-button size="small" link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination style="margin-top:16px" :current-page="page" :page-size="pageSize" :total="total" @current-change="p => { page = p; loadData() }" layout="total, prev, pager, next" />

    <el-dialog v-model="sendVisible" title="发送系统消息" width="500px">
      <el-form :model="sendForm" label-width="80px">
        <el-form-item label="发送方式">
          <el-radio-group v-model="sendForm.broadcast">
            <el-radio :value="false">指定用户</el-radio>
            <el-radio :value="true">全体广播</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="!sendForm.broadcast" label="接收者">
          <el-input v-model="sendForm.toOpenid" placeholder="目标用户 openid" />
        </el-form-item>
        <el-form-item label="标题"><el-input v-model="sendForm.title" /></el-form-item>
        <el-form-item label="内容"><el-input v-model="sendForm.content" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="sendVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSend" :loading="sending">发送</el-button>
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
const sendVisible = ref(false), sending = ref(false)
const sendForm = ref({ toOpenid: '', title: '', content: '', broadcast: false })
const fmtTime = t => t ? new Date(t).toLocaleString('zh-CN') : ''

async function loadData() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value }
    if (keyword.value) params.keyword = keyword.value
    const { data } = await api.get('/admin/messages', { params })
    if (data.code === 0) { list.value = data.data; total.value = data.total }
  } finally { loading.value = false }
}

async function handleSend() {
  if (!sendForm.value.title && !sendForm.value.content) return ElMessage.warning('请输入标题或内容')
  if (!sendForm.value.broadcast && !sendForm.value.toOpenid) return ElMessage.warning('请输入接收者 openid')
  if (sendForm.value.broadcast) {
    await ElMessageBox.confirm('确认向所有用户发送广播消息？', '确认', { type: 'warning' })
  }
  sending.value = true
  try {
    const payload = { title: sendForm.value.title, content: sendForm.value.content }
    if (!sendForm.value.broadcast) payload.toOpenid = sendForm.value.toOpenid
    await api.post('/admin/messages', payload)
    ElMessage.success(sendForm.value.broadcast ? '广播发送成功' : '消息已发送')
    sendVisible.value = false
    sendForm.value = { toOpenid: '', title: '', content: '', broadcast: false }
    loadData()
  } finally { sending.value = false }
}

async function handleDelete(row) {
  await ElMessageBox.confirm('确认删除该消息？', '警告', { type: 'warning' })
  await api.delete(`/admin/messages/${row._id}`)
  ElMessage.success('已删除'); loadData()
}

async function batchDelete() {
  await ElMessageBox.confirm(`确认删除选中的 ${selected.value.length} 条消息？`, '警告', { type: 'warning' })
  await Promise.all(selected.value.map(r => api.delete(`/admin/messages/${r._id}`)))
  ElMessage.success('批量删除完成'); loadData()
}

onMounted(loadData)
</script>
