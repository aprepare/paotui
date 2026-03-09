<template>
  <div>
    <h2>提现管理</h2>
    <el-row :gutter="16" style="margin:16px 0">
      <el-col :span="4">
        <el-select v-model="statusFilter" placeholder="状态筛选" clearable @change="loadData">
          <el-option label="待提现" :value="0" />
          <el-option label="已提现" :value="3" />
          <el-option label="已拒绝" :value="2" />
        </el-select>
      </el-col>
      <el-col :span="6">
        <el-input v-model="searchCode" placeholder="搜索凭证编号" clearable @clear="loadData" @keyup.enter="loadData">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
      </el-col>
      <el-col :span="2"><el-button type="primary" @click="loadData">刷新</el-button></el-col>
    </el-row>
    <el-table :data="filteredList" v-loading="loading" border stripe>
      <el-table-column label="凭证编号" width="160">
        <template #default="{ row }">
          <span style="font-weight:bold;color:#DD6B20;font-family:monospace">{{ row.withdrawCode || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="用户" width="150">
        <template #default="{ row }">
          <div style="display:flex;align-items:center;gap:6px">
            <span>{{ row.userName || (row.userInfo && row.userInfo.name) || '-' }}</span>
          </div>
          <div style="font-size:12px;color:#999">{{ row.userInfo && row.userInfo.phone ? row.userInfo.phone : '' }}</div>
        </template>
      </el-table-column>
      <el-table-column label="金额" width="120">
        <template #default="{ row }">
          <span style="font-weight:bold;color:#f56c6c;font-size:16px">¥{{ row.amount }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="openid" label="OpenID" width="200" show-overflow-tooltip />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="申请时间" width="170">
        <template #default="{ row }">{{ fmtTime(row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="处理时间" width="170">
        <template #default="{ row }">{{ fmtTime(row.paidTime || row.rejectTime || row.handleTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="240" fixed="right">
        <template #default="{ row }">
          <template v-if="row.status === 0">
            <el-button size="small" type="success" @click="handlePaid(row)">✅ 标记已提现</el-button>
            <el-button size="small" type="danger" @click="openReject(row)">拒绝</el-button>
          </template>
          <template v-else>
            <el-tag v-if="row.status === 3" type="success">已提现</el-tag>
            <el-tag v-else-if="row.status === 1" type="success">已通过</el-tag>
            <el-tag v-else type="info">已拒绝</el-tag>
          </template>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination style="margin-top:16px" :current-page="page" :page-size="pageSize" :total="total" @current-change="p => { page = p; loadData() }" layout="total, prev, pager, next" />

    <el-dialog v-model="rejectVisible" title="拒绝提现" width="400px">
      <el-alert type="warning" :closable="false" style="margin-bottom:16px">
        拒绝后将退还用户钱包余额 ¥{{ rejectAmount }}
      </el-alert>
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
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import api from '../api/index'

const list = ref([]), loading = ref(false), page = ref(1), pageSize = ref(20), total = ref(0)
const statusFilter = ref('')
const searchCode = ref('')
const rejectVisible = ref(false), rejectId = ref(''), rejectReason = ref(''), rejectAmount = ref(0)

const statusMap = { 0: '待提现', 1: '已通过', 2: '已拒绝', 3: '已提现' }
const statusTypeMap = { 0: 'warning', 1: 'success', 2: 'danger', 3: 'success' }
function statusText(s) { return statusMap[s] || '未知' }
function statusType(s) { return statusTypeMap[s] || 'info' }
const fmtTime = t => t ? new Date(t).toLocaleString('zh-CN') : ''

const filteredList = computed(() => {
  if (!searchCode.value) return list.value
  const kw = searchCode.value.trim().toUpperCase()
  return list.value.filter(r => (r.withdrawCode || '').toUpperCase().includes(kw))
})

async function loadData() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value }
    if (statusFilter.value !== '' && statusFilter.value !== null) params.status = statusFilter.value
    const { data } = await api.get('/admin/withdrawals', { params })
    if (data.code === 0) { list.value = data.data; total.value = data.total }
  } finally { loading.value = false }
}

async function handlePaid(row) {
  await ElMessageBox.confirm(
    `确认该用户已线下提现 ¥${row.amount}？\n凭证编号: ${row.withdrawCode || '-'}\n用户: ${row.userName || '-'}`,
    '标记已提现',
    { type: 'success', confirmButtonText: '确认已提现', cancelButtonText: '取消' }
  )
  const { data } = await api.put(`/admin/withdrawals/${row._id}/approve`)
  if (data.code === 0) {
    ElMessage.success('已标记为「已提现」')
    loadData()
  } else {
    ElMessage.error(data.msg || '操作失败')
  }
}

function openReject(row) {
  rejectId.value = row._id
  rejectAmount.value = row.amount
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
