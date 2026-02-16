<template>
  <div>
    <h2>仪表盘</h2>
    <el-row :gutter="20" style="margin-top:20px">
      <el-col :span="6"><el-card><el-statistic title="总用户数" :value="stats.totalUsers" /></el-card></el-col>
      <el-col :span="6"><el-card><el-statistic title="总订单数" :value="stats.totalOrders" /></el-card></el-col>
      <el-col :span="6"><el-card><el-statistic title="今日送达" :value="stats.todayDelivered" /></el-card></el-col>
      <el-col :span="6"><el-card><el-statistic title="总收入 (¥)" :value="stats.totalRevenue" :precision="2" /></el-card></el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../api/index'
const stats = ref({ totalUsers: 0, totalOrders: 0, todayDelivered: 0, totalRevenue: 0 })
onMounted(async () => {
  const { data } = await api.get('/admin/dashboard')
  if (data.code === 0) stats.value = data.data
})
</script>
