<template>
  <div>
    <h2>内容审核</h2>
    <el-tabs v-model="activeTab" @tab-change="loadData">
      <el-tab-pane v-for="tab in tabs" :key="tab.key" :label="tab.label + (counts[tab.key] ? ' (' + counts[tab.key] + ')' : '')" :name="tab.key" />
    </el-tabs>
    <el-empty v-if="!loading && currentList.length === 0" description="暂无待审核内容" />
    <el-table v-else :data="currentList" v-loading="loading" stripe>
      <el-table-column label="类型" width="100">
        <template #default="{row}">
          <el-tag size="small">{{ typeLabel(row._type) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="内容摘要" min-width="250">
        <template #default="{row}">{{ getSummary(row) }}</template>
      </el-table-column>
      <el-table-column label="发布者" width="120">
        <template #default="{row}">{{ row.publisher || row.nickname || row.openid?.substring(0,8) || '-' }}</template>
      </el-table-column>
      <el-table-column label="发布时间" width="170">
        <template #default="{row}">{{ formatTime(row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{row}">
          <el-button type="success" size="small" @click="approve(row)">通过</el-button>
          <el-button type="danger" size="small" @click="reject(row)">拒绝</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../api/index'

const tabs = [
  { key: 'express', label: '快递订单' },
  { key: 'errand', label: '跑腿任务' },
  { key: 'market', label: '二手商品' },
  { key: 'forum', label: '论坛帖子' },
  { key: 'skill', label: '技能服务' },
  { key: 'tutor', label: '家教信息' }
]
const activeTab = ref('express')
const loading = ref(false)
const allData = ref({ express: [], errand: [], market: [], forum: [], skill: [], tutor: [] })
const counts = computed(() => {
  const c = {}
  for (const k of Object.keys(allData.value)) c[k] = allData.value[k].length
  return c
})
const currentList = computed(() => allData.value[activeTab.value] || [])

function typeLabel(t) {
  const m = { express: '快递', errand: '跑腿', market: '商品', forum: '帖子', skill: '技能', tutor: '家教' }
  return m[t] || t
}

function getSummary(row) {
  if (row._type === 'tutor') {
    if (row.type === 'demand') return '[家长需求] ' + (row.title || row.subject || '')
    return '[家教自荐] ' + (row.name || '') + ' - ' + (row.subjects?.join('/') || row.subject || '')
  }
  if (row.title) return row.title
  if (row.content) return row.content.substring(0, 60)
  if (row.pickupPoint) return row.pickupPoint + ' → ' + (row.building || '')
  return row._id
}

function formatTime(t) {
  if (!t) return '-'
  return new Date(t).toLocaleString('zh-CN')
}

async function loadData() {
  loading.value = true
  try {
    const { data } = await api.get('/admin/pending-reviews')
    if (data.code === 0) allData.value = data.data
  } catch (e) { ElMessage.error('加载失败') }
  loading.value = false
}

async function approve(row) {
  try {
    await ElMessageBox.confirm('确认通过该内容？', '审核确认')
  } catch { return }
  try {
    const { data } = await api.put(`/admin/review/${row._type}/${row._id}/approve`)
    if (data.code === 0) { ElMessage.success('已通过'); loadData() }
    else ElMessage.error(data.msg)
  } catch (e) { ElMessage.error('操作失败') }
}

async function reject(row) {
  try {
    await ElMessageBox.confirm('确认拒绝该内容？拒绝后发布者可重新发布。', '拒绝确认', { type: 'warning' })
  } catch { return }
  try {
    const { data } = await api.put(`/admin/review/${row._type}/${row._id}/reject`)
    if (data.code === 0) { ElMessage.success('已拒绝'); loadData() }
    else ElMessage.error(data.msg)
  } catch (e) { ElMessage.error('操作失败') }
}

onMounted(loadData)
</script>
