<template>
  <div>
    <h2>骑手审核</h2>
    <el-radio-group v-model="filterStatus" @change="loadList" style="margin-bottom:16px">
      <el-radio-button value="pending">待审核</el-radio-button>
      <el-radio-button value="approved">已通过</el-radio-button>
      <el-radio-button value="rejected">已拒绝</el-radio-button>
    </el-radio-group>
    <el-table :data="list" v-loading="loading" stripe>
      <el-table-column label="姓名" width="100">
        <template #default="{row}">{{ row.riderInfo?.realName || '-' }}</template>
      </el-table-column>
      <el-table-column label="手机号" width="130">
        <template #default="{row}">{{ row.riderInfo?.phone || '-' }}</template>
      </el-table-column>
      <el-table-column label="学校" width="150">
        <template #default="{row}">{{ row.riderInfo?.school || '-' }}</template>
      </el-table-column>
      <el-table-column label="学号" width="140">
        <template #default="{row}">{{ row.riderInfo?.studentId || '-' }}</template>
      </el-table-column>
      <el-table-column label="宿舍楼" width="120">
        <template #default="{row}">{{ row.riderInfo?.building || '-' }}</template>
      </el-table-column>
      <el-table-column label="骑手ID" prop="riderId" width="160" />
      <el-table-column label="申请时间" width="170">
        <template #default="{row}">{{ formatTime(row.riderRegTime) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{row}">
          <el-tag :type="row.riderStatus === 'pending' ? 'warning' : row.riderStatus === 'approved' ? 'success' : 'danger'">
            {{ row.riderStatus === 'pending' ? '待审核' : row.riderStatus === 'approved' ? '已通过' : '已拒绝' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{row}">
          <template v-if="row.riderStatus === 'pending'">
            <el-button type="success" size="small" @click="approve(row)">通过</el-button>
            <el-button type="danger" size="small" @click="reject(row)">拒绝</el-button>
          </template>
          <span v-else style="color:#999">已处理</span>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../api/index'

const list = ref([])
const loading = ref(false)
const filterStatus = ref('pending')

function formatTime(t) {
  if (!t) return '-'
  return new Date(t).toLocaleString('zh-CN')
}

async function loadList() {
  loading.value = true
  try {
    const { data } = await api.get('/admin/rider-applications', { params: { status: filterStatus.value } })
    if (data.code === 0) list.value = data.data || []
  } catch (e) { ElMessage.error('加载失败') }
  loading.value = false
}

async function approve(row) {
  try {
    await ElMessageBox.confirm('确认通过该骑手注册申请？', '审核确认')
  } catch { return }
  try {
    const { data } = await api.put(`/admin/rider-applications/${row._id}/approve`)
    if (data.code === 0) { ElMessage.success('已通过'); loadList() }
    else ElMessage.error(data.msg)
  } catch (e) { ElMessage.error('操作失败') }
}

async function reject(row) {
  try {
    const { value: reason } = await ElMessageBox.prompt('请输入拒绝原因（可选）', '拒绝申请', {
      inputPlaceholder: '如：信息不完整',
      confirmButtonText: '确认拒绝',
      type: 'warning'
    })
    const { data } = await api.put(`/admin/rider-applications/${row._id}/reject`, { reason: reason || '' })
    if (data.code === 0) { ElMessage.success('已拒绝'); loadList() }
    else ElMessage.error(data.msg)
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('操作失败')
  }
}

onMounted(loadList)
</script>
