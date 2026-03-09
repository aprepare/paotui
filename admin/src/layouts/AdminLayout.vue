<template>
  <el-container style="height: 100vh">
    <el-aside :width="isCollapse ? '64px' : '220px'" style="background: #1d1e2c; transition: width .3s">
      <div class="logo">
        <span v-if="!isCollapse">校园跑腿管理</span>
        <span v-else>PT</span>
      </div>
      <el-menu
        :default-active="$route.path"
        :collapse="isCollapse"
        router
        background-color="#1d1e2c"
        text-color="#a0aec0"
        active-text-color="#409eff"
        :collapse-transition="false"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <template #title>数据总览</template>
        </el-menu-item>

        <el-sub-menu index="order-group">
          <template #title>
            <el-icon><Box /></el-icon>
            <span>订单管理</span>
          </template>
          <el-menu-item index="/express-orders">快递订单</el-menu-item>
          <el-menu-item index="/errand-tasks">跑腿任务</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="content-group">
          <template #title>
            <el-icon><Document /></el-icon>
            <span>内容管理</span>
          </template>
          <el-menu-item index="/forum-posts">论坛帖子</el-menu-item>
          <el-menu-item index="/market-goods">二手市场</el-menu-item>
          <el-menu-item index="/team-activities">组队活动</el-menu-item>
          <el-menu-item index="/carpool">拼车信息</el-menu-item>
          <el-menu-item index="/skills">技能服务</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="merchant-group">
          <template #title>
            <el-icon><Shop /></el-icon>
            <span>商户管理</span>
          </template>
          <el-menu-item index="/food">美食管理</el-menu-item>
          <el-menu-item index="/wash">洗护管理</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="finance-group">
          <template #title>
            <el-icon><Wallet /></el-icon>
            <span>财务管理</span>
          </template>
          <el-menu-item index="/withdrawals">提现审批</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="system-group">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>系统设置</span>
          </template>
          <el-menu-item index="/users">用户管理</el-menu-item>
          <el-menu-item index="/messages">消息管理</el-menu-item>
          <el-menu-item index="/site-config">页面配置</el-menu-item>
          <el-menu-item index="/stats">统计设置</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="top-header">
        <el-icon class="collapse-btn" @click="isCollapse = !isCollapse">
          <Fold v-if="!isCollapse" />
          <Expand v-else />
        </el-icon>
        <div class="header-right">
          <span class="admin-name">{{ auth.username }}</span>
          <el-button text @click="handleLogout">退出登录</el-button>
        </div>
      </el-header>
      <el-main style="background:#f0f2f5; overflow-y: auto">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { DataAnalysis, Box, Document, Shop, Wallet, Setting, Fold, Expand } from '@element-plus/icons-vue'

const router = useRouter()
const auth = useAuthStore()
const isCollapse = ref(false)

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.logo {
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  padding: 20px 0;
  text-align: center;
  border-bottom: 1px solid rgba(255,255,255,.08);
  white-space: nowrap;
  overflow: hidden;
}
.top-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  padding: 0 20px;
}
.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  color: #606266;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.admin-name {
  color: #606266;
  font-size: 14px;
}
</style>
