<template>
  <el-container style="height: 100vh">
    <el-aside width="220px" style="background: #1A1A2E">
      <div class="logo">校园跑腿</div>
      <el-menu :default-active="$route.path" router background-color="#1A1A2E" text-color="#A0AEC0" active-text-color="#4299E1">
        <el-menu-item index="/dashboard">📊 仪表盘</el-menu-item>
        <el-menu-item index="/users">👤 用户管理</el-menu-item>
        <el-menu-item index="/express-orders">📦 快递订单</el-menu-item>
        <el-menu-item index="/errand-tasks">🏃 跑腿任务</el-menu-item>
        <el-menu-item index="/carpool">🚗 拼车</el-menu-item>
        <el-menu-item index="/market-goods">🛒 二手市场</el-menu-item>
        <el-menu-item index="/forum-posts">💬 论坛</el-menu-item>
        <el-menu-item index="/team-activities">🤝 组队</el-menu-item>
        <el-menu-item index="/skills">🎯 技能</el-menu-item>
        <el-menu-item index="/messages">📨 消息</el-menu-item>
        <el-menu-item index="/page-config">🏠 首页配置</el-menu-item>
        <el-menu-item index="/stats">📈 统计</el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header style="display:flex;align-items:center;justify-content:flex-end;background:#fff;border-bottom:1px solid #e2e8f0">
        <span style="margin-right:16px">{{ auth.username }}</span>
        <el-button text @click="handleLogout">退出</el-button>
      </el-header>
      <el-main style="background:#f0f2f5">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
const router = useRouter()
const auth = useAuthStore()
function handleLogout() { auth.logout(); router.push('/login') }
</script>

<style scoped>
.logo { color: #fff; font-size: 20px; font-weight: bold; padding: 20px; text-align: center; }
</style>
