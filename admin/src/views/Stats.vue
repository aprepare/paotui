<template>
  <div>
    <h2>统计管理</h2>
    <el-card style="margin-top:16px;max-width:500px">
      <el-form :model="form" label-width="120px" v-loading="loading">
        <el-form-item label="今日送达数"><el-input-number v-model="form.todayDelivered" :min="0" /></el-form-item>
        <el-form-item label="总订单数"><el-input-number v-model="form.totalOrders" :min="0" /></el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSave">保存</el-button>
          <el-button @click="loadData">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../api/index'

const loading = ref(false)
const form = ref({ todayDelivered: 0, totalOrders: 0 })

async function loadData() {
  loading.value = true
  try {
    const { data } = await api.get('/admin/stats')
    if (data.code === 0 && data.data) {
      form.value = { todayDelivered: data.data.todayDelivered || 0, totalOrders: data.data.totalOrders || 0 }
    }
  } finally { loading.value = false }
}

async function handleSave() {
  await api.put('/admin/stats', form.value)
  ElMessage.success('已保存')
}

onMounted(loadData)
</script>
