<template>
  <div v-loading="loading">
    <h2>页面配置</h2>
    <el-tabs v-model="activeTab" @tab-change="onTabChange">
      <!-- ===== 首页配置 ===== -->
      <el-tab-pane label="首页配置" name="home">
        <div style="margin:12px 0;display:flex;gap:10px;align-items:center">
          <el-button type="success" :disabled="!homeLoaded" @click="saveHome">保存首页配置</el-button>
          <el-tag v-if="homeFromDb" type="success">已从数据库加载</el-tag>
          <el-tag v-else-if="homeLoaded" type="warning">数据库无配置（使用代码默认值，小程序端正常显示）</el-tag>
          <el-tag v-else type="danger">加载失败，禁止保存</el-tag>
          <el-button v-if="homeLoaded && homeActions.length === 0 && homeBanners.length === 0 && !heroImage" size="small" @click="fillHomeDefaults">填充默认值</el-button>
        </div>

        <!-- 顶部形象图 -->
        <el-card style="margin-bottom:20px">
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-weight:bold;font-size:16px">顶部形象图（heroImage）</span>
              <span style="font-size:12px;color:#999">对应首页蓝色卡片右侧的形象图</span>
            </div>
          </template>
          <div style="display:flex;gap:20px;align-items:center">
            <div>
              <ImgPreview :url="heroImage" wide />
            </div>
            <div style="flex:1">
              <el-form label-width="80px" size="small">
                <el-form-item label="图片">
                  <div style="display:flex;gap:6px;align-items:center;width:100%">
                    <el-upload :show-file-list="false" :auto-upload="false" accept="image/*" @change="onUploadHeroImage">
                      <el-button size="small" type="primary">上传</el-button>
                    </el-upload>
                    <el-input v-model="heroImage" placeholder="图片路径（/static/... 或 /uploads/...）" />
                  </div>
                </el-form-item>
              </el-form>
            </div>
          </div>
        </el-card>

        <!-- 快捷操作 -->
        <el-card style="margin-bottom:20px">
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-weight:bold;font-size:16px">快捷操作（actions）</span>
              <el-button size="small" @click="homeActions.push({ emoji: '', iconUrl: '', text: '', link: '', bg: '' })">添加操作</el-button>
            </div>
          </template>
          <el-empty v-if="homeActions.length === 0" description="暂无配置项" />
          <div v-else style="display:flex;flex-wrap:wrap;gap:16px">
            <el-card v-for="(act, i) in homeActions" :key="i" shadow="hover" style="width:300px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                <span style="font-weight:bold">操作 {{ i + 1 }}</span>
                <el-button type="danger" size="small" text @click="homeActions.splice(i, 1)">删除</el-button>
              </div>
              <div style="text-align:center;margin-bottom:10px">
                <ImgPreview :url="act.iconUrl" :emoji="act.emoji" />
              </div>
              <el-form label-width="60px" size="small">
                <el-form-item label="图标">
                  <div style="display:flex;gap:6px;align-items:center;width:100%">
                    <el-upload :show-file-list="false" :auto-upload="false" accept="image/*" @change="f => onUploadActionIcon(f, i)">
                      <el-button size="small" type="primary">上传</el-button>
                    </el-upload>
                    <el-input v-model="act.iconUrl" placeholder="图片路径" />
                  </div>
                </el-form-item>
                <el-form-item label="Emoji"><el-input v-model="act.emoji" placeholder="如 📦" /></el-form-item>
                <el-form-item label="文字"><el-input v-model="act.text" /></el-form-item>
                <el-form-item label="跳转"><el-input v-model="act.link" placeholder="/pages/xxx/xxx" /></el-form-item>
              </el-form>
            </el-card>
          </div>
        </el-card>

        <!-- 轮播图 -->
        <el-card>
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-weight:bold;font-size:16px">轮播图（banners）</span>
              <el-button size="small" @click="homeBanners.push({ imageUrl: '', emoji: '', title: '', desc: '', bg: '' })">添加轮播</el-button>
            </div>
          </template>
          <el-empty v-if="homeBanners.length === 0" description="暂无配置项" />
          <div v-else style="display:flex;flex-wrap:wrap;gap:16px">
            <el-card v-for="(banner, i) in homeBanners" :key="i" shadow="hover" style="width:350px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                <span style="font-weight:bold">轮播 {{ i + 1 }}</span>
                <el-button type="danger" size="small" text @click="homeBanners.splice(i, 1)">删除</el-button>
              </div>
              <div style="margin-bottom:10px">
                <template v-if="banner.imageUrl">
                  <ImgPreview :url="banner.imageUrl" wide />
                </template>
                <div v-else :style="{ background: banner.bg || '#ccc', borderRadius: '8px', padding: '16px', minHeight: '60px', display: 'flex', alignItems: 'center', gap: '12px' }">
                  <span v-if="banner.emoji" style="font-size:36px">{{ banner.emoji }}</span>
                  <div>
                    <div style="color:#fff;font-weight:bold;font-size:14px">{{ banner.title || '标题' }}</div>
                    <div style="color:rgba(255,255,255,0.85);font-size:12px;margin-top:4px">{{ banner.desc || '描述' }}</div>
                  </div>
                </div>
              </div>
              <el-form label-width="70px" size="small">
                <el-form-item label="轮播图片">
                  <div style="display:flex;gap:6px;align-items:center;width:100%">
                    <el-upload :show-file-list="false" :auto-upload="false" accept="image/*" @change="f => onUploadHomeBanner(f, i)">
                      <el-button size="small" type="primary">上传</el-button>
                    </el-upload>
                    <el-input v-model="banner.imageUrl" placeholder="图片URL（可选）" />
                  </div>
                </el-form-item>
                <el-form-item label="Emoji"><el-input v-model="banner.emoji" placeholder="如 📦" /></el-form-item>
                <el-form-item label="标题"><el-input v-model="banner.title" /></el-form-item>
                <el-form-item label="描述"><el-input v-model="banner.desc" /></el-form-item>
                <el-form-item label="背景色"><el-input v-model="banner.bg" placeholder="linear-gradient(135deg, #4299E1, #2B6CB0)" /></el-form-item>
              </el-form>
            </el-card>
          </div>
        </el-card>
      </el-tab-pane>

      <!-- ===== 福利页配置 ===== -->
      <el-tab-pane label="福利页配置" name="welfare">
        <div style="margin:12px 0;display:flex;gap:10px;align-items:center">
          <el-button type="success" :disabled="!welfareLoaded" @click="saveWelfare">保存福利页配置</el-button>
          <el-tag v-if="welfareFromDb" type="success">已从数据库加载</el-tag>
          <el-tag v-else-if="welfareLoaded" type="warning">数据库无配置（使用代码默认值，小程序端正常显示）</el-tag>
          <el-tag v-else type="danger">加载失败，禁止保存</el-tag>
          <el-button v-if="welfareLoaded && welfareServices.length === 0 && welfareBanners.length === 0" size="small" @click="fillWelfareDefaults">填充默认值</el-button>
        </div>

        <!-- 服务入口 -->
        <el-card style="margin-bottom:20px">
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-weight:bold;font-size:16px">服务入口（services）</span>
              <el-button size="small" @click="welfareServices.push({ iconUrl: '', text: '', desc: '', url: '' })">添加服务</el-button>
            </div>
          </template>
          <el-empty v-if="welfareServices.length === 0" description="暂无配置项" />
          <div v-else style="display:flex;flex-wrap:wrap;gap:16px">
            <el-card v-for="(svc, i) in welfareServices" :key="i" shadow="hover" style="width:300px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                <span style="font-weight:bold">服务 {{ i + 1 }}</span>
                <el-button type="danger" size="small" text @click="welfareServices.splice(i, 1)">删除</el-button>
              </div>
              <div style="text-align:center;margin-bottom:10px">
                <ImgPreview :url="svc.iconUrl" />
              </div>
              <el-form label-width="60px" size="small">
                <el-form-item label="图标">
                  <div style="display:flex;gap:6px;align-items:center;width:100%">
                    <el-upload :show-file-list="false" :auto-upload="false" accept="image/*" @change="f => onUploadWelfareService(f, i)">
                      <el-button size="small" type="primary">上传</el-button>
                    </el-upload>
                    <el-input v-model="svc.iconUrl" placeholder="图片路径" />
                  </div>
                </el-form-item>
                <el-form-item label="名称"><el-input v-model="svc.text" /></el-form-item>
                <el-form-item label="描述"><el-input v-model="svc.desc" /></el-form-item>
                <el-form-item label="跳转"><el-input v-model="svc.url" placeholder="/pages/xxx/index" /></el-form-item>
              </el-form>
            </el-card>
          </div>
        </el-card>

        <!-- 福利页轮播 -->
        <el-card>
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-weight:bold;font-size:16px">轮播图（banners）</span>
              <el-button size="small" @click="welfareBanners.push({ title: '', desc: '', bg: '', imageUrl: '' })">添加轮播</el-button>
            </div>
          </template>
          <el-empty v-if="welfareBanners.length === 0" description="暂无配置项" />
          <div v-else style="display:flex;flex-wrap:wrap;gap:16px">
            <el-card v-for="(banner, i) in welfareBanners" :key="i" shadow="hover" style="width:350px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                <span style="font-weight:bold">轮播 {{ i + 1 }}</span>
                <el-button type="danger" size="small" text @click="welfareBanners.splice(i, 1)">删除</el-button>
              </div>
              <div style="margin-bottom:10px">
                <template v-if="banner.imageUrl">
                  <ImgPreview :url="banner.imageUrl" style="width:100%;height:100px" wide />
                </template>
                <div v-else :style="{ background: banner.bg || '#ccc', borderRadius: '8px', padding: '16px', minHeight: '60px' }">
                  <div style="color:#fff;font-weight:bold;font-size:14px">{{ banner.title || '标题' }}</div>
                  <div style="color:rgba(255,255,255,0.85);font-size:12px;margin-top:4px">{{ banner.desc || '描述' }}</div>
                </div>
              </div>
              <el-form label-width="70px" size="small">
                <el-form-item label="轮播图片">
                  <div style="display:flex;gap:6px;align-items:center;width:100%">
                    <el-upload :show-file-list="false" :auto-upload="false" accept="image/*" @change="f => onUploadWelfareBanner(f, i)">
                      <el-button size="small" type="primary">上传</el-button>
                    </el-upload>
                    <el-input v-model="banner.imageUrl" placeholder="图片URL（可选）" />
                  </div>
                </el-form-item>
                <el-form-item label="标题"><el-input v-model="banner.title" /></el-form-item>
                <el-form-item label="描述"><el-input v-model="banner.desc" /></el-form-item>
                <el-form-item label="背景色"><el-input v-model="banner.bg" placeholder="linear-gradient(...)" /></el-form-item>
              </el-form>
            </el-card>
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted, h, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../api/index'

const ImgPreview = (props) => {
  const url = props.url
  const emoji = props.emoji
  if (url && isLocalStaticPath(url)) {
    const filename = url.split('/').pop()
    return h('div', {
      style: {
        width: props.wide ? '100%' : '60px', height: props.wide ? '100px' : '60px',
        background: '#e6f7ff', border: '1px dashed #91d5ff', borderRadius: '8px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        margin: props.wide ? '' : '0 auto', color: '#1890ff', fontSize: '11px', padding: '4px', textAlign: 'center'
      }
    }, [
      h('div', { style: { fontSize: '9px', color: '#999', marginBottom: '2px' } }, '小程序本地资源'),
      h('div', { style: { fontWeight: 'bold', wordBreak: 'break-all' } }, filename)
    ])
  }
  if (url) {
    const resolved = resolveUrl(url)
    return h('img', {
      src: resolved, style: {
        width: props.wide ? '100%' : '60px', height: props.wide ? '100px' : '60px',
        objectFit: props.wide ? 'cover' : 'contain', borderRadius: '8px', display: 'block',
        margin: props.wide ? '' : '0 auto'
      }
    })
  }
  if (emoji) return h('div', { style: { fontSize: '40px', lineHeight: '60px' } }, emoji)
  return h('div', {
    style: {
      width: '60px', height: '60px', background: '#f5f5f5', borderRadius: '8px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', color: '#ccc', fontSize: '12px'
    }
  }, '无图标')
}
ImgPreview.props = ['url', 'emoji', 'wide']

const activeTab = ref('home')
const loading = ref(false)

const homeLoaded = ref(false)
const homeFromDb = ref(false)
const welfareLoaded = ref(false)
const welfareFromDb = ref(false)

const heroImage = ref('/static/kuaidi.jpg')
const homeActions = ref([])
const homeBanners = ref([])
const welfareServices = ref([])
const welfareBanners = ref([])

function isLocalStaticPath(url) {
  return url && (url.startsWith('/static/') || url.startsWith('static/'))
}

function resolveUrl(url) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  if (isLocalStaticPath(url)) return ''
  return window.location.origin + url
}

const defaultActions = [
  { emoji: '📦', iconUrl: '/static/action/kuaidi.png', text: '代取快递', link: '/pages/express/create', bg: '' },
  { emoji: '🏃', iconUrl: '/static/action/paotui.png', text: '万能跑腿', link: '/pages/errand/create', bg: '' },
  { emoji: '🏅', iconUrl: '/static/action/qishou.png', text: '骑手注册', link: '/pages/express/rider-register', bg: '' }
]
const defaultBanners = [
  { imageUrl: '', emoji: '📦', title: '快递代取 极速送达', desc: '下单后最快30分钟送到宿舍', bg: 'linear-gradient(135deg, #4299E1, #2B6CB0)' },
  { imageUrl: '', emoji: '🏃', title: '万能跑腿 有求必应', desc: '买饭、打印、取件 一键搞定', bg: 'linear-gradient(135deg, #ED8936, #DD6B20)' },
  { imageUrl: '', emoji: '🎉', title: '新用户首单立减', desc: '注册即享优惠 快来体验吧', bg: 'linear-gradient(135deg, #48BB78, #38A169)' }
]
const defaultWelfareServices = [
  { iconUrl: '/static/welfare/dazi.png', text: '校园搭子', desc: '找搭子一起', url: '/pages/team/index' },
  { iconUrl: '/static/welfare/xihu.png', text: '萌马洗护', desc: '洗鞋团购', url: '/pages/wash/index' },
  { iconUrl: '/static/welfare/pinche.png', text: '校园拼车', desc: '拼车省钱', url: '/pages/carpool/index' },
  { iconUrl: '/static/welfare/jineng.png', text: '技能出租', desc: '技能变现', url: '/pages/skill/index' },
  { iconUrl: '/static/welfare/kaoyan.png', text: '考研服务', desc: '考研加油', url: '/pages/graduate/index' },
  { iconUrl: '/static/welfare/ershou.png', text: '二手市场', desc: '闲置换钱', url: '/pages/market/index' },
  { iconUrl: '/static/welfare/bashi.png', text: '小岛巴士', desc: '校园出行', url: '/pages/carpool/index' },
  { iconUrl: '/static/welfare/waimai.png', text: '福利外卖', desc: '优惠点餐', url: '/pages/food/index' }
]
const defaultWelfareBanners = [
  { title: '新学期福利大放送', desc: '多重优惠等你来领', bg: 'linear-gradient(135deg, #F6AD55, #DD6B20)', imageUrl: '' },
  { title: '快递代取 首单立减', desc: '新用户专享优惠', bg: 'linear-gradient(135deg, #63B3ED, #2B6CB0)', imageUrl: '' },
  { title: '拼车出行 安全省钱', desc: '校园出行好帮手', bg: 'linear-gradient(135deg, #68D391, #38A169)', imageUrl: '' }
]

function fillHomeDefaults() {
  heroImage.value = '/static/kuaidi.jpg'
  homeActions.value = defaultActions.map(a => ({ ...a }))
  homeBanners.value = defaultBanners.map(b => ({ ...b }))
}
function fillWelfareDefaults() {
  welfareServices.value = defaultWelfareServices.map(s => ({ ...s }))
  welfareBanners.value = defaultWelfareBanners.map(b => ({ ...b }))
}

async function loadHome() {
  loading.value = true
  homeLoaded.value = false
  homeFromDb.value = false
  try {
    const { data } = await api.get('/admin/home-config')
    if (data.code === 0) {
      const cfg = data.data?.config || {}
      if (cfg.heroImage) {
        heroImage.value = cfg.heroImage
      } else {
        heroImage.value = '/static/kuaidi.jpg'
      }
      const hasActions = Array.isArray(cfg.actions) && cfg.actions.length > 0
      const hasBanners = Array.isArray(cfg.banners) && cfg.banners.length > 0

      if (hasActions || hasBanners) {
        // 已有数据库配置
        homeFromDb.value = true
        // 如果数据库里还没有 actions，就用默认 3 个快捷操作，方便直接修改
        homeActions.value = hasActions ? cfg.actions.map(a => ({ ...a })) : defaultActions.map(a => ({ ...a }))
        homeBanners.value = hasBanners ? cfg.banners.map(b => ({ ...b })) : []
      } else {
        // 数据库暂无配置，默认展示代码里的默认值，方便直接修改
        homeFromDb.value = false
        fillHomeDefaults()
      }
      homeLoaded.value = true
    }
  } catch (e) {
    ElMessage.error('加载首页配置失败')
  }
  loading.value = false
}

async function loadWelfare() {
  loading.value = true
  welfareLoaded.value = false
  welfareFromDb.value = false
  try {
    const { data } = await api.get('/admin/welfare-config')
    if (data.code === 0) {
      const cfg = data.data?.config || {}
      const hasServices = Array.isArray(cfg.services) && cfg.services.length > 0
      const hasBanners = Array.isArray(cfg.banners) && cfg.banners.length > 0

      if (hasServices || hasBanners) {
        // 已有数据库配置
        welfareFromDb.value = true
        welfareServices.value = hasServices ? cfg.services.map(s => ({ ...s })) : []
        welfareBanners.value = hasBanners ? cfg.banners.map(b => ({ ...b })) : []
      } else {
        // 数据库暂无配置，默认展示代码里的默认值，方便直接修改
        welfareFromDb.value = false
        fillWelfareDefaults()
      }
      welfareLoaded.value = true
    }
  } catch (e) {
    ElMessage.error('加载福利页配置失败')
  }
  loading.value = false
}

function onTabChange(tab) {
  if (tab === 'home') loadHome()
  else loadWelfare()
}

// 带确认弹窗的手动保存
async function saveHome() {
  if (!homeLoaded.value) return ElMessage.error('配置未成功加载，禁止保存')
  try {
    await ElMessageBox.confirm(
      '保存后将覆盖数据库中的首页配置，小程序端将实时生效。\n请确认页面上显示的内容是你想要的。',
      '确认保存', { type: 'warning' }
    )
  } catch { return }
  await doSaveHome()
}

async function saveWelfare() {
  if (!welfareLoaded.value) return ElMessage.error('配置未成功加载，禁止保存')
  try {
    await ElMessageBox.confirm(
      '保存后将覆盖数据库中的福利页配置，小程序端将实时生效。\n请确认页面上显示的内容是你想要的。',
      '确认保存', { type: 'warning' }
    )
  } catch { return }
  await doSaveWelfare()
}

// 静默保存（上传图片后自动调用，无弹窗）
async function doSaveHome(silent = false) {
  try {
    await api.put('/admin/home-config', {
      config: { heroImage: heroImage.value, banners: homeBanners.value, actions: homeActions.value }
    })
    homeFromDb.value = true
    if (!silent) ElMessage.success('首页配置已保存')
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

async function doSaveWelfare(silent = false) {
  try {
    await api.put('/admin/welfare-config', {
      config: { services: welfareServices.value, banners: welfareBanners.value }
    })
    welfareFromDb.value = true
    if (!silent) ElMessage.success('福利页配置已保存')
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

// 上传图片到服务器，返回 URL 字符串（失败返回 null）
async function uploadImg(uploadFile) {
  const file = uploadFile.raw || uploadFile
  if (!file) return null
  const formData = new FormData()
  formData.append('file', file)
  try {
    const { data } = await api.post('/admin/upload?folder=config', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    if (data.code === 0 && data.data && data.data.url) {
      return data.data.url
    } else {
      ElMessage.error(data.msg || '上传失败')
      return null
    }
  } catch (e) {
    console.error('[uploadImg] request error:', e)
    ElMessage.error('上传失败')
    return null
  }
}

// ===== 命名上传处理函数（避免 Vue3 模板 ref 自动 unwrap 导致赋值失效）=====
async function onUploadHeroImage(f) {
  const url = await uploadImg(f)
  if (url) {
    heroImage.value = url
    await doSaveHome(true)
    ElMessage.success('配置已同步，小程序刷新后生效')
  }
}

async function onUploadActionIcon(f, index) {
  const url = await uploadImg(f)
  if (url) {
    homeActions.value[index].iconUrl = url
    await doSaveHome(true)
    ElMessage.success('配置已同步，小程序刷新后生效')
  }
}

async function onUploadHomeBanner(f, index) {
  const url = await uploadImg(f)
  if (url) {
    homeBanners.value[index].imageUrl = url
    await doSaveHome(true)
    ElMessage.success('配置已同步，小程序刷新后生效')
  }
}

async function onUploadWelfareService(f, index) {
  const url = await uploadImg(f)
  if (url) {
    welfareServices.value[index].iconUrl = url
    await doSaveWelfare(true)
    ElMessage.success('配置已同步，小程序刷新后生效')
  }
}

async function onUploadWelfareBanner(f, index) {
  const url = await uploadImg(f)
  if (url) {
    welfareBanners.value[index].imageUrl = url
    await doSaveWelfare(true)
    ElMessage.success('配置已同步，小程序刷新后生效')
  }
}

onMounted(loadHome)
</script>
