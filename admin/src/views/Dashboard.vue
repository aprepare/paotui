<template>
  <div>
    <h2 style="margin-bottom: 20px">数据总览</h2>

    <el-row :gutter="16">
      <el-col :span="4" v-for="card in statCards" :key="card.label">
        <el-card shadow="hover" :body-style="{ padding: '20px' }">
          <div class="stat-card">
            <div class="stat-value" :style="{ color: card.color }">{{ card.value }}</div>
            <div class="stat-label">{{ card.label }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 20px">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span>订单趋势</span>
              <el-radio-group v-model="trendDays" size="small" @change="loadTrend">
                <el-radio-button :value="7">7天</el-radio-button>
                <el-radio-button :value="30">30天</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="orderChartRef" style="height: 320px"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header><span>待处理事项</span></template>
          <div class="pending-list">
            <div class="pending-item" v-for="item in pendingItems" :key="item.label" @click="$router.push(item.route)">
              <span>{{ item.label }}</span>
              <el-badge :value="item.count" :type="item.count > 0 ? 'danger' : 'info'" />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header><span>收入趋势</span></template>
          <div ref="revenueChartRef" style="height: 280px"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header><span>用户增长</span></template>
          <div ref="userChartRef" style="height: 280px"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import api from '../api/index'

const stats = ref({ totalUsers: 0, totalOrders: 0, todayOrders: 0, todayUsers: 0, totalRevenue: 0, pendingWithdrawals: 0 })
const trendDays = ref(7)
const trendData = ref([])
const revenueData = ref([])

const orderChartRef = ref(null)
const revenueChartRef = ref(null)
const userChartRef = ref(null)
let orderChart, revenueChart, userChart

const statCards = computed(() => [
  { label: '总用户', value: stats.value.totalUsers, color: '#409eff' },
  { label: '总订单', value: stats.value.totalOrders, color: '#67c23a' },
  { label: '今日订单', value: stats.value.todayOrders, color: '#e6a23c' },
  { label: '今日新用户', value: stats.value.todayUsers, color: '#f56c6c' },
  { label: '总收入(¥)', value: stats.value.totalRevenue, color: '#409eff' },
  { label: '待审提现', value: stats.value.pendingWithdrawals, color: '#f56c6c' }
])

const pendingItems = computed(() => [
  { label: '待审提现', count: stats.value.pendingWithdrawals, route: '/withdrawals' }
])

async function loadStats() {
  try {
    const { data } = await api.get('/admin/dashboard')
    if (data.code === 0) stats.value = data.data
  } catch (e) { /* ignore */ }
}

async function loadTrend() {
  try {
    const [tRes, rRes] = await Promise.all([
      api.get('/admin/analytics/overview', { params: { days: trendDays.value } }),
      api.get('/admin/analytics/revenue', { params: { days: trendDays.value } })
    ])
    if (tRes.data.code === 0) trendData.value = tRes.data.data
    if (rRes.data.code === 0) revenueData.value = rRes.data.data
    await nextTick()
    renderOrderChart()
    renderRevenueChart()
    renderUserChart()
  } catch (e) { /* ignore */ }
}

function renderOrderChart() {
  if (!orderChartRef.value) return
  if (!orderChart) orderChart = echarts.init(orderChartRef.value)
  const dates = trendData.value.map(d => d.date.slice(5))
  orderChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['快递', '跑腿', '美食', '洗护'] },
    grid: { left: 40, right: 20, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: dates },
    yAxis: { type: 'value', minInterval: 1 },
    series: [
      { name: '快递', type: 'line', smooth: true, data: trendData.value.map(d => d.express) },
      { name: '跑腿', type: 'line', smooth: true, data: trendData.value.map(d => d.errand) },
      { name: '美食', type: 'line', smooth: true, data: trendData.value.map(d => d.food) },
      { name: '洗护', type: 'line', smooth: true, data: trendData.value.map(d => d.wash) }
    ]
  })
}

function renderRevenueChart() {
  if (!revenueChartRef.value) return
  if (!revenueChart) revenueChart = echarts.init(revenueChartRef.value)
  const dates = revenueData.value.map(d => d.date.slice(5))
  revenueChart.setOption({
    tooltip: { trigger: 'axis', formatter: '{b}<br/>收入: ¥{c}' },
    grid: { left: 50, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: dates },
    yAxis: { type: 'value' },
    series: [{
      type: 'bar', data: revenueData.value.map(d => d.revenue),
      itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: '#409eff' }, { offset: 1, color: '#79bbff' }
      ])}
    }]
  })
}

function renderUserChart() {
  if (!userChartRef.value) return
  if (!userChart) userChart = echarts.init(userChartRef.value)
  const dates = trendData.value.map(d => d.date.slice(5))
  userChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: dates },
    yAxis: { type: 'value', minInterval: 1 },
    series: [{
      type: 'bar', data: trendData.value.map(d => d.newUsers),
      itemStyle: { color: '#67c23a' }
    }]
  })
}

function handleResize() {
  orderChart?.resize()
  revenueChart?.resize()
  userChart?.resize()
}

onMounted(async () => {
  await loadStats()
  await loadTrend()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  orderChart?.dispose()
  revenueChart?.dispose()
  userChart?.dispose()
})
</script>

<style scoped>
.stat-card { text-align: center; }
.stat-value { font-size: 28px; font-weight: bold; }
.stat-label { color: #909399; font-size: 13px; margin-top: 6px; }
.pending-list { display: flex; flex-direction: column; gap: 12px; }
.pending-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 12px; background: #fafafa; border-radius: 6px; cursor: pointer;
  transition: background .2s;
}
.pending-item:hover { background: #f0f0f0; }
</style>
