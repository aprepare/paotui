<template>
  <div>
    <h2>首页配置</h2>
    <el-row style="margin:16px 0" :gutter="16">
      <el-col :span="3"><el-button type="primary" @click="loadData">刷新</el-button></el-col>
      <el-col :span="3"><el-button type="success" @click="handleSave">保存配置</el-button></el-col>
      <el-col :span="3"><el-button @click="addSection">添加区块</el-button></el-col>
    </el-row>

    <draggable v-model="sections" item-key="key" handle=".drag-handle" @end="onDragEnd">
      <template #item="{ element: sec, index: si }">
        <el-card style="margin-bottom:16px">
          <template #header>
            <div style="display:flex;align-items:center;gap:12px">
              <el-icon class="drag-handle" style="cursor:move"><Rank /></el-icon>
              <el-input v-model="sec.key" style="width:120px" placeholder="key" />
              <el-input v-model="sec.title" style="width:160px" placeholder="标题" />
              <el-switch v-model="sec.visible" active-text="显示" inactive-text="隐藏" />
              <el-button type="danger" size="small" @click="sections.splice(si, 1)">删除区块</el-button>
              <el-button size="small" @click="addItem(si)">添加项目</el-button>
            </div>
          </template>
          <draggable v-model="sec.items" item-key="order" handle=".item-drag" style="display:flex;flex-wrap:wrap;gap:12px">
            <template #item="{ element: item, index: ii }">
              <el-card shadow="hover" style="width:220px">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
                  <el-icon class="item-drag" style="cursor:move"><Rank /></el-icon>
                  <span style="font-size:12px;color:#999">项目 {{ ii + 1 }}</span>
                  <el-button type="danger" size="small" text @click="sec.items.splice(ii, 1)">删除</el-button>
                </div>
                <el-form label-width="50px" size="small">
                  <el-form-item label="文字"><el-input v-model="item.text" /></el-form-item>
                  <el-form-item label="Emoji"><el-input v-model="item.emoji" /></el-form-item>
                  <el-form-item label="图片"><el-input v-model="item.image" placeholder="URL" /></el-form-item>
                  <el-form-item label="链接"><el-input v-model="item.link" /></el-form-item>
                  <el-form-item label="背景"><el-input v-model="item.bg" /></el-form-item>
                </el-form>
              </el-card>
            </template>
          </draggable>
        </el-card>
      </template>
    </draggable>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Rank } from '@element-plus/icons-vue'
import draggable from 'vuedraggable'
import api from '../api/index'

const sections = ref([])

async function loadData() {
  const { data } = await api.get('/admin/page-config')
  if (data.code === 0 && data.data) {
    sections.value = (data.data.sections || []).map((s, i) => ({
      ...s, order: s.order ?? i, visible: s.visible !== false,
      items: (s.items || []).map((it, j) => ({ ...it, order: it.order ?? j }))
    }))
  }
}

function addSection() {
  sections.value.push({ key: '', title: '', order: sections.value.length, visible: true, items: [] })
}

function addItem(si) {
  sections.value[si].items.push({ text: '', emoji: '', image: '', link: '', bg: '', order: sections.value[si].items.length })
}

function onDragEnd() {
  sections.value.forEach((s, i) => { s.order = i })
}

async function handleSave() {
  const payload = sections.value.map((s, i) => ({
    key: s.key, title: s.title, order: i, visible: s.visible,
    items: (s.items || []).map((it, j) => ({ text: it.text, emoji: it.emoji, image: it.image, link: it.link, bg: it.bg, order: j }))
  }))
  await api.put('/admin/page-config', { sections: payload })
  ElMessage.success('配置已保存')
}

onMounted(loadData)
</script>
