<template>
  <div>
    <h2>提现审批</h2>
    <el-row :gutter="16" style="margin:16px 0">
      <el-col :span="4">
        <el-select v-model="statusFilter" placeholder="状态筛选" clearable @change="loadData">
          <el-option label="待审批" :value="0" />
          <el-option label="已通过" :value="1" />
          <el-option label="已拒绝" :value="2" />
        </el-select>
      </el-col>
      <el-col :span="2"><el-button type="primary" @click="loadData">刷新</el-button></el-col>
    </el-row>
    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="_id" label="ID" width="220" show-overflow-tooltip />
      <el-table-column prop="openid" label="用户OpenID" width="200" show-overflow-tooltip />
      <el-table-column label="金额" width="100">
        <template #default="{ row }">
          <span style="font-weight:bold;color:#f56c6c">¥{{ row.amount }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="realName" label="真实姓名" width="100" />
      <el-table-column prop="account" label="提现账号" width="150" show-overflow-tooltip />
      <el-table-column prop="accountType" label="账号类型" width="90" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="申请时间" width="170">
        <template #default="{ row }">{{ fmtTime(row.createTime) }}</template>
      </el-table-column>
      <el-table-column prop="handleTime" label="处理时间" width="170">
        <template #default="{ row }">{{ fmtTime(row.handleTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <template v-if="row.status === 0">
            <el-button size="small" type="success" @click="handleApprove(row)">通过</el-button>
            <el-button size="small" type="danger" @click="openReject(row)">拒绝</el-button>
          </template>
          <template v-else>
            <el-tag v-if="row.status === 1" type="success">已处理</el-tag>
            <el-tag v-else type="info">已拒绝</el-tag>
          </template>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination style="margin-top:16px" :current-page="page" :page-size="pageSize" :total="total" @current-change="p => { page = p; loadData() }" layout="total, prev, pager, next" />

    <el-dialog v-model="rejectVisible" title="拒绝提现" width="400px">
      <el-form label-width="80px">
        <el-form-item label="拒绝理由">
          <el-input v-model="rejectReason" type="textarea" :rows="3" placeholder="请输入拒绝理由（选填）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectVisible = false">取消</el-button>
        <el-button type="danger" @click="handleReject">确认拒绝</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../api/index'

const list = ref([]), loading = ref(false), page = ref(1), pageSize = ref(20), total = ref(0)
const statusFilter = ref('')
const rejectVisible = ref(false), rejectId = ref(''), rejectReason = ref('')

const statusMap = { 0: '待审批', 1: '已通过', 2: '已拒绝' }
const statusTypeMap = { 0: 'warning', 1: 'success', 2: 'danger' }
function statusText(s) { return statusMap[s] || '未知' }
function statusType(s) { return statusTypeMap[s] || 'info' }
const fmtTime = t => t ? new Date(t).toLocaleString('zh-CN') : ''

async function loadData() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value }
    if (statusFilter.value !== '' && statusFilter.value !== null) params.status = statusFilter.value
    const { data } = await api.get('/admin/withdrawals', { params })
    if (data.code === 0) { list.value = data.data; total.value = data.total }
  } finally { loading.value = false }
}

async function handleApprove(row) {
  await ElMessageBox.confirm(`确认通过该笔 ¥${row.amount} 的提现申请？`, '审批确认', { type: 'info' })
  const { data } = await api.put(`/admin/withdrawals/${row._id}/approve`)
  if (data.code === 0) {
    ElMessage.success('已通过')
    loadData()
  } else {
    ElMessage.error(data.msg || '操作失败')
  }
}

function openReject(row) {
  rejectId.value = row._id
  rejectReason.value = ''
  rejectVisible.value = true
}

async function handleReject() {
  const { data } = await api.put(`/admin/withdrawals/${rejectId.value}/reject`, { reason: rejectReason.value })
  if (data.code === 0) {
    ElMessage.success('已拒绝，余额已退回')
    rejectVisible.value = false
    loadData()
  } else {
    ElMessage.error(data.msg || '操作失败')
  }
}

onMounted(loadData)
</script>
