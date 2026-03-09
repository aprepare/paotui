<template>
  <draggable :model-value="sections" @update:model-value="v => sections.splice(0, sections.length, ...v)" item-key="key" handle=".drag-handle">
    <template #item="{ element: sec, index: si }">
      <el-card style="margin-bottom:16px">
        <template #header>
          <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
            <el-icon class="drag-handle" style="cursor:move"><Rank /></el-icon>
            <el-input v-model="sec.key" style="width:120px" placeholder="key" />
            <el-input v-model="sec.title" style="width:160px" placeholder="标题" />
            <el-switch v-model="sec.visible" active-text="显示" inactive-text="隐藏" />
            <el-button type="danger" size="small" @click="sections.splice(si, 1)">删除区块</el-button>
            <el-button size="small" @click="addItem(sec)">添加项目</el-button>
          </div>
        </template>
        <draggable :model-value="sec.items" @update:model-value="v => sec.items = v" item-key="order" handle=".item-drag" style="display:flex;flex-wrap:wrap;gap:12px">
          <template #item="{ element: item, index: ii }">
            <el-card shadow="hover" style="width:260px">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
                <el-icon class="item-drag" style="cursor:move"><Rank /></el-icon>
                <span style="font-size:12px;color:#999">项目 {{ ii + 1 }}</span>
                <el-button type="danger" size="small" text @click="sec.items.splice(ii, 1)">删除</el-button>
              </div>
              <el-form label-width="50px" size="small">
                <el-form-item label="文字">
                  <el-input v-model="item.text" />
                </el-form-item>
                <el-form-item label="Emoji">
                  <el-input v-model="item.emoji" />
                </el-form-item>
                <el-form-item label="图片">
                  <div style="width:100%">
                    <div v-if="item.image" style="margin-bottom:6px;position:relative;display:inline-block">
                      <el-image :src="fullUrl(item.image)" style="width:80px;height:80px;border-radius:4px" fit="cover" :preview-src-list="[fullUrl(item.image)]" />
                      <el-button type="danger" size="small" circle style="position:absolute;top:-6px;right:-6px;width:20px;height:20px;padding:0" @click="item.image = ''">
                        <el-icon :size="10"><Close /></el-icon>
                      </el-button>
                    </div>
                    <div style="display:flex;gap:6px;align-items:center">
                      <el-upload
                        :show-file-list="false"
                        :auto-upload="false"
                        accept="image/*"
                        @change="f => uploadFile(f, url => item.image = url)"
                      >
                        <el-button size="small" type="primary">上传图片</el-button>
                      </el-upload>
                      <el-input v-model="item.image" placeholder="或输入URL" size="small" />
                    </div>
                  </div>
                </el-form-item>
                <el-form-item label="背景">
                  <div style="width:100%">
                    <div v-if="item.bg && isImageUrl(item.bg)" style="margin-bottom:6px;position:relative;display:inline-block">
                      <el-image :src="fullUrl(item.bg)" style="width:80px;height:40px;border-radius:4px" fit="cover" />
                      <el-button type="danger" size="small" circle style="position:absolute;top:-6px;right:-6px;width:20px;height:20px;padding:0" @click="item.bg = ''">
                        <el-icon :size="10"><Close /></el-icon>
                      </el-button>
                    </div>
                    <div style="display:flex;gap:6px;align-items:center">
                      <el-upload
                        :show-file-list="false"
                        :auto-upload="false"
                        accept="image/*"
                        @change="f => uploadFile(f, url => item.bg = url)"
                      >
                        <el-button size="small">上传背景</el-button>
                      </el-upload>
                      <el-input v-model="item.bg" placeholder="颜色或URL" size="small" />
                    </div>
                  </div>
                </el-form-item>
                <el-form-item label="链接">
                  <el-input v-model="item.link" />
                </el-form-item>
              </el-form>
            </el-card>
          </template>
        </draggable>
      </el-card>
    </template>
  </draggable>
</template>

<script setup>
import { Rank, Close } from '@element-plus/icons-vue'
import draggable from 'vuedraggable'

const props = defineProps({
  sections: { type: Array, required: true }
})

const emit = defineEmits(['upload'])

function addItem(sec) {
  sec.items.push({ text: '', emoji: '', image: '', link: '', bg: '', order: sec.items.length })
}

function fullUrl(url) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return window.location.origin + url
}

function isImageUrl(str) {
  if (!str) return false
  return str.startsWith('/uploads/') || str.startsWith('http')
}

function uploadFile(uploadFile, callback) {
  const file = uploadFile.raw || uploadFile
  if (!file) return
  emit('upload', { file, callback })
}
</script>
