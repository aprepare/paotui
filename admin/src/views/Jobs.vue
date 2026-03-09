<template>
  <div>
    <h2>兼职管理</h2>
    <el-row :gutter="16" style="margin:16px 0">
      <el-col :span="4">
        <el-select v-model="filterCategory" placeholder="分类筛选" clearable @change="loadData">
          <el-option v-for="c in categoryOptions" :key="c" :label="c" :value="c" />
        </el-select>
      </el-col>
      <el-col :span="6">
        <el-input v-model="searchKeyword" placeholder="搜索岗位/公司" clearable @clear="loadData" @keyup.enter="loadData">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
      </el-col>
      <el-col :span="2"><el-button type="primary" @click="loadData">刷新</el-button></el-col>
      <el-col :span="2"><el-button type="success" @click="openAdd">+ 添加</el-button></el-col>
    </el-row>
    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column label="图标" width="80">
        <template #default="{ row }">
          <el-image v-if="row.image" :src="row.image" style="width:40px;height:40px;border-radius:8px" fit="cover" />
          <span v-else style="font-size:28px">{{ row.emoji || '💼' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="title" label="岗位名称" width="180" show-overflow-tooltip />
      <el-table-column prop="company" label="公司" width="150" show-overflow-tooltip />
      <el-table-column prop="location" label="地点" width="150" show-overflow-tooltip />
      <el-table-column prop="pay" label="薪资" width="130" />
      <el-table-column prop="category" label="分类" width="100">
        <template #default="{ row }">
          <el-tag>{{ row.category }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="subCategory" label="子分类" width="100" />
      <el-table-column label="热招" width="70">
        <template #default="{ row }">
          <el-switch v-model="row.hot" @change="toggleField(row, 'hot', row.hot)" />
        </template>
      </el-table-column>
      <el-table-column label="启用" width="70">
        <template #default="{ row }">
          <el-switch v-model="row.enabled" @change="toggleField(row, 'enabled', row.enabled)" />
        </template>
      </el-table-column>
      <el-table-column prop="sort" label="排序" width="70" />
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination style="margin-top:16px" :current-page="page" :page-size="pageSize" :total="total"
      @current-change="p => { page = p; loadData() }" layout="total, prev, pager, next" />

    <!-- 编辑/添加弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editMode ? '编辑岗位' : '添加岗位'" width="600px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="岗位名称" required>
          <el-input v-model="form.title" placeholder="如：海边咖啡师" />
        </el-form-item>
        <el-form-item label="公司">
          <el-input v-model="form.company" placeholder="如：孤独图书馆咖啡" />
        </el-form-item>
        <el-form-item label="分类" required>
          <el-select v-model="form.category" placeholder="选择分类">
            <el-option v-for="c in categoryOptions" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="子分类">
          <el-input v-model="form.subCategory" placeholder="如：餐饮、酒店（用于侧边栏导航）" />
        </el-form-item>
        <el-form-item label="地点">
          <el-input v-model="form.location" />
        </el-form-item>
        <el-form-item label="薪资">
          <el-input v-model="form.pay" placeholder="如：¥200/天" />
        </el-form-item>
        <el-form-item label="工作时间">
          <el-input v-model="form.time" placeholder="如：10:00-18:00" />
        </el-form-item>
        <el-form-item label="图标">
          <el-row :gutter="12">
            <el-col :span="6">
              <el-input v-model="form.emoji" placeholder="emoji" />
            </el-col>
            <el-col :span="18">
              <el-input v-model="form.image" placeholder="图片URL（优先于emoji显示）" />
            </el-col>
          </el-row>
        </el-form-item>
        <el-form-item label="渐变背景">
          <el-input v-model="form.bg" placeholder="如：linear-gradient(135deg, #ffecd2, #fcb69f)" />
        </el-form-item>
        <el-form-item label="岗位描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="热招">
          <el-switch v-model="form.hot" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.enabled" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" :max="9999" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import api from '../api/index'

const categoryOptions = ['校内', '家教', '阿那亚', '阿尔卡迪亚', '寒暑假']

const list = ref([]), loading = ref(false), page = ref(1), pageSize = ref(50), total = ref(0)
const filterCategory = ref(''), searchKeyword = ref('')
const dialogVisible = ref(false), editMode = ref(false), editId = ref('')

const defaultForm = () => ({
  title: '', company: '', location: '', pay: '', emoji: '💼',
  bg: 'linear-gradient(135deg, #4299E1, #2B6CB0)', image: '',
  category: '校内', subCategory: '', time: '', description: '',
  hot: false, enabled: true, sort: 0
})
const form = ref(defaultForm())

async function loadData() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value }
    if (filterCategory.value) params.category = filterCategory.value
    if (searchKeyword.value) params.keyword = searchKeyword.value
    const { data } = await api.get('/admin/jobs', { params })
    if (data.code === 0) { list.value = data.data; total.value = data.total }
  } finally { loading.value = false }
}

function openAdd() {
  editMode.value = false; editId.value = ''
  form.value = defaultForm()
  dialogVisible.value = true
}

function openEdit(row) {
  editMode.value = true; editId.value = row._id
  form.value = { ...row }
  dialogVisible.value = true
}

async function handleSave() {
  if (!form.value.title) { ElMessage.warning('请填写岗位名称'); return }
  if (editMode.value) {
    const { data } = await api.put(`/admin/jobs/${editId.value}`, form.value)
    if (data.code === 0) { ElMessage.success('已更新'); dialogVisible.value = false; loadData() }
    else ElMessage.error(data.msg || '更新失败')
  } else {
    const { data } = await api.post('/admin/jobs', form.value)
    if (data.code === 0) { ElMessage.success('已添加'); dialogVisible.value = false; loadData() }
    else ElMessage.error(data.msg || '添加失败')
  }
}

async function handleDelete(row) {
  await ElMessageBox.confirm(`确认删除岗位「${row.title}」？`, '删除确认', { type: 'warning' })
  const { data } = await api.delete(`/admin/jobs/${row._id}`)
  if (data.code === 0) { ElMessage.success('已删除'); loadData() }
  else ElMessage.error(data.msg || '删除失败')
}

async function toggleField(row, field, val) {
  const { data } = await api.put(`/admin/jobs/${row._id}`, { [field]: val })
  if (data.code !== 0) ElMessage.error('操作失败')
}

onMounted(loadData)
</script>
